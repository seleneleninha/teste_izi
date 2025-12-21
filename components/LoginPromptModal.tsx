import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, UserPlus } from 'lucide-react';

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSignup = () => {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?returnUrl=${returnUrl}&type=client&register=true`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-700 animate-scale-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart size={32} className="text-red-500" />
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-white">
                        Para favoritar imóveis você precisa se cadastrar ou estar logado na plataforma.
                    </h1>

                    <p className="text-gray-300 text-lg">
                        Quer se cadastrar? É <span className="text-emerald-400 font-semibold">grátis</span> e <span className="text-emerald-400 font-semibold">super rápido</span>!
                    </p>
                </div>

                {/* Buttons */}
                <div className="mt-8 space-y-3">
                    <button
                        onClick={handleSignup}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                    >
                        <UserPlus size={20} />
                        CADASTRE-SE
                    </button>

                    {/* Login link for existing users */}
                    <div className="text-center">
                        <span className="text-lg text-white">Já tenho conta. </span>
                        <button
                            onClick={() => {
                                const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                                navigate(`/login?returnUrl=${returnUrl}&type=client`);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-bold text-lg underline transition-colors"
                        >
                            LOGAR
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium py-3 rounded-full transition-colors border border-slate-600"
                    >
                        Não obrigado. Prefiro pesquisar mais opções.
                    </button>
                </div>
            </div>
        </div>
    );
};
