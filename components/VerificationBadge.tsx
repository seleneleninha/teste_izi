import React from 'react';
import { getVerificationConfig } from '../lib/verificationHelper';
import { ShieldCheck } from 'lucide-react';

interface VerificationBadgeProps {
    plano_id?: string;
    className?: string;
    showLabel?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
    plano_id,
    className = '',
    showLabel = true
}) => {
    if (!plano_id) return null;

    const config = getVerificationConfig(plano_id);
    if (!config) return null;

    return (
        <div
            className={`inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-black/85 backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:bg-black/100 cursor-default shadow-2xl shadow-black/50 ${className}`}
            title={`Corretor Verificado: Nível ${config.title}`}
        >
            {/* Badge Icon with Glow */}
            <div className="relative group">
                <div className={`absolute -inset-2 rounded-full ${config.gradientClass} opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-500`}></div>
                <img
                    src={config.badgeUrl}
                    alt={config.title}
                    className="w-8 h-8 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                />
            </div>

            {/* Label */}
            {showLabel && (
                <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-0.5">Corretor Verificado</span>
                    <span className={`text-sm font-black uppercase tracking-wide ${config.textClass} drop-shadow-sm`}>
                        Nível {config.title.replace('Corretor ', '')}
                    </span>
                </div>
            )}
        </div>
    );
};
