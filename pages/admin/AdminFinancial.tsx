import React from 'react';
import { DollarSign, TrendingUp, CreditCard, Lock, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

export const AdminFinancial: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 pb-12">
            {/* Admin Header - Command Center Style */}
            <div className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 border-b border-slate-800/50 pt-8 pb-6 px-6 mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                <DollarSign className="text-emerald-400" size={24} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Controle <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Financeiro</span>
                            </h1>
                        </div>
                        <p className="text-slate-400 font-medium ml-1">Monitore o faturamento e a saúde financeira da plataforma.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                <DollarSign size={24} className="text-emerald-400" />
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight size={12} /> +12%
                            </span>
                        </div>
                        <h3 className="text-slate-400 text-sm font-bold mb-1">Receita Mensal (RR)</h3>
                        <div className="text-3xl font-black text-white">R$ 0,00</div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                <TrendingUp size={24} className="text-blue-400" />
                            </div>
                            <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight size={12} /> +5%
                            </span>
                        </div>
                        <h3 className="text-slate-400 text-sm font-bold mb-1">Crescimento Anual</h3>
                        <div className="text-3xl font-black text-white">0%</div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                                <CreditCard size={24} className="text-purple-400" />
                            </div>
                            <span className="bg-slate-700 text-slate-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowDownRight size={12} /> 0%
                            </span>
                        </div>
                        <h3 className="text-slate-400 text-sm font-bold mb-1">Assinaturas Ativas</h3>
                        <div className="text-3xl font-black text-white">0</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Placeholder Chart Section */}
                    <div className="lg:col-span-2 bg-slate-800 rounded-3xl p-8 border border-slate-700 relative overflow-hidden min-h-[400px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700 shadow-xl">
                                <Lock className="text-emerald-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Relatórios Detalhados</h3>
                            <p className="text-slate-400 max-w-sm">
                                A visualização gráfica de receitas e churn estará disponível após a integração com o Gateway de Pagamentos.
                            </p>
                        </div>
                        {/* Fake Background Chart Elements */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-500/10 to-transparent"></div>
                        <div className="absolute left-10 bottom-10 w-20 h-40 bg-slate-700/30 rounded-t-xl"></div>
                        <div className="absolute left-36 bottom-10 w-20 h-64 bg-slate-700/30 rounded-t-xl"></div>
                        <div className="absolute left-62 bottom-10 w-20 h-52 bg-slate-700/30 rounded-t-xl"></div>
                    </div>

                    {/* Recent Transactions Placeholder */}
                    <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <CreditCard size={18} className="text-slate-400" /> Transações Recentes
                            </h3>
                        </div>

                        <div className="space-y-4 flex-1">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 opacity-50 blur-[1px] select-none">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                                        <div>
                                            <div className="h-4 w-24 bg-slate-700 rounded mb-1"></div>
                                            <div className="h-3 w-16 bg-slate-700/50 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-4 w-16 bg-slate-700 rounded"></div>
                                </div>
                            ))}
                            <div className="p-4 text-center mt-4">
                                <p className="text-sm text-slate-500 italic">Nenhuma transação registrada.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
