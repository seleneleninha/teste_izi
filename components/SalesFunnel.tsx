import React from 'react';
import { TrendingUp, Users, DollarSign, Target, Eye, Search, FileText, CheckCircle, XCircle, Archive } from 'lucide-react';

interface FunnelMetrics {
    totalLeads: number;
    byStage: {
        novo: number;
        emContato: number;
        negociacao: number;
        fechado: number;
        arquivado: number;
    };
    totalValue: number;
    conversionRate: number;
}

interface SalesFunnelProps {
    metrics: FunnelMetrics;
}

export const SalesFunnel: React.FC<SalesFunnelProps> = ({ metrics }) => {
    const stages = [
        {
            key: 'novo',
            label: 'Novos',
            count: metrics.byStage.novo,
            color: '#3B82F6',
            icon: Eye,
            description: 'Leads recém-capturados'
        },
        {
            key: 'emContato',
            label: 'Em Contato',
            count: metrics.byStage.emContato,
            color: '#F59E0B',
            icon: Search,
            description: 'Primeiro contato realizado'
        },
        {
            key: 'negociacao',
            label: 'Negociação',
            count: metrics.byStage.negociacao,
            color: '#8B5CF6',
            icon: FileText,
            description: 'Negociando proposta'
        },
        {
            key: 'fechado',
            label: 'Fechados',
            count: metrics.byStage.fechado,
            color: '#10B981',
            icon: CheckCircle,
            description: 'Negócio concluído'
        },
    ];

    const calculateConversion = (from: number, to: number) => {
        if (from === 0) return 0;
        return ((to / from) * 100).toFixed(1);
    };

    const totalActive = metrics.totalLeads; // totalLeads already excludes archived in the parent component

    return (
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 mb-6 shadow-sm h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                <div className="w-full md:w-auto">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Target className="text-primary-500" size={20} />
                        Funil de Vendas
                    </h3>
                    <p className="text-sm text-slate-400">Acompanhe seus Leads</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-2 md:pb-0">
                <div className="text-center min-w-[80px]">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                        <Users size={14} />
                        <span>Ativos</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalActive}</div>
                </div>
                <div className="text-center min-w-[80px]">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                        <TrendingUp size={14} />
                        <span>Conversão</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 text-green-400">{metrics.conversionRate.toFixed(1)}%</div>
                </div>
                <div className="text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                        <DollarSign size={14} />
                        <span>VGV Estimado</span>
                    </div>
                    <div className="text-xl font-bold text-primary-600 text-primary-400">
                        {(metrics.totalValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </div>
                </div>
                <div className="text-center min-w-[80px]">
                    <div className="flex items-center justify-center gap-1 text-red-400 text-xs mb-1">
                        <Archive size={14} />
                        <span>Arquivados</span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">{metrics.byStage.arquivado}</div>
                </div>
            </div>


            {/* SVG Funnel - Centered and Responsive */}
            <div className="flex-1 flex justify-center items-center py-2">
                <svg viewBox="0 0 500 350" className="w-full max-w-[500px] drop-shadow-lg h-auto">
                    <defs>
                        {stages.map((stage, index) => (
                            <linearGradient key={stage.key} id={`gradient-${stage.key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={stage.color} stopOpacity="0.9" />
                                <stop offset="100%" stopColor={stage.color} stopOpacity="0.7" />
                            </linearGradient>
                        ))}
                    </defs>

                    {/* Funnel Layers */}
                    {stages.map((stage, index) => {
                        const yPos = 50 + (index * 70);
                        const topWidth = 400 - (index * 80);
                        const bottomWidth = 400 - ((index + 1) * 80);
                        const xStart = (500 - topWidth) / 2;
                        const xEnd = (500 - bottomWidth) / 2;
                        const percentage = totalActive > 0 ? ((stage.count / totalActive) * 100).toFixed(0) : 0;
                        const Icon = stage.icon;

                        return (
                            <g key={stage.key} className="cursor-pointer hover:opacity-90 transition-opacity group">
                                {/* Trapezoid */}
                                <path
                                    d={`M ${xStart} ${yPos} L ${xStart + topWidth} ${yPos} L ${xEnd + bottomWidth} ${yPos + 70} L ${xEnd} ${yPos + 70} Z`}
                                    fill={`url(#gradient-${stage.key})`}
                                    stroke={stage.color}
                                    strokeWidth="2"
                                />

                                {/* Icon */}
                                <foreignObject x={xStart + 30} y={yPos + 15} width="30" height="30">
                                    <div className="flex items-center justify-right w-full h-full">
                                        <Icon size={20} color="white" />
                                    </div>
                                </foreignObject>

                                {/* Label */}
                                <text
                                    x={xStart + 50}
                                    y={yPos + 15}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="11"
                                    fontWeight="bold"
                                >
                                    {stage.label}
                                </text>

                                {/* Count and Percentage */}
                                <text
                                    x={xEnd + bottomWidth - 30}
                                    y={yPos + 55}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="18"
                                    fontWeight="bold"
                                >
                                    {stage.count} ({percentage}%)
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
