import React from 'react';
import { X, Camera, Link, Palette, Rocket, Sparkles } from 'lucide-react';

interface MobileWelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName?: string;
}

export const MobileWelcomeModal: React.FC<MobileWelcomeModalProps> = ({
    isOpen,
    onClose,
    userName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal - Full screen on mobile, compact centered card on desktop */}
            <div className="relative w-full h-full md:h-auto md:max-w-md md:mx-4 md:rounded-3xl flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 animate-in fade-in zoom-in-95 duration-300 md:overflow-visible overflow-hidden">

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all z-10"
                >
                    <X size={24} />
                </button>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 md:py-6 overflow-y-auto">

                    {/* Animated Icon */}
                    <div className="relative mb-4 md:mb-3">
                        <div className="w-20 h-20 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce">
                            <Rocket size={40} className="md:w-8 md:h-8 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2">
                            <Sparkles size={28} className="text-yellow-400 animate-pulse" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-2xl font-bold text-white text-center mb-1">
                        Bem-vindo(a){userName ? `, ${userName}` : ''}! 🏠
                    </h1>
                    <p className="text-emerald-400 font-medium text-center mb-6 md:mb-4">
                        Sua conta foi criada com sucesso! 🎉
                    </p>

                    {/* Description */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 md:p-3 border border-white/10 mb-4 md:mb-3 max-w-sm">
                        <p className="text-white/90 text-center leading-relaxed text-sm md:text-xs mb-4 md:mb-2">
                            Antes de começar, que tal deixar sua <span className="text-emerald-400 font-bold">vitrine digital</span> pronta para impressionar?
                        </p>

                        {/* Features list */}
                        <div className="space-y-2 md:space-y-1.5 mb-4 md:mb-3">
                            <div className="flex items-center gap-2 md:gap-2 text-white/80">
                                <div className="w-8 h-8 md:w-7 md:h-7 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Camera size={16} className="text-pink-400" />
                                </div>
                                <span className="text-sm md:text-xs">Adicionar sua foto profissional</span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-2 text-white/80">
                                <div className="w-8 h-8 md:w-7 md:h-7 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Link size={16} className="text-blue-400" />
                                </div>
                                <span className="text-sm md:text-xs">Criar o endereço único da sua página</span>
                            </div>
                            <div className="flex items-center gap-2 md:gap-2 text-white/80">
                                <div className="w-8 h-8 md:w-7 md:h-7 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Palette size={16} className="text-purple-400" />
                                </div>
                                <span className="text-sm md:text-xs">Colocar sua logo e redes sociais</span>
                            </div>
                        </div>

                        {/* Time estimate */}
                        <div className="text-center">
                            <span className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-bold">
                                ⏱️ Só leva 3 minutinhos!
                            </span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-3 md:p-2 border border-purple-500/30 mb-4 md:mb-2 max-w-sm">
                        <p className="text-white text-center text-sm md:text-xs">
                            <span className="font-bold">Como fazer:</span><br />
                            {/* Mobile instructions */}
                            <span className="md:hidden">
                                Toque em <span className="bg-slate-700 px-2 py-0.5 rounded font-bold">... Mais</span> → <span className="bg-slate-700 px-2 py-0.5 rounded font-bold">Configs</span><br />
                                no menu abaixo
                            </span>
                            {/* Desktop instructions */}
                            <span className="hidden md:inline">
                                Clique em <span className="bg-slate-700 px-1.5 py-0.5 rounded font-bold text-xs">Configurações</span> no menu à esquerda
                            </span>
                        </p>
                    </div>

                    {/* Quote */}
                    <p className="text-white/60 text-xs md:text-[11px] italic text-center mb-4 md:mb-3 max-w-xs">
                        "Uma boa primeira impressão vale mais que mil anúncios!" 😉
                    </p>

                    {/* CTA Button */}
                    <button
                        onClick={onClose}
                        className="w-full max-w-xs py-3 md:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base md:text-sm rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Rocket size={18} className="md:w-4 md:h-4" />
                        BOAS VENDAS! 🚀
                    </button>
                </div>

                {/* Bottom gradient fade - only on mobile */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none md:hidden" />
            </div>
        </div>
    );
};
