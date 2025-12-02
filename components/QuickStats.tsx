import React from 'react';
import { Users, TrendingUp, DollarSign, Clock, Target, Zap } from 'lucide-react';

interface QuickStatsProps {
    totalLeads: number;
    conversionRate: number;
    pipelineValue: number;
    leadsToday: number;
    avgResponseTime?: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
    totalLeads,
    conversionRate,
    pipelineValue,
    leadsToday,
    avgResponseTime = '2h'
}) => {
    const stats = [
        {
            icon: Users,
            label: 'Total de Leads',
            value: totalLeads,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
            trend: null
        },
        {
            icon: TrendingUp,
            label: 'Taxa de Conversão',
            value: `${conversionRate.toFixed(1)}%`,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            trend: conversionRate > 20 ? '+5%' : null
        },
        {
            icon: DollarSign,
            label: 'Valor em Pipeline',
            value: pipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
            color: 'text-primary-600 dark:text-primary-400',
            bgColor: 'bg-primary-100 dark:bg-primary-900/30',
            trend: null
        },
        {
            icon: Zap,
            label: 'Leads Hoje',
            value: leadsToday,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
            trend: leadsToday > 0 ? 'Novo!' : null
        },
        {
            icon: Clock,
            label: 'Tempo Médio de Resposta',
            value: avgResponseTime,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
            trend: null
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                        {stat.trend && (
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                {stat.trend}
                            </span>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {stat.value}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                        {stat.label}
                    </div>
                </div>
            ))}
        </div>
    );
};
