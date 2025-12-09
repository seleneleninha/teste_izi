"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, DollarSign, TrendingUp, Users, CreditCard, Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface FinancialStats {
    totalRevenue: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
    totalUsers: number;
    totalProperties: number;
    pendingApprovals: number;
}

export default function FinancialPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<FinancialStats>({
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeSubscriptions: 0,
        totalUsers: 0,
        totalProperties: 0,
        pendingApprovals: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch user count
            const { count: userCount } = await supabase
                .from('perfis')
                .select('*', { count: 'exact', head: true });

            // Fetch property count
            const { count: propCount } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true });

            // Fetch pending approvals
            const { count: pendingCount } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('status_aprovacao', 'pendente');

            // Mock financial data (replace with real data when available)
            setStats({
                totalRevenue: 45680.00,
                monthlyRevenue: 12340.00,
                activeSubscriptions: Math.floor((userCount || 0) * 0.7),
                totalUsers: userCount || 0,
                totalProperties: propCount || 0,
                pendingApprovals: pendingCount || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={48} />
            </div>
        );
    }

    const statCards = [
        { title: 'Receita Total', value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'emerald', trend: '+12.5%', up: true },
        { title: 'Receita Mensal', value: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'blue', trend: '+8.2%', up: true },
        { title: 'Assinaturas Ativas', value: stats.activeSubscriptions.toString(), icon: CreditCard, color: 'purple', trend: '+5', up: true },
        { title: 'Total de Usuários', value: stats.totalUsers.toString(), icon: Users, color: 'orange', trend: '+23', up: true },
        { title: 'Total de Imóveis', value: stats.totalProperties.toString(), icon: Building2, color: 'cyan', trend: '+48', up: true },
        { title: 'Pendentes', value: stats.pendingApprovals.toString(), icon: Building2, color: 'yellow', trend: 'Aguardando', up: false },
    ];

    const colorClasses: Record<string, string> = {
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
        cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
    };

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel Financeiro</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral da plataforma</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                                <stat.icon size={24} />
                            </div>
                            {stat.up !== undefined && (
                                <span className={`flex items-center text-sm font-semibold ${stat.up ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                    {stat.up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    {stat.trend}
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                    </div>
                ))}
            </div>

            {/* Revenue Chart Placeholder */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Evolução da Receita</h2>
                <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <div className="text-center">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Gráfico de receita será implementado aqui</p>
                        <p className="text-sm">Integre com Chart.js ou Recharts</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
