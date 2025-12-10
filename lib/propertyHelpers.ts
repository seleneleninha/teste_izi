// Property Data Transformation Helpers
// Centraliza lógica de transformação de dados de propriedades

export interface PropertyData {
    id: string;
    user_id: string;
    cod_imovel: number;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number | null;
    valor_locacao: number | null;
    fotos: string | string[];
    operacao: any;
    tipo_imovel: any;
    quartos: number;
    banheiros: number;
    vagas: number;
    area_priv: number;
    aceita_parceria?: boolean;
    isPartnership?: boolean;
}

export interface TransformedProperty extends Omit<PropertyData, 'fotos' | 'operacao' | 'tipo_imovel'> {
    fotos: string[];
    operacao: string;
    tipo_imovel: string;
}

/**
 * Transforma dados brutos de propriedade do Supabase
 * Converte fotos de string para array e extrai tipos de operacao/imovel
 */
export function transformPropertyData(property: PropertyData): TransformedProperty {
    return {
        ...property,
        fotos: typeof property.fotos === 'string'
            ? property.fotos.split(',').filter(Boolean)
            : property.fotos || [],
        operacao: typeof property.operacao === 'object' && property.operacao?.tipo
            ? property.operacao.tipo
            : property.operacao || '',
        tipo_imovel: typeof property.tipo_imovel === 'object' && property.tipo_imovel?.tipo
            ? property.tipo_imovel.tipo
            : property.tipo_imovel || ''
    };
}

/**
 * Transforma array de propriedades
 */
export function transformPropertiesArray(properties: PropertyData[]): TransformedProperty[] {
    return properties.map(transformPropertyData);
}

/**
 * Query otimizada para buscar propriedades com JOINs
 * Elimina N+1 queries
 */
export const PROPERTY_SELECT_QUERY = `
    *,
    operacao:operacao_id(tipo),
    tipo_imovel:tipo_imovel_id(tipo)
`;

/**
 * Formata valor monetário para BRL
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
    }).format(value);
}

/**
 * Obtém label de operação formatada
 */
export function getOperationLabel(operation: any): string {
    if (!operation) return '';
    const tipo = typeof operation === 'string' ? operation : operation.tipo || operation;
    if (tipo.toLowerCase() === 'venda') return 'Venda';
    if (tipo.toLowerCase() === 'locação' || tipo.toLowerCase() === 'locacao') return 'Locação';
    return tipo;
}

/**
 * Gera slug SEO-friendly para URL de propriedade
 * Formato: tipo-quartos-bairro-cidade-garagem-area-operacao-valor-cod
 * Exemplo: apartamento-3-quartos-ponta-negra-natal-com-garagem-85m2-venda-RS450000-cod1012
 */
export function generatePropertySlug(property: {
    tipo_imovel: string;
    quartos?: number;
    bairro: string;
    cidade: string;
    vagas?: number;
    area_priv?: number;
    operacao: string;
    valor_venda?: number | null;
    valor_locacao?: number | null;
    cod_imovel: number;
}): string {
    const parts: string[] = [];

    // Tipo do imóvel
    const tipoImovel = typeof property.tipo_imovel === 'object' && (property.tipo_imovel as any).tipo
        ? (property.tipo_imovel as any).tipo
        : property.tipo_imovel;
    parts.push(tipoImovel.toLowerCase());

    // Quartos (se aplicável)
    if (property.quartos && property.quartos > 0) {
        parts.push(`${property.quartos}-quartos`);
    }

    // Localização
    parts.push(property.bairro.toLowerCase());
    parts.push(property.cidade.toLowerCase());

    // Vagas (se tiver)
    if (property.vagas && property.vagas > 0) {
        parts.push('com-garagem');
    }

    // Área
    if (property.area_priv && property.area_priv > 0) {
        parts.push(`${Math.round(property.area_priv)}m2`);
    }

    // Operação
    const operacao = getOperationLabel(property.operacao);
    parts.push(operacao.toLowerCase());

    // Valor
    const valor = property.valor_venda || property.valor_locacao || 0;
    if (valor > 0) {
        parts.push(`RS${Math.round(valor)}`);
    }

    // Código do imóvel (identificador único)
    parts.push(`cod${property.cod_imovel}`);

    // Normalizar: remover acentos, espaços, caracteres especiais
    return parts
        .join('-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9-]/g, '') // Remove caracteres especiais
        .replace(/-+/g, '-'); // Remove hífens duplicados
}

/**
 * Navega para página de detalhes da propriedade
 * @param navigate - Função de navegação do react-router
 * @param property - Dados da propriedade
 * @param isDashboard - Se true, usa rota protegida do dashboard (/properties/:id)
 *                      Se false, usa rota pública com slug (/corretor/:brokerSlug/imovel/:propertySlug)
 * @param brokerSlug - Slug do corretor (obrigatório se isDashboard = false)
 */
export function navigateToProperty(
    navigate: any,
    property: any,
    isDashboard: boolean = false,
    brokerSlug?: string
) {
    if (isDashboard) {
        // Rota protegida do dashboard com slug inteligente
        const propertySlug = generatePropertySlug(property);
        navigate(`/properties/${propertySlug}`);
    } else {
        // Rota pública com slug
        const propertySlug = generatePropertySlug(property);
        if (brokerSlug) {
            navigate(`/corretor/${brokerSlug}/imovel/${propertySlug}`);
        } else {
            // Fallback: rota pública sem contexto de corretor
            navigate(`/imovel/${propertySlug}`);
        }
    }
}

/**
 * Gera URL completa para compartilhamento
 * @param property - Dados da propriedade
 * @param brokerSlug - Slug do corretor (opcional)
 * @returns URL completa para compartilhar
 */
export function getPropertyUrl(property: any, brokerSlug?: string): string {
    const propertySlug = generatePropertySlug(property);
    const baseUrl = window.location.origin;

    if (brokerSlug) {
        return `${baseUrl}/#/${propertySlug}?broker=${brokerSlug}`;
    } else {
        return `${baseUrl}/#/${propertySlug}`;
    }
}
