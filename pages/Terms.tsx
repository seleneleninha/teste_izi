import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Terms: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-primary-600 mb-8 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" /> Voltar
                </button>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Termos de Uso</h1>

                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-slate-300 space-y-4">
                    <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                    <h3>1. Aceitação dos Termos</h3>
                    <p>Ao acessar e usar a plataforma iziBrokerz, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.</p>

                    <h3>2. Uso da Plataforma</h3>
                    <p>A plataforma destina-se a facilitar a gestão imobiliária para corretores e imobiliárias. O uso indevido ou para fins ilegais é estritamente proibido.</p>

                    <h3>3. Cadastro e Segurança</h3>
                    <p>Você é responsável por manter a confidencialidade de sua conta e senha. A iziBrokerz não se responsabiliza por perdas decorrentes do uso não autorizado de sua conta.</p>

                    <h3>4. Propriedade Intelectual</h3>
                    <p>Todo o conteúdo, design e código da plataforma são propriedade exclusiva da iziBrokerz e estão protegidos por leis de direitos autorais.</p>

                    <h3>5. Limitação de Responsabilidade</h3>
                    <p>A iziBrokerz não garante que a plataforma estará livre de erros ou interrupções. O uso é por sua conta e risco.</p>
                </div>
            </div>
        </div>
    );
};
