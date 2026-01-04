import { createClient } from "@supabase/supabase-js";
import { detectXMLFormat, parsers } from "./parsers";
import { ImportedImovel } from "./parsers/tecimob";

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
    userId: string
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
        const imoveis = await parsers[format](xmlContent);
        result.total = imoveis.length;

        if (imoveis.length === 0) {
            throw new Error("Nenhum imóvel encontrado no XML.");
        }

        // 3. Process each property
        // We treat them in batches or one by one to check duplicates.
        // For 50-100 items, one by one is fine but slow. 
        // Optimization: fetch all codes first to check existing.

        const codes = imoveis.map(i => i.codigo_imovel);

        // Check duplicates in database for this user
        // We assume codigo_imovel + usuario_id is unique enough constraint 
        // or just checking if 'anuncios' has this codigo_imovel for this user.
        const { data: existingData, error: fetchError } = await supabaseClient
            .from('anuncios')
            .select('codigo_imovel')
            .eq('usuario_id', userId)
            .in('codigo_imovel', codes);

        if (fetchError) throw fetchError;

        const existingCodes = new Set(existingData?.map((item: any) => item.codigo_imovel));

        const toInsert = [];

        for (const imovel of imoveis) {
            // Basic validation
            if (!imovel.valor_venda && !imovel.valor_locacao) {
                result.errors.push(`Imóvel ${imovel.codigo_imovel}: Sem valor definido.`);
                continue;
            }

            if (existingCodes.has(imovel.codigo_imovel)) {
                result.duplicates++;
                // Optional: Update logic could be here
                continue;
            }

            // Prepare for insertion
            toInsert.push({
                ...imovel,
                usuario_id: userId,
                status: 'disponivel',
                destaque: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // Map any extra fields necessary for your schema
                // Ensure coordinates are null initially
                latitude: null,
                longitude: null
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
