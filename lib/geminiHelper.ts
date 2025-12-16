// Groq AI Configuration and Helper Functions
// Uses Llama 3 via Groq Cloud - Extremely fast and efficient

const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// List of models to try in order (newest to oldest/fastest)
const GROQ_MODELS = [
    'llama-3.3-70b-versatile',   // Latest stable (Dec 2024)
    'llama-3.1-70b-versatile',   // Previous stable
    'llama-3.1-8b-instant',      // Fast fallback
];

// Development warning only (no sensitive data exposed)
if (!GROQ_API_KEY && (import.meta as any).env?.DEV) {
    console.warn('⚠️ AI: Configure VITE_GROQ_API_KEY em .env.local para habilitar IA');
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
 * Creates 3 different styles: Conservative, Popular (with emojis), and Mix
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
    brokerName?: string;
    brokerCreci?: string;
    brokerUfCreci?: string;
    brokerWhatsapp?: string;
    // Financial info
    valorVenda?: number;
    valorLocacao?: number;
    valorDiaria?: number;
    valorMensal?: number;
    taxasInclusas?: boolean;
    aceitaFinanciamento?: boolean;
    isTemporada?: boolean;
}): Promise<string[]> {
    const prompt = `Você é um redator especialista em marketing imobiliário. Crie 3 descrições DIFERENTES para o seguinte imóvel:

${propertyData.titulo ? `Título: ${propertyData.titulo}` : ''}
Tipo: ${propertyData.tipo}${propertyData.subtipo ? ` - ${propertyData.subtipo}` : ''}
${propertyData.operacao ? `Operação: ${propertyData.operacao}` : ''}
Localização: ${propertyData.bairro}, ${propertyData.cidade}
Quartos: ${propertyData.quartos} | Suítes: ${propertyData.suites} | Banheiros: ${propertyData.banheiros}
Vagas: ${propertyData.vagas} | Área: ${propertyData.area}m²
Características: ${propertyData.caracteristicas.join(', ')}

VALORES E CONDIÇÕES:
${propertyData.valorVenda ? `💰 Valor de Venda: R$ ${propertyData.valorVenda.toLocaleString('pt-BR')}` : ''}
${propertyData.valorLocacao ? `💰 Valor de Locação: R$ ${propertyData.valorLocacao.toLocaleString('pt-BR')}/mês` : ''}
${propertyData.valorDiaria ? `🏖️ Valor da Diária: R$ ${propertyData.valorDiaria.toLocaleString('pt-BR')}` : ''}
${propertyData.valorMensal ? `📅 Valor Mensal (temporada): R$ ${propertyData.valorMensal.toLocaleString('pt-BR')}` : ''}
${propertyData.taxasInclusas ? '✅ Taxas inclusas (condomínio e IPTU inclusos no valor)' : '⚠️ Taxas não inclusas'}
${propertyData.aceitaFinanciamento ? '🏦 Aceita financiamento bancário' : ''}
${propertyData.isTemporada ? `

🌴 IMPORTANTE: Este é um imóvel para TEMPORADA/FÉRIAS. 
Use termos relacionados a: férias, descanso, família, pausa, curtição, viajar, viagem, amigos, passeios, lazer, relaxamento, escapada, refúgio, momento especial
Explore o conceito de experiência única, memórias inesquecíveis, e qualidade de vida temporária.
Enfatize a localização como destino turístico ideal.` : ''}

IMPORTANTE: Cada descrição deve seguir um estilo DIFERENTE:

═══════════════════════════════════════════════════════════════════
OPÇÃO 1 - CONSERVADORA (Profissional e Concisa):
═══════════════════════════════════════════════════════════════════
- Tom: Profissional, objetivo, direto
- Estrutura (com quebras de linha entre parágrafos):
  1º parágrafo: Breve resumo enaltecendo o bairro (2-3 linhas)
  [QUEBRA DE LINHA]
  2º parágrafo: Enaltecer as dependências do imóvel (quartos, suítes, vagas, etc) e agregar valor (3-4 linhas)
  [QUEBRA DE LINHA]
  3º parágrafo: Frase de impacto para agendamento de visita (1 linha, sem exageros ou intimidades)
- NÃO use emojis
- Use linguagem formal mas acessível
- Entre 100-150 palavras

═══════════════════════════════════════════════════════════════════
OPÇÃO 2 - POPULAR (Estilo Corretor com Emojis):
═══════════════════════════════════════════════════════════════════
- Tom: Informal, emocional, com emojis
- Estrutura OBRIGATÓRIA (copie exatamente este formato):

🏡 [Breve resumo sobre o bairro e valorização do imóvel]

🏡 ${propertyData.tipo} com ${propertyData.area}m² de área${propertyData.quartos > 0 ? `;
😍 ${propertyData.caracteristicas[0] || 'Excelente acabamento'}` : ''};
${propertyData.caracteristicas.length > 1 ? `🍃 ${propertyData.caracteristicas[1]}` : ''}
[continue listando características com emojis relevantes]

${propertyData.quartos > 2 || propertyData.suites > 0 ? `📺 [Descrição de sala/ambientes];
😴 ${propertyData.quartos} quartos${propertyData.suites > 0 ? ` (${propertyData.suites} suíte${propertyData.suites > 1 ? 's' : ''})` : ''};
${propertyData.banheiros > 0 ? `🚾 ${propertyData.banheiros} banheiro${propertyData.banheiros > 1 ? 's' : ''};` : ''}
${propertyData.vagas > 0 ? `🚗 ${propertyData.vagas} vaga${propertyData.vagas > 1 ? 's' : ''};` : ''}` : ''}

Investimento:
💰 [Valor ou "Sob consulta"];

Espero seu agendamento!

${propertyData.brokerName || '[Nome do Corretor]'}
CRECI - ${propertyData.brokerCreci || '[CRECI]'}/${propertyData.brokerUfCreci || '[UF]'}
📲 ${propertyData.brokerWhatsapp || '[WhatsApp]'}

═══════════════════════════════════════════════════════════════════
OPÇÃO 3 - MIX (Equilibrado - Nem conservador, nem popular demais):
═══════════════════════════════════════════════════════════════════
- Tom: Profissional mas amigável
- Use POUCOS emojis (máximo 3-4 no texto todo, de forma sutil)
- Estrutura com quebras de linha:
  1º parágrafo: Introdução atrativa sobre localização e destaque do imóvel
  [QUEBRA DE LINHA]
  2º parágrafo: Descrição objetiva mas envolvente das características principais
  [QUEBRA DE LINHA]
  3º parágrafo: Call-to-action sutil para agendamento
- Entre 120-160 palavras
- Mescle formalidade com proximidade

REGRAS GERAIS:
- IDIOMA: Português Brasil (PT-BR)
- Respeite QUEBRAS DE LINHA (use \\n\\n entre parágrafos)
- NÃO invente valores ou informações não fornecidas
- Use "Sob consulta" ao invés de inventar preços

Separe cada descrição com "---"

IMPORTANTE: Retorne APENAS o texto das descrições, SEM incluir cabeçalhos como "[Descrição 1 - CONSERVADORA]" ou labels. 
O usuário já verá os labels na interface, então retorne somente o conteúdo puro de cada descrição.

Formato de resposta (apenas texto, sem labels):
[Texto da descrição conservadora, sem cabeçalho]
---
[Texto da descrição popular, sem cabeçalho]
---
[Texto da descrição mix, sem cabeçalho]`;

    const response = await callGemini(prompt);

    if (!response) {
        console.warn('⚠️ GROQ API: Falha na chamada. Usando descrições genéricas como fallback.');

        return [
            // CONSERVADORA
            `Localizado em ${propertyData.bairro}, um dos bairros mais valorizados de ${propertyData.cidade}, este imóvel oferece excelente qualidade de vida e infraestrutura completa.

Imóvel com ${propertyData.area}m², contando com ${propertyData.quartos} quarto${propertyData.quartos > 1 ? 's' : ''}${propertyData.suites > 0 ? `, sendo ${propertyData.suites} suíte${propertyData.suites > 1 ? 's' : ''}` : ''}, ${propertyData.banheiros} banheiro${propertyData.banheiros > 1 ? 's' : ''} e ${propertyData.vagas} vaga${propertyData.vagas > 1 ? 's' : ''} de garagem. Acabamento de primeira qualidade e ótima distribuição de ambientes.

Agende sua visita e confira pessoalmente todos os detalhes deste excelente imóvel.`,

            // POPULAR COM EMOJIS
            `🏡 ${propertyData.bairro} é sinônimo de valorização e qualidade de vida!

🏡 ${propertyData.tipo} com ${propertyData.area}m²;
😍 ${propertyData.quartos} quarto${propertyData.quartos > 1 ? 's' : ''}${propertyData.suites > 0 ? ` (${propertyData.suites} suíte${propertyData.suites > 1 ? 's' : ''})` : ''};
🚾 ${propertyData.banheiros} banheiro${propertyData.banheiros > 1 ? 's' : ''};
🚗 ${propertyData.vagas} vaga${propertyData.vagas > 1 ? 's' : ''} de garagem;

Investimento:
💰 Sob consulta

Espero seu agendamento!

${propertyData.brokerName || '[Nome do Corretor]'}
CRECI - ${propertyData.brokerCreci || '[CRECI]'}/${propertyData.brokerUfCreci || '[UF]'}
📲 ${propertyData.brokerWhatsapp || '[WhatsApp]'}`,

            // MIX
            `Descubra este ${propertyData.tipo} em ${propertyData.bairro}, uma região que combina tranquilidade e conveniência em ${propertyData.cidade}. 🏡

Com ${propertyData.area} m² bem distribuídos, o imóvel oferece ${propertyData.quartos} quarto${propertyData.quartos > 1 ? 's' : ''}${propertyData.suites > 0 ? `, sendo ${propertyData.suites} suíte${propertyData.suites > 1 ? 's' : ''}` : ''}, ${propertyData.banheiros} banheiro${propertyData.banheiros > 1 ? 's' : ''} e ${propertyData.vagas} vaga${propertyData.vagas > 1 ? 's' : ''} de garagem.Ideal para quem valoriza conforto e praticidade.

Entre em contato para agendar uma visita e conhecer todos os detalhes! 📲✨`
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

    const prompt = `Você é um avaliador imobiliário experiente.Analise os dados abaixo e sugira uma faixa de preço justa:

Imóvel a avaliar:
    - Tipo: ${propertyData.tipo}
    - Localização: ${propertyData.bairro}, ${propertyData.cidade}
    - Quartos: ${propertyData.quartos}
    - Área: ${propertyData.area} m²

Imóveis similares na região:
${propertyData.similarProperties.map((p, i) =>
        `${i + 1}. R$ ${p.valor.toLocaleString('pt-BR')} - ${p.area}m² - ${p.quartos} quartos (R$ ${(p.valor / p.area).toFixed(2)}/m²)`
    ).join('\n')
        }

Média de preço: R$ ${avgPrice.toLocaleString('pt-BR')}
Média metro quadrado: R$ ${avgPricePerM2.toFixed(2)}/m²

Com base nesses dados, forneça:
    1. Preço mínimo sugerido
    2. Preço máximo sugerido
    3. Breve justificativa(máximo 50 palavras)

Formato de resposta(EXATAMENTE neste formato):
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
    const prompt = `Você é um especialista em análise de bairros e regiões urbanas no Brasil.Analise o bairro ${neighborhoodData.bairro} em ${neighborhoodData.cidade}, ${neighborhoodData.uf} e forneça informações REAIS e ATUALIZADAS sobre:

    1. EDUCAÇÃO: Escolas, universidades, qualidade do ensino na região
    2. LAZER & SERVIÇOS: Comércios, restaurantes, parques, academias, supermercados
    3. SEGURANÇA: Índices de segurança, policiamento, características do bairro
4. RESUMO: Um parágrafo geral sobre o bairro, destacando seu perfil, características principais e por que é um bom lugar para morar

    IMPORTANTE:
    - Use dados REAIS do bairro específico
        - Seja conciso(máximo 2 - 3 linhas por categoria, exceto resumo)
            - Use linguagem profissional mas acessível
                - Mencione estabelecimentos ou referências reais quando possível
                    - Se não tiver informações específicas, seja genérico mas útil
                        - O RESUMO deve ter 3 - 4 linhas e ser envolvente

Formato de resposta(EXATAMENTE neste formato):
    EDUCACAO: [texto]
    LAZER: [texto]
    SEGURANCA: [texto]
    RESUMO: [texto]`;

    const response = await callGemini(prompt);

    if (!response) {
        // Fallback genérico
        return {
            educacao: `Região com infraestrutura educacional variada em ${neighborhoodData.cidade}. Consulte escolas e instituições locais para mais informações.`,
            lazer: `Bairro com comércio local e serviços essenciais.Explore a região para descobrir opções de lazer e conveniência.`,
            seguranca: `Bairro residencial em ${neighborhoodData.cidade}.Recomenda - se consultar dados oficiais de segurança pública da região.`,
            resumo: `${neighborhoodData.bairro} é um bairro em ${neighborhoodData.cidade}, ${neighborhoodData.uf}, que oferece infraestrutura urbana e qualidade de vida para seus moradores.A região conta com comércio local, serviços essenciais e boa acessibilidade.Ideal para quem busca um local com equilíbrio entre tranquilidade e conveniência.`
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
