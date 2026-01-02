
export type VerificationTier = 'bronze' | 'prata' | 'ouro' | null;

export const PLAN_IDS = {
    BRONZE: 'b974682b-cb4e-4a93-86ef-1efa47a2813c',   // Intermediário
    PRATA: '55de4ee5-c2f1-4f9d-b466-7e08138854f0',    // Avançado
    OURO: 'edf90163-d554-4f8e-bfe9-7d9e98fc4450'      // Profissional
};

interface TierConfig {
    tier: VerificationTier;
    badgeUrl: string;
    badgeSize?: number; // Optional override
    borderClass: string;
    pulseClass: string;
    gradientClass: string;
    textClass: string;
    title: string;
}

// Cache busting to prevent broken images if loaded before upload
const CACHE_BUST = `?v=${new Date().getTime()}`;

export const getVerificationConfig = (planoId: string | undefined | null): TierConfig | null => {
    if (!planoId) return null;

    if (planoId === PLAN_IDS.OURO) {
        return {
            tier: 'ouro',
            badgeUrl: `/badgeOuro.png${CACHE_BUST}`,
            borderClass: 'border-yellow-400', // Gold border
            pulseClass: '', // Pulse removed by user request
            gradientClass: 'bg-gradient-to-tr from-yellow-300 via-amber-200 to-yellow-500',
            textClass: 'text-yellow-400',
            title: 'Corretor Ouro'
        };
    }

    if (planoId === PLAN_IDS.PRATA) {
        return {
            tier: 'prata',
            badgeUrl: `/badgePrata.png${CACHE_BUST}`,
            borderClass: 'border-slate-300', // Silver border
            pulseClass: '', // Pulse removed by user request
            gradientClass: 'bg-gradient-to-tr from-slate-300 via-gray-100 to-slate-400',
            textClass: 'text-slate-300',
            title: 'Corretor Prata'
        };
    }

    if (planoId === PLAN_IDS.BRONZE) {
        return {
            tier: 'bronze',
            badgeUrl: `/badgeBronze.png${CACHE_BUST}`,
            borderClass: 'border-orange-200', // Bronze border
            pulseClass: '', // Bronze static
            gradientClass: 'bg-gradient-to-tr from-orange-200 via-amber-700 to-orange-500',
            textClass: 'text-orange-200',
            title: 'Corretor Bronze'
        };
    }

    return null;
};
