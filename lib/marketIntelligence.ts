// Market Intelligence - Funções de Cálculo
// Análise de R$/m² baseado em anúncios ativos

export interface PropertyData {
    id: string;
    uf: string;
    cidade: string;
    bairro: string;
    tipo_imovel: any;
    operacao: any;
    area_priv: number;
    valor_venda: number | null;
    valor_locacao: number | null;
    quartos: number;
    banheiros: number;
    vagas: number;
}

export interface MarketAnalysis {
    location: string;
    uf?: string;
    cidade?: string;
    bairro?: string;
    tipoImovel?: string;
    totalAnuncios: number;
    mediaM2Venda: number | null;
    mediaM2Locacao: number | null;
    minM2Venda: number | null;
    maxM2Venda: number | null;
    minM2Locacao: number | null;
    maxM2Locacao: number | null;
    yieldAnual: number | null;
}

export interface MarketSummary {
    totalAnuncios: number;
    totalEstados: number;
    totalCidades: number;
    totalBairros: number;
    mediaM2VendaBrasil: number;
    mediaM2LocacaoBrasil: number;
    anunciosVenda: number;
    anunciosLocacao: number;
}

// Calcula R$/m² de um imóvel
export const calcularM2 = (valor: number | null, area: number): number | null => {
    if (!valor || !area || area <= 0) return null;
    return Math.round(valor / area);
};

// Calcula yield anual (rentabilidade)
export const calcularYield = (valorVenda: number | null, valorLocacao: number | null): number | null => {
    if (!valorVenda || !valorLocacao || valorVenda <= 0) return null;
    return Math.round(((valorLocacao * 12) / valorVenda) * 10000) / 100; // Retorna % com 2 casas
};

// Agrupa propriedades por localização
export const agruparPorLocalizacao = (
    properties: PropertyData[],
    groupBy: 'uf' | 'cidade' | 'bairro' | 'tipo'
): Map<string, PropertyData[]> => {
    const grupos = new Map<string, PropertyData[]>();

    properties.forEach(prop => {
        let key = '';
        switch (groupBy) {
            case 'uf':
                key = prop.uf || 'Não informado';
                break;
            case 'cidade':
                key = `${prop.cidade || 'Não informado'}, ${prop.uf || ''}`;
                break;
            case 'bairro':
                key = `${prop.bairro || 'Não informado'}, ${prop.cidade || ''}, ${prop.uf || ''}`;
                break;
            case 'tipo':
                const tipo = typeof prop.tipo_imovel === 'string' ? prop.tipo_imovel : prop.tipo_imovel?.tipo;
                key = tipo || 'Não informado';
                break;
        }

        if (!grupos.has(key)) {
            grupos.set(key, []);
        }
        grupos.get(key)!.push(prop);
    });

    return grupos;
};

// Calcula estatísticas de um grupo de propriedades
export const calcularEstatisticas = (properties: PropertyData[], location: string): MarketAnalysis => {
    const m2Vendas: number[] = [];
    const m2Locacoes: number[] = [];

    properties.forEach(prop => {
        const m2Venda = calcularM2(prop.valor_venda, prop.area_priv);
        const m2Locacao = calcularM2(prop.valor_locacao, prop.area_priv);

        if (m2Venda) m2Vendas.push(m2Venda);
        if (m2Locacao) m2Locacoes.push(m2Locacao);
    });

    const mediaM2Venda = m2Vendas.length > 0
        ? Math.round(m2Vendas.reduce((a, b) => a + b, 0) / m2Vendas.length)
        : null;

    const mediaM2Locacao = m2Locacoes.length > 0
        ? Math.round(m2Locacoes.reduce((a, b) => a + b, 0) / m2Locacoes.length)
        : null;

    return {
        location,
        totalAnuncios: properties.length,
        mediaM2Venda,
        mediaM2Locacao,
        minM2Venda: m2Vendas.length > 0 ? Math.min(...m2Vendas) : null,
        maxM2Venda: m2Vendas.length > 0 ? Math.max(...m2Vendas) : null,
        minM2Locacao: m2Locacoes.length > 0 ? Math.min(...m2Locacoes) : null,
        maxM2Locacao: m2Locacoes.length > 0 ? Math.max(...m2Locacoes) : null,
        yieldAnual: calcularYield(
            mediaM2Venda ? mediaM2Venda * 100 : null, // Valor médio aproximado
            mediaM2Locacao ? mediaM2Locacao : null
        ),
    };
};

// Gera análise completa por bairro
export const analisarPorBairro = (
    properties: PropertyData[],
    filtroUF?: string,
    filtroCidade?: string,
    filtroTipo?: string
): MarketAnalysis[] => {
    let filtered = properties;

    // Aplicar filtros
    if (filtroUF) {
        filtered = filtered.filter(p => p.uf === filtroUF);
    }
    if (filtroCidade) {
        filtered = filtered.filter(p => p.cidade === filtroCidade);
    }
    if (filtroTipo) {
        const tipoFilter = filtroTipo.toLowerCase();
        filtered = filtered.filter(p => {
            const tipo = typeof p.tipo_imovel === 'string' ? p.tipo_imovel : p.tipo_imovel?.tipo;
            return tipo?.toLowerCase() === tipoFilter;
        });
    }

    // Agrupar por bairro
    const grupos = agruparPorLocalizacao(filtered, 'bairro');
    const analises: MarketAnalysis[] = [];

    grupos.forEach((props, location) => {
        const analise = calcularEstatisticas(props, location);
        // Extrair UF, cidade, bairro do location
        const parts = location.split(', ');
        analise.bairro = parts[0];
        analise.cidade = parts[1];
        analise.uf = parts[2];
        analises.push(analise);
    });

    // Ordenar por quantidade de anúncios (decrescente)
    return analises.sort((a, b) => b.totalAnuncios - a.totalAnuncios);
};

// Gera resumo geral do mercado
export const gerarResumoMercado = (properties: PropertyData[]): MarketSummary => {
    const estados = new Set<string>();
    const cidades = new Set<string>();
    const bairros = new Set<string>();
    let totalM2Venda = 0;
    let countM2Venda = 0;
    let totalM2Locacao = 0;
    let countM2Locacao = 0;
    let anunciosVenda = 0;
    let anunciosLocacao = 0;

    properties.forEach(prop => {
        if (prop.uf) estados.add(prop.uf);
        if (prop.cidade) cidades.add(`${prop.cidade}-${prop.uf}`);
        if (prop.bairro) bairros.add(`${prop.bairro}-${prop.cidade}-${prop.uf}`);

        const m2Venda = calcularM2(prop.valor_venda, prop.area_priv);
        const m2Locacao = calcularM2(prop.valor_locacao, prop.area_priv);

        if (m2Venda) {
            totalM2Venda += m2Venda;
            countM2Venda++;
            anunciosVenda++;
        }
        if (m2Locacao) {
            totalM2Locacao += m2Locacao;
            countM2Locacao++;
            anunciosLocacao++;
        }
    });

    return {
        totalAnuncios: properties.length,
        totalEstados: estados.size,
        totalCidades: cidades.size,
        totalBairros: bairros.size,
        mediaM2VendaBrasil: countM2Venda > 0 ? Math.round(totalM2Venda / countM2Venda) : 0,
        mediaM2LocacaoBrasil: countM2Locacao > 0 ? Math.round(totalM2Locacao / countM2Locacao) : 0,
        anunciosVenda,
        anunciosLocacao,
    };
};

// Formata valor em moeda brasileira
export const formatarMoeda = (valor: number | null): string => {
    if (valor === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    }).format(valor);
};

// Formata percentual
export const formatarPercentual = (valor: number | null): string => {
    if (valor === null) return '-';
    return `${valor.toFixed(2)}%`;
};

// Obtém lista única de valores para filtros
export const obterValoresUnicos = (
    properties: PropertyData[],
    campo: 'uf' | 'cidade' | 'tipo'
): string[] => {
    const valores = new Set<string>();

    properties.forEach(prop => {
        let valor = '';
        switch (campo) {
            case 'uf':
                valor = prop.uf || '';
                break;
            case 'cidade':
                valor = prop.cidade || '';
                break;
            case 'tipo':
                valor = typeof prop.tipo_imovel === 'string' ? prop.tipo_imovel : prop.tipo_imovel?.tipo || '';
                break;
        }
        if (valor) valores.add(valor);
    });

    return Array.from(valores).sort();
};
