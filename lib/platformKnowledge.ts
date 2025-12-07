// iziBrokerz Platform Knowledge Base
// Base de conhecimento completa para a IzA

export const PLATFORM_KNOWLEDGE = {
    // Informações da Plataforma
    platform: {
        name: "iziBrokerz",
        tagline: "A Plataforma inteligente que conecta você às melhores oportunidades do mercado",
        mission: "Revolucionar o mercado imobiliário com tecnologia e parcerias estratégicas",

        diferenciais: [
            "Sistema de parcerias \"fifty\" entre Corretores Parceiros",
            "IA integrada para análise de bairros e precificação (com base nos anúncios ativos)",
            "CRM simples, completo e gratuito para Corretores",
            "Página personalizada para cada Corretor Parceiro",
            "Busca inteligente com filtros avançados"
        ]
    },

    // Sistema "fifty"
    fiftyFifty: {
        description: "Sistema de parcerias entre Corretores Parceiros",
        howItWorks: "Corretor A anuncia um imóvel. Corretor B traz o cliente. Ambos dividem 50% da comissão.",

        benefits: {
            forAdvertiser: [
                "Maior alcance para seus imóveis",
                "Rede de Parceiros trabalhando para você e vice-versa",
                "Sem custo adicional - só paga se vender",
                "Multiplica suas chances de venda"
            ],
            forPartner: [
                "Acesso a portfólio completo de imóveis",
                "Comissão de 50%",
                "Não precisa captar imóveis",
                "Foco total em atender Clientes"
            ]
        },

        example: "Imóvel de R$ 500.000 com 6% de comissão (R$ 30.000). Cada corretor recebe R$ 15.000."
    },

    // Funcionalidades para Corretores
    features: {
        crm: {
            name: "CRM Integrado",
            description: "Sistema simples e completo de gestão de leads e Clientes",
            includes: [
                "Cadastro e organização de leads",
                "Histórico de interações",
                "Funil de vendas visual",
                "Relatórios de performance"
            ]
        },

        announcements: {
            name: "Gestão de Anúncios",
            description: "Publique e gerencie seus imóveis facilmente",
            includes: [
                "Upload múltiplo de fotos",
                "Descrições otimizadas com IA",
                "Análise de precificação",
                "Status de aprovação",
                "Edição rápida"
            ]
        },

        personalPage: {
            name: "Página Personalizada",
            description: "Seu próprio site profissional",
            url: "izibrokerz.com/corretor/[seu-slug]",
            includes: [
                "Design profissional",
                "Seus imóveis em destaque",
                "Anúncios dos Parceiros na seção Você também pode gostar...",
                "Formulário de contato",
                "Integração com WhatsApp",
                "SEO otimizado"
            ]
        },

        aiTools: {
            name: "Ferramentas de IA",
            description: "Inteligência artificial a seu favor",
            includes: [
                "Análise de bairros (educação, lazer, segurança)",
                "Sugestão de preços",
                "Geração de descrições atrativas",
                "Insights de mercado"
            ]
        }
    },

    // Planos e Preços
    pricing: {
        current: "FREEmium",
        future: "Teste grátis por 7 dias",

        plans: {
            free: {
                features: [
                    "Anúncios ilimitados",
                    "CRM simples e completo",
                    "IA ilimitada",
                    "Suporte prioritário",
                    "Analytics avançado"
                ]
            },
            enterprise: {
                name: "Imobiliária (Em breve)",
                price: "Sob consulta",
                features: [
                    "Múltiplos Corretores",
                    "Gestão centralizada",
                    "API personalizada",
                    "White label",
                    "Treinamento dedicado"
                ]
            }
        }
    },

    // Processo de Cadastro
    onboarding: {
        steps: [
            "1. Acesse izibrokerz.com e clique em 'Cadastrar'",
            "2. Escolha 'Sou Corretor'",
            "3. Preencha seus dados (nome, email, CRECI, telefone)",
            "4. Confirme seu email",
            "5. Complete seu perfil",
            "6. Comece a anunciar!"
        ],
        requirements: [
            "CRECI ativo",
            "Email válido",
            "Telefone para contato"
        ],
        time: "Menos de 5 minutos"
    },

    // Tipos de Imóveis
    propertyTypes: [
        "Apartamento",
        "Casa",
        "Cobertura",
        "Kitnet/Studio",
        "Loft",
        "Sobrado",
        "Terreno",
        "Chácara",
        "Fazenda",
        "Comercial/Loja",
        "Sala Comercial",
        "Galpão",
        "Prédio Comercial"
    ],

    // Operações
    operations: [
        "Venda",
        "Locação",
        "Temporada"
    ],

    // Guias Passo-a-Passo
    guides: {
        howToRegisterProperty: {
            title: "Como cadastrar um imóvel",
            steps: [
                "1. Faça login na sua conta de Corretor",
                "2. Clique em 'Novo Imóvel' no menu lateral",
                "3. Preencha os dados básicos (tipo, endereço, valores)",
                "4. Adicione fotos de alta qualidade (mínimo 5)",
                "5. Use a IA para gerar uma descrição atrativa",
                "6. Revise e clique em 'Enviar para Aprovação'"
            ]
        },
        howToInvitePartner: {
            title: "Como convidar um parceiro",
            steps: [
                "1. Acesse a área 'Parcerias'",
                "2. Clique em 'Convidar Corretor'",
                "3. Digite o email do colega",
                "4. Ele receberá um convite para se cadastrar gratuitamente"
            ]
        },
        howToCloseDeal: {
            title: "Como fechar negócio no sistema fifty",
            steps: [
                "1. Quando um parceiro traz um cliente para seu imóvel, vocês negociam os termos",
                "2. O contrato é fechado normalmente",
                "3. A comissão é dividida 50/50 conforme as regras da plataforma",
                "4. Ambos marcam o imóvel como 'Vendido' no sistema"
            ]
        }
    },

    // Termos e Políticas
    legal: {
        termsOfUse: "O uso da plataforma implica na aceitação das regras de conduta ética, veracidade das informações dos imóveis e respeito ao sistema de parcerias.",
        privacyPolicy: "Seus dados e de seus clientes são protegidos. Não compartilhamos leads com terceiros sem autorização.",
        commissionRules: "A plataforma sugere a divisão 50/50 (fifty) para parcerias, mas os corretores têm liberdade para negociar percentuais diferentes caso acordado previamente por escrito."
    },

    // Dicas de Vendas e Mercado
    salesTips: [
        "Fotos profissionais aumentam em 3x as chances de contato.",
        "Descrições que contam histórias (storytelling) engajam mais que listas técnicas.",
        "Responda aos leads em até 5 minutos para aumentar a conversão em 400%.",
        "Mantenha o status dos imóveis sempre atualizado para evitar frustrações."
    ],

    // Perguntas Frequentes
    faq: [
        {
            q: "Como funciona o sistema \"fifty\"?",
            a: "Você anuncia um imóvel e outros Corretores podem trazer Clientes. Quando fecham negócio, vocês dividem 50/50 a comissão. Simples assim!"
        },
        {
            q: "Preciso pagar para anunciar?",
            a: "Não! Durante a fase beta, a Plataforma é 100% gratuita. Você só paga comissão quando vender."
        },
        {
            q: "Como recebo os leads?",
            a: "Leads chegam direto no seu CRM e você recebe notificação por email e WhatsApp em tempo real."
        },
        {
            q: "Posso usar minha própria marca?",
            a: "Sim! Sua página personalizada destaca sua marca e identidade visual."
        },
        {
            q: "Quanto tempo leva para aprovar um anúncio?",
            a: "Em média 24 horas. Anúncios com fotos de qualidade e descrições completas são aprovados mais rápido."
        }
    ],

    // Suporte
    support: {
        email: "contato@izibrokerz.com",
        whatsapp: "(11) 9999-9999",
        hours: "Segunda a Sexta, 9h às 18h",
        responseTime: "Até 24 horas"
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
        return `Lead qualificado! Cliente demonstrou interesse claro e forneceu informações importantes. ${missingInfo.length > 0 ? `Falta apenas: ${missingInfo.join(', ')}.` : 'Pronto para contato!'}`;
    } else if (level === 'warm') {
        return `Lead com potencial. Cliente interessado mas precisa de mais informações: ${missingInfo.join(', ')}.`;
    } else {
        return `Lead inicial. Continuar qualificando com perguntas sobre: ${missingInfo.join(', ')}.`;
    }
}
