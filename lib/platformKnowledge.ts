// iziBrokerz Platform Knowledge Base
// Base de conhecimento completa para a IzA

export const PLATFORM_KNOWLEDGE = {
    // Informações da Plataforma
    platform: {
        name: "iziBrokerz",
        tagline: "A Plataforma inteligente que conecta você às melhores oportunidades do mercado",
        mission: "Revolucionar o mercado imobiliário com tecnologia, parcerias e inteligência artificial",

        diferenciais: [
            "Teste Grátis de 14 dias - sem compromisso!",
            "Sistema de parcerias entre Corretores Parceiros",
            "IA integrada para análise de bairros e precificação",
            "Sistema MATCH: busca automática de imóveis para seus clientes",
            "CRM simplificado e objetivo",
            "Página personalizada para cada Corretor Parceiro",
            "Verificação CRECI/COFECI de todos os Parceiros"
        ]
    },

    // GANCHO PRINCIPAL - Teste Grátis
    trialOffer: {
        duration: "14 dias",
        description: "Teste grátis de 14 dias sem compromisso! Experimente todas as funcionalidades da plataforma.",
        callToAction: "Cadastre-se agora e comece seu teste grátis!",
        noCardRequired: true,
        benefits: [
            "Acesso limitado às funcionalidades",
            "Anúncios limitados",
            "Página personalizada",
            "Sistema de parcerias (somente visualização)"
        ]
    },

    // Pitch para Corretores (Atualizado)
    brokerPitch: {
        headline: "Mais Leads. Mais Imóveis. Mais Parcerias. Mais Resultados!",

        mainBenefits: [
            {
                title: "Página Personalizada com IA",
                description: "Seu site profissional com assistente virtual que atende seus clientes 24h",
                icon: "🏠"
            },
            {
                title: "Sistema de Parcerias Inteligente",
                description: "Amplie sua carteira de imóveis trabalhando em parceria com outros Corretores da sua região",
                icon: "🤝"
            },
            {
                title: "MATCH Automático",
                description: "Cadastrou um cliente? Buscamos automaticamente imóveis compatíveis em toda nossa Plataforma!",
                icon: "🎯"
            },
            {
                title: "Notificações em Tempo Real",
                description: "Novo imóvel compatível com seu cliente? Avisamos você pelo WhatsApp!",
                icon: "📲"
            },
            {
                title: "CRM Simplificado",
                description: "Sem firulas! Funil de vendas direto ao ponto, focado no que gera resultado",
                icon: "📊"
            },
            {
                title: "Importação XML (Em breve)",
                description: "Importe seus imóveis de outras plataformas com poucos cliques",
                icon: "📥"
            }
        ],

        security: {
            title: "Rede Segura e Verificada",
            description: "Todos os Corretores Parceiros são verificados no sistema CRECI/COFECI",
            icon: "🔒"
        },

        focus: [
            "MAIS LEADS",
            "MAIS IMÓVEIS",
            "MAIS PARCERIAS",
            "MAIS POSSIBILIDADES DE GANHO",
            "MATCH INTELIGENTE",
            "INTEGRAÇÕES QUE FUNCIONAM"
        ],

        ctaPage: "/anunciar",
        ctaText: "Começar Teste Grátis de 14 dias"
    },

    // Fluxo para Compradores/Locatários
    buyerFlow: {
        // Palavras-chave para detectar operação
        operacaoKeywords: {
            venda: ["comprar", "compra", "compro", "adquirir", "venda", "à venda", "a venda", "pra comprar"],
            locacao: ["alugar", "aluguel", "aluga", "locação", "locacao", "pra alugar", "para alugar"],
            temporada: ["temporada", "temporário", "temporario", "veraneio", "férias", "ferias"]
        },

        // Palavras-chave para tipo de imóvel
        tipoImovelKeywords: {
            apartamento: ["apartamento", "apartamentos", "apto", "aptos", "ap"],
            casa: ["casa", "casas", "residência", "residencia"],
            terreno: ["terreno", "terrenos", "lote", "lotes"],
            comercial: ["comercial", "loja", "lojas", "sala comercial", "ponto comercial"],
            kitnet: ["kitnet", "kitnets", "kitinete", "quitinete", "studio", "estudio", "estúdio"],
            sobrado: ["sobrado", "sobrados", "assobradada", "assobradadas", "assobradado", "assobradados"],
            cobertura: ["cobertura", "coberturas", "duplex", "triplex", "penthouse"],
            chacara: ["chácara", "chacara", "chácaras", "sítio", "sitio", "granja", "granjas"],
            fazenda: ["fazenda", "fazendas", "propriedade rural", "granja", "granjas"],
            galpao: ["galpão", "galpao", "barracão", "barracao"]
        },

        // Campos para match score (60% = 3 de 5)
        matchFields: ["operacao", "tipoImovel", "cidade", "bairro", "valor"],
        matchThreshold: 0.6, // 60%

        // Mensagens para quando não encontra imóveis
        noResultsMessage: "Ainda não temos imóveis nessa região, mas posso sugerir bairros próximos ou você pode explorar nosso mapa interativo!",

        // Sugestões para clientes indecisos
        undecidedSuggestion: "Que tal explorar no mapa? 🗺️ Navegue pela região e descubra oportunidades incríveis!"
    },

    // Sistema de Parcerias (simplificado)
    partnerships: {
        description: "Amplie sua carteira trabalhando em parceria com outros Corretores",
        benefits: [
            "Acesso a mais imóveis para oferecer aos seus clientes",
            "Mais chances de fechar negócios",
            "Rede de Corretores verificados",
            "Divisão de comissão transparente (50/50)"
        ]
    },

    // Sistema MATCH
    matchSystem: {
        name: "Sistema MATCH",
        description: "Busca inteligente de imóveis para seus clientes",
        howItWorks: [
            "Cadastre seu cliente com as preferências dele",
            "Nosso sistema busca imóveis compatíveis automaticamente",
            "Quando encontramos, você recebe notificação no WhatsApp",
            "Novos imóveis cadastrados também são verificados"
        ]
    },

    // Funcionalidades para Corretores
    features: {
        crm: {
            name: "CRM Simplificado",
            description: "Gestão de leads sem complicação",
            includes: [
                "Cadastro rápido de leads",
                "Funil de vendas visual",
                "Histórico de interações",
                "Sem campos desnecessários"
            ]
        },

        announcements: {
            name: "Gestão de Anúncios",
            description: "Publique e gerencie seus imóveis facilmente",
            includes: [
                "Upload múltiplo de fotos",
                "Descrições otimizadas com IA",
                "Status em tempo real",
                "Edição rápida"
            ]
        },

        personalPage: {
            name: "Página Personalizada",
            description: "Seu próprio site profissional",
            url: "izibrokerz.com/corretor/[seu-slug]",
            includes: [
                "Seus imóveis em destaque",
                "Imóveis de parceiros como Outras Opções",
                "Integração com WhatsApp",
                "Integração com IA (consulte planos)"
            ]
        },

        aiTools: {
            name: "Ferramentas de IA (consulte os planos)",
            description: "Inteligência artificial a seu favor",
            includes: [
                "Análise de bairros",
                "Sugestão de preços",
                "Geração de descrições do imóvel com um clique",
                "IzA - Nossa Assistente Virtual na sua página"
            ]
        }
    },

    // Preços
    pricing: {
        trial: {
            name: "Teste Grátis",
            duration: "14 dias",
            price: "R$ 0",
            features: "Acesso limitado sem compromisso"
        },
        plans: {
            starter: {
                name: "Starter",
                price: "Em breve",
                features: ["Anúncios limitados", "CRM básico"]
            },
            pro: {
                name: "Profissional",
                price: "Em breve",
                features: ["Anúncios ilimitados", "CRM completo", "IA ilimitada", "Página personalizada"]
            },
            enterprise: {
                name: "Imobiliária",
                price: "Sob consulta",
                features: ["Múltiplos corretores", "Gestão centralizada", "API personalizada"]
            }
        }
    },

    // Processo de Cadastro
    onboarding: {
        steps: [
            "1. Clique em 'http://localhost:3000/#/partner' e veja porquê você deve ser um Parceiro iziBrokerz",
            "2. Preencha seus dados (nome, email, CRECI, telefone, etc.)",
            "3. Confirme seu email",
            "4. Complete seu perfil em Configurações",
            "5. Comece a anunciar!"
        ],
        requirements: [
            "CRECI ativo",
            "Email válido",
            "WhatsApp para contato"
        ],
        time: "Menos de 5 minutos"
    },

    // Perguntas Frequentes
    faq: [
        {
            q: "O teste grátis é realmente sem compromisso?",
            a: "Sim! São 14 dias de acesso limitado sem precisar de cartão de crédito. Cancele quando quiser!"
        },
        {
            q: "Como funciona o sistema de parcerias?",
            a: "Você acessa imóveis de outros Corretores da rede e eles acessam os seus. Mais opções para seus clientes, mais chances de fechar negócio!"
        },
        {
            q: "O que é o sistema MATCH?",
            a: "Quando você cadastra um cliente, buscamos automaticamente imóveis compatíveis em nossa base de dados. E se outro Corretor cadastrar um imóvel ideal, você é notificado!"
        },
        {
            q: "Preciso pagar para anunciar?",
            a: "Não! Você pode começar com o teste grátis de 14 dias! Se gostar, depois você pode escolher o plano ideal para você."
        },
        {
            q: "Como vocês verificam os Corretores?",
            a: "Todos os cadastros são verificados no sistema CRECI/COFECI. Sua segurança é nossa prioridade!"
        }
    ],

    // Suporte
    support: {
        email: "contato@izibrokerz.com",
        whatsapp: "(11) 9999-9999",
        hours: "Segunda a Sexta, 9h às 18h",
        responseTime: "Até 24 horas"
    },

    // Tom de voz
    voiceTone: {
        style: 'Profissional, empática, proativa e amigável. Como uma consultora imobiliária experiente que realmente quer ajudar.',
        rules: [
            "Seja direto e evite rodeios",
            "Use linguagem amigável e acessível",
            "Mostre entusiasmo genuíno",
            "Personalize com o contexto da conversa",
            "Use emojis com moderação (1-2 por mensagem)",
            "Sempre termine com uma ação ou pergunta relevante",
            "Se possível, chegando próximo do final da conversa, direcione o cliente com um CTA (anúncio de imóvel ou direcione para uma página da plataforma"
        ],
        goldenRules: [
            "NUNCA seja insistente ou agressiva se o usuário disser 'não'.",
            "NUNCA compartilhe dados pessoais de outros usuários.",
            "NUNCA deixe o usuário sem resposta (sempre termine com uma pergunta ou ação).",
            "NUNCA use gírias excessivas ou linguagem muito informal.",
            "NUNCA critique outras plataformas ou concorrentes.",
            "NUNCA assuma que o usuário é corretor ou comprador sem indícios.",
            "NUNCA envie links quebrados ou IDs internos.",
            "NUNCA esqueça que seu objetivo final é conectar pessoas (lead ou parceria).",
            "EVITE termos em inglês (ex: 'pricing', 'timing', 'knowhow'). Use equivalentes em português."
        ],
        responseVariations: {
            greetings: [
                "Olá! Sou a IzA. Como posso ajudar você hoje?",
                "Oi! Bem-vindo à iziBrokerz. Estou aqui para te ajudar. O que você procura?",
                "Olá! Tudo bem? Sou a assistente virtual da iziBrokerz. Vamos encontrar seu novo lar ou ampliar seus negócios?"
            ],
            fallback: [
                "Não entendi muito bem. Você pode reformular? Estou aprendendo todos os dias! 🧠",
                "Poderia explicar de outra forma? Quero muito te ajudar com isso.",
                "Hmm, não tenho certeza se entendi. Você está buscando comprar, alugar ou é um corretor?"
            ],
            closing: [
                "Qualquer coisa, estou por aqui! 👋",
                "Espero ter ajudado! Se precisar de algo mais, é só chamar.",
                "Tenha um ótimo dia! Conte comigo para o que precisar."
            ],
            brokerHooks: [
                "Sabia que você pode testar nossa plataforma por 14 dias grátis? E sem cartão de crédito?",
                "Nossa rede de parcerias está crescendo muito. Já pensou em anunciar seus imóveis aqui?",
                "Temos ferramentas incríveis para corretores. Que tal dar uma olhada no nosso plano Básico?"
            ]
        }
    },

    // Tratamento de Objeções (Novo)
    objections: {
        security: {
            trigger: ["seguro", "golpe", "confiável", "medo", "perigoso", "fake"],
            response: "Pode ficar tranquilo(a)! 🛡️ Nossos Corretores Parceiros passam por verificação de CRECI/COFECI antes de entrarem na plataforma. Sua segurança é nossa prioridade número 1. Se notar algo estranho, me avise!"
        },
        price: {
            trigger: ["caro", "preço alto", "valor alto", "muito dinheiro", "muito caro"],
            response: "Entendo a preocupação com o valor. 💰 O mercado varia bastante por região. Que tal me dizer qual faixa de preço fica confortável para o seu bolso? Posso filtrar opções melhores!"
        },
        competition: {
            trigger: ["zap", "quintoandar", "viva real", "olx", "chaves na mão", "kenlo", "tecimob", "outra plataforma"],
            response: "São ótimas plataformas também! 🤝 O diferencial da iziBrokerz é que conectamos você diretamente ao Corretor especialista da região, sem intermediários burocráticos e com parcerias que aumentam as opções de imóveis."
        }
    },

    // Dicas Educacionais para Corretores (Novo)
    brokerEducation: [
        "📸 **Dica da IzA:** Fotos com iluminação natural e ambientes organizados aumentam em até 3x os cliques no anúncio!",
        "💰 **Precificação:** Imóveis com preço 5% acima da média da região demoram o dobro para vender. Vale a pena conferir a avaliação!",
        "⚡ **Agilidade:** Responder leads em menos de 1 hora aumenta suas chances de conversão em 7x. Fique ligado nas notificações!"
    ],

    // Contexto Regional (Estrutura para futuro)
    neighborhoodVibes: {
        generic: "Essa região é muito procurada! Tem boa valorização e acesso fácil a serviços.",
        quiet: "Bairro tranquilo, ideal para famílias e quem busca sossego.",
        busy: "Região vibrante, com muita vida noturna, comércio e facilidades.",
        luxury: "Região nobre, com alta segurança e imóveis de alto padrão."
    }
};

// Sistema de Qualificação de Leads
export interface LeadQualification {
    score: number; // 0-100
    level: 'cold' | 'warm' | 'hot';
    readyToContact: boolean;
    missingInfo: string[];
    notes: string;
}

// Estado da Conversa
export interface ConversationState {
    clientType: 'buyer' | 'broker' | null;
    operacao: string | null;
    tipoImovel: string | null;
    cidade: string | null;
    bairro: string | null;
    valorMin: number | null;
    valorMax: number | null;
    quartos: number | null;
    answeredQuestions: string[];
    bairros?: string[];  // Support multiple neighborhoods
    shownPropertyIds: string[];  // Track properties already shown to avoid repetition
}

export function createEmptyConversationState(): ConversationState {
    return {
        clientType: null,
        operacao: null,
        tipoImovel: null,
        cidade: null,
        bairro: null,
        valorMin: null,
        valorMax: null,
        quartos: null,
        answeredQuestions: [],
        bairros: [],
        shownPropertyIds: []
    };
}

export function extractInfoFromMessage(message: string, state: ConversationState): ConversationState {
    const lowerMessage = message.toLowerCase();
    const newState = { ...state };

    // Detectar operação
    if (!newState.operacao) {
        for (const [operacao, keywords] of Object.entries(PLATFORM_KNOWLEDGE.buyerFlow.operacaoKeywords)) {
            if (keywords.some(kw => lowerMessage.includes(kw))) {
                newState.operacao = operacao;
                if (!newState.answeredQuestions.includes('operacao')) {
                    newState.answeredQuestions.push('operacao');
                }
                break;
            }
        }
    }

    // Detectar tipo de imóvel
    if (!newState.tipoImovel) {
        for (const [tipo, keywords] of Object.entries(PLATFORM_KNOWLEDGE.buyerFlow.tipoImovelKeywords)) {
            if (keywords.some(kw => lowerMessage.includes(kw))) {
                newState.tipoImovel = tipo;
                if (!newState.answeredQuestions.includes('tipoImovel')) {
                    newState.answeredQuestions.push('tipoImovel');
                }
                break;
            }
        }
    }

    // Detectar valor (padrões: R$ X, X mil, X milhão, até X, de X a Y)
    const valorPatterns = [
        /r\$\s*([\d.,]+)\s*(mil|milhão|milhao)?/gi,
        /([\d.,]+)\s*(mil|milhão|milhao)/gi,
        /até\s*([\d.,]+)\s*(mil|milhão|milhao)?/gi,
        /de\s*([\d.,]+)\s*a\s*([\d.,]+)/gi
    ];

    for (const pattern of valorPatterns) {
        const match = pattern.exec(lowerMessage);
        if (match) {
            let valor = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
            const multiplicador = match[2];

            if (multiplicador?.includes('mil')) valor *= 1000;
            if (multiplicador?.includes('milh')) valor *= 1000000;

            if (!newState.valorMax || valor > newState.valorMax) {
                newState.valorMax = valor;
            }
            if (!newState.valorMin) {
                newState.valorMin = valor * 0.8; // 20% abaixo como mínimo
            }
            if (!newState.answeredQuestions.includes('valor')) {
                newState.answeredQuestions.push('valor');
            }
            break;
        }
    }

    // Detectar quartos
    const quartosMatch = lowerMessage.match(/(\d+)\s*(quarto|quartos|dormitório|dormitórios|dorm)/);
    if (quartosMatch && !newState.quartos) {
        newState.quartos = parseInt(quartosMatch[1]);
        if (!newState.answeredQuestions.includes('quartos')) {
            newState.answeredQuestions.push('quartos');
        }
    }

    return newState;
}

export function calculateMatchScore(state: ConversationState): number {
    const fields = ['operacao', 'tipoImovel', 'cidade', 'bairro', 'valorMax'];
    let filledCount = 0;

    if (state.operacao) filledCount++;
    if (state.tipoImovel) filledCount++;
    if (state.cidade) filledCount++;
    if (state.bairro) filledCount++;
    if (state.valorMax) filledCount++;

    return filledCount / fields.length;
}

export function generateSmartSearchLink(state: ConversationState): string {
    const params = new URLSearchParams();

    if (state.operacao) params.append('operacao', state.operacao);
    if (state.tipoImovel) params.append('tipo', state.tipoImovel);
    if (state.cidade) params.append('cidade', state.cidade);
    if (state.bairro) params.append('bairro', state.bairro);
    if (state.valorMax) params.append('valorMax', state.valorMax.toString());
    if (state.quartos) params.append('quartos', state.quartos.toString());

    return `/search?${params.toString()}`;
}

export function qualifyLead(conversation: string[]): LeadQualification {
    let score = 0;
    const missingInfo: string[] = [];

    const conversationText = conversation.join(' ').toLowerCase();

    // Interesse demonstrado (+30 pontos)
    if (conversationText.includes('quero') || conversationText.includes('busco') || conversationText.includes('procuro')) {
        score += 30;
    }

    // Orçamento mencionado (+25 pontos)
    if (conversationText.match(/r\$|real|reais|\d+\s*mil|\d+\s*milhão/)) {
        score += 25;
    } else {
        missingInfo.push('orçamento');
    }

    // Localização mencionada (+20 pontos)
    if (conversationText.match(/cidade|bairro|região|zona/)) {
        score += 20;
    } else {
        missingInfo.push('localização preferida');
    }

    // Tipo de imóvel (+15 pontos)
    if (conversationText.match(/apartamento|casa|terreno|comercial|kitnet|loft/)) {
        score += 15;
    } else {
        missingInfo.push('tipo de imóvel');
    }

    // Urgência (+10 pontos)
    if (conversationText.match(/urgente|rápido|logo|breve|mês/)) {
        score += 10;
    }

    // Determinar nível
    let level: 'cold' | 'warm' | 'hot';
    if (score >= 70) level = 'hot';
    else if (score >= 40) level = 'warm';
    else level = 'cold';

    return {
        score,
        level,
        readyToContact: score >= 50,
        missingInfo,
        notes: generateLeadNotes(score, level, missingInfo)
    };
}

function generateLeadNotes(score: number, level: string, missingInfo: string[]): string {
    if (level === 'hot') {
        return `Lead qualificado! Cliente demonstrou interesse claro. ${missingInfo.length > 0 ? `Falta: ${missingInfo.join(', ')}.` : 'Pronto para contato!'}`;
    } else if (level === 'warm') {
        return `Lead com potencial. Precisa de: ${missingInfo.join(', ')}.`;
    } else {
        return `Lead inicial. Qualificar: ${missingInfo.join(', ')}.`;
    }
}

