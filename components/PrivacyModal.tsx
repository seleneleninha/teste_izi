import React from 'react';
import { X } from 'lucide-react';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white">Política de Privacidade</h2>
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

                        <h3 className="text-lg font-semibold text-white mt-6">1. Coleta de Dados</h3>
                        <p>Coletamos informações pessoais que você nos fornece, como nome, e-mail, telefone e dados profissionais (CRECI), para fornecer nossos serviços.</p>

                        <h3 className="text-lg font-semibold text-white mt-6">2. Uso das Informações</h3>
                        <p>Utilizamos seus dados para gerenciar sua conta, processar transações, enviar notificações importantes e melhorar a experiência na Plataforma.</p>

                        <h3 className="text-lg font-semibold text-white mt-6">3. Compartilhamento de Dados</h3>
                        <p>Não vendemos ou alugamos seus dados pessoais a terceiros. Podemos compartilhar dados com parceiros de serviço apenas para fins operacionais da Plataforma.</p>

                        <h3 className="text-lg font-semibold text-white mt-6">4. Segurança dos Dados</h3>
                        <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado ou perda.</p>

                        <h3 className="text-lg font-semibold text-white mt-6">5. Seus Direitos (LGPD)</h3>
                        <p>Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento, conforme previsto na Lei Geral de Proteção de Dados.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
