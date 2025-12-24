import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export interface TourStep {
  target: string; // CSS selector or data-tour attribute or 'body' for centered
  title: string;
  content: string | React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  isOpen,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (!step) return;

    // Remove highlight from previous element if any
    const cleanupPreviousHighlight = () => {
      if (targetElement) {
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
        targetElement.style.boxShadow = '';
        targetElement.style.transition = '';
      }
    };

    // Handle centered steps (like welcome message)
    if (step.target === 'body' || step.placement === 'center') {
      cleanupPreviousHighlight();
      setTargetElement(null);
      return;
    }

    // Find target element
    const element = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement ||
      document.querySelector(step.target) as HTMLElement;

    if (element) {
      cleanupPreviousHighlight();
      setTargetElement(element);

      // Scroll element into view with some padding
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      // Highlight element
      element.style.position = 'relative';
      element.style.zIndex = '9999';
      element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2)';
      element.style.borderRadius = '8px';
      element.style.transition = 'all 0.3s ease';
    } else {
      setTargetElement(null);
    }

    return () => {
      // Remove highlight when step changes or component unmounts
      if (element) {
        element.style.position = '';
        element.style.zIndex = '';
        element.style.boxShadow = '';
        element.style.transition = '';
      }
    };
  }, [currentStep, isOpen, steps]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998] animate-in fade-in duration-300" />

      {/* Centered Modal for all steps */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 p-6 md:p-8 max-w-lg w-full animate-in zoom-in-95 fade-in duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs font-bold text-primary-400 bg-primary-900/30 px-3 py-1.5 rounded-full border border-primary-500/20">
                  Passo {currentStep + 1} de {steps.length}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                {step.title}
              </h3>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-200 transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="text-sm md:text-base text-gray-300 mb-6 md:mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {typeof step.content === 'string' ? (
              <p>{step.content}</p>
            ) : (
              step.content
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-700 rounded-full h-1.5 md:h-2 mb-4 md:mb-6">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-xs md:text-sm text-gray-500 hover:text-gray-300 font-medium transition-colors"
            >
              Pular Tour
            </button>

            <div className="flex gap-2 md:gap-3">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="px-4 md:px-6 py-2 md:py-3 border border-slate-600 rounded-full text-gray-300 hover:bg-slate-700 transition-colors font-medium flex items-center gap-2 text-sm md:text-base"
                >
                  <ChevronLeft size={18} />
                  <span className="hidden sm:inline">Voltar</span>
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 md:px-8 py-2 md:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-colors font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 text-sm md:text-base"
              >
                {isLastStep ? (
                  <>
                    <Check size={18} />
                    Finalizar
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
