import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from './ThemeContext';
import { Bell, Send } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { MessagesDrawer } from './MessagesDrawer';
import { TrialBanner } from './TrialBanner';
import { AIAssistant } from './AIAssistant';
import { PublicAIAssistant } from './PublicAIAssistant';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

export const DashboardLayout: React.FC = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMessages, setShowMessages] = useState(false);

    // Open chat from URL
    useEffect(() => {
        const chatId = searchParams.get('openChat');
        if (chatId) {
            setShowMessages(true);
        }
    }, [searchParams]);

    const notifRef = useRef<HTMLDivElement>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Subscribe to new notifications
            const subscription = supabase
                .channel('notificacoes')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` }, payload => {
                    setNotifications(prev => [payload.new, ...prev]);
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data } = await supabase
                .from('notificacoes')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notificacoes')
                .update({ lida: true })
                .eq('user_id', user?.id)
                .eq('lida', false);

            if (!error) {
                setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.lida).length;

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Extract page title from path
    const getTitle = () => {
        const path = location.pathname.substring(1);
        if (!path) return 'Dashboard';
        // Handle dynamic routes or complex paths simply
        const base = path.split('/')[0];
        if (base === 'add-property') return ''; // Hide title, form has its own
        if (base === 'properties') return 'Meus Imóveis';
        if (base === 'leads') return 'Meus Leads';
        if (base === 'settings') return 'Configurações';
        if (base === 'partner-properties') return 'Parcerias';

        return base.charAt(0).toUpperCase() + base.slice(1);
    };

    return (
        <div className="min-h-screen bg-gray-50 bg-midnight-950 transition-colors duration-200 flex">
            {/* Mobile hamburger */}
            <button className="bg-emerald-500 bg-emerald-600 rounded-full md:hidden p-2 fixed top-6 left-6 z-[60] shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform animate-pulse" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content area with margin to account for fixed sidebar */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-64">
                {/* Topbar - Increased Z-Index */}
                <header className="bg-slate-800 border-b border-slate-700 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-[50]">
                    <div className="flex items-center">
                        <h1 className="p-14 text-xl font-bold text-white truncate">
                            {getTitle()}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-4">


                        {/* Messages Button */}
                        <button
                            onClick={() => setShowMessages(true)}
                            className="p-2 rounded-full bg-blue-50 bg-blue-900/30 text-blue-600 text-blue-400 hover:bg-blue-100 hover:bg-blue-900/50 shadow-sm transition-colors relative"
                            title="Mensagens"
                        >
                            <Send size={20} />
                            {/* Optional: unread count badge */}
                        </button>

                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 rounded-full bg-slate-800 text-gray-300 hover:bg-slate-700 shadow-sm transition-colors relative ${showNotifications ? 'ring-2 ring-primary-500' : ''}`}
                            >
                                <Bell size={20} />
                                {notifications.some(n => !n.lida) && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white border-slate-800"></span>
                                )}
                            </button>

                            {showNotifications && (
                                <NotificationDropdown
                                    notifications={notifications}
                                    onMarkAsRead={markAllAsRead}
                                    onClose={() => setShowNotifications(false)}
                                />
                            )}
                        </div>
                    </div>
                </header>

                <MessagesDrawer
                    isOpen={showMessages}
                    onClose={() => setShowMessages(false)}
                    initialChatId={searchParams.get('openChat')}
                />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900 scroll-smooth">
                    <TrialBanner />
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export const PublicLayout: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [brokerLogo, setBrokerLogo] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if we're on a broker page
    const isBrokerPage = location.pathname.startsWith('/corretor/');
    const brokerSlug = isBrokerPage ? location.pathname.split('/corretor/')[1] : null;

    useEffect(() => {
        const fetchBrokerLogo = async () => {
            if (!brokerSlug) {
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('perfis')
                    .select('watermark_light, watermark_dark, marca_dagua')
                    .eq('slug', brokerSlug)
                    .single();

                if (!error && data) {
                    // Start with specific theme logo
                    let logo = theme === 'light' ? data.watermark_light : data.watermark_dark;

                    // Fallback 1: Try marca_dagua (often white/transparent, good for dark mode, risky for light)
                    if (!logo && theme === 'dark') logo = data.marca_dagua;

                    // Fallback 2: Try the other theme's logo
                    if (!logo) logo = theme === 'light' ? data.watermark_dark : data.watermark_light;

                    // Fallback 3: Try marca_dagua for light mode as last resort
                    if (!logo) logo = data.marca_dagua;

                    setBrokerLogo(logo || null);
                }
            } catch (error) {
                console.error('Error fetching broker logo:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBrokerLogo();
    }, [brokerSlug, theme]);

    return (
        <div className="min-h-screen bg-gray-50 bg-midnight-950 text-white overflow-x-hidden">
            {!isBrokerPage && (
                <nav className="border-b border-slate-800 px-6 py-4 flex justify-between items-center fixed top-0 w-full bg-midnight-950/90 backdrop-blur-md z-50 transition-all duration-300">
                    {/* Logo - Conditional: Broker or Platform */}
                    {isBrokerPage && brokerLogo ? (
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href = `#/corretor/${brokerSlug}`}>
                            <img src={brokerLogo} alt="Corretor" className="h-10 w-auto" />
                        </div>
                    ) : (
                        <>
                            <div className="hidden dark:block cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                                <img src="/logos/izibrokerz-escuro.png" alt="iziBrokerz" className="h-10 w-auto" />
                            </div>
                            <div className="block dark:hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                                <img src="/logos/izibrokerz-claro.png" alt="iziBrokerz" className="h-10 w-auto" />
                            </div>
                        </>
                    )}

                    {/* Desktop Menu - Conditional based on broker page */}
                    <div className="hidden md:flex items-center space-x-8 font-medium">
                        {isBrokerPage ? (
                            <>
                                <a href={`#/corretor/${brokerSlug}`} className="hover:text-primary-500">Início</a>
                                <a href={`#/search?broker=${brokerSlug}`} className="hover:text-primary-500">Buscar Imóveis</a>
                            </>
                        ) : (
                            <>
                                <a href="#/" className="hover:text-primary-500">Início</a>
                                <a href="#/search" className="hover:text-primary-500">Buscar Imóveis</a>
                                <a href="#/partner" className="hover:text-primary-500">Anunciar</a>
                                <a href="#/about" className="hover:text-primary-500">Sobre</a>
                            </>
                        )}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        <a href="#/login" className="hidden md:block px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors font-medium">
                            ENTRAR/CADASTRAR
                        </a>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 hover:bg-slate-800 rounded-full animate-pulse"
                        >
                            {mobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </nav>
            )}

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed top-[73px] w-auto right-0 bg-midnight-950/90 border-b border-slate-800 z-40 shadow-lg rounded-bl-3xl">
                    <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                        {isBrokerPage ? (
                            <>
                                <a href={`#/corretor/${brokerSlug}`} className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Início</a>
                                <a href={`#/search?broker=${brokerSlug}`} className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Buscar Imóveis</a>
                            </>
                        ) : (
                            <>
                                <a href="#/" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Início</a>
                                <a href="#/search" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Buscar Imóveis</a>
                                <a href="#/partner" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Anunciar</a>
                                <a href="#/about" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
                            </>
                        )}
                        <a href="#/login" className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors font-bold text-center">
                            ENTRAR/CADASTRAR
                        </a>
                    </div>
                </div>
            )}

            {/* Persistence for Public Chat */}
            <PublicAIAssistant />

            <div className={!isBrokerPage ? "pt-[73px]" : ""}>
                <Outlet />
            </div>
        </div>
    )
}