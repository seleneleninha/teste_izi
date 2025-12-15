import { ConversationState } from './platformKnowledge';

export interface LeadScoreBreakdown {
    operacao: number;
    tipoImovel: number;
    bairro: number;
    valorMax: number;
    urgencia: number;
    interacao: number;
    detalhamento: number;
    total: number;
}

export interface LeadClassification {
    score: number;
    status: 'quente' | 'morno' | 'frio';
    breakdown: LeadScoreBreakdown;
    priority: 'alta' | 'media' | 'baixa';
}

// Palavras-chave de urgência
const URGENCY_KEYWORDS = [
    'urgente', 'rápido', 'logo', 'imediato', 'hoje', 'amanhã',
    'essa semana', 'este mês', 'preciso', 'necessito',
    'quanto antes', 'o mais rápido', 'asap'
];

/**
 * Calcula o score de um lead baseado no estado da conversa
 */
export function calculateLeadScore(
    state: ConversationState,
    messages: { role: string; content: string; timestamp: Date }[]
): LeadClassification {
    const breakdown: LeadScoreBreakdown = {
        operacao: 0,
        tipoImovel: 0,
        bairro: 0,
        valorMax: 0,
        urgencia: 0,
        interacao: 0,
        detalhamento: 0,
        total: 0
    };

    // 1. Operação definida = 20 pontos
    if (state.operacao) {
        breakdown.operacao = 20;
    }

    // 2. Tipo de imóvel definido = 20 pontos
    if (state.tipoImovel) {
        breakdown.tipoImovel = 20;
    }

    // 3. Bairro definido = 15 pontos
    if (state.bairro || (state.bairros && state.bairros.length > 0)) {
        breakdown.bairro = 15;
    }

    // 4. Valor máximo definido = 15 pontos
    if (state.valorMax) {
        breakdown.valorMax = 15;
    }

    // 5. Urgência mencionada = 15 pontos
    const hasUrgency = messages.some(msg =>
        msg.role === 'user' &&
        URGENCY_KEYWORDS.some(keyword =>
            msg.content.toLowerCase().includes(keyword)
        )
    );
    if (hasUrgency) {
        breakdown.urgencia = 15;
    }

    // 6. Interação ativa (tempo de resposta médio < 5min) = 10 pontos
    const avgResponseTime = calculateAverageResponseTime(messages);
    if (avgResponseTime > 0 && avgResponseTime < 300) { // 5 minutos em segundos
        breakdown.interacao = 10;
    }

    // 7. Mensagens detalhadas (> 50 caracteres) = 5 pontos
    const hasDetailedMessages = messages.some(msg =>
        msg.role === 'user' && msg.content.length > 50
    );
    if (hasDetailedMessages) {
        breakdown.detalhamento = 5;
    }

    // Calcula total
    breakdown.total = Object.values(breakdown)
        .filter(v => typeof v === 'number')
        .reduce((sum, val) => sum + val, 0);

    // Classifica o lead
    const status = classifyLeadStatus(breakdown.total);
    const priority = getLeadPriority(breakdown.total);

    return {
        score: breakdown.total,
        status,
        breakdown,
        priority
    };
}

/**
 * Classifica o status do lead baseado no score
 */
export function classifyLeadStatus(score: number): 'quente' | 'morno' | 'frio' {
    if (score >= 80) return 'quente';
    if (score >= 50) return 'morno';
    return 'frio';
}

/**
 * Determina a prioridade do lead
 */
export function getLeadPriority(score: number): 'alta' | 'media' | 'baixa' {
    if (score >= 80) return 'alta';
    if (score >= 50) return 'media';
    return 'baixa';
}

/**
 * Calcula tempo médio de resposta do usuário (em segundos)
 */
function calculateAverageResponseTime(
    messages: { role: string; timestamp: Date }[]
): number {
    if (messages.length < 2) return 0;

    const responseTimes: number[] = [];

    for (let i = 1; i < messages.length; i++) {
        const current = messages[i];
        const previous = messages[i - 1];

        // Só conta se usuário respondeu após assistente
        if (current.role === 'user' && previous.role === 'assistant') {
            const timeDiff = new Date(current.timestamp).getTime() -
                new Date(previous.timestamp).getTime();
            responseTimes.push(timeDiff / 1000); // Converte para segundos
        }
    }

    if (responseTimes.length === 0) return 0;

    const avgMs = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    return avgMs;
}

/**
 * Verifica se lead deve notificar corretor
 */
export function shouldNotifyBroker(classification: LeadClassification): boolean {
    return classification.status === 'quente';
}

/**
 * Gera mensagem de resumo do lead para corretor
 */
export function generateLeadSummary(
    conversation: any,
    classification: LeadClassification
): string {
    const state = conversation.conversation_state as ConversationState;

    let summary = `🔥 *LEAD ${classification.status.toUpperCase()}!*\n\n`;
    summary += `📊 Score: ${classification.score}/100\n`;
    summary += `⏰ Prioridade: ${classification.priority.toUpperCase()}\n\n`;

    if (conversation.name) {
        summary += `👤 Cliente: ${conversation.name}\n`;
    }
    summary += `📱 WhatsApp: ${formatPhoneNumber(conversation.phone_number)}\n\n`;

    summary += `*Interesse:*\n`;
    if (state.operacao) {
        summary += `• Operação: ${state.operacao}\n`;
    }
    if (state.tipoImovel) {
        summary += `• Tipo: ${state.tipoImovel}\n`;
    }
    if (state.bairro) {
        summary += `• Bairro: ${state.bairro}\n`;
    } else if (state.cidade) {
        summary += `• Cidade: ${state.cidade}\n`;
    }
    if (state.valorMax) {
        summary += `• Valor máximo: R$ ${state.valorMax.toLocaleString('pt-BR')}\n`;
    }

    summary += `\n👉 Acesse o painel para assumir o lead!`;

    return summary;
}

/**
 * Formata número de telefone
 */
function formatPhoneNumber(phone: string): string {
    // Remove non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Format: +55 84 99999-9999
    if (cleaned.length === 13) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }

    return phone;
}

/**
 * Retorna emoji baseado no status do lead
 */
export function getLeadEmoji(status: 'quente' | 'morno' | 'frio'): string {
    switch (status) {
        case 'quente': return '🔥';
        case 'morno': return '🌡️';
        case 'frio': return '❄️';
    }
}

/**
 * Retorna cor baseado no status do lead
 */
export function getLeadColor(status: 'quente' | 'morno' | 'frio'): string {
    switch (status) {
        case 'quente': return 'red';
        case 'morno': return 'orange';
        case 'frio': return 'blue';
    }
}
