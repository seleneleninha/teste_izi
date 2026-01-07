import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, HelpCircle } from 'lucide-react';

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

  // Reset step when tour opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

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
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      {/* Gradient card matching TourPrompt style */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl shadow-2xl p-5 w-80 sm:w-96 relative">
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <HelpCircle size={24} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                Passo {currentStep + 1} de {steps.length}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg mb-2 leading-tight">
              {step.title}
            </h3>

            {/* Description */}
            <div className="text-sm text-white/90 mb-4 max-h-24 overflow-y-auto pr-1">
              {typeof step.content === 'string' ? (
                <p>{step.content}</p>
              ) : (
                step.content
              )}
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-4">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep
                      ? 'bg-white w-6'
                      : idx < currentStep
                        ? 'bg-white/60 w-1.5'
                        : 'bg-white/30 w-1.5'
                    }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full font-medium flex items-center justify-center gap-1 text-sm transition-colors"
                >
                  <ChevronLeft size={16} />
                  Voltar
                </button>
              )}
              <button
                onClick={handleNext}
                className={`px-4 py-2 bg-white text-blue-600 rounded-full font-bold flex items-center justify-center gap-1 text-sm hover:bg-gray-100 transition-colors ${isFirstStep ? 'w-full' : 'flex-1'}`}
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
      </div>
    </div>
  );
};
