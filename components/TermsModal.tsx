import React from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white">Termos de Uso</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-700 transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
                    <div className="prose dark:prose-invert max-w-none text-slate-300 space-y-4">
                        <p className="text-sm text-slate-400">
                            Última atualização: {new Date().toLocaleDateString('pt-BR')}
                        </p>

                        <h3 className="text-lg font-semibold text-white mt-6">1. Aceitação dos Termos</h3>
                        <p>Ao acessar e usar a Plataforma iziBrokerz, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.</p>

                        <h3 className="text-lg font-semibold text-white mt-6">2. Uso da Plataforma</h3>
                        <p>A Plataforma destina-se a facilitar a gestão imobiliária para Corretores e imobiliárias. O uso indevido ou para fins ilegais é estritamente proibido.</p>

                        <h3 className="text-lg font-semibold text-white mt-6">3. Cadastro e Segurança</h3>
                        <p>Você é responsável por manter a confidencialidade de sua conta e senha. A iziBrokerz não se responsabiliza por perdas decorrentes do uso não autorizado de sua conta.</p>

                        <h3 className="text-lg font-semibold text-white mt-6">4. Propriedade Intelectual</h3>
                        <p>Todo o conteúdo, design e código da Plataforma são propriedade exclusiva da iziBrokerz e estão protegidos por leis de direitos autorais.</p>

                        <h3 className="text-lg font-semibold text-white mt-6">5. Limitação de Responsabilidade</h3>
                        <p>A iziBrokerz não garante que a Plataforma estará livre de erros ou interrupções. O uso é por sua conta e risco.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
