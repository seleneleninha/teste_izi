// Gemini AI Configuration and Helper Functions
// Free tier: 15 requests per minute, 1500 requests per day

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface GeminiResponse {
    candidates?: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

/**
 * Call Gemini API to generate text
 * @param prompt - The prompt to send to Gemini
 * @returns Generated text or null if error
 */
export async function callGemini(prompt: string): Promise<string | null> {
    if (!GEMINI_API_KEY) {
        console.error('Gemini API key not configured');
        return null;
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Gemini API error:', error);
            return null;
        }

        const data: GeminiResponse = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        return text || null;
    } catch (error) {
        console.error('Error calling Gemini:', error);
        return null;
    }
}

/**
 * Generate property description using Gemini
 */
export async function generatePropertyDescription(propertyData: {
    tipo: string;
    subtipo?: string;
    bairro: string;
    cidade: string;
    quartos: number;
    suites: number;
    banheiros: number;
    vagas: number;
    area: number;
    caracteristicas: string[];
}): Promise<string[]> {
    const prompt = `Você é um especialista em marketing imobiliário. Crie 3 descrições atrativas e profissionais para um imóvel com as seguintes características:

Tipo: ${propertyData.tipo}${propertyData.subtipo ? ` - ${propertyData.subtipo}` : ''}
Localização: ${propertyData.bairro}, ${propertyData.cidade}
Quartos: ${propertyData.quartos}
Suítes: ${propertyData.suites}
Banheiros: ${propertyData.banheiros}
Vagas de garagem: ${propertyData.vagas}
Área privativa: ${propertyData.area}m²
Características: ${propertyData.caracteristicas.join(', ')}

IMPORTANTE:
- Crie 3 versões DIFERENTES da descrição
- Cada descrição deve ter entre 100-150 palavras
- Use linguagem persuasiva mas profissional
- Destaque os diferenciais do imóvel
- Não invente informações que não foram fornecidas
- Separe cada descrição com "---"

Formato de resposta:
[Descrição 1]
---
[Descrição 2]
---
[Descrição 3]`;

    const response = await callGemini(prompt);

    if (!response) {
        return [
            'Excelente imóvel localizado em região privilegiada. Conta com acabamento de primeira qualidade e ótima distribuição de ambientes. Ideal para quem busca conforto e praticidade no dia a dia.',
            'Imóvel com localização estratégica e infraestrutura completa. Ambientes bem planejados que proporcionam funcionalidade e bem-estar. Perfeito para famílias que valorizam qualidade de vida.',
            'Oportunidade única! Imóvel em excelente estado de conservação, pronto para morar. Localização privilegiada com fácil acesso a comércios e serviços. Não perca esta chance!'
        ];
    }

    // Split response into 3 descriptions
    const descriptions = response.split('---').map(d => d.trim()).filter(d => d.length > 0);

    // Ensure we have exactly 3 descriptions
    while (descriptions.length < 3) {
        descriptions.push('Descrição não disponível. Por favor, edite manualmente.');
    }

    return descriptions.slice(0, 3);
}

/**
 * Get property price evaluation using Gemini
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
 * Analyze neighborhood using Gemini
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

    // Parse response
    const educacaoMatch = response.match(/EDUCACAO:\s*(.+?)(?=LAZER:|$)/s);
    const lazerMatch = response.match(/LAZER:\s*(.+?)(?=SEGURANCA:|$)/s);
    const segurancaMatch = response.match(/SEGURANCA:\s*(.+?)(?=RESUMO:|$)/s);
    const resumoMatch = response.match(/RESUMO:\s*(.+?)$/s);

    return {
        educacao: educacaoMatch?.[1]?.trim() || 'Informação não disponível.',
        lazer: lazerMatch?.[1]?.trim() || 'Informação não disponível.',
        seguranca: segurancaMatch?.[1]?.trim() || 'Informação não disponível.',
        resumo: resumoMatch?.[1]?.trim() || `${neighborhoodData.bairro} é um bairro em ${neighborhoodData.cidade}, ${neighborhoodData.uf}.`
    };
}
