import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { PropertyCard } from '../components/PropertyCard';
import { CHART_DATA } from '../constants';
import { Plus, Edit2, Trash2, CheckCircle, ArrowUp, Loader2, Bed, Bath, Square, MapPin, Share2, ExternalLink, Home, Handshake, Building2, Users, Eye } from 'lucide-react';
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
                .eq('user_id', user.id);

            // Count available partnerships (properties accepting partnerships in my state, excluding mine)
            const { data: userProfile } = await supabase
                .from('perfis')
                .select('uf')
                .eq('id', user.id)
                .single();

            let availableCount = 0;
            if (userProfile?.uf) {
                const { count } = await supabase
                    .from('anuncios')
                    .select('*', { count: 'exact', head: true })
                    .eq('uf', userProfile.uf)
                    .neq('user_id', user.id)
                    .eq('status', 'ativo')
                    .eq('aceita_parceria', true);
                availableCount = count || 0;
            }

            setStats({
                properties: propCount || 0,
                leads: leadCount || 0,
                messages: msgCount || 0,
                acceptedPartnerships: acceptedCount || 0,
                availablePartnerships: availableCount
            });

            // Fetch recent properties - ONLY for current user
            const { data: props } = await supabase
                .from('anuncios')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (props) setRecentProperties(props);

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
                        <h2 className="text-2xl md:text-3xl font-bold text-white">Bem-vindo(a) de volta, {userName}!</h2>
                        {role?.toLowerCase() === 'admin' ? <p className="text-slate-400 mt-2 text-sm md:text-base">Acompanhe o crescimento da Plataforma.</p> : <p className="text-slate-400 mt-2 text-sm md:text-base">Vamos melhorar seus números e ampliar sua possibilidade de ganhos?</p>}
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
                    {/* Stats Grid */}
                    {/* Public Page URL Display - Enhanced */}
                    {user && (
                        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-gradient-to-r from-primary-50 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl border border-primary-100 border-primary-900/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-3xl blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                            <div className="flex-1 min-w-0 z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-primary-100 bg-primary-900/30 rounded-3xl text-primary-600 text-primary-400">
                                        <Home size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-200 uppercase tracking-wide">Endereço da Sua Página</p>
                                </div>
                                <div className="bg-white/50 dark:bg-black/20 rounded-3xl p-2 border border-slate-700/50 backdrop-blur-sm">
                                    <p className="text-base md:text-lg font-mono font-bold text-primary-700 text-primary-400 truncate select-all">
                                        {window.location.origin}/{userSlug || 'configurar-slug'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 z-10 w-full md:w-auto">
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/${userSlug || 'configurar-slug'}`;
                                        navigator.clipboard.writeText(url);
                                        addToast('Link colado na sua área de transferência! 📋', 'success');
                                    }}
                                    className="flex-1 md:flex-none px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-full shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    title="Copiar Link"
                                >
                                    <Share2 size={20} />
                                    <span>Copiar</span>
                                </button>
                                <button
                                    onClick={() => window.open(`/${userSlug || 'configurar-slug'}`, '_blank')}
                                    className="px-4 py-3 bg-slate-800 border-2 border-primary-100 border-slate-600 text-primary-600 text-slate-300 font-bold rounded-full hover:bg-primary-50 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    title="Visitar Página"
                                >
                                    <Eye size={20} />
                                    <span>Ver Página</span>
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                        {/* Meus Imóveis */}
                        <div
                            onClick={() => navigate('/properties')}
                            className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <Home size={24} className="text-blue-600 text-blue-400" />
                                </div>
                                <span className="text-xs text-green-600 text-green-400 font-medium">+12.5%</span>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium mb-1">Meus Imóveis</h3>
                            <div className="text-3xl font-bold text-white">{stats.properties}</div>
                        </div>

                        {/* Imóveis em Parceria (Accepted) */}
                        <div
                            onClick={() => navigate('/partner-properties')}
                            className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-emerald-100 bg-emerald-900/30 rounded-full flex items-center justify-center">
                                    <Handshake size={24} className="text-emerald-600 text-emerald-400" />
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
                                <div className="w-12 h-12 bg-purple-100 bg-purple-900/30 rounded-full flex items-center justify-center">
                                    <Building2 size={24} className="text-purple-600 text-purple-400" />
                                </div>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium mb-1">Parcerias Disponíveis</h3>
                            <div className="text-3xl font-bold text-white">{stats.availablePartnerships || 0}</div>
                        </div>

                        {/* Leads */}
                        <div
                            onClick={() => navigate('/leads')}
                            className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-amber-100 bg-amber-900/30 rounded-full flex items-center justify-center">
                                    <Users size={24} className="text-amber-600 text-amber-400" />
                                </div>
                                <span className="text-xs text-red-600 text-red-400 font-medium">-3.1%</span>
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium mb-1">Leads</h3>
                            <div className="text-3xl font-bold text-white">{stats.leads}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div
                                    className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 cursor-pointer hover:shadow-md transition-all group"
                                    onClick={() => navigate('/add-property')}
                                >
                                    <div className="w-12 h-12 bg-primary-100 bg-primary-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Plus size={24} className="text-primary-600 text-primary-400" />
                                    </div>
                                    <h4 className="font-bold text-white mb-1">Anunciar Imóvel</h4>
                                    <p className="text-sm text-slate-400">Cadastre um novo imóvel para venda, locação ou ambos.</p>
                                </div>

                                <div
                                    className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 cursor-pointer hover:shadow-md transition-all group"
                                    onClick={() => navigate('/leads')}
                                >
                                    <div className="w-12 h-12 bg-purple-100 bg-purple-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <CheckCircle size={24} className="text-purple-600 text-purple-400" />
                                    </div>
                                    <h4 className="font-bold text-white mb-1">Gerenciar Leads</h4>
                                    <p className="text-sm text-slate-400">Visualize seus leads no funil de vendas.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-700 h-full">
                                    <h3 className="text-lg font-bold text-white mb-4">Notificações Recentes</h3>
                                    <div className="space-y-4">
                                        {notifications.length === 0 ? (
                                            <p className="text-gray-500 text-sm text-center py-8">Nenhuma notificação recente.</p>
                                        ) : (
                                            notifications.map(notif => (
                                                <div key={notif.id} className="flex space-x-3 pb-3 border-b border-slate-700 last:border-0 last:pb-0">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                        <CheckCircle className="text-blue-600 text-blue-400 w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-200 font-medium">{notif.titulo}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.mensagem}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <button className="w-full mt-4 text-center text-sm text-primary-500 hover:text-primary-600 font-medium">
                                        Ver Todas
                                    </button>
                                </div>
                            </div>
                        </div>
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
