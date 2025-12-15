import React from 'react';
import { HelpCircle, X, Play } from 'lucide-react';

interface TourPromptProps {
    onStartTour: () => void;
    onDismiss: () => void;
    dismissCount: number;
}

export const TourPrompt: React.FC<TourPromptProps> = ({
    onStartTour,
    onDismiss,
    dismissCount
}) => {
    // Don't show after 3 dismissals
    if (dismissCount >= 3) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl shadow-2xl p-6 max-w-sm relative">
                <button
                    onClick={onDismiss}
                    className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-3xl flex items-center justify-center flex-shrink-0">
                        <HelpCircle size={24} />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">
                            {dismissCount === 0 ? 'Ainda com dúvidas?' : 'Precisa de ajuda?'}
                        </h3>
                        <p className="text-sm text-white/90 mb-4">
                            Faça um tour rápido pela Plataforma e descubra todos os recursos disponíveis!
                        </p>

                        <button
                            onClick={onStartTour}
                            className="w-full px-4 py-2.5 bg-white text-blue-600 rounded-full font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Play size={16} />
                            Iniciar Tour
                        </button>

                        {dismissCount > 0 && (
                            <p className="text-xs text-white/70 mt-2 text-center">
                                Essa mensagem aparecerá mais {3 - dismissCount} {3 - dismissCount === 1 ? 'vez' : 'vezes'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
