import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Rocket, ExternalLink, Copy, Home, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';

export interface SpotlightStep {
    target?: string; // CSS selector for spotlight - if empty = centered
    title: string;
    content: string;
    // Fixed tooltip position (percentage of viewport)
    tooltipX?: number; // 0-100 (% from left)
    tooltipY?: number; // 0-100 (% from top)
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
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
    steps,
    isOpen,
    onComplete,
    onSkip,
    brokerSlug,
    hasPremiumPlan = false
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const step = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;
    const isCenteredStep = !step?.target;

    // Update spotlight rectangle when step changes
    useEffect(() => {
        if (!isOpen || !step?.target) {
            setSpotlightRect(null);
            return;
        }

        setIsTransitioning(true);

        const timer = setTimeout(() => {
            const element = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement ||
                document.querySelector(step.target) as HTMLElement;

            if (element) {
                const rect = element.getBoundingClientRect();
                setSpotlightRect(rect);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setSpotlightRect(null);
            }

            setTimeout(() => setIsTransitioning(false), 100);
        }, 150);

        return () => clearTimeout(timer);
    }, [isOpen, currentStep, step]);

    // Handle step action (navigate, click, etc.)
    const executeStepAction = () => {
        if (!step?.action) return;

        switch (step.action) {
            case 'navigate':
                if (step.actionTarget) navigate(step.actionTarget);
                break;
            case 'click':
                if (step.actionTarget) {
                    const element = document.querySelector(step.actionTarget) as HTMLElement;
                    element?.click();
                }
                break;
            case 'focus':
                if (step.actionTarget) {
                    const element = document.querySelector(step.actionTarget) as HTMLElement;
                    element?.focus();
                }
                break;
        }
    };

    const handleNext = () => {
        executeStepAction();
        if (isLastStep) {
            setShowSuccessModal(true);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) setCurrentStep(prev => prev - 1);
    };

    const handleComplete = () => {
        setShowSuccessModal(false);
        onComplete();
        navigate('/add-property');
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

    // Calculate tooltip position from step config (percentage-based)
    const tooltipX = step?.tooltipX ?? 50; // Default center
    const tooltipY = step?.tooltipY ?? 50; // Default center

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
                            onClick={() => brokerSlug && window.open(`/${brokerSlug}`, '_blank')}
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
        <>
            {/* Tooltip - FIXED POSITION using percentages */}
            < div
                className={`fixed z-[10000] w-[320px] max-w-[calc(100vw-32px)] transition-all duration-300 ease-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`
                }
                style={{
                    top: `${tooltipY}%`,
                    left: `${tooltipX}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
                    {/* Content */}
                    <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <h4 className="text-lg font-bold text-slate-200">{step.title}</h4>
                            <button onClick={onSkip} className="text-slate-400 hover:text-slate-200 transition-colors -mt-1">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                            {step.content}
                        </p>

                        {/* Progress and navigation */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">
                                {currentStep + 1} de {steps.length}
                            </span>

                            <div className="flex gap-2">
                                {!isFirstStep && (
                                    <button
                                        onClick={handlePrev}
                                        className="px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <ChevronLeft size={16} />
                                        Anterior
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="px-4 py-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-emerald-500/20"
                                >
                                    {isLastStep ? (
                                        <>
                                            <Check size={16} />
                                            Finalizar
                                        </>
                                    ) : (
                                        <>
                                            Próximo
                                            <ChevronRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-slate-700">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div >
        </>
    );
};

// Tour steps with FIXED X/Y coordinates (percentage of viewport)
export const getOnboardingSteps = (hasPremiumPlan: boolean): SpotlightStep[] => {
    const baseSteps: SpotlightStep[] = [
        {
            title: 'Bem-vindo(a) à iziBrokerz!',
            content: 'Vamos configurar sua página de imóveis em poucos passos. Ela é a sua "vitrine digital" para atrair mais clientes!',
            tooltipX: 50,  // Center
            tooltipY: 50,
        },
        {
            target: 'settings-tab',
            title: 'Configurações',
            content: 'Primeiro, vamos ajustar suas informações essenciais. Clique na aba "Configurações"',
            action: 'click',
            actionTarget: '[data-tour="settings-tab"]',
            tooltipX: 50,  // Center horizontally
            tooltipY: 40,  // Upper middle
        },
        {
            target: 'address-section',
            title: 'Sua Foto do Perfil e Endereço',
            content: 'Insira sua foto do perfil e seu endereço. Preencha seu CEP, número e complemento (se houver). Se quiser exibir o endereço na sua página, clique no checkbox abaixo.',
            tooltipX: 60,
            tooltipY: 50,
        },
        {
            target: 'slug-field',
            title: 'Nome da Sua Página',
            content: 'Escolha bem, pois este será o link da sua "vitrine". Você pode definir esse nome somente uma vez.',
            tooltipX: 60,
            tooltipY: 35,
        },
        {
            target: 'welcome-messages',
            title: 'Mensagens de Boas-Vindas',
            content: 'Personalize a saudação que seus Clientes verão ao acessar sua página. São duas pequenas frases com no máximo 40 caracteres cada.',
            tooltipX: 60,
            tooltipY: 50,
        },
        {
            target: 'about-section',
            title: 'Sobre Você',
            content: 'Conte um pouco da sua trajetória profissional. Clientes confiam mais em Corretores com um histórico!',
            tooltipX: 60,
            tooltipY: 55,
        },
        {
            target: 'stats-section',
            title: 'Suas Estatísticas',
            content: 'Imóveis vendidos, clientes atendidos e anos de experiência enaltecem sua credibilidade. Deixe em branco para não exibir.',
            tooltipX: 60,
            tooltipY: 60,
        },
        {
            target: 'branding-tab',
            title: 'Marca & Redes',
            content: 'Adicione seu logo e sua marca d\'água (preferencialmente .PNG c/fundo transparente) para melhor visualização e conecte suas redes sociais.',
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
