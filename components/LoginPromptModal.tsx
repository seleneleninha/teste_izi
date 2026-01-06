import React from 'react';
import { createPortal } from 'react-dom';
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

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#1a1f2e] rounded-3xl p-8 max-w-md w-[300px] shadow-2xl border border-slate-700 animate-scale-in z-10">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Heart size={32} className="text-red-500" />
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                    <h1 className="text-md font-bold text-white">
                        Para favoritar você precisa se cadastrar na plataforma.
                    </h1>

                    <p className="text-gray-300 text-sm">
                        <p className="text-yellow-300 font-bold">Porquê se cadastrar?</p>
                        <p><span className="text-emerald-400 font-semibold">É GRÁTIS, SUPER RÁPIDO</span></p>
                        <p>e você pode <span className="text-emerald-400 font-semibold">COMPARAR até 3 imóveis lado a lado!</span></p>
                    </p>
                </div>

                {/* Buttons */}
                <div className="mt-4">
                    <button
                        onClick={handleSignup}
                        className="w-[240px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 animate-pulse mb-1"
                    >
                        <UserPlus size={20} />
                        CADASTRE-SE
                    </button>

                    {/* Login link for existing users */}
                    <div className="text-center mb-4">
                        <span className="text-sm text-white">Já tenho conta. </span>
                        <button
                            onClick={() => {
                                const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                                navigate(`/login?returnUrl=${returnUrl}&type=client`);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-bold text-sm underline transition-colors"
                        >
                            LOGAR
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-[240px] bg-slate-700 hover:bg-slate-600 text-gray-300 py-2 rounded-full transition-colors"
                    >
                        <strong>Não obrigado.</strong>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
