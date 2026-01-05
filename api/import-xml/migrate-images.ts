
import { supabase } from '../../lib/supabaseClient';

interface MigrationProgress {
    total: number;
    current: number;
    success: number;
    errors: number;
    currentFile?: string;
}

export type ProgressCallback = (progress: MigrationProgress) => void;

interface MigrationResult {
    success: number;
    errors: string[];
}

export async function migrateExternalImages(
    userId: string,
    onProgress?: ProgressCallback,
    isAdmin: boolean = false
): Promise<MigrationResult> {
    const result: MigrationResult = { success: 0, errors: [] };
    const BUCKET_NAME = 'imported-photos';

    try {
        // 1. Buscar anúncios com fotos
        let query = supabase
            .from('anuncios')
            .select('id, fotos')
            .not('fotos', 'is', null);

        if (!isAdmin) {
            query = query.eq('user_id', userId);
        }

        const { data: anuncios, error } = await query;

        if (error) throw error;

        // Filtrar apenas anúncios que têm URLs externas (não supabase)
        const anunciosParaMigrar = anuncios?.filter(a => {
            const fotos = a.fotos?.split(',') || [];
            return fotos.some(url => !url.includes('supabase.co'));
        }) || [];

        let totalProcessed = 0;
        const total = anunciosParaMigrar.length;

        if (onProgress) onProgress({ total, current: 0, success: 0, errors: 0 });

        // 2. Processar cada anúncio
        for (const anuncio of anunciosParaMigrar) {
            try {
                const fotos = anuncio.fotos?.split(',') || [];
                const newFotos: string[] = [];
                let changesMade = false;

                for (const url of fotos) {
                    const cleanUrl = url.trim();
                    if (!cleanUrl) continue;

                    // Se já é do Supabase, mantém
                    if (cleanUrl.includes('supabase.co')) {
                        newFotos.push(cleanUrl);
                        continue;
                    }

                    // Se é externa, faz download e upload
                    try {
                        if (onProgress) onProgress({
                            total,
                            current: totalProcessed + 1,
                            success: result.success,
                            errors: result.errors.length,
                            currentFile: `Baixando...`
                        });

                        // Download
                        const response = await fetch(cleanUrl);
                        if (!response.ok) throw new Error(`Falha ao baixar: ${response.statusText}`);
                        const blob = await response.blob();

                        // Otimizar ou validar tamanho poderia ser aqui, mas para migração vamos direto
                        // Nome único: ID_IMOVEL/TIMESTAMP_RANDOM.ext
                        const ext = cleanUrl.split('.').pop()?.split('?')[0] || 'jpg';
                        // Limitar extensão a 3-4 chars para evitar lixo
                        const safeExt = ext.length > 4 ? 'jpg' : ext;

                        const filename = `${anuncio.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${safeExt}`;

                        // Upload
                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from(BUCKET_NAME)
                            .upload(filename, blob, {
                                contentType: blob.type || 'image/jpeg',
                                upsert: false
                            });

                        if (uploadError) throw uploadError;

                        // Get Public URL
                        const { data: publicUrlData } = supabase.storage
                            .from(BUCKET_NAME)
                            .getPublicUrl(filename);

                        newFotos.push(publicUrlData.publicUrl);
                        changesMade = true;

                        // Pequeno delay para não estourar rate limit se houver muitos
                        await new Promise(resolve => setTimeout(resolve, 200));

                    } catch (imgError) {
                        console.error(`Erro ao migrar imagem ${cleanUrl}:`, imgError);
                        // Se falhar o download/upload, MANTÉM a URL original para não quebrarmos o anúncio
                        newFotos.push(cleanUrl);
                        result.errors.push(`Imóvel ${anuncio.id}: Falha na imagem ${cleanUrl.substring(0, 30)}...`);
                    }
                }

                // 3. Atualizar anúncio se houve mudança
                if (changesMade) {
                    const { error: updateError } = await supabase
                        .from('anuncios')
                        .update({ fotos: newFotos.join(',') })
                        .eq('id', anuncio.id);

                    if (updateError) throw updateError;
                    result.success++;
                }

            } catch (anuncioError: any) {
                console.error(`Erro ao processar anúncio ${anuncio.id}:`, anuncioError);
                result.errors.push(`Imóvel ${anuncio.id}: ${anuncioError.message}`);
            }

            totalProcessed++;
            if (onProgress) onProgress({
                total,
                current: totalProcessed,
                success: result.success,
                errors: result.errors.length
            });
        }

    } catch (err: any) {
        console.error('Erro geral na migração:', err);
        result.errors.push(`Erro fatal: ${err.message}`);
    }

    return result;
}
