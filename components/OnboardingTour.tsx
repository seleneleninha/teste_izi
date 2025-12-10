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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (!step) return;

    // Handle centered steps (like welcome message)
    if (step.target === 'body' || step.placement === 'center') {
      setTargetElement(null);
      return;
    }

    // Find target element
    const element = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement ||
      document.querySelector(step.target) as HTMLElement;

    if (element) {
      setTargetElement(element);

      // Scroll element into view with some padding
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      // Wait for scroll to finish, then calculate position
      setTimeout(() => {
        calculateTooltipPosition(element, step.placement || 'bottom');
      }, 300);

      // Highlight element
      element.style.position = 'relative';
      element.style.zIndex = '9999';
      element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2)';
      element.style.borderRadius = '8px';
      element.style.transition = 'all 0.3s ease';
    }

    return () => {
      // Remove highlight
      if (element) {
        element.style.position = '';
        element.style.zIndex = '';
        element.style.boxShadow = '';
        element.style.transition = '';
      }
    };
  }, [currentStep, isOpen, steps]);

  const calculateTooltipPosition = (element: HTMLElement, placement: string) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = Math.min(450, window.innerWidth - 40); // Max 450px or screen width - padding
    const tooltipHeight = 350; // Approximate max height
    const spacing = 16;
    const padding = 20; // Minimum padding from screen edges

    let top = 0;
    let left = 0;
    let arrow: 'top' | 'bottom' | 'left' | 'right' = 'top';

    // Calculate available space in all directions
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    // Determine best placement based on available space
    let finalPlacement = placement;

    // Priority: try to fit in requested placement, otherwise find best alternative
    if (placement === 'bottom' && spaceBelow < tooltipHeight + spacing) {
      if (spaceAbove >= tooltipHeight + spacing) {
        finalPlacement = 'top';
      } else if (spaceRight >= tooltipWidth + spacing) {
        finalPlacement = 'right';
      } else if (spaceLeft >= tooltipWidth + spacing) {
        finalPlacement = 'left';
      } else {
        finalPlacement = 'bottom'; // Keep original, will adjust position
      }
    } else if (placement === 'top' && spaceAbove < tooltipHeight + spacing) {
      if (spaceBelow >= tooltipHeight + spacing) {
        finalPlacement = 'bottom';
      } else if (spaceRight >= tooltipWidth + spacing) {
        finalPlacement = 'right';
      } else if (spaceLeft >= tooltipWidth + spacing) {
        finalPlacement = 'left';
      } else {
        finalPlacement = 'top';
      }
    } else if (placement === 'right' && spaceRight < tooltipWidth + spacing) {
      if (spaceLeft >= tooltipWidth + spacing) {
        finalPlacement = 'left';
      } else if (spaceBelow >= tooltipHeight + spacing) {
        finalPlacement = 'bottom';
      } else if (spaceAbove >= tooltipHeight + spacing) {
        finalPlacement = 'top';
      } else {
        finalPlacement = 'right';
      }
    } else if (placement === 'left' && spaceLeft < tooltipWidth + spacing) {
      if (spaceRight >= tooltipWidth + spacing) {
        finalPlacement = 'right';
      } else if (spaceBelow >= tooltipHeight + spacing) {
        finalPlacement = 'bottom';
      } else if (spaceAbove >= tooltipHeight + spacing) {
        finalPlacement = 'top';
      } else {
        finalPlacement = 'left';
      }
    }

    // Calculate position based on final placement
    switch (finalPlacement) {
      case 'top':
        top = rect.top - spacing;
        left = rect.left + rect.width / 2;
        arrow = 'bottom';
        break;
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + rect.width / 2;
        arrow = 'top';
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - spacing;
        arrow = 'right';
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + spacing;
        arrow = 'left';
        break;
    }

    // Ensure tooltip stays within viewport bounds
    if (finalPlacement === 'top' || finalPlacement === 'bottom') {
      // Horizontal centering with bounds checking
      const halfWidth = tooltipWidth / 2;
      left = Math.max(padding + halfWidth, Math.min(left, window.innerWidth - padding - halfWidth));

      // Vertical bounds
      if (finalPlacement === 'top') {
        top = Math.max(padding, top);
      } else {
        top = Math.min(window.innerHeight - tooltipHeight - padding, top);
      }
    } else {
      // Vertical centering with bounds checking
      const halfHeight = tooltipHeight / 2;
      top = Math.max(padding + halfHeight, Math.min(top, window.innerHeight - padding - halfHeight));

      // Horizontal bounds
      if (finalPlacement === 'left') {
        left = Math.max(padding, left);
      } else {
        left = Math.min(window.innerWidth - tooltipWidth - padding, left);
      }
    }

    setTooltipPosition({ top, left });
    setArrowPosition(arrow);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const isCentered = step.target === 'body' || step.placement === 'center';

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

      {/* Tooltip - Centered or Positioned */}
      {isCentered ? (
        // Centered Modal for welcome/completion messages
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-8 max-w-2xl w-full animate-in zoom-in-95 fade-in duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-primary-500 bg-primary-100 dark:bg-primary-900/30 px-3 py-1.5 rounded-full">
                    Passo {currentStep + 1} de {steps.length}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
              </div>
              <button
                onClick={onSkip}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="text-base text-gray-600 dark:text-gray-300 mb-8">
              {typeof step.content === 'string' ? (
                <p>{step.content}</p>
              ) : (
                step.content
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-6">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={onSkip}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
              >
                Pular Tour
              </button>

              <div className="flex gap-3">
                {!isFirstStep && (
                  <button
                    onClick={handlePrev}
                    className="px-6 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Voltar
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-bold flex items-center gap-2 shadow-lg shadow-primary-500/30"
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
      ) : (
        // Positioned Tooltip near target element
        <div
          className="fixed z-[10000] animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{
            top: arrowPosition === 'bottom' ? `${tooltipPosition.top}px` : arrowPosition === 'top' ? `${tooltipPosition.top}px` : `${tooltipPosition.top}px`,
            left: arrowPosition === 'left' || arrowPosition === 'right' ? `${tooltipPosition.left}px` : `${tooltipPosition.left}px`,
            transform: arrowPosition === 'bottom' ? 'translate(-50%, 0)' :
              arrowPosition === 'top' ? 'translate(-50%, -100%)' :
                arrowPosition === 'left' ? 'translate(-100%, -50%)' :
                  'translate(0, -50%)',
            maxWidth: `${Math.min(450, window.innerWidth - 40)}px`,
            width: '90vw'
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 relative">
            {/* Arrow */}
            <div
              className={`absolute w-4 h-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rotate-45 ${arrowPosition === 'top' ? '-top-2 left-1/2 -translate-x-1/2 border-b-0 border-r-0' :
                  arrowPosition === 'bottom' ? '-bottom-2 left-1/2 -translate-x-1/2 border-t-0 border-l-0' :
                    arrowPosition === 'left' ? '-left-2 top-1/2 -translate-y-1/2 border-t-0 border-r-0' :
                      '-right-2 top-1/2 -translate-y-1/2 border-b-0 border-l-0'
                }`}
            />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary-500 bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded">
                    Passo {currentStep + 1} de {steps.length}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
              </div>
              <button
                onClick={onSkip}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {typeof step.content === 'string' ? (
                <p>{step.content}</p>
              ) : (
                step.content
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mb-4">
              <div
                className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={onSkip}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
              >
                Pular Tour
              </button>

              <div className="flex gap-2">
                {!isFirstStep && (
                  <button
                    onClick={handlePrev}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium flex items-center gap-1 text-sm"
                  >
                    <ChevronLeft size={16} />
                    Voltar
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-bold flex items-center gap-1 text-sm"
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
      )}
    </>
  );
};
