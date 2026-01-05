import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import {
    PropertyData,
    MarketAnalysis,
    MarketSummary,
    analisarPorBairro,
    gerarResumoMercado,
    formatarMoeda,
    formatarPercentual,
    obterValoresUnicos,
} from '../../lib/marketIntelligence';
import {
    BarChart3,
    Building2,
    MapPin,
    TrendingUp,
    TrendingDown,
    Filter,
    ChevronDown,
    ChevronUp,
    Loader2,
    Home,
    DollarSign,
    Percent,
    Map,
    ArrowUpDown,
    Search,
    RefreshCw,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
} from 'recharts';

export const MarketStudyPage: React.FC = () => {
    const { user, userProfile, role } = useAuth();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<PropertyData[]>([]);
    const [summary, setSummary] = useState<MarketSummary | null>(null);
    const [analysis, setAnalysis] = useState<MarketAnalysis[]>([]);
    const [priceSnapshots, setPriceSnapshots] = useState<{ mes: string; valor: number }[]>([]);

    // Filtros
    const [filtroUF, setFiltroUF] = useState<string>('');
    const [filtroCidade, setFiltroCidade] = useState<string>('');
    const [filtroTipo, setFiltroTipo] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Ordenação
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'totalAnuncios',
        direction: 'desc',
    });

    // Fetch properties and snapshots
    useEffect(() => {
        fetchProperties();
        fetchPriceSnapshots();
    }, []);

    // Recalcular análise quando filtros mudam
    useEffect(() => {
        if (properties.length > 0) {
            const novaAnalise = analisarPorBairro(properties, filtroUF, filtroCidade, filtroTipo);
            setAnalysis(novaAnalise);
        }
    }, [properties, filtroUF, filtroCidade, filtroTipo]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
                    id,
                    uf,
                    cidade,
                    bairro,
                    area_priv,
                    valor_venda,
                    valor_locacao,
                    quartos,
                    banheiros,
                    vagas,
                    tipo_imovel (tipo),
                    operacao (tipo)
                `)
                .eq('status', 'ativo')
                .gt('area_priv', 0);

            if (error) throw error;

            const formattedData: PropertyData[] = (data || []).map(p => ({
                ...p,
                tipo_imovel: p.tipo_imovel,
                operacao: p.operacao,
            }));

            setProperties(formattedData);
            setSummary(gerarResumoMercado(formattedData));
            setAnalysis(analisarPorBairro(formattedData));

        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            addToast('Erro ao carregar dados para análise', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch price snapshots for trends
    const fetchPriceSnapshots = async () => {
        try {
            const { data, error } = await supabase
                .from('price_snapshots')
                .select('mes_referencia, media_m2_venda')
                .not('media_m2_venda', 'is', null)
                .order('mes_referencia', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                // Group by month and calculate average
                const monthlyData: Record<string, { total: number; count: number }> = {};

                data.forEach((item: any) => {
                    const date = new Date(item.mes_referencia);
                    const monthKey = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().slice(-2)}`;

                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = { total: 0, count: 0 };
                    }
                    monthlyData[monthKey].total += Number(item.media_m2_venda);
                    monthlyData[monthKey].count += 1;
                });

                const formattedData = Object.entries(monthlyData).map(([mes, { total, count }]) => ({
                    mes,
                    valor: Math.round(total / count)
                }));

                setPriceSnapshots(formattedData);
            }
        } catch (error) {
            console.error('Erro ao buscar snapshots de preço:', error);
        }
    };

    // Valores únicos para filtros
    const estados = useMemo(() => obterValoresUnicos(properties, 'uf'), [properties]);
    const cidades = useMemo(() => {
        const filtered = filtroUF ? properties.filter(p => p.uf === filtroUF) : properties;
        return obterValoresUnicos(filtered, 'cidade');
    }, [properties, filtroUF]);
    const tipos = useMemo(() => obterValoresUnicos(properties, 'tipo'), [properties]);

    // Ordenação
    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedAnalysis = useMemo(() => {
        let filtered = [...analysis];

        // Filtro de busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(a =>
                a.bairro?.toLowerCase().includes(term) ||
                a.cidade?.toLowerCase().includes(term) ||
                a.uf?.toLowerCase().includes(term)
            );
        }

        // Ordenação
        filtered.sort((a, b) => {
            const aVal = (a as any)[sortConfig.key] ?? 0;
            const bVal = (b as any)[sortConfig.key] ?? 0;

            if (sortConfig.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

        return filtered;
    }, [analysis, searchTerm, sortConfig]);

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-slate-500" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className="text-emerald-400" />
            : <ChevronDown size={14} className="text-emerald-400" />;
    };

    // Verificar se é admin (coluna is_admin na tabela perfis ou role === 'Admin')
    const isAdmin = userProfile?.is_admin === true || role === 'Admin';

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <BarChart3 size={64} className="text-slate-600 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h2>
                <p className="text-slate-400">Esta funcionalidade é exclusiva para administradores.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={48} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BarChart3 className="text-emerald-400" />
                        Inteligência de Mercado
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Análise de R$/m² baseada em {summary?.totalAnuncios || 0} anúncios ativos
                    </p>
                </div>
                <button
                    onClick={fetchProperties}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all"
                >
                    <RefreshCw size={18} />
                    Atualizar Dados
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Home className="text-emerald-400" size={24} />
                            <span className="text-slate-400 text-sm">Anúncios</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{summary.totalAnuncios.toLocaleString()}</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Map className="text-blue-400" size={24} />
                            <span className="text-slate-400 text-sm">Estados</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{summary.totalEstados}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="text-purple-400" size={24} />
                            <span className="text-slate-400 text-sm">Cidades</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{summary.totalCidades}</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 border border-pink-500/30 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="text-pink-400" size={24} />
                            <span className="text-slate-400 text-sm">Bairros</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{summary.totalBairros}</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="text-amber-400" size={24} />
                            <span className="text-slate-400 text-sm">R$/m² Venda</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatarMoeda(summary.mediaM2VendaBrasil)}</p>
                        <p className="text-xs text-slate-500">{summary.anunciosVenda} anúncios</p>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 border border-cyan-500/30 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="text-cyan-400" size={24} />
                            <span className="text-slate-400 text-sm">R$/m² Locação</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatarMoeda(summary.mediaM2LocacaoBrasil)}</p>
                        <p className="text-xs text-slate-500">{summary.anunciosLocacao} anúncios</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={20} className="text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">Filtros</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Busca */}
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar bairro, cidade..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Estado */}
                    <select
                        value={filtroUF}
                        onChange={(e) => {
                            setFiltroUF(e.target.value);
                            setFiltroCidade('');
                        }}
                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todos os Estados</option>
                        {estados.map(uf => (
                            <option key={uf} value={uf}>{uf}</option>
                        ))}
                    </select>

                    {/* Cidade */}
                    <select
                        value={filtroCidade}
                        onChange={(e) => setFiltroCidade(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todas as Cidades</option>
                        {cidades.map(cidade => (
                            <option key={cidade} value={cidade}>{cidade}</option>
                        ))}
                    </select>

                    {/* Tipo */}
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todos os Tipos</option>
                        {tipos.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Analysis Table */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-emerald-400" size={20} />
                        Análise por Bairro
                        <span className="text-sm font-normal text-slate-400 ml-2">
                            ({sortedAnalysis.length} resultados)
                        </span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-900/80 border-b border-white/10 text-xs uppercase tracking-wider">
                                <th className="p-4 text-left text-slate-400 font-semibold">
                                    <button onClick={() => handleSort('bairro')} className="flex items-center gap-1 hover:text-white">
                                        Localização {getSortIcon('bairro')}
                                    </button>
                                </th>
                                <th className="p-4 text-center text-slate-400 font-semibold">
                                    <button onClick={() => handleSort('totalAnuncios')} className="flex items-center gap-1 mx-auto hover:text-white">
                                        Anúncios {getSortIcon('totalAnuncios')}
                                    </button>
                                </th>
                                <th className="p-4 text-right text-slate-400 font-semibold">
                                    <button onClick={() => handleSort('mediaM2Venda')} className="flex items-center gap-1 ml-auto hover:text-white">
                                        R$/m² Venda {getSortIcon('mediaM2Venda')}
                                    </button>
                                </th>
                                <th className="p-4 text-right text-slate-400 font-semibold">Min/Max Venda</th>
                                <th className="p-4 text-right text-slate-400 font-semibold">
                                    <button onClick={() => handleSort('mediaM2Locacao')} className="flex items-center gap-1 ml-auto hover:text-white">
                                        R$/m² Locação {getSortIcon('mediaM2Locacao')}
                                    </button>
                                </th>
                                <th className="p-4 text-right text-slate-400 font-semibold">Min/Max Loc.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAnalysis.map((row, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b border-white/5 hover:bg-slate-800/50 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium">{row.bairro}</span>
                                            <span className="text-slate-500 text-xs">{row.cidade}, {row.uf}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-mono">
                                            {row.totalAnuncios}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-emerald-400 font-bold">
                                            {formatarMoeda(row.mediaM2Venda)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex flex-col text-xs">
                                            <span className="text-slate-400">{formatarMoeda(row.minM2Venda)}</span>
                                            <span className="text-slate-400">{formatarMoeda(row.maxM2Venda)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-blue-400 font-bold">
                                            {formatarMoeda(row.mediaM2Locacao)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex flex-col text-xs">
                                            <span className="text-slate-400">{formatarMoeda(row.minM2Locacao)}</span>
                                            <span className="text-slate-400">{formatarMoeda(row.maxM2Locacao)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sortedAnalysis.length === 0 && (
                    <div className="p-12 text-center">
                        <BarChart3 size={48} className="text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum dado encontrado</h3>
                        <p className="text-slate-400">Ajuste os filtros ou aguarde mais anúncios serem cadastrados.</p>
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Top 10 Neighborhoods by Price */}
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                        <BarChart3 className="text-emerald-400" size={20} />
                        R$/m² por Bairro (Top 10)
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[...analysis]
                                    .filter(a => a.mediaM2Venda)
                                    .sort((a, b) => (b.mediaM2Venda || 0) - (a.mediaM2Venda || 0))
                                    .slice(0, 10)
                                    .map(a => ({
                                        name: a.bairro?.substring(0, 15) || 'N/A',
                                        valor: a.mediaM2Venda || 0
                                    }))}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis type="number" stroke="#9ca3af" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}/m²`, 'Preço Médio']}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="valor" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart - Distribution by Property Type */}
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                        <Home className="text-blue-400" size={20} />
                        Distribuição por Tipo de Imóvel
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={(() => {
                                        const tipoCount: Record<string, number> = {};
                                        properties.forEach(p => {
                                            const tipo = typeof p.tipo_imovel === 'string' ? p.tipo_imovel : p.tipo_imovel?.tipo || 'Outros';
                                            tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
                                        });
                                        return Object.entries(tipoCount)
                                            .map(([name, value]) => ({ name, value }))
                                            .sort((a, b) => b.value - a.value);
                                    })()}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={60}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'].map((color, index) => (
                                        <Cell key={`cell-${index}`} fill={color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`${value} imóveis`, 'Quantidade']}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Heat Map Section */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Map className="text-orange-400" size={20} />
                    Mapa de Calor - R$/m² por Bairro
                </h3>
                <p className="text-slate-400 text-sm mb-6">Cores indicam faixa de preço: 🟢 Baixo → 🟡 Médio → 🔴 Alto</p>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[...analysis]
                        .filter(a => a.mediaM2Venda)
                        .sort((a, b) => (b.mediaM2Venda || 0) - (a.mediaM2Venda || 0))
                        .slice(0, 24)
                        .map((item, idx) => {
                            const maxPrice = analysis.reduce((max, a) => Math.max(max, a.mediaM2Venda || 0), 0);
                            const minPrice = analysis.reduce((min, a) => a.mediaM2Venda ? Math.min(min, a.mediaM2Venda) : min, Infinity);
                            const range = maxPrice - minPrice;
                            const price = item.mediaM2Venda || 0;
                            const position = range > 0 ? (price - minPrice) / range : 0.5;

                            // Color gradient: green (low) -> yellow (mid) -> red (high)
                            let bgColor = 'from-green-600/30 to-green-800/30 border-green-500/40';
                            let textColor = 'text-green-400';
                            if (position > 0.66) {
                                bgColor = 'from-red-600/30 to-red-800/30 border-red-500/40';
                                textColor = 'text-red-400';
                            } else if (position > 0.33) {
                                bgColor = 'from-amber-600/30 to-amber-800/30 border-amber-500/40';
                                textColor = 'text-amber-400';
                            }

                            return (
                                <div
                                    key={idx}
                                    className={`bg-gradient-to-br ${bgColor} border rounded-xl p-3 hover:scale-105 transition-transform cursor-default`}
                                >
                                    <p className="text-white text-xs font-bold truncate">{item.bairro}</p>
                                    <p className={`text-lg font-bold ${textColor}`}>
                                        {formatarMoeda(item.mediaM2Venda)}
                                    </p>
                                    <p className="text-slate-500 text-[10px]">{item.cidade}</p>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Trends Section - Placeholder */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <TrendingUp className="text-purple-400" size={20} />
                    Tendências Temporais - R$/m² ao Longo do Tempo
                </h3>

                {/* Real or Simulated Trend Data */}
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={priceSnapshots.length > 0 ? priceSnapshots : [
                                { mes: 'Ago/25', valor: summary?.mediaM2Venda ? Math.round(summary.mediaM2Venda * 0.92) : 6500 },
                                { mes: 'Set/25', valor: summary?.mediaM2Venda ? Math.round(summary.mediaM2Venda * 0.94) : 6600 },
                                { mes: 'Out/25', valor: summary?.mediaM2Venda ? Math.round(summary.mediaM2Venda * 0.95) : 6700 },
                                { mes: 'Nov/25', valor: summary?.mediaM2Venda ? Math.round(summary.mediaM2Venda * 0.97) : 6800 },
                                { mes: 'Dez/25', valor: summary?.mediaM2Venda ? Math.round(summary.mediaM2Venda * 0.99) : 6900 },
                                { mes: 'Jan/26', valor: summary?.mediaM2Venda || 7000 },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="mes" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#9ca3af" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}/m²`, 'Preço Médio']}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                labelStyle={{ color: '#fff' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="valor"
                                stroke="#a855f7"
                                strokeWidth={3}
                                dot={{ fill: '#a855f7', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 8, fill: '#c084fc' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <p className="text-slate-500 text-xs mt-4 flex items-center gap-1">
                    {priceSnapshots.length > 0
                        ? `📊 Dados reais de ${priceSnapshots.length} mês(es) capturados. Execute a função capture_price_snapshot() mensalmente para atualizar.`
                        : '💡 Dados simulados. Execute o SQL price_snapshots.sql no Supabase para capturar dados reais.'
                    }
                </p>
            </div>

            {/* Rankings Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Mais Caros */}
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <TrendingUp className="text-red-400" size={20} />
                        Top 5 Bairros Mais Caros (Venda)
                    </h3>
                    <div className="space-y-3">
                        {[...analysis]
                            .filter(a => a.mediaM2Venda)
                            .sort((a, b) => (b.mediaM2Venda || 0) - (a.mediaM2Venda || 0))
                            .slice(0, 5)
                            .map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-500 text-black' :
                                            idx === 1 ? 'bg-slate-400 text-black' :
                                                idx === 2 ? 'bg-amber-700 text-white' :
                                                    'bg-slate-700 text-white'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-white font-medium">{item.bairro}</p>
                                            <p className="text-slate-500 text-xs">{item.cidade}</p>
                                        </div>
                                    </div>
                                    <span className="text-emerald-400 font-bold">{formatarMoeda(item.mediaM2Venda)}/m²</span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Top 5 Mais Baratos */}
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <TrendingDown className="text-green-400" size={20} />
                        Top 5 Bairros Mais Acessíveis (Venda)
                    </h3>
                    <div className="space-y-3">
                        {[...analysis]
                            .filter(a => a.mediaM2Venda)
                            .sort((a, b) => (a.mediaM2Venda || 0) - (b.mediaM2Venda || 0))
                            .slice(0, 5)
                            .map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-green-500 text-black' :
                                            idx === 1 ? 'bg-green-600 text-white' :
                                                idx === 2 ? 'bg-green-700 text-white' :
                                                    'bg-slate-700 text-white'
                                            }`}>
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-white font-medium">{item.bairro}</p>
                                            <p className="text-slate-500 text-xs">{item.cidade}</p>
                                        </div>
                                    </div>
                                    <span className="text-emerald-400 font-bold">{formatarMoeda(item.mediaM2Venda)}/m²</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketStudyPage;
