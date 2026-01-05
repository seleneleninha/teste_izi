import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from './ThemeContext';
import { Send } from 'lucide-react';
import { MessagesDrawer } from './MessagesDrawer';
import { TrialBanner } from './TrialBanner';
import { PublicAIAssistant } from './PublicAIAssistant';
import { ConditionalFloatingButton } from './ConditionalFloatingButton';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import { MobileBottomNav } from './MobileBottomNav';
import { useHeader } from './HeaderContext';

export const DashboardLayout: React.FC = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const { user, role } = useAuth();
    const [searchParams] = useSearchParams();
    const [showMessages, setShowMessages] = useState(false);

    // Open chat from URL
    useEffect(() => {
        const chatId = searchParams.get('openChat');
        if (chatId) {
            setShowMessages(true);
        }
    }, [searchParams]);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (user) {
            // Subscription for other things can go here if needed
        }
    }, [user]);

    // Close messages when clicking outside if needed (currently not handled by ref in this snippet)

    // Close drawers when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Add message drawer outside click if needed
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { headerContent } = useHeader();

    // Extract page title from path
    const getTitle = () => {
        if (headerContent) return headerContent;

        const path = location.pathname.substring(1);
        if (!path) return 'Dashboard';
        // Handle dynamic routes or complex paths simply
        const base = path.split('/')[0];
        if (base === 'add-property') return ''; // Hide title, form has its own
        if (base === 'properties') return 'Meus Imóveis';
        if (base === 'myproperties') return 'Meus Imóveis';
        if (base === 'market') return 'Mercado Imobiliário';
        if (base === 'leads') return 'Meus Leads';
        if (base === 'settings') return 'Configurações';
        if (base === 'partner-properties') return 'Parcerias';

        return base.charAt(0).toUpperCase() + base.slice(1);
    };

    return (
        <div className="min-h-screen bg-midnight-950 transition-colors duration-200 flex">
            {/* Sidebar - Hidden on mobile, visible on desktop */}
            <div className="hidden md:block">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main content area with margin to account for fixed sidebar */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-56">
                {/* Topbar - Increased Z-Index */}
                <header className="bg-slate-800 border-b border-slate-700 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-[50]">
                    <div className="flex items-center w-full">
                        <div className="text-xl font-bold text-white truncate w-full">
                            {getTitle()}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 bg-slate-800 pl-4">

                        {/* Tour Button */}
                        <button
                            onClick={() => {
                                // Navigate to dashboard and trigger tour
                                if (typeof window !== 'undefined') {
                                    // Dispatch custom event to trigger tour
                                    window.dispatchEvent(new CustomEvent('startOnboardingTour'));
                                }
                            }}
                            className="p-2 rounded-full bg-slate-800 text-gray-300 hover:bg-slate-700 shadow-sm transition-colors relative group"
                            title="Tour Guiado"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-emerald-400 transition-colors">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                            {/* Pulsing dot - Will be controlled by parent */}
                            <span className="tour-incomplete-indicator absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping hidden"></span>
                            <span className="tour-incomplete-dot absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full hidden"></span>
                        </button>

                        {/* Notifications removed as requested */}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900 scroll-smooth pb-24 md:pb-8">
                    <TrialBanner />
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav isClient={role === 'Cliente'} isAdmin={role === 'Admin' || role === 'admin'} />
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

    // Check if we're on a broker page (new clean URLs)
    // Broker pages: /:slug, /:slug/buscar, /:slug/sobre, /:slug/imovel/:propertySlug
    // Not broker pages: /, /search, /buscar, /imovel/:slug, /partner, /login, /admin/*, etc.

    // Extract first path segment
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0] || '';

    // List of reserved routes that are NOT broker pages
    const fixedRoutes = ['search', 'buscar', 'partner', 'sell', 'login', 'terms', 'privacy', 'about', 'favoritos', 'contact', 'agent', 'v'];
    const isFixedRoute = fixedRoutes.includes(firstSegment);

    const isAdminRoute = location.pathname.startsWith('/admin');
    const isPropertyRoute = location.pathname.startsWith('/imovel/');

    // If it's not a fixed route, admin route, or property route, it's a broker page
    const isBrokerPage = !isFixedRoute && !isAdminRoute && !isPropertyRoute && location.pathname !== '/';


    // Extract broker slug from path (first segment after /)
    const brokerSlug = isBrokerPage && pathSegments[0] ? pathSegments[0] : null;


    useEffect(() => {
        const fetchBrokerLogo = async () => {
            if (!brokerSlug) {
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('perfis')
                    .select('watermark_dark, marca_dagua')
                    .eq('slug', brokerSlug)
                    .single();

                if (!error && data) {
                    // Start with specific theme logo
                    let logo = data.watermark_dark;

                    // Fallback: Try marca_dagua
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
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href = `/${brokerSlug}`}>
                            <img src={brokerLogo} alt="Corretor" className="h-10 w-auto" />
                        </div>
                    ) : (
                        <>
                            <div className="hidden dark:block cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                                <img src="/logos/izibrokerz-escuro2.png" alt="iziBrokerz" className="h-10 w-auto" />
                            </div>
                        </>
                    )}

                    {/* Desktop Menu - Conditional based on broker page */}
                    <div className="hidden md:flex items-center space-x-8 font-medium">
                        {isBrokerPage ? (
                            <>
                                <a href={`/${brokerSlug}`} className="hover:text-primary-500">Início</a>
                                <a href={`/search?broker=${brokerSlug}`} className="hover:text-primary-500">Buscar Imóveis</a>
                            </>
                        ) : (
                            <>
                                <a href="/" className="hover:text-primary-500">Início</a>
                                <a href="/search" className="hover:text-primary-500">Buscar Imóveis</a>
                                <a href="/partner" className="hover:text-primary-500">Anunciar</a>
                                <a href="/about" className="hover:text-primary-500">Sobre</a>
                            </>
                        )}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        <a href="/login" className="hidden md:block px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors font-medium">
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
                                <a href={`/${brokerSlug}`} className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Início</a>
                                <a href={`/search?broker=${brokerSlug}`} className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Buscar Imóveis</a>
                            </>
                        ) : (
                            <>
                                <a href="/" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Início</a>
                                <a href="/search" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Buscar Imóveis</a>
                                <a href="/partner" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Anunciar</a>
                                <a href="/about" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
                            </>
                        )}
                        <a href="/login" className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors font-bold text-center">
                            ENTRAR/CADASTRAR
                        </a>
                    </div>
                </div>
            )}

            {/* Conditional Floating Button based on Broker's Plan */}
            <ConditionalFloatingButton brokerSlug={brokerSlug || undefined} />

            <div className={!isBrokerPage ? "pt-[73px]" : ""}>
                <Outlet />
            </div>
        </div>
    )
}