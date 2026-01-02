import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { AlertCircle, ArrowRight, Lock } from 'lucide-react';

interface TrialStatus {
    status: string;
    trial_fim: string;
    days_left: number;
}

export const TrialBanner: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<TrialStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from('perfis')
                    .select('is_trial, trial_fim')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    if (profile.is_trial) {
                        const endDate = new Date(profile.trial_fim);
                        const now = new Date();
                        const diffTime = endDate.getTime() - now.getTime();
                        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        setStatus({
                            status: 'trial',
                            trial_fim: profile.trial_fim,
                            days_left: daysLeft
                        });
                    } else {
                        // Regular active user (no trial)
                        setStatus(null);
                    }
                }
            } catch (error) {
                console.error('Error checking trial status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, []);

    if (loading || !status) return null;

    // Don't show if active subscriber
    if (['ativo', 'anual', 'mensal'].includes(status.status)) return null;

    // Show expired warning
    if (status.days_left <= 0) {
        return (
            <div className="bg-red-50 bg-red-900/20 border-b border-red-200 border-red-800 p-4 sticky top-16 z-40">
                <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-red-800 text-red-200">
                        <Lock size={20} className="shrink-0" />
                        <span className="font-medium">
                            Seu período de teste expirou. Suas funcionalidades foram limitadas.
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/partner')}
                        className="w-full md:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        Assinar Agora
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // Show trial countdown
    return (
        <div className="bg-yellow-500 bg-yellow-700 rounded-3xl border-b border-yellow-200 border-yellow-800 p-5 mb-5">
            <div className="flex items-center justify-center gap-2 text-lg text-yellow-100 text-yellow-200">
                <span className="font-medium">
                    🚀 Você tem {status.days_left} dias restantes no seu teste grátis.
                </span>
                <button
                    onClick={() => navigate('/partner')}
                    className="text-indigo-600 dark:text-white font-bold hover:underline"
                >
                    FAZER UPGRADE AGORA
                </button>
            </div>
        </div>
    );
};
