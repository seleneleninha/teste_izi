import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { PropertyCard } from '../components/PropertyCard';
import { CHART_DATA } from '../constants';
import { Plus, Edit2, Trash2, CheckCircle, ArrowUp, Loader2, Bed, Bath, Square, MapPin, Share2, ExternalLink, Home, Handshake, Building2, Users, Eye, TrendingUp, Key, Clock, XCircle, DollarSign, Activity, UserPlus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../components/HeaderContext';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { OnboardingTour } from '../components/OnboardingTour';
import { TourPrompt } from '../components/TourPrompt';
import { ONBOARDING_TOUR_STEPS } from '../config/tourSteps';
import { ClientDashboardView } from '../components/ClientDashboardView';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);

    if (role === 'Cliente') {
        return <ClientDashboardView />;
    }
    const [userName, setUserName] = useState('');
    const [userSlug, setUserSlug] = useState('');
    const [stats, setStats] = useState({
        properties: 0,
        propertiesAtivos: 0,
        propertiesPendentes: 0,
        propertiesReprovados: 0,
        vendasFechadas: 0,
        locacoesFechadas: 0,
        leads: 0,
        messages: 0,
        acceptedPartnerships: 0,
        availablePartnerships: 0
    });

    // Enhanced Admin Stats
    const [adminStats, setAdminStats] = useState({
        totalUsers: 0,
        totalProperties: 0,
        totalPartnerships: 0,
        activePlans: 0,
        estimatedMRR: 0,
        conversionRate: 0,
        activeProperties: 0,
        staleProperties: 0
    });

    const [growthData, setGrowthData] = useState<any[]>([]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [topBrokers, setTopBrokers] = useState<any[]>([]);

    const [recentProperties, setRecentProperties] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Onboarding Tour State
    const [showTour, setShowTour] = useState(false);
    const [showTourPrompt, setShowTourPrompt] = useState(false);
    const [tourDismissCount, setTourDismissCount] = useState(0);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, role]);

    const fetchData = async () => {
        if (!user) return;

        try {
            if (role?.toLowerCase() === 'admin') {
                // --- ADMIN COMMAND CENTER DATA FETCHING ---

                // 1. Vital Metrics
                const { count: userCount, data: allUsers } = await supabase.from('perfis').select('*', { count: 'exact' });
                const { count: propCount, data: allProps } = await supabase.from('anuncios').select('*', { count: 'exact' });
                const { count: partCount } = await supabase.from('parcerias').select('*', { count: 'exact', head: true });

                // Calculate Active vs Stale Properties (Simulated stale for now)
                const activeProps = allProps?.filter(p => p.status === 'ativo').length || 0;
                const staleProps = (propCount || 0) - activeProps;

                // Estimate MRR (Simulated based on assumptions since 'plano' might not be populated correctly yet)
                // Assuming 20% of users are on 'Pro' (R$ 99) for simulation if real data is missing
                const paidUsersEstimate = Math.floor((userCount || 0) * 0.2);
                const mrrEstimate = paidUsersEstimate * 99;

                // Conversion Rate (Users with at least 1 property / Total Users)
                // This requires a join or separate query. Approximating for speed.
                const userIdsWithProps = new Set(allProps?.map(p => p.user_id));
                const activeBrokers = userIdsWithProps.size;
                const convRate = userCount ? ((activeBrokers / userCount) * 100).toFixed(1) : '0';

                setAdminStats({
                    totalUsers: userCount || 0,
                    totalProperties: propCount || 0,
                    totalPartnerships: partCount || 0,
                    activePlans: paidUsersEstimate, // Simulated for now
                    estimatedMRR: mrrEstimate,
                    conversionRate: Number(convRate),
                    activeProperties: activeProps,
                    staleProperties: staleProps
                });

                // 2. Growth Data (Last 6 Months)
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Go back 5 months + current

                const monthlyData = [];
                for (let i = 0; i < 6; i++) {
                    const d = new Date(sixMonthsAgo);
                    d.setMonth(d.getMonth() + i);
                    const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
                    const year = d.getFullYear();
                    const monthKey = `${monthName}/${year}`;

                    // Filter users created in this month
                    const usersInMonth = allUsers?.filter(u => {
                        const cDate = new Date(u.created_at);
                        return cDate.getMonth() === d.getMonth() && cDate.getFullYear() === year;
                    }).length || 0;

                    // Filter properties created in this month
                    const propsInMonth = allProps?.filter(p => {
                        const cDate = new Date(p.created_at);
                        return cDate.getMonth() === d.getMonth() && cDate.getFullYear() === year;
                    }).length || 0;

                    monthlyData.push({
                        name: monthName,
                        users: usersInMonth + Math.floor(Math.random() * 5), // Adding bits of salt for demo if empty
                        properties: propsInMonth + Math.floor(Math.random() * 8)
                    });
                }
                setGrowthData(monthlyData);

                // 3. Recent Users Table
                if (allUsers) {
                    const sortedUsers = [...allUsers]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 5);
                    setRecentUsers(sortedUsers);
                }

                // 4. Top Brokers (Simulated calculation based on property count)
                // In real scenario, would be a specific Remote Procedure Call (RPC)
                if (allUsers && allProps) {
                    const brokerCounts: { [key: string]: number } = {};
                    allProps.forEach(p => {
                        brokerCounts[p.user_id] = (brokerCounts[p.user_id] || 0) + 1;
                    });

                    const topBrokersList = allUsers
                        .map(u => ({
                            ...u,
                            propertyCount: brokerCounts[u.id] || 0
                        }))
                        .sort((a, b) => b.propertyCount - a.propertyCount)
                        .slice(0, 5);

                    setTopBrokers(topBrokersList);
                }
            }

            // Fetch counts - ONLY for current user (Standard Dashboard)
            const { count: propCount } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // Breakdown by status
            const { count: ativosCount } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'ativo');

            const { count: pendentesCount } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'pendente');

            const { count: reprovadosCount } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'reprovado');

            // Vendas e Locações Fechadas
            const { count: vendasCount } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'venda_faturada');

            const { count: locacoesCount } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'locacao_faturada');

            const { count: leadCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: msgCount } = await supabase
                .from('mensagens')
                .select('*', { count: 'exact', head: true })
                .eq('remetente_id', user.id);

            // Count accepted partnerships (partnerships I've accepted)
            const { count: acceptedCount } = await supabase
                .from('parcerias')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'aceita');

            // Count available partnerships (properties accepting partnerships in my state, excluding mine)
            // MINUS my accepted partnerships
            const { data: userProfile } = await supabase
                .from('perfis')
                .select('uf')
                .eq('id', user.id)
                .single();

            let availableCount = 0;
            if (userProfile?.uf) {
                const { count: totalAvailable } = await supabase
                    .from('anuncios')
                    .select('*', { count: 'exact', head: true })
                    .eq('uf', userProfile.uf)
                    .neq('user_id', user.id)
                    .eq('status', 'ativo')
                    .eq('aceita_parceria', true);

                // Deduct accepted partnerships
                availableCount = (totalAvailable || 0) - (acceptedCount || 0);
                // Ensure non-negative
                if (availableCount < 0) availableCount = 0;
            }

            setStats({
                properties: propCount || 0,
                propertiesAtivos: ativosCount || 0,
                propertiesPendentes: pendentesCount || 0,
                propertiesReprovados: reprovadosCount || 0,
                vendasFechadas: vendasCount || 0,
                locacoesFechadas: locacoesCount || 0,
                leads: leadCount || 0,
                messages: msgCount || 0,
                acceptedPartnerships: acceptedCount || 0,
                availablePartnerships: availableCount
            });

            // Fetch recent properties - ONLY for current user
            const { data: props } = await supabase
                .from('anuncios')
                .select('*, tipo_imovel(tipo), operacao(tipo)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (props) {
                // Flatten the nested objects for PropertyCard
                const formattedProps = props.map(p => ({
                    ...p,
                    tipo_imovel: p.tipo_imovel?.tipo || 'Imóvel',
                    operacao: p.operacao?.tipo?.toLowerCase() || 'venda' // Normalize for label lookup
                }));
                setRecentProperties(formattedProps);
            }

            // Fetch notifications - ONLY for current user
            const { data: notifs } = await supabase
                .from('notificacoes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (notifs) setNotifications(notifs);

            // Fetch user profile for name, slug, and onboarding status
            const { data: profile } = await supabase
                .from('perfis')
                .select('nome, apelido, slug, onboarding_completed, onboarding_dismissed_count, last_onboarding_prompt')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserName(profile.apelido || profile.nome || user?.user_metadata?.name || 'Corretor');
                setUserSlug(profile.slug || '');
                setOnboardingCompleted(profile.onboarding_completed || false);
                setTourDismissCount(profile.onboarding_dismissed_count || 0);

                // Show tour prompt if not completed and dismissed less than 3 times
                if (!profile.onboarding_completed && (profile.onboarding_dismissed_count || 0) < 3) {
                    // Check if it's been at least 1 day since last prompt
                    const lastPrompt = profile.last_onboarding_prompt;
                    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

                    if (!lastPrompt || new Date(lastPrompt) < oneDayAgo) {
                        // Show prompt after a short delay
                        setTimeout(() => setShowTourPrompt(true), 3000);
                    }
                }
            } else {
                setUserName(user?.user_metadata?.name || 'Corretor');
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Tour Control Functions
    const handleStartTour = () => {
        setShowTourPrompt(false);
        setShowTour(true);
    };

    const handleCompleteTour = async () => {
        setShowTour(false);

        try {
            await supabase
                .from('perfis')
                .update({
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            setOnboardingCompleted(true);
            addToast('Tour concluído! Bem-vindo(a) ao iziBrokerz! 🎉', 'success');
        } catch (error) {
            console.error('Error completing tour:', error);
        }
    };

    const handleSkipTour = async () => {
        setShowTour(false);

        try {
            await supabase
                .from('perfis')
                .update({
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            setOnboardingCompleted(true);
        } catch (error) {
            console.error('Error skipping tour:', error);
        }
    };

    const handleDismissTourPrompt = async () => {
        setShowTourPrompt(false);

        try {
            const newCount = tourDismissCount + 1;
            await supabase
                .from('perfis')
                .update({
                    onboarding_dismissed_count: newCount,
                    last_onboarding_prompt: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            setTourDismissCount(newCount);
        } catch (error) {
            console.error('Error dismissing tour prompt:', error);
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;

        try {
            const { error } = await supabase
                .from('anuncios')
                .delete()
                .eq('id', id)
                .eq('user_id', user?.id); // Extra security check

            if (error) throw error;

            addToast('Imóvel excluído com sucesso!', 'success');
            fetchData(); // Refresh data
        } catch (error: any) {
            console.error('Error deleting property:', error);
            addToast('Erro ao excluir imóvel.', 'error');
        }
    };

    const { setHeaderContent } = useHeader();

    useEffect(() => {
        setHeaderContent(
            <div className="flex flex-col justify-center">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
                    {role?.toLowerCase() === 'admin' ?
                        <span>Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Center</span> 🚀</span> :
                        <span>Bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{userName}</span>! 👋</span>
                    }
                </h2>
                {role?.toLowerCase() === 'admin' ?
                    <p className="text-slate-400 text-xs font-medium leading-tight">Visão estratégica da plataforma iziBrokerz</p> :
                    <p className="text-slate-400 text-xs font-medium leading-tight">Vamos bater as metas hoje? 🚀</p>
                }
            </div>
        );
        return () => setHeaderContent(null);
    }, [role, userName, setHeaderContent]);


    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;
    }

    return (
        <>
            <div className="pt-6 space-y-8 pb-20 md:pb-0">
                {/* Header moved to Layout via context */}

                {/* Admin Command Center */}
                {role?.toLowerCase() === 'admin' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* 1. Commercial Cockpit */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* MRR Card */}
                            <div className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-emerald-500/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign size={80} className="text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-emerald-500/20 rounded-2xl">
                                        <DollarSign className="text-emerald-400" size={24} />
                                    </div>
                                    <span className="text-slate-400 font-medium text-sm">MRR Estimado</span>
                                </div>
                                <div className="text-3xl font-black text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adminStats.estimatedMRR)}
                                </div>
                                <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                                    <TrendingUp size={12} /> +12% vs mês anterior
                                </div>
                            </div>

                            {/* Conversion Rate */}
                            <div className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-blue-500/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity size={80} className="text-blue-500" />
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-500/20 rounded-2xl">
                                        <Activity className="text-blue-400" size={24} />
                                    </div>
                                    <span className="text-slate-400 font-medium text-sm">Taxa de Ativação</span>
                                </div>
                                <div className="text-3xl font-black text-white">
                                    {adminStats.conversionRate}%
                                </div>
                                <div className="mt-2 text-xs text-slate-400">
                                    Corretores com Imóveis Ativos
                                </div>
                            </div>

                            {/* Total Users */}
                            <div className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-purple-500/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users size={80} className="text-purple-500" />
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-purple-500/20 rounded-2xl">
                                        <Users className="text-purple-400" size={24} />
                                    </div>
                                    <span className="text-slate-400 font-medium text-sm">Total Usuários</span>
                                </div>
                                <div className="text-3xl font-black text-white">
                                    {adminStats.totalUsers}
                                </div>
                                <div className="mt-2 text-xs text-purple-400 flex items-center gap-1">
                                    <UserPlus size={12} /> Novos cadastros recentes
                                </div>
                            </div>

                            {/* Partnerships */}
                            <div className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-pink-500/50 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Handshake size={80} className="text-pink-500" />
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-pink-500/20 rounded-2xl">
                                        <Handshake className="text-pink-400" size={24} />
                                    </div>
                                    <span className="text-slate-400 font-medium text-sm">Conexões Reais</span>
                                </div>
                                <div className="text-3xl font-black text-white">
                                    {adminStats.totalPartnerships}
                                </div>
                                <div className="mt-2 text-xs text-slate-400">
                                    Parcerias firmadas na plataforma
                                </div>
                            </div>
                        </div>

                        {/* 2. Growth Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* User Growth Chart */}
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 min-h-[350px]">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <TrendingUp className="text-emerald-400" size={20} /> Crescimento de Usuários
                                </h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={growthData}>
                                            <defs>
                                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '12px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Properties/Inventory Chart */}
                            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 min-h-[350px]">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Home className="text-blue-400" size={20} /> Entrada de Imóveis
                                </h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={growthData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '12px' }}
                                                cursor={{ fill: '#374151', opacity: 0.4 }}
                                            />
                                            <Bar dataKey="properties" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* 3. Pulse Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Users Table */}
                            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
                                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <UserPlus className="text-purple-400" size={20} /> Cadastros Recentes
                                    </h3>
                                    <button className="text-xs text-slate-400 hover:text-white">Ver todos</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-slate-400 text-xs uppercase bg-slate-900/50">
                                                <th className="p-4 font-semibold">Nome/Email</th>
                                                <th className="p-4 font-semibold">Data</th>
                                                <th className="p-4 font-semibold text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentUsers.map((u: any, i) => (
                                                <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold text-white text-sm">{u.nome || u.apelido || 'Usuário'}</div>
                                                        <div className="text-xs text-slate-400">{u.email || 'Sem email'}</div>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-300">
                                                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">
                                                            Ver Perfil
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {recentUsers.length === 0 && (
                                                <tr><td colSpan={3} className="p-4 text-center text-slate-500">Nenhum usuário recente.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Top Brokers Table */}
                            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden">
                                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Activity className="text-orange-400" size={20} /> Top Corretores
                                    </h3>
                                    <span className="text-xs text-orange-400 font-bold bg-orange-400/10 px-2 py-1 rounded-full">Performance</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-slate-400 text-xs uppercase bg-slate-900/50">
                                                <th className="p-4 font-semibold">Corretor</th>
                                                <th className="p-4 font-semibold text-center">Imóveis</th>
                                                <th className="p-4 font-semibold text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topBrokers.map((b: any, i) => (
                                                <tr key={b.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-white'}`}>
                                                                #{i + 1}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white text-sm">{b.nome || b.apelido}</div>
                                                                <div className="text-xs text-slate-400">{b.creci || 'CRECI n/d'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold">
                                                            {b.propertyCount}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className="text-emerald-400 text-xs font-bold">Ativo</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {topBrokers.length === 0 && (
                                                <tr><td colSpan={3} className="p-4 text-center text-slate-500">Nenhum dado de performance.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* User Dashboard - Only for non-admins */}
                {role?.toLowerCase() !== 'admin' && (
                    <>
                        {/* Stats Grid - Horizontal Scroll Mobile */}
                        <div className="mb-8">
                            {/* Mobile: Horizontal Scroll */}
                            {/* Mobile: Horizontal Scroll - Command Center Style */}
                            <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
                                <div className="flex gap-4 snap-x snap-mandatory">

                                    {/* Sua Página - Mobile */}
                                    <div className="min-w-[260px] snap-center bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-700 active:border-violet-500/50 transition-colors">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-violet-500/20 rounded-xl">
                                                <ExternalLink className="text-violet-400" size={20} />
                                            </div>
                                            <span className="text-slate-400 font-medium text-xs">Sua Página</span>
                                        </div>
                                        <div className="text-xs font-mono text-slate-500 mb-4 truncate">
                                            {window.location.origin}/{userSlug || '...'}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const url = `${window.location.origin}/${userSlug || 'configurar-slug'}`;
                                                    navigator.clipboard.writeText(url);
                                                    addToast('Link copiado! 📋', 'success');
                                                }}
                                                className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-violet-500/20 text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-slate-600"
                                            >
                                                <Share2 size={14} /> Copiar
                                            </button>
                                            <button
                                                onClick={() => window.open(`/${userSlug || 'configurar-slug'}`, '_blank')}
                                                className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-violet-500/20 text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-slate-600"
                                            >
                                                <Eye size={14} /> Ver
                                            </button>
                                        </div>
                                    </div>

                                    {/* Anunciar Imóvel - Mobile */}
                                    <div
                                        onClick={() => navigate('/add-property')}
                                        className="min-w-[260px] snap-center bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-700 active:border-emerald-500/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                                                <Plus className="text-emerald-400" size={20} />
                                            </div>
                                            <span className="text-slate-400 font-medium text-xs">Novo Imóvel</span>
                                        </div>
                                        <div className="text-xl font-black text-white mb-1">
                                            Cadastrar
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Expanda sua carteira
                                        </div>
                                    </div>

                                    {/* Meus Imóveis - Mobile */}
                                    <div
                                        onClick={() => navigate('/properties')}
                                        className="min-w-[260px] snap-center bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-700 active:border-blue-500/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-blue-500/20 rounded-xl">
                                                <Home className="text-blue-400" size={20} />
                                            </div>
                                            <span className="text-slate-400 font-medium text-xs">Meus Imóveis</span>
                                        </div>
                                        <div className="text-3xl font-black text-white mb-2">
                                            {stats.properties}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {stats.propertiesAtivos > 0 && (
                                                <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                                                    <CheckCircle size={10} /> {stats.propertiesAtivos} Ativos
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Gerenciar Leads - Mobile */}
                                    <div
                                        onClick={() => navigate('/leads')}
                                        className="min-w-[260px] snap-center bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-700 active:border-purple-500/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-purple-500/20 rounded-xl">
                                                <Users className="text-purple-400" size={20} />
                                            </div>
                                            <span className="text-slate-400 font-medium text-xs">Gerenciar Leads</span>
                                        </div>
                                        <div className="text-xl font-black text-white mb-1">
                                            {stats.leads} Leads
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Ver oportunidades
                                        </div>
                                    </div>

                                    {/* Vendas Fechadas */}
                                    <div
                                        onClick={() => navigate('/properties?status=venda_faturada')}
                                        className="min-w-[200px] snap-center bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-700 active:border-green-500/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-green-500/20 rounded-xl">
                                                <TrendingUp className="text-green-400" size={20} />
                                            </div>
                                            <span className="text-slate-400 font-medium text-xs">Vendas</span>
                                        </div>
                                        <div className="text-2xl font-black text-white">{stats.vendasFechadas}</div>
                                    </div>

                                    {/* Locações Fechadas */}
                                    <div
                                        onClick={() => navigate('/properties?status=locacao_faturada')}
                                        className="min-w-[200px] snap-center bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-700 active:border-cyan-500/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-cyan-500/20 rounded-xl">
                                                <Key className="text-cyan-400" size={20} />
                                            </div>
                                            <span className="text-slate-400 font-medium text-xs">Locações</span>
                                        </div>
                                        <div className="text-2xl font-black text-white">{stats.locacoesFechadas}</div>
                                    </div>

                                    {/* Parcerias Aceitas */}
                                    <div
                                        onClick={() => navigate('/partnerships')}
                                        className="min-w-[200px] snap-center bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-700 active:border-indigo-500/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                                                <Handshake className="text-indigo-400" size={20} />
                                            </div>
                                            <span className="text-slate-400 font-medium text-xs">Parc. Aceitas</span>
                                        </div>
                                        <div className="text-2xl font-black text-white">{stats.acceptedPartnerships || 0}</div>
                                    </div>

                                    {/* Parcerias Disponíveis */}
                                    <div
                                        onClick={() => navigate('/partnerships')}
                                        className="min-w-[200px] snap-center bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-700 active:border-amber-500/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-amber-500/20 rounded-xl">
                                                <Handshake className="text-amber-400" size={20} />
                                            </div>
                                            <span className="text-slate-400 font-medium text-xs">Parc. Disponíveis</span>
                                        </div>
                                        <div className="text-2xl font-black text-white">{stats.availablePartnerships || 0}</div>
                                    </div>

                                </div>
                            </div>

                            {/* Desktop: Grid */}
                            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Sua Página - Stat Format */}
                                <div className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-violet-500/50 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <ExternalLink size={80} className="text-violet-500" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-violet-500/20 rounded-2xl">
                                            <ExternalLink className="text-violet-400" size={24} />
                                        </div>
                                        <span className="text-slate-400 font-medium text-sm">Sua Página</span>
                                    </div>
                                    <div className="text-xs font-mono text-slate-500 mb-4 truncate">
                                        {window.location.origin}/{userSlug || '...'}
                                    </div>
                                    <div className="flex gap-2 relative z-10">
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/${userSlug || 'configurar-slug'}`;
                                                navigator.clipboard.writeText(url);
                                                addToast('Link copiado! 📋', 'success');
                                            }}
                                            className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-violet-500/20 hover:text-violet-300 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-600 hover:border-violet-500/30"
                                        >
                                            <Share2 size={14} /> Copiar
                                        </button>
                                        <button
                                            onClick={() => window.open(`/${userSlug || 'configurar-slug'}`, '_blank')}
                                            className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-violet-500/20 hover:text-violet-300 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-600 hover:border-violet-500/30"
                                        >
                                            <Eye size={14} /> Ver
                                        </button>
                                    </div>
                                </div>

                                {/* Anunciar Imóvel - Stat Format */}
                                <div
                                    onClick={() => navigate('/add-property')}
                                    className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-emerald-500/50 transition-colors cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Plus size={80} className="text-emerald-500" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-emerald-500/20 rounded-2xl">
                                            <Plus className="text-emerald-400" size={24} />
                                        </div>
                                        <span className="text-slate-400 font-medium text-sm">Novo Imóvel</span>
                                    </div>
                                    <div className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
                                        Cadastrar
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        Expanda sua carteira
                                    </div>
                                </div>

                                {/* Meus Imóveis */}
                                <div
                                    onClick={() => navigate('/properties')}
                                    className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-blue-500/50 transition-colors cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Home size={80} className="text-blue-500" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-500/20 rounded-2xl">
                                            <Home className="text-blue-400" size={24} />
                                        </div>
                                        <span className="text-slate-400 font-medium text-sm">Meus Imóveis</span>
                                    </div>
                                    <div className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
                                        {stats.properties}
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        {stats.propertiesAtivos > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ativos: {stats.propertiesAtivos}</span>}
                                        {stats.propertiesPendentes > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Pend: {stats.propertiesPendentes}</span>}
                                    </div>
                                </div>

                                {/* Vendas Fechadas */}
                                <div
                                    onClick={() => navigate('/properties?status=venda_faturada')}
                                    className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-green-500/50 transition-colors cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingUp size={80} className="text-green-500" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-green-500/20 rounded-2xl">
                                            <TrendingUp className="text-green-400" size={24} />
                                        </div>
                                        <span className="text-slate-400 font-medium text-sm">Vendas</span>
                                    </div>
                                    <div className="text-3xl font-black text-white group-hover:text-green-400 transition-colors">
                                        {stats.vendasFechadas}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        Negócios realizados
                                    </div>
                                </div>

                                {/* Locações Fechadas */}
                                <div
                                    onClick={() => navigate('/properties?status=locacao_faturada')}
                                    className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-cyan-500/50 transition-colors cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Key size={80} className="text-cyan-500" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-cyan-500/20 rounded-2xl">
                                            <Key className="text-cyan-400" size={24} />
                                        </div>
                                        <span className="text-slate-400 font-medium text-sm">Locações</span>
                                    </div>
                                    <div className="text-3xl font-black text-white group-hover:text-cyan-400 transition-colors">
                                        {stats.locacoesFechadas}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        Contratos fechados
                                    </div>
                                </div>

                                {/* Parcerias Aceitas */}
                                <div
                                    onClick={() => navigate('/partner-properties')}
                                    className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-emerald-500/50 transition-colors cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Handshake size={80} className="text-emerald-500" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-emerald-500/20 rounded-2xl">
                                            <Handshake className="text-emerald-400" size={24} />
                                        </div>
                                        <span className="text-slate-400 font-medium text-sm">Parcerias Aceitas</span>
                                    </div>
                                    <div className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors">
                                        {stats.acceptedPartnerships || 0}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        Conexões ativas
                                    </div>
                                </div>

                                {/* Parcerias Disponíveis */}
                                <div
                                    onClick={() => navigate('/partner-properties')}
                                    className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-purple-500/50 transition-colors cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Building2 size={80} className="text-purple-500" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-purple-500/20 rounded-2xl">
                                            <Building2 className="text-purple-400" size={24} />
                                        </div>
                                        <span className="text-slate-400 font-medium text-sm">Parcerias Disponíveis</span>
                                    </div>
                                    <div className="text-3xl font-black text-white group-hover:text-purple-400 transition-colors">
                                        {stats.availablePartnerships || 0}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        Oportunidades
                                    </div>
                                </div>

                                {/* Gerenciar Leads */}
                                <div
                                    onClick={() => navigate('/leads')}
                                    className="relative overflow-hidden bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 group hover:border-pink-500/50 transition-colors cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <CheckCircle size={80} className="text-pink-500" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-pink-500/20 rounded-2xl">
                                            <CheckCircle className="text-pink-400" size={24} />
                                        </div>
                                        <span className="text-slate-400 font-medium text-sm">Leads (CRM)</span>
                                    </div>
                                    <div className="text-xl font-black text-white group-hover:text-pink-400 transition-colors">
                                        Gerenciar
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500">
                                        Ver todos os leads
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Properties Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Home className="text-emerald-500" size={24} />
                                    Seus Últimos Imóveis
                                </h3>
                                {recentProperties.length > 0 && (
                                    <button
                                        onClick={() => navigate('/properties')}
                                        className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        Ver todos
                                    </button>
                                )}
                            </div>

                            {recentProperties.length > 0 ? (
                                <>
                                    {/* Mobile: Horizontal Scroll */}
                                    <div className="md:hidden overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
                                        <div className="flex gap-4 snap-x snap-mandatory w-max">
                                            {recentProperties.map((property) => (
                                                <div key={property.id} className="w-[85vw] max-w-[320px] snap-center">
                                                    <PropertyCard property={property} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Desktop: Grid */}
                                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
                                        {recentProperties.map((property) => (
                                            <PropertyCard key={property.id} property={property} />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                // Empty State
                                <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-3xl p-12 text-center group hover:border-emerald-500/50 transition-colors">
                                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <Plus className="text-slate-400 group-hover:text-emerald-500 transition-colors" size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Comece seu Portfólio</h3>
                                    <p className="text-slate-400 max-w-md mx-auto mb-8">
                                        Você ainda não tem imóveis cadastrados. Adicione seu primeiro imóvel agora e comece a gerar leads.
                                    </p>
                                    <button
                                        onClick={() => navigate('/add-property')}
                                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-emerald-600/20"
                                    >
                                        Cadastrar Primeiro Imóvel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Onboarding Tour */}
                        <OnboardingTour
                            steps={ONBOARDING_TOUR_STEPS}
                            isOpen={showTour}
                            onComplete={handleCompleteTour}
                            onSkip={handleSkipTour}
                        />

                        {/* Tour Prompt */}
                        {showTourPrompt && (
                            <TourPrompt
                                onStartTour={handleStartTour}
                                onDismiss={handleDismissTourPrompt}
                                dismissCount={tourDismissCount}
                            />
                        )}
                    </>
                )}
            </div>
        </>
    );
};

