import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Rocket, ExternalLink, Copy, Home, MessageCircle, Facebook, Instagram } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';

export interface SpotlightStep {
    target?: string;
    title: string;
    content: string;
    tooltipX?: number;
    tooltipY?: number;
    action?: 'navigate' | 'click' | 'focus';
    actionTarget?: string;
}

interface SpotlightTourProps {
    steps: SpotlightStep[];
    isOpen: boolean;
    onComplete: () => void;
    onSkip: () => void;
    brokerSlug?: string;
    hasPremiumPlan?: boolean;
    currentStep?: number;
    onStepChange?: (step: number) => void;
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
    steps,
    isOpen,
    onComplete,
    onSkip,
    brokerSlug,
    hasPremiumPlan = false,
    currentStep: externalStep,
    onStepChange
}) => {
    const [internalStep, setInternalStep] = useState(0);
    const currentStep = externalStep !== undefined ? externalStep : internalStep;
    const setCurrentStep = (step: number) => {
        if (onStepChange) {
            onStepChange(step);
        } else {
            setInternalStep(step);
        }
    };

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const step = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            setShowSuccessModal(true);
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) setCurrentStep(currentStep - 1);
    };

    const handleComplete = () => {
        setShowSuccessModal(false);
        onComplete();
        navigate('/add-property');
    };

    const handleViewPage = () => {
        if (brokerSlug) {
            window.open(`/${brokerSlug}`, '_blank');
        } else {
            addToast('Slug não configurado ainda. Salve as configurações primeiro.', 'warning');
        }
    };

    const copyLink = () => {
        if (brokerSlug) {
            navigator.clipboard.writeText(`${window.location.origin}/${brokerSlug}`);
            addToast('Link copiado!', 'success');
        }
    };

    const shareOnSocial = (platform: string) => {
        if (!brokerSlug) return;
        const url = encodeURIComponent(`${window.location.origin}/${brokerSlug}`);
        const text = encodeURIComponent('Confira meus imóveis!');

        const links: Record<string, string> = {
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            instagram: `https://instagram.com`,
        };

        window.open(links[platform], '_blank');
    };

    if (!isOpen) return null;

    // Success Modal
    if (showSuccessModal) {
        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700 p-8 max-w-md w-full animate-in zoom-in-95 fade-in duration-300">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                            <Rocket size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Parabéns! 🎉</h2>
                        <p className="text-slate-400">Sua página está configurada! Agora é hora de mostrar ao mundo.</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        <button
                            onClick={handleComplete}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            <Home size={20} />
                            Cadastrar Primeiro Imóvel
                        </button>

                        <button
                            onClick={handleViewPage}
                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <ExternalLink size={18} />
                            Ver Minha Página
                        </button>
                    </div>

                    {brokerSlug && (
                        <div className="border-t border-slate-700 pt-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-3 text-center">Compartilhar nas Redes</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={copyLink} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all" title="Copiar link">
                                    <Copy size={20} className="text-slate-300" />
                                </button>
                                <button onClick={() => shareOnSocial('whatsapp')} className="p-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all" title="WhatsApp">
                                    <MessageCircle size={20} className="text-white" />
                                </button>
                                <button onClick={() => shareOnSocial('facebook')} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all" title="Facebook">
                                    <Facebook size={20} className="text-white" />
                                </button>
                                <button onClick={() => shareOnSocial('instagram')} className="p-3 bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 rounded-xl transition-all" title="Instagram">
                                    <Instagram size={20} className="text-white" />
                                </button>
                            </div>
                        </div>
                    )}

                    <button onClick={() => { setShowSuccessModal(false); onComplete(); }} className="w-full mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                        Fazer isso depois
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-24 md:top-6 right-4 md:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="bg-gradient-to-r from-midnight-900 to-purple-800 text-white rounded-2xl md:rounded-3xl shadow-2xl p-3 md:p-5 w-64 md:w-96 relative">
                {/* Close button */}
                <button
                    onClick={onSkip}
                    className="absolute top-2 md:top-3 right-2 md:right-3 text-white/80 hover:text-white transition-colors"
                >
                    <X size={16} className="md:w-[18px] md:h-[18px]" />
                </button>

                <div className="flex items-start gap-2 md:gap-4">
                    {/* Icon */}
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Rocket size={16} className="md:w-6 md:h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <span className="text-[10px] md:text-xs font-bold text-white/80 bg-white/20 px-1.5 md:px-2 py-0.5 rounded-full">
                                {currentStep + 1}/{steps.length}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2 leading-tight pr-4 md:pr-6">
                            {step.title}
                        </h3>

                        {/* Description */}
                        <div className="text-xs md:text-sm text-white/90 mb-2 md:mb-4 max-h-16 md:max-h-24 overflow-y-auto pr-1 leading-snug">
                            <p>{step.content}</p>
                        </div>

                        {/* Progress dots */}
                        <div className="flex items-center gap-1 md:gap-1.5 mb-2 md:mb-4">
                            {steps.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentStep(idx)}
                                    className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${idx === currentStep
                                        ? 'bg-white w-4 md:w-6'
                                        : idx < currentStep
                                            ? 'bg-white/60 w-1 md:w-1.5'
                                            : 'bg-white/30 w-1 md:w-1.5'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 md:gap-2">
                            {!isFirstStep && (
                                <button
                                    onClick={handlePrev}
                                    className="flex-1 px-2 md:px-3 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-full font-medium flex items-center justify-center gap-0.5 md:gap-1 text-xs md:text-sm transition-colors"
                                >
                                    <ChevronLeft size={14} className="md:w-4 md:h-4" />
                                    <span className="hidden md:inline">Voltar</span>
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className={`px-3 md:px-4 py-1.5 md:py-2 bg-white text-purple-800 rounded-full font-bold flex items-center justify-center gap-0.5 md:gap-1 text-xs md:text-sm hover:bg-gray-100 transition-colors ${isFirstStep ? 'w-full' : 'flex-1'}`}
                            >
                                {isLastStep ? (
                                    <>
                                        <Check size={14} className="md:w-4 md:h-4" />
                                        <span className="hidden md:inline">Finalizar</span>
                                        <span className="md:hidden">OK</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="hidden md:inline">Próximo</span>
                                        <ChevronRight size={14} className="md:w-4 md:h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Desktop Tour Steps - 4 simple steps
export const getOnboardingSteps = (hasPremiumPlan: boolean): SpotlightStep[] => {
    const baseSteps: SpotlightStep[] = [
        {
            title: 'Bem-vindo(a) à iziBrokerz!',
            content: 'Vamos configurar sua página para atrair + leads! Clique em "Mais ..." e depois "Configs".',
            tooltipX: 50,
            tooltipY: 50,
        },
        {
            target: 'address-section',
            title: 'Aba "Minha Conta"',
            content: 'Insira foto do perfil e endereço. Insira o CEP, número e complemento. Para exibir o endereço na sua página, clique no checkbox logo abaixo e SALVE.',
            tooltipX: 60,
            tooltipY: 50,
        },
        {
            target: 'slug-field',
            title: 'Aba "Página & Conteúdo"',
            content: 'Crie uma ÚNICA VEZ o nome da sua página e clique em "Criar Meu Endereço". Role a página e preencha os demais campos e SALVE',
            tooltipX: 60,
            tooltipY: 35,
        },
        {
            target: 'branding-tab',
            title: 'Aba "Marca & Redes"',
            content: 'Adicione sua logo e marca d\'água (em formato .PNG c/fundo transparente). Insira suas redes sociais, logo abaixo e SALVE.',
            action: 'click',
            actionTarget: '[data-tour="branding-tab"]',
            tooltipX: 50,
            tooltipY: 40,
        },
    ];

    // Add WhatsApp step only for premium plans
    if (hasPremiumPlan) {
        baseSteps.push({
            target: 'whatsapp-tab',
            title: 'WhatsApp & IA',
            content: 'Conecte seu WhatsApp e ative a IzA para atender seus clientes 24/7 automaticamente!',
            action: 'click',
            actionTarget: '[data-tour="whatsapp-tab"]',
            tooltipX: 50,
            tooltipY: 40,
        });
    }

    return baseSteps;
};

// Mobile Tour Steps - Starts at LINE 302
// Customize these steps for mobile navigation (uses MobileBottomNav instead of Sidebar)
export const getMobileOnboardingSteps = (hasPremiumPlan: boolean): SpotlightStep[] => {
    const baseSteps: SpotlightStep[] = [
        {
            title: 'Bem-vindo(a) à iziBrokerz!',
            content: 'Vamos configurar sua página! Ela é sua "vitrine digital". Toque em "..." no menu inferior e depois em "Configs".',
            tooltipX: 50,
            tooltipY: 40,
        },
        {
            target: 'address-section',
            title: 'Minha Conta',
            content: 'Adicione sua foto e endereço. Preencha CEP, número e complemento. Marque o checkbox para exibir na página e SALVE.',
            tooltipX: 50,
            tooltipY: 30,
        },
        {
            target: 'slug-field',
            title: 'Página & Conteúdo',
            content: 'Crie o nome da sua página (só pode uma vez!) e clique em "Criar Meu Endereço". Preencha os demais campos e SALVE.',
            tooltipX: 50,
            tooltipY: 25,
        },
        {
            target: 'branding-tab',
            title: 'Marca & Redes',
            content: 'Adicione sua logo e marca d\'água (PNG transparente). Insira suas redes sociais e SALVE.',
            action: 'click',
            actionTarget: '[data-tour="branding-tab"]',
            tooltipX: 50,
            tooltipY: 30,
        },
    ];

    // Add WhatsApp step only for premium plans
    if (hasPremiumPlan) {
        baseSteps.push({
            target: 'whatsapp-tab',
            title: 'WhatsApp & IA',
            content: 'Conecte seu WhatsApp e ative a IzA para atender clientes 24/7!',
            action: 'click',
            actionTarget: '[data-tour="whatsapp-tab"]',
            tooltipX: 50,
            tooltipY: 30,
        });
    }

    return baseSteps;
};
