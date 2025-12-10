// Gemini Neighborhood Analysis Cache
// Implementa cache em localStorage para reduzir chamadas à API

interface NeighborhoodCache {
    bairro: string;
    cidade: string;
    uf: string;
    data: {
        educacao: string;
        lazer: string;
        seguranca: string;
        resumo: string;
    };
    timestamp: number;
}

const CACHE_KEY = 'gemini_neighborhood_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias em millisegundos

/**
 * Gera chave única para o bairro
 */
function getCacheKey(bairro: string, cidade: string, uf: string): string {
    return `${bairro.toLowerCase()}_${cidade.toLowerCase()}_${uf.toLowerCase()}`;
}

/**
 * Busca dados do cache
 */
export function getNeighborhoodFromCache(
    bairro: string,
    cidade: string,
    uf: string
): NeighborhoodCache['data'] | null {
    try {
        const cacheData = localStorage.getItem(CACHE_KEY);
        if (!cacheData) return null;

        const cache: Record<string, NeighborhoodCache> = JSON.parse(cacheData);
        const key = getCacheKey(bairro, cidade, uf);
        const entry = cache[key];

        if (!entry) return null;

        // Verificar se expirou
        const now = Date.now();
        if (now - entry.timestamp > CACHE_TTL) {
            // Expirado, remover
            delete cache[key];
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            return null;
        }

        return entry.data;
    } catch (error) {
        console.error('Error reading neighborhood cache:', error);
        return null;
    }
}

/**
 * Salva dados no cache
 */
export function saveNeighborhoodToCache(
    bairro: string,
    cidade: string,
    uf: string,
    data: NeighborhoodCache['data']
): void {
    try {
        const cacheData = localStorage.getItem(CACHE_KEY);
        const cache: Record<string, NeighborhoodCache> = cacheData ? JSON.parse(cacheData) : {};

        const key = getCacheKey(bairro, cidade, uf);
        cache[key] = {
            bairro,
            cidade,
            uf,
            data,
            timestamp: Date.now()
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Error saving neighborhood cache:', error);
    }
}

/**
 * Limpa cache expirado
 */
export function cleanExpiredCache(): void {
    try {
        const cacheData = localStorage.getItem(CACHE_KEY);
        if (!cacheData) return;

        const cache: Record<string, NeighborhoodCache> = JSON.parse(cacheData);
        const now = Date.now();
        let cleaned = false;

        Object.keys(cache).forEach(key => {
            if (now - cache[key].timestamp > CACHE_TTL) {
                delete cache[key];
                cleaned = true;
            }
        });

        if (cleaned) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        }
    } catch (error) {
        console.error('Error cleaning cache:', error);
    }
}

/**
 * Limpa todo o cache
 */
export function clearNeighborhoodCache(): void {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
}
