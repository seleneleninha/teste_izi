import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Privacy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-3xl mx-auto bg-slate-800 rounded-3xl shadow-xl p-8 md:p-12">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-primary-600 mb-8 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Voltar
                </button>

                <h1 className="text-3xl font-bold text-white mb-6">Política de Privacidade</h1>

                <div className="prose dark:prose-invert max-w-none text-slate-300 space-y-4">
                    <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                    <h3>1. Coleta de Dados</h3>
                    <p>Coletamos informações pessoais que você nos fornece, como nome, e-mail, telefone e dados profissionais (CRECI), para fornecer nossos serviços.</p>

                    <h3>2. Uso das Informações</h3>
                    <p>Utilizamos seus dados para gerenciar sua conta, processar transações, enviar notificações importantes e melhorar a experiência na Plataforma.</p>

                    <h3>3. Compartilhamento de Dados</h3>
                    <p>Não vendemos ou alugamos seus dados pessoais a terceiros. Podemos compartilhar dados com parceiros de serviço apenas para fins operacionais da Plataforma.</p>

                    <h3>4. Segurança dos Dados</h3>
                    <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado ou perda.</p>

                    <h3>5. Seus Direitos (LGPD)</h3>
                    <p>Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento, conforme previsto na Lei Geral de Proteção de Dados.</p>
                </div>
            </div>
        </div>
    );
};
