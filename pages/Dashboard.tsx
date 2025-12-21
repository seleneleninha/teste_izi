import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { PropertyCard } from '../components/PropertyCard';
import { CHART_DATA } from '../constants';
import { Plus, Edit2, Trash2, CheckCircle, ArrowUp, Loader2, Bed, Bath, Square, MapPin, Share2, ExternalLink, Home, Handshake, Building2, Users, Eye, TrendingUp, Key, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { OnboardingTour } from '../components/OnboardingTour';
import { TourPrompt } from '../components/TourPrompt';
import { ONBOARDING_TOUR_STEPS } from '../config/tourSteps';
import { ClientDashboardView } from '../components/ClientDashboardView';

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
    const [adminStats, setAdminStats] = useState({
        totalUsers: 0,
        totalProperties: 0,
        totalPartnerships: 0,
        activePlans: 0
    });
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
                // Admin X-Ray Fetch
                const { count: userCount } = await supabase.from('perfis').select('*', { count: 'exact', head: true });
                const { count: propCount } = await supabase.from('anuncios').select('*', { count: 'exact', head: true });
                const { count: partCount } = await supabase.from('parcerias').select('*', { count: 'exact', head: true });

                setAdminStats({
                    totalUsers: userCount || 0,
                    totalProperties: propCount || 0,
                    totalPartnerships: partCount || 0,
                    activePlans: 0 // Mock for now
                });
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

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;
    }

    return (
        <div className="pt-6 space-y-8 pb-20 md:pb-0">
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                            Bem-vindo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{userName}</span>! 👋
                        </h2>
                        {role?.toLowerCase() === 'admin' ?
                            <p className="text-slate-400 mt-2 font-medium">Visão Geral do Sistema</p> :
                            <p className="text-slate-400 mt-2 font-medium">Vamos bater as metas hoje?</p>
                        }
                    </div>
                </div>
            </div>

            {/* Admin X-Ray View */}
            {role?.toLowerCase() === 'admin' && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                        Raio-X da Plataforma
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 bg-blue-900/30 rounded-3xl flex items-center justify-center">
                                    <Users size={24} className="text-blue-600 text-blue-400" />
                                </div>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium mb-1">Total Usuários</h3>
                            <div className="text-3xl font-bold text-white">{adminStats.totalUsers}</div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-emerald-100 bg-emerald-900/30 rounded-3xl flex items-center justify-center">
                                    <Home size={24} className="text-emerald-600 text-emerald-400" />
                                </div>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium mb-1">Total Imóveis</h3>
                            <div className="text-3xl font-bold text-white">{adminStats.totalProperties}</div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-purple-100 bg-purple-900/30 rounded-3xl flex items-center justify-center">
                                    <Handshake size={24} className="text-purple-600 text-purple-400" />
                                </div>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium mb-1">Total Parcerias</h3>
                            <div className="text-3xl font-bold text-white">{adminStats.totalPartnerships}</div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-amber-100 bg-amber-900/30 rounded-3xl flex items-center justify-center">
                                    <Building2 size={24} className="text-amber-600 text-amber-400" />
                                </div>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium mb-1">Planos Ativos</h3>
                            <div className="text-3xl font-bold text-white">{adminStats.activePlans}</div>
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
                        <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
                            <div className="flex gap-4 snap-x snap-mandatory">

                                {/* Sua Página - Mobile */}
                                <div className="min-w-[200px] snap-center bg-purple-500/30 p-5 rounded-2xl shadow-lg border border-white active:scale-[0.98] transition-transform animate-pulse">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                            <ExternalLink size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-white text-xs font-bold mb-1">DIVULGUE SUA PÁGINA</h3>
                                    <div className="text-xs font-mono text-slate-400 mb-3 truncate">
                                        {window.location.origin}/{userSlug || 'configurar-slug'}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/${userSlug || 'configurar-slug'}`;
                                                navigator.clipboard.writeText(url);
                                                addToast('Link copiado! 📋', 'success');
                                            }}
                                            className="flex-1 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Share2 size={14} /> Copiar
                                        </button>
                                        <button
                                            onClick={() => window.open(`/${userSlug || 'configurar-slug'}`, '_blank')}
                                            className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Eye size={14} /> Ver
                                        </button>
                                    </div>
                                </div>

                                {/* Anunciar Imóvel - Mobile */}
                                <div
                                    onClick={() => navigate('/add-property')}
                                    className="min-w-[200px] snap-center bg-red-500/30 p-5 rounded-2xl shadow-lg border border-white active:scale-[0.98] transition-transform cursor-pointer animate-pulse"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                            <Plus size={24} className="text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-slate-400 text-sm font-medium mb-1">Expanda sua Carteira</h3>
                                    <div className="text-lg font-bold text-white">Cadastrar Novo Imóvel</div>
                                </div>

                                {/* Meus Imóveis */}
                                <div
                                    onClick={() => navigate('/properties')}
                                    className="min-w-[200px] snap-center bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-slate-700/50 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <Home size={24} className="text-blue-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-slate-400 text-sm font-medium mb-1">Meus Imóveis</h3>
                                    <div className="text-3xl font-bold text-white mb-3">{stats.properties}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {stats.propertiesAtivos > 0 && (
                                            <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                                                <CheckCircle size={12} /> {stats.propertiesAtivos} Ativo(s)
                                            </span>
                                        )}
                                        {stats.propertiesPendentes > 0 && (
                                            <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 flex items-center gap-1">
                                                <Clock size={12} /> {stats.propertiesPendentes} Pendente(s)
                                            </span>
                                        )}
                                        {stats.propertiesReprovados > 0 && (
                                            <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 flex items-center gap-1">
                                                <XCircle size={12} /> {stats.propertiesReprovados} Reprovado(s)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Vendas Fechadas */}
                                <div
                                    onClick={() => navigate('/properties?status=venda_faturada')}
                                    className="min-w-[200px] snap-center bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-slate-700/50 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center">
                                            <TrendingUp size={24} className="text-green-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-slate-400 text-sm font-medium mb-1">Vendas Fechadas</h3>
                                    <div className="text-3xl font-bold text-white">{stats.vendasFechadas}</div>
                                </div>

                                {/* Locações Fechadas */}
                                <div
                                    onClick={() => navigate('/properties?status=locacao_faturada')}
                                    className="min-w-[200px] snap-center bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-slate-700/50 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <Key size={24} className="text-blue-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-slate-400 text-sm font-medium mb-1">Locações Fechadas</h3>
                                    <div className="text-3xl font-bold text-white">{stats.locacoesFechadas}</div>
                                </div>

                                {/* Parcerias Aceitas */}
                                <div
                                    onClick={() => navigate('/partner-properties')}
                                    className="min-w-[200px] snap-center bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-slate-700/50 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center">
                                            <Handshake size={24} className="text-emerald-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-slate-400 text-sm font-medium mb-1">Parcerias Aceitas</h3>
                                    <div className="text-3xl font-bold text-white">{stats.acceptedPartnerships || 0}</div>
                                </div>

                                {/* Parcerias Disponíveis */}
                                <div
                                    onClick={() => navigate('/partner-properties')}
                                    className="min-w-[200px] snap-center bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-slate-700/50 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center">
                                            <Building2 size={24} className="text-purple-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-slate-400 text-sm font-medium mb-1">Parcerias Disponíveis</h3>
                                    <div className="text-3xl font-bold text-white">{stats.availablePartnerships || 0}</div>
                                </div>

                                {/* Gerenciar Leads - Mobile */}
                                <div
                                    onClick={() => navigate('/leads')}
                                    className="min-w-[200px] snap-center bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-slate-700/50 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center">
                                            <CheckCircle size={24} className="text-purple-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-slate-400 text-sm font-medium mb-1">Gerenciar Leads</h3>
                                    <div className="text-lg font-bold text-white">Ver Todos</div>
                                </div>

                            </div>
                        </div>

                        {/* Desktop: Grid */}
                        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">

                            {/* Sua Página - Stat Format */}
                            <div
                                className="bg-purple-500/30 p-6 rounded-3xl shadow-sm border border-white/20 hover:border-purple-400 hover:bg-purple-500/40 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <ExternalLink size={24} className="text-white" />
                                    </div>
                                </div>
                                <h3 className="text-white text-sm font-bold mb-1">DIVULGUE SUA PÁGINA</h3>
                                <div className="text-sm font-mono text-slate-400 mb-4">
                                    {window.location.origin}/{userSlug || 'configurar-slug'}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/${userSlug || 'configurar-slug'}`;
                                            navigator.clipboard.writeText(url);
                                            addToast('Link copiado! 📋', 'success');
                                        }}
                                        className="flex-1 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Share2 size={16} /> Copiar
                                    </button>
                                    <button
                                        onClick={() => window.open(`/${userSlug || 'configurar-slug'}`, '_blank')}
                                        className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} /> Ver
                                    </button>
                                </div>
                            </div>

                            {/* Anunciar Imóvel - Stat Format */}
                            <div
                                className="bg-red-500/30 p-6 rounded-3xl shadow-sm border border-white/20 hover:border-red-400 hover:bg-red-500/40 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                                onClick={() => navigate('/add-property')}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Plus size={24} className="text-white" />
                                    </div>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Expanda sua Carteira</h3>
                                <div className="text-lg font-bold text-white">Cadastrar Novo Imóvel</div>
                            </div>

                            {/* Meus Imóveis */}
                            <div
                                onClick={() => navigate('/properties')}
                                className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:border-blue-500/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center">
                                        <Home size={24} className="text-blue-400" />
                                    </div>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Meus Imóveis</h3>
                                <div className="text-3xl font-bold text-white mb-3">{stats.properties}</div>
                                <div className="flex flex-wrap gap-2">
                                    {stats.propertiesAtivos > 0 && (
                                        <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                                            <CheckCircle size={12} /> {stats.propertiesAtivos} Ativo(s)
                                        </span>
                                    )}
                                    {stats.propertiesPendentes > 0 && (
                                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 flex items-center gap-1">
                                            <Clock size={12} /> {stats.propertiesPendentes} Pendente(s)
                                        </span>
                                    )}
                                    {stats.propertiesReprovados > 0 && (
                                        <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 flex items-center gap-1">
                                            <XCircle size={12} /> {stats.propertiesReprovados} Reprovado(s)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Vendas Fechadas */}
                            <div
                                onClick={() => navigate('/properties?status=venda_faturada')}
                                className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center">
                                        <TrendingUp size={24} className="text-green-400" />
                                    </div>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Vendas Fechadas</h3>
                                <div className="text-3xl font-bold text-white">{stats.vendasFechadas}</div>
                            </div>

                            {/* Locações Fechadas */}
                            <div
                                onClick={() => navigate('/properties?status=locacao_faturada')}
                                className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center">
                                        <Key size={24} className="text-blue-400" />
                                    </div>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Locações Fechadas</h3>
                                <div className="text-3xl font-bold text-white">{stats.locacoesFechadas}</div>
                            </div>

                            {/* Imóveis em Parceria (Accepted) */}
                            <div
                                onClick={() => navigate('/partner-properties')}
                                className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center">
                                        <Handshake size={24} className="text-emerald-400" />
                                    </div>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Parcerias Aceitas</h3>
                                <div className="text-3xl font-bold text-white">{stats.acceptedPartnerships || 0}</div>
                            </div>

                            {/* Imóveis Parceiros (Available) */}
                            <div
                                onClick={() => navigate('/partner-properties')}
                                className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center">
                                        <Building2 size={24} className="text-purple-400" />
                                    </div>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Parcerias Disponíveis</h3>
                                <div className="text-3xl font-bold text-white">{stats.availablePartnerships || 0}</div>
                            </div>

                            {/* Gerenciar Leads - Stat Format */}
                            <div
                                className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => navigate('/leads')}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle size={24} className="text-purple-400" />
                                    </div>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Gerenciar Leads</h3>
                                <div className="text-lg font-bold text-white">Ver Todos</div>
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
    );
};

