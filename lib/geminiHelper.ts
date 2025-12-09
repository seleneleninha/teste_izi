// Groq AI Configuration and Helper Functions
// Uses Llama 3 via Groq Cloud - Extremely fast and efficient

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// List of models to try in order (newest to oldest/fastest)
const GROQ_MODELS = [
    'llama-3.3-70b-versatile',   // Latest stable (Dec 2024)
    'llama-3.1-70b-versatile',   // Previous stable
    'llama-3.1-8b-instant',      // Fast fallback
];

// Development warning only (no sensitive data exposed)
if (!GROQ_API_KEY && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ AI: Configure NEXT_PUBLIC_GROQ_API_KEY em .env.local para habilitar IA');
}

interface GroqResponse {
    choices?: Array<{
        message: {
            content: string;
        };
    }>;
    error?: {
        message: string;
        type: string;
    };
}

/**
 * Call Groq API to generate text
 * @param prompt - The prompt to send to Groq
 * @returns Generated text or null if error
 */
export async function callGemini(prompt: string): Promise<string | null> {
    // Note: Function name kept as callGemini to avoid breaking imports, but uses Groq

    if (!GROQ_API_KEY) {
        console.error('❌ GROQ API: Chave API não configurada');
        return null;
    }

    // Try each model in order until one works
    for (let i = 0; i < GROQ_MODELS.length; i++) {
        const model = GROQ_MODELS[i];

        try {
            console.log(`🔄 GROQ API: Tentando modelo ${model} (${i + 1}/${GROQ_MODELS.length})...`);

            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 1,
                    stream: false
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.warn(`⚠️ GROQ API: Modelo ${model} falhou (${response.status})`, error);

                // If 401 (Unauthorized), stop trying (key is invalid)
                if (response.status === 401) {
                    console.error('❌ GROQ API: Chave API inválida. Verifique sua chave.');
                    return null;
                }

                // Try next model
                continue;
            }

            const data: GroqResponse = await response.json();
            const text = data.choices?.[0]?.message?.content;

            if (text) {
                console.log(`✅ GROQ API: Sucesso com modelo ${model}!`);
                return text;
            } else {
                console.warn(`⚠️ GROQ API: Modelo ${model} retornou resposta vazia`);
                continue;
            }
        } catch (error) {
            console.error(`❌ GROQ API: Erro ao tentar modelo ${model}`, error);
            continue;
        }
    }

    console.error('❌ GROQ API: Todos os modelos falharam');
    return null;
}

/**
 * Generate property description using AI (Groq/Llama 3)
 */
export async function generatePropertyDescription(propertyData: {
    tipo: string;
    subtipo?: string;
    titulo?: string;
    operacao?: string;
    bairro: string;
    cidade: string;
    quartos: number;
    suites: number;
    banheiros: number;
    vagas: number;
    area: number;
    caracteristicas: string[];
}): Promise<string[]> {
    const prompt = `Você é um redator especialista em marketing imobiliário. Crie 3 descrições ÚNICAS e ATRATIVAS para o seguinte imóvel:

${propertyData.titulo ? `Título: ${propertyData.titulo}` : ''}
Tipo: ${propertyData.tipo}${propertyData.subtipo ? ` - ${propertyData.subtipo}` : ''}
${propertyData.operacao ? `Operação: ${propertyData.operacao}` : ''}
Localização: ${propertyData.bairro}, ${propertyData.cidade}
Quartos: ${propertyData.quartos} | Suítes: ${propertyData.suites} | Banheiros: ${propertyData.banheiros}
Vagas: ${propertyData.vagas} | Área: ${propertyData.area}m²
Características: ${propertyData.caracteristicas.join(', ')}

DIRETRIZES IMPORTANTES:
- Crie 3 versões COMPLETAMENTE DIFERENTES (não apenas variações)
- IDIOMA: Português do Brasil (PT-BR) Impecável. NUNCA use termos em inglês desnecessários (ex: use "varanda gourmet" e não "gourmet balcony"). Termos aceitos: Closet, Living, Suite, Loft.
- TOM DE VOZ: Profissional, encantador e persuasivo. Evite exageros como "luxo" para imóveis simples.
- Destaque os DIFERENCIAIS e BENEFÍCIOS do imóvel, não apenas liste características
- Explore o ESTILO DE VIDA que o imóvel proporciona
- Mencione a LOCALIZAÇÃO de forma atrativa (use referências reais do bairro se souber, senão foque na conveniência)
- NÃO repita todas as especificações técnicas - use-as para criar uma narrativa envolvente
- Cada descrição deve ter entre 120-180 palavras
- Use verbos de ação e adjetivos que despertem emoção

EXEMPLOS DE ABORDAGENS DIFERENTES:
1ª descrição: "Família & Conforto" (Foco em segurança, espaço e convivência)
2ª descrição: "Praticidade & Modernidade" (Foco em localização, facilidades e design)
3ª descrição: "Investimento & Oportunidade" (Foco em valorização e custo-benefício)

Separe cada descrição com "---"

Formato de resposta:
[Descrição 1]
---
[Descrição 2]
---
[Descrição 3]`;

    const response = await callGemini(prompt);

    if (!response) {
        // Log warning when using fallback descriptions
        console.warn('⚠️ GROQ API: Falha na chamada. Usando descrições genéricas como fallback.');

        return [
            'Excelente imóvel localizado em região privilegiada. Conta com acabamento de primeira qualidade e ótima distribuição de ambientes. Ideal para quem busca conforto e praticidade no dia a dia.',
            'Imóvel com localização estratégica e infraestrutura completa. Ambientes bem planejados que proporcionam funcionalidade e bem-estar. Perfeito para famílias que valorizam qualidade de vida.',
            'Oportunidade única! Imóvel em excelente estado de conservação, pronto para morar. Localização privilegiada com fácil acesso a comércios e serviços. Não perca esta chance!'
        ];
    }

    console.log('✅ GROQ API: Descrições geradas com sucesso pela IA');

    // Split response into 3 descriptions
    const descriptions = response.split('---').map(d => d.trim()).filter(d => d.length > 0);

    // Ensure we have exactly 3 descriptions
    while (descriptions.length < 3) {
        descriptions.push('Descrição não disponível. Por favor, edite manualmente.');
    }

    return descriptions.slice(0, 3);
}

/**
 * Get property price evaluation using AI
 */
export async function evaluatePropertyPrice(propertyData: {
    tipo: string;
    bairro: string;
    cidade: string;
    quartos: number;
    area: number;
    similarProperties: Array<{
        valor: number;
        area: number;
        quartos: number;
    }>;
}): Promise<{ min: number; max: number; suggestion: string } | null> {
    if (propertyData.similarProperties.length < 3) {
        return null; // Not enough data
    }

    const avgPrice = propertyData.similarProperties.reduce((sum, p) => sum + p.valor, 0) / propertyData.similarProperties.length;
    const avgPricePerM2 = propertyData.similarProperties.reduce((sum, p) => sum + (p.valor / p.area), 0) / propertyData.similarProperties.length;

    const prompt = `Você é um avaliador imobiliário experiente. Analise os dados abaixo e sugira uma faixa de preço justa:

Imóvel a avaliar:
- Tipo: ${propertyData.tipo}
- Localização: ${propertyData.bairro}, ${propertyData.cidade}
- Quartos: ${propertyData.quartos}
- Área: ${propertyData.area}m²

Imóveis similares na região:
${propertyData.similarProperties.map((p, i) =>
        `${i + 1}. R$ ${p.valor.toLocaleString('pt-BR')} - ${p.area}m² - ${p.quartos} quartos (R$ ${(p.valor / p.area).toFixed(2)}/m²)`
    ).join('\n')}

Média de preço: R$ ${avgPrice.toLocaleString('pt-BR')}
Média por m²: R$ ${avgPricePerM2.toFixed(2)}/m²

Com base nesses dados, forneça:
1. Preço mínimo sugerido
2. Preço máximo sugerido
3. Breve justificativa (máximo 50 palavras)

Formato de resposta (EXATAMENTE neste formato):
MIN: [valor numérico]
MAX: [valor numérico]
JUSTIFICATIVA: [texto]`;

    const response = await callGemini(prompt);

    if (!response) {
        // Fallback calculation
        const margin = avgPrice * 0.1;
        return {
            min: Math.round(avgPrice - margin),
            max: Math.round(avgPrice + margin),
            suggestion: `Baseado em ${propertyData.similarProperties.length} imóveis similares na região.`
        };
    }

    // Parse response
    const minMatch = response.match(/MIN:\s*(\d+)/);
    const maxMatch = response.match(/MAX:\s*(\d+)/);
    const justMatch = response.match(/JUSTIFICATIVA:\s*(.+)/);

    if (minMatch && maxMatch) {
        return {
            min: parseInt(minMatch[1]),
            max: parseInt(maxMatch[1]),
            suggestion: justMatch?.[1]?.trim() || 'Avaliação baseada em imóveis similares.'
        };
    }

    return null;
}

/**
 * Analyze neighborhood using AI
 */
export async function analyzeNeighborhood(neighborhoodData: {
    bairro: string;
    cidade: string;
    uf: string;
}): Promise<{
    educacao: string;
    lazer: string;
    seguranca: string;
    resumo: string;
} | null> {
    const prompt = `Você é um especialista em análise de bairros e regiões urbanas no Brasil. Analise o bairro ${neighborhoodData.bairro} em ${neighborhoodData.cidade}, ${neighborhoodData.uf} e forneça informações REAIS e ATUALIZADAS sobre:

1. EDUCAÇÃO: Escolas, universidades, qualidade do ensino na região
2. LAZER & SERVIÇOS: Comércios, restaurantes, parques, academias, supermercados
3. SEGURANÇA: Índices de segurança, policiamento, características do bairro
4. RESUMO: Um parágrafo geral sobre o bairro, destacando seu perfil, características principais e por que é um bom lugar para morar

IMPORTANTE:
- Use dados REAIS do bairro específico
- Seja conciso (máximo 2-3 linhas por categoria, exceto resumo)
- Use linguagem profissional mas acessível
- Mencione estabelecimentos ou referências reais quando possível
- Se não tiver informações específicas, seja genérico mas útil
- O RESUMO deve ter 3-4 linhas e ser envolvente

Formato de resposta (EXATAMENTE neste formato):
EDUCACAO: [texto]
LAZER: [texto]
SEGURANCA: [texto]
RESUMO: [texto]`;

    const response = await callGemini(prompt);

    if (!response) {
        // Fallback genérico
        return {
            educacao: `Região com infraestrutura educacional variada em ${neighborhoodData.cidade}. Consulte escolas e instituições locais para mais informações.`,
            lazer: `Bairro com comércio local e serviços essenciais. Explore a região para descobrir opções de lazer e conveniência.`,
            seguranca: `Bairro residencial em ${neighborhoodData.cidade}. Recomenda-se consultar dados oficiais de segurança pública da região.`,
            resumo: `${neighborhoodData.bairro} é um bairro em ${neighborhoodData.cidade}, ${neighborhoodData.uf}, que oferece infraestrutura urbana e qualidade de vida para seus moradores. A região conta com comércio local, serviços essenciais e boa acessibilidade. Ideal para quem busca um local com equilíbrio entre tranquilidade e conveniência.`
        };
    }

    // Parse response - using [\s\S] instead of /s flag for broader compatibility
    const educacaoMatch = response.match(/EDUCACAO:\s*([\s\S]+?)(?=LAZER:|$)/);
    const lazerMatch = response.match(/LAZER:\s*([\s\S]+?)(?=SEGURANCA:|$)/);
    const segurancaMatch = response.match(/SEGURANCA:\s*([\s\S]+?)(?=RESUMO:|$)/);
    const resumoMatch = response.match(/RESUMO:\s*([\s\S]+?)$/);

    return {
        educacao: educacaoMatch?.[1]?.trim() || 'Informação não disponível.',
        lazer: lazerMatch?.[1]?.trim() || 'Informação não disponível.',
        seguranca: segurancaMatch?.[1]?.trim() || 'Informação não disponível.',
        resumo: resumoMatch?.[1]?.trim() || `${neighborhoodData.bairro} é um bairro em ${neighborhoodData.cidade}, ${neighborhoodData.uf}.`
    };
}
