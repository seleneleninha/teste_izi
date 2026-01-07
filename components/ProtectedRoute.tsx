import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const ProtectedRoute: React.FC = () => {
    const { user, emailVerified, loading, signOut } = useAuth();
    const [checking, setChecking] = useState(true);
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    useEffect(() => {
        // Give auth context time to initialize
        const timer = setTimeout(() => {
            setChecking(false);
        }, 100);

        return () => clearTimeout(timer);
    }, [loading]);

    const handleResendEmail = async () => {
        if (!user?.email) return;

        setResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            });

            if (error) throw error;
            setResendSuccess(true);
        } catch (error) {
            console.error('Error resending email:', error);
        } finally {
            setResending(false);
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    if (loading || checking) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check if email is verified
    if (!emailVerified) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-yellow-500/30 p-8 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail size={40} className="text-yellow-400" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Verifique seu E-mail
                    </h1>

                    <p className="text-slate-400 mb-6">
                        Enviamos um link de verificação para <span className="text-yellow-400 font-medium">{user.email}</span>.
                        Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
                    </p>

                    {resendSuccess ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                            <p className="text-emerald-400 font-medium">
                                ✅ E-mail reenviado com sucesso!
                            </p>
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                        >
                            <RefreshCw size={18} />
                            Já verifiquei, atualizar
                        </button>

                        <button
                            onClick={handleResendEmail}
                            disabled={resending || resendSuccess}
                            className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-xl border border-slate-700 transition-all disabled:opacity-50"
                        >
                            {resending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Reenviando...
                                </>
                            ) : (
                                <>
                                    <Mail size={18} />
                                    Reenviar e-mail
                                </>
                            )}
                        </button>

                        <button
                            onClick={signOut}
                            className="flex items-center justify-center gap-2 w-full text-slate-400 hover:text-white font-medium py-2 transition-colors"
                        >
                            <LogOut size={16} />
                            Sair e usar outro e-mail
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 mt-6">
                        Não encontrou o e-mail? Verifique a pasta de spam ou lixo eletrônico.
                    </p>
                </div>
            </div>
        );
    }

    return <Outlet />;
};
