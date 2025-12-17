/**
 * ============================================
 * RATE LIMITING - Proteção contra Abuso
 * ============================================
 * 
 * 🎯 OBJETIVO:
 * Proteger a plataforma contra ataques de brute force, spam e abuso,
 * sem prejudicar a experiência de usuários legítimos.
 * 
 * 🛡️ PROTEÇÕES IMPLEMENTADAS:
 * - Login: Previne tentativas excessivas de senha
 * - Cadastro: Previne criação massiva de contas fake
 * - Formulários: Previne spam de anúncios
 * - AI/IzA: Previne uso excessivo da API Gemini (custo)
 * 
 * ⚖️ FILOSOFIA DE CALIBRAÇÃO:
 * - Limites generosos (usuários reais não são afetados)
 * - Bloqueios curtos (frustração mínima)
 * - Mensagens claras (usuário sabe quanto esperar)
 * 
 * 📊 MONITORAMENTO:
 * - Em produção, considerar migrar para Redis (dados persistentes)
 * - Adicionar logging de bloqueios para detectar ataques
 * - Whitelist para usuários premium (bypass de limites)
 * 
 * 🔧 AJUSTES FUTUROS:
 * - Se houver reclamações: aumentar `points` ou `duration`
 * - Se houver ataques: diminuir `blockDuration` para punir mais
 * - Monitorar métricas: rate_limit_blocks_count, rate_limit_triggered
 * 
 * ============================================
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * Rate limiters para diferentes tipos de ações
 * 
 * ⚖️ FILOSOFIA: Proteger contra ataques REAIS sem frustrar usuários legítimos
 * 
 * Calibração baseada em:
 * - Comportamento normal: usuário erra senha 2-3x, não 10x
 * - Margem de erro: permitir reenvios por erro de validação
 * - UX primeiro: bloqueios curtos, mensagens claras
 */

// Login: 10 tentativas em 5 minutos (2 tentativas/min)
// Raciocínio: Usuário pode errar senha algumas vezes, mas 10 em 5min é suspeito
export const loginLimiter = new RateLimiterMemory({
    points: 10,
    duration: 300, // 5 minutos
    blockDuration: 60, // Bloqueia apenas 1 minuto (não 5!)
});

// Cadastro: 5 tentativas em 10 minutos
// Raciocínio: Erros de validação (CPF, email) podem forçar reenvios
export const formLimiter = new RateLimiterMemory({
    points: 5,
    duration: 600, // 10 minutos
    blockDuration: 120, // 2 minutos - tempo para ler erro e corrigir
});

// Formulários pesados (AddProperty): 10 submissões em 5 minutos
// Raciocínio: Upload pode falhar, validação pode rejeitar - precisa de margem
export const propertyFormLimiter = new RateLimiterMemory({
    points: 10,
    duration: 300, // 5 minutos
    blockDuration: 60, // Apenas 1 minuto
});

// AI/Gemini: 20 chamadas em 1 minuto (bem generoso)
// Raciocínio: Conversação natural pode gerar muitas mensagens rápidas
export const aiLimiter = new RateLimiterMemory({
    points: 20,
    duration: 60,
    blockDuration: 30, // 30 segundos - muito curto
});

/**
 * Helper para consumir rate limiter com mensagens amigáveis
 * 
 * @param limiter O rate limiter a ser verificado
 * @param key Chave única (email, user_id, IP)
 * @param actionName Nome da ação para mensagem (ex: "login")
 * @returns { allowed, error? }
 */
export async function checkRateLimit(
    limiter: RateLimiterMemory,
    key: string,
    actionName: string = 'esta ação'
): Promise<{ allowed: boolean; error?: string }> {
    try {
        await limiter.consume(key);
        return { allowed: true };
    } catch (rateLimiterRes: any) {
        const secondsUntilReset = Math.ceil(rateLimiterRes.msBeforeNext / 1000);
        const minutesUntilReset = Math.floor(secondsUntilReset / 60);

        // Mensagem amigável baseada no tempo
        let timeMessage = '';
        if (minutesUntilReset > 0) {
            timeMessage = `${minutesUntilReset} minuto${minutesUntilReset > 1 ? 's' : ''}`;
        } else {
            timeMessage = `${secondsUntilReset} segundo${secondsUntilReset > 1 ? 's' : ''}`;
        }

        return {
            allowed: false,
            error: `Por segurança, aguarde ${timeMessage} antes de tentar ${actionName} novamente. 🔒`
        };
    }
}

/**
 * Whitelist para usuários premium/admin (FUTURO)
 * Usuários pagantes não devem ser limitados
 */
export function shouldBypassRateLimit(userId: string, isPremium: boolean): boolean {
    // TODO: Implementar quando tiver planos pagos
    return isPremium; // Bypass para usuários pagantes
}
