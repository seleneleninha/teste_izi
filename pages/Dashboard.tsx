import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { PropertyCard } from '../components/PropertyCard';
import { CHART_DATA } from '../constants';
import { Plus, Edit2, Trash2, CheckCircle, ArrowUp, Loader2, Bed, Bath, Square, MapPin, Share2, ExternalLink, Home, Handshake, Building2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { OnboardingTour } from '../components/OnboardingTour';
import { TourPrompt } from '../components/TourPrompt';
import { ONBOARDING_TOUR_STEPS } from '../config/tourSteps';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [userSlug, setUserSlug] = useState('');
    const [stats, setStats] = useState({
        properties: 0,
        leads: 0,
        messages: 0,
        acceptedPartnerships: 0,
        availablePartnerships: 0
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
    }, [user]);

    const fetchData = async () => {
        if (!user) return;

        try {
            // Fetch counts - ONLY for current user
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
                    .eq('status_aprovacao', 'aprovado')
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
            addToast('Tour concluído! Bem-vindo ao iziBrokerz! 🎉', 'success');
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
        <div className="space-y-8 pb-20 md:pb-0">
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Bem-vindo de volta, {userName}!</h2>
                        <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm md:text-base">Aqui está o resumo das suas atividades hoje.</p>
                    </div>

                    {/* Public Page URL Display */}
                    {user && (
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Endereço da Sua Página Pública</p>
                                <p className="text-sm font-mono text-primary-600 dark:text-primary-400 truncate">
                                    {window.location.origin}/#/corretor/{userSlug || 'configurar-slug'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/#/corretor/${userSlug || 'configurar-slug'}`;
                                        navigator.clipboard.writeText(url);
                                        addToast('Link copiado!', 'success');
                                    }}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Copiar Link"
                                >
                                    <Share2 size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button
                                    onClick={() => window.open(`/#/corretor/${userSlug || 'configurar-slug'}`, '_blank')}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Visitar Página"
                                >
                                    <ExternalLink size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid - Redesigned without charts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Meus Imóveis */}
                <div
                    onClick={() => navigate('/properties')}
                    className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Home size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">+12.5%</span>
                    </div>
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">Meus Imóveis</h3>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.properties}</div>
                </div>


                {/* Imóveis em Parceria (Accepted) */}
                <div
                    onClick={() => navigate('/partner-properties')}
                    className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                            <Handshake size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">Parcerias Aceitas</h3>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.acceptedPartnerships || 0}</div>
                </div>


                {/* Imóveis Parceiros (Available) */}
                <div
                    onClick={() => navigate('/partner-properties')}
                    className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Building2 size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">Parcerias Disponíveis</h3>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.availablePartnerships || 0}</div>
                </div>


                {/* Leads */}
                <div
                    onClick={() => navigate('/leads')}
                    className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                            <Users size={24} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">-3.1%</span>
                    </div>
                    <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">Leads</h3>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.leads}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group"
                            onClick={() => navigate('/add-property')}
                        >
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Plus size={24} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Anunciar Imóvel</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Cadastre um novo imóvel para venda, locação ou ambos.</p>
                        </div>

                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group"
                            onClick={() => navigate('/leads')}
                        >
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <CheckCircle size={24} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Gerenciar Leads</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Visualize seus leads no funil de vendas.</p>
                        </div>


                    </div>
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 h-full">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notificações Recentes</h3>
                            <div className="space-y-4">
                                {notifications.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-8">Nenhuma notificação recente.</p>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className="flex space-x-3 pb-3 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="text-blue-600 dark:text-blue-400 w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{notif.titulo}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.descricao}</p>
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
        </div>
    );
};
