import { createClient } from "@supabase/supabase-js";
import { detectXMLFormat, parsers } from "./parsers";
import { ImportedImovel } from "./parsers/tecimob";
import { migrateExternalImages, ProgressCallback } from './migrate-images';

// Supabase client instance should be passed or imported from context/config
// Assuming we pass it or import a singleton if available. 
// For now, let's assume the caller passes the authenticated client client.

export interface ImportResult {
    total: number;
    imported: number;
    errors: string[];
    duplicates: number;
}

export const processXMLImport = async (
    xmlContent: string,
    supabaseClient: any,
    userId: string,
    limit?: number
): Promise<ImportResult> => {

    const result: ImportResult = {
        total: 0,
        imported: 0,
        errors: [],
        duplicates: 0
    };

    try {
        // 1. Detect format
        const format = detectXMLFormat(xmlContent);
        if (format === 'unknown') {
            throw new Error("Formato XML não reconhecido. Suportamos apenas Tecimob por enquanto.");
        }

        // 2. Parse
        let imoveis = await parsers[format](xmlContent);

        // Apply Plan Limit
        if (limit && limit > 0 && imoveis.length > limit) {
            console.log(`[Import] Limiting items from ${imoveis.length} to ${limit}`);
            // We keep result.total as the effectively processed amount or the original?
            // Let's keep total as the amount we are TRYING to import.
            // But maybe we should warn? For now just slice.
            imoveis = imoveis.slice(0, limit);
        }

        result.total = imoveis.length;

        if (imoveis.length === 0) {
            throw new Error("Nenhum imóvel encontrado no XML.");
        }

        // 2. Fetch dependencies (Types, Operations) for mapping
        const { data: opsData } = await supabaseClient.from('operacao').select('id, tipo');
        const { data: typesData } = await supabaseClient.from('tipo_imovel').select('id, tipo');

        // Helper to find ID by text (fuzzy match)
        const findId = (list: any[], text: string) => {
            if (!list || !text) return null;
            const clean = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const target = clean(text);
            const found = list.find(item => clean(item.tipo) === target);
            return found ? found.id : null;
        };

        const defaultOperacao = findId(opsData, 'Venda'); // Fallback if needed, though we should try to match exactly

        // 3. Process each property
        // We treat them in batches or one by one to check duplicates.
        // For 50-100 items, one by one is fine but slow. 
        // Optimization: fetch all codes first to check existing.

        const codes = imoveis.map(i => i.cod_imovel);

        // Check duplicates in database for this user
        const { data: existingData, error: fetchError } = await supabaseClient
            .from('anuncios')
            .select('cod_imovel')
            .eq('user_id', userId)
            .in('cod_imovel', codes);

        if (fetchError) throw fetchError;

        const existingCodes = new Set(existingData?.map((item: any) => String(item.cod_imovel)));

        const toInsert = [];

        for (const imovel of imoveis) {
            // Basic validation
            if (!imovel.valor_venda && !imovel.valor_locacao) {
                result.errors.push(`Imóvel ${imovel.cod_imovel}: Sem valor definido.`);
                continue;
            }

            if (existingCodes.has(String(imovel.cod_imovel))) {
                result.duplicates++;
                continue;
            }

            // Prepare photos string (cover + others)
            const allPhotos = [imovel.foto_capa, ...imovel.fotos_imovel].filter(Boolean);
            const fotosString = allPhotos.join(',');

            // Prepare features string
            const featuresString = Array.isArray(imovel.caracteristicas) ? imovel.caracteristicas.join(', ') : '';

            // Map domains
            const opId = findId(opsData, imovel.operacao) || findId(opsData, 'Venda') || opsData?.[0]?.id;
            const typeId = findId(typesData, imovel.tipo_imovel) || typesData?.[0]?.id; // Fallback to first type if unknown (e.g. Apartamento)

            // Map fields strictly to DB schema
            toInsert.push({
                user_id: userId,
                cod_imovel: Number(imovel.cod_imovel) || 0,
                titulo: imovel.titulo,
                descricao: imovel.descricao,
                tipo_imovel: typeId, // Resolved UUID
                operacao: opId,      // Resolved UUID

                // Values
                valor_venda: imovel.valor_venda || null,
                valor_locacao: imovel.valor_locacao || null,
                valor_condo: imovel.valor_condominio || null,
                valor_iptu: null,

                // Address
                cidade: imovel.cidade,
                bairro: imovel.bairro,
                logradouro: imovel.logradouro,
                numero: imovel.numero,
                cep: imovel.cep,
                uf: imovel.uf,

                // Details
                area_priv: imovel.area_priv || 0,
                area_total: imovel.area_total || null,
                quartos: imovel.quartos || 0,
                suites: imovel.suites || 0,
                banheiros: imovel.banheiros || 0,
                vagas: imovel.vagas || 0,

                // Media
                fotos: fotosString,
                video: imovel.videos?.[0] || null,

                // Meta
                caracteristicas: featuresString,
                status: 'rascunho',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),

                // Store original type/operation in internal notes for manual mapping
                observacoes: `Importado de XML.\nTipo Original: ${imovel.tipo_imovel}\nOperacao Original: ${imovel.operacao}`
            });
        }

        // 4. Batch Insert
        if (toInsert.length > 0) {
            const { error: insertError } = await supabaseClient
                .from('anuncios')
                .insert(toInsert);

            if (insertError) {
                throw new Error(`Erro ao inserir no banco: ${insertError.message}`);
            }

            result.imported = toInsert.length;
        }

    } catch (error: any) {
        result.errors.push(`Falha fatal na importação: ${error.message}`);
    }

    return result;
};

// Cleanup Tool: Removes HTML artifacts from existing drafts
export const cleanupHtmlArtifacts = async (
    supabaseClient: any,
    userId: string
): Promise<{ fixed: number, total: number }> => {
    // 1. Fetch all drafts associated with this user
    const { data: drafts, error } = await supabaseClient
        .from('anuncios')
        .select('id, titulo, descricao')
        .eq('user_id', userId)
        .eq('status', 'rascunho');

    if (error) throw error;
    if (!drafts || drafts.length === 0) return { fixed: 0, total: 0 };

    let fixedCount = 0;

    // Helper (Decodes HTML entities then strips tags)
    const clean = (html: string) => {
        if (!html) return "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const decoded = tempDiv.textContent || tempDiv.innerText || "";
        return decoded.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
    };

    // 2. Iterate and Update
    for (const draft of drafts) {
        const newTitle = clean(draft.titulo);
        const newDesc = clean(draft.descricao);

        if (newTitle !== draft.titulo || newDesc !== draft.descricao) {
            await supabaseClient
                .from('anuncios')
                .update({
                    titulo: newTitle,
                    descricao: newDesc,
                    updated_at: new Date().toISOString()
                })
                .eq('id', draft.id);
            fixedCount++;
        }
    }

    return { fixed: fixedCount, total: drafts.length };
};



// Geolocation Batch Tool
export const batchGeocodeProperties = async (
    supabaseClient: any,
    userId: string,
    onProgress: (current: number, total: number, message: string) => void,
    isAdmin: boolean = false
): Promise<{ success: number, failed: number, total: number }> => {

    // 1. Fetch properties needing geocoding (valid CEP, no lat/lng, only drafts)
    let query = supabaseClient
        .from('anuncios')
        .select('id, cep, logradouro, cidade, uf, bairro') // Fetch address fields for fallback/better search
        .eq('status', 'rascunho')
        .is('latitude', null);

    // If NOT admin, filter by user. If Admin, fetch ALL drafts.
    if (!isAdmin) {
        query = query.eq('user_id', userId);
    }

    const { data: properties, error } = await query;

    if (error) throw error;
    if (!properties || properties.length === 0) return { success: 0, failed: 0, total: 0 };

    let successCount = 0;
    let failedCount = 0;
    const total = properties.length;

    // Helper: Delay to respect OpenStreetMap rate limit (1 request per second)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < total; i++) {
        const prop = properties[i];
        const cepOnly = prop.cep?.replace(/\D/g, ''); // Clean CEP string

        if (!cepOnly || cepOnly.length < 8) {
            failedCount++;
            onProgress(i + 1, total, `Imóvel #${prop.id}: CEP inválido.`);
            continue;
        }

        onProgress(i + 1, total, `Geolocalizando ${i + 1}/${total} (CEP: ${prop.cep})...`);

        try {
            // Respect Rate Limit (Absolute minimum 1s for Nominatim Free Tier)
            await delay(1100);

            // Query Nominatim API
            // Primary strategy: Query by CEP + Country
            // "postalcode" param is safer than general query for distinct structured data
            const url = `https://nominatim.openstreetmap.org/search?postalcode=${cepOnly}&country=Brazil&format=json&limit=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'IziBrokerz-Importer/1.0 (contact@izibrokerz.com)' // Good practice for OSM
                }
            });

            if (!response.ok) throw new Error("Erro na API de Mapas");

            const data = await response.json();

            if (data && data.length > 0) {
                // ... Success Strategy 1 (CEP)
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                await supabaseClient.from('anuncios').update({ latitude: lat, longitude: lon }).eq('id', prop.id);
                successCount++;
            } else {
                // FAIL STRATEGY 1 -> Try Strategy 2: Structured Address
                let found = false;

                if (prop.logradouro && prop.cidade) {
                    onProgress(i + 1, total, `Tentando estratégia 2 (Rua/Cidade)...`);
                    await delay(2000); // 2s delay for safety

                    const cleanStreet = prop.logradouro.split(',')[0].trim();
                    const urlFallback = `https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(cleanStreet)}&city=${encodeURIComponent(prop.cidade)}&state=${encodeURIComponent(prop.uf || '')}&country=Brazil&format=json&limit=1`;

                    try {
                        const resFallback = await fetch(urlFallback, { headers: { 'User-Agent': 'IziBrokerz-Importer/1.0 (contact@izibrokerz.com)' } });
                        if (resFallback.ok) {
                            const dataFallback = await resFallback.json();
                            if (dataFallback && dataFallback.length > 0) {
                                const lat = parseFloat(dataFallback[0].lat);
                                const lon = parseFloat(dataFallback[0].lon);
                                await supabaseClient.from('anuncios').update({ latitude: lat, longitude: lon }).eq('id', prop.id);
                                successCount++;
                                found = true;
                            }
                        }
                    } catch (e) { console.error(e); }
                }

                // FAIL STRATEGY 2 -> Try Strategy 3: Unstructured Query (Best Effort)
                if (!found && prop.logradouro && prop.cidade) {
                    onProgress(i + 1, total, `Tentando estratégia 3 (Busca Livre)...`);
                    await delay(2000); // 2s delay

                    // q=<street>, <city> - <state>
                    const query = `${prop.logradouro}, ${prop.cidade} - ${prop.uf || ''}`;
                    const urlFree = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&country=Brazil&format=json&limit=1`;

                    try {
                        const resFree = await fetch(urlFree, { headers: { 'User-Agent': 'IziBrokerz-Importer/1.0 (contact@izibrokerz.com)' } });
                        if (resFree.ok) {
                            const dataFree = await resFree.json();
                            if (dataFree && dataFree.length > 0) {
                                const lat = parseFloat(dataFree[0].lat);
                                const lon = parseFloat(dataFree[0].lon);
                                await supabaseClient.from('anuncios').update({ latitude: lat, longitude: lon }).eq('id', prop.id);
                                successCount++;
                                found = true;
                            }
                        }
                    } catch (e) { console.error(e); }
                }

                if (!found) failedCount++;
            }

        } catch (err) {
            console.error(`Geo error for ${prop.id}:`, err);
            failedCount++;
        }
    }

    return { success: successCount, failed: failedCount, total };
};

// Mass Publish Tool
export const massPublishProperties = async (
    supabaseClient: any,
    userId: string,
    isAdmin: boolean = false
): Promise<{ published: number, total: number }> => {

    // 1. Fetch drafts
    let queryDrafts = supabaseClient
        .from('anuncios')
        .select('id')
        .eq('status', 'rascunho');

    if (!isAdmin) {
        queryDrafts = queryDrafts.eq('user_id', userId);
    }

    const { data: drafts, error } = await queryDrafts;

    if (error) throw error;
    if (!drafts || drafts.length === 0) return { published: 0, total: 0 };

    // 2. Update all to 'ativo'
    let updateQuery = supabaseClient
        .from('anuncios')
        .update({ status: 'ativo', updated_at: new Date().toISOString() })
        .eq('status', 'rascunho');

    if (!isAdmin) {
        updateQuery = updateQuery.eq('user_id', userId);
    }

    const { error: updateError, count } = await updateQuery.select('id', { count: 'exact' });

    if (updateError) throw updateError;

    return { published: count || drafts.length, total: drafts.length };
};

export { migrateExternalImages };
export type { ProgressCallback };
