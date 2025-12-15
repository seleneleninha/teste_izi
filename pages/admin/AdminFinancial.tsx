import React from 'react';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';

export const AdminFinancial: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-white mb-8">Financeiro</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 bg-green-900/30 rounded-full flex items-center justify-center">
                            <DollarSign size={24} className="text-green-600 text-green-400" />
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Receita Mensal (Estimada)</h3>
                    <div className="text-3xl font-bold text-white">R$ 0,00</div>
                </div>

                <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 bg-blue-900/30 rounded-full flex items-center justify-center">
                            <TrendingUp size={24} className="text-blue-600 text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Crescimento</h3>
                    <div className="text-3xl font-bold text-white">0%</div>
                </div>

                <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 bg-purple-900/30 rounded-full flex items-center justify-center">
                            <CreditCard size={24} className="text-purple-600 text-purple-400" />
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Assinaturas Ativas</h3>
                    <div className="text-3xl font-bold text-white">0</div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 border-dashed">
                <div className="max-w-md mx-auto">
                    <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Integração de Pagamentos</h2>
                    <p className="text-gray-400">
                        A integração com Gateway de Pagamento será implementada em breve.
                        Aqui você poderá visualizar transações, faturas e gerenciar assinaturas.
                    </p>
                </div>
            </div>
        </div>
    );
};
