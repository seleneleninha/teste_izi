import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-midnight-950">
            <div className="relative">
                {/* Spinner */}
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />

                {/* Glow effect */}
                <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse"></div>
            </div>

            {/* Message */}
            <p className="mt-6 text-lg text-gray-300 animate-pulse">{message}</p>

            {/* Progress bar */}
            <div className="mt-4 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-primary-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
            </div>

            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};
