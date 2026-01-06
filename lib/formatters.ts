
/**
 * Formatters - Funções de formatação centralizadas
 * @module lib/formatters
 */

/**
 * Formata valor monetário para BRL (sem centavos)
 * Ex: 300000 -> "R$ 300.000"
 */
export const formatCurrency = (value: number | null | undefined): string => {
    if (!value || value === 0) return 'Sob Consulta';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

/**
 * Formata valor monetário para exibição em input (sem R$)
 * Ex: "300000" -> "300.000"
 */
export const formatCurrencyInput = (value: string | number): string => {
    const numeric = String(value).replace(/\D/g, '');
    if (!numeric) return '';
    return Number(numeric).toLocaleString('pt-BR');
};

/**
 * Converte string formatada para número
 * Ex: "300.000" -> 300000
 */
export const parseCurrencyInput = (formatted: string): number => {
    return Number(formatted.replace(/\D/g, '')) || 0;
};

/**
 * Formata área com separador de milhar
 * Ex: 1500 -> "1.500"
 */
export const formatArea = (value: number | null | undefined): string => {
    if (!value || value === 0) return '0';
    return value.toLocaleString('pt-BR');
};

/**
 * Formata área para input (mesmo que formatCurrencyInput)
 */
export const formatAreaInput = (value: string | number): string => {
    const numeric = String(value).replace(/\D/g, '');
    if (!numeric) return '';
    return Number(numeric).toLocaleString('pt-BR');
};

/**
 * Converte string de área formatada para número
 */
export const parseAreaInput = (formatted: string): number => {
    return Number(formatted.replace(/\D/g, '')) || 0;
};

/**
 * Normaliza string para URL (remove acentos, espaços, caracteres especiais)
 */
export const normalizeSlug = (text: string): string => {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Gera slug padronizado para imóveis
 */
export const generatePropertySlug = (property: any): string => {
    const tipo = normalizeSlug(property.tipo_imovel?.tipo || property.tipo_imovel || 'imovel');
    const quartos = property.quartos || 0;
    const bairro = normalizeSlug(property.bairro || '');
    const cidade = normalizeSlug(property.cidade || '');
    const area = property.area_priv || 0;

    let operacao = normalizeSlug(property.operacao?.tipo || property.operacao || '');
    // Fix common operation names if needed
    if (operacao === 'venda-locacao' || operacao === 'venda/locacao') operacao = 'venda-e-locacao';

    const valor = property.valor_venda || property.valor_locacao || 0;
    const garagem = (property.vagas || 0) > 0 ? '-com-garagem' : '';
    const codigo = property.cod_imovel || property.id;

    return `${tipo}-${quartos}-quartos-${bairro}-${cidade}${garagem}-${area}m2-${operacao}-RS${valor}-cod${codigo}`;
};

/**
 * Converte URLs de vídeo (YouTube/Vimeo) para formato embed
 */
export const getEmbedUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;

    try {
        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';

            // Handle youtu.be/ID
            if (url.includes('youtu.be')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            }
            // Handle youtube.com/watch?v=ID
            else if (url.includes('watch?v=')) {
                videoId = url.split('watch?v=')[1]?.split('&')[0];
            }
            // Handle youtube.com/embed/ID
            else if (url.includes('embed/')) {
                videoId = url.split('embed/')[1]?.split('?')[0];
            }
            // Handle youtube.com/shorts/ID
            else if (url.includes('shorts/')) {
                videoId = url.split('shorts/')[1]?.split('?')[0];
            }

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }
        }

        // Vimeo
        if (url.includes('vimeo.com')) {
            const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
            if (vimeoId) {
                return `https://player.vimeo.com/video/${vimeoId}`;
            }
        }

        return url; // Retorna original se não reconhecer, ou null? Melhor original caso seja um link direto de mp4 válido ou outro player.
    } catch (e) {
        console.error('Error parsing video URL:', e);
        return null;
    }
};
