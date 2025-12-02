import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from './ThemeContext';
import { Sun, Moon, Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { AIAssistant } from './AIAssistant';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

export const DashboardLayout: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const { user } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
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
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200 flex">
            {/* Mobile hamburger */}
            <button className="md:hidden p-2 fixed top-4 left-4 z-30" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 ml-0 md:ml-64 p-8 overflow-y-auto h-screen relative">
                {/* Top Header */}
                <header className="flex justify-between items-center mb-8">

                    <div className="flex items-center space-x-4 ml-auto">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-sm transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 rounded-full bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-sm transition-colors relative ${showNotifications ? 'ring-2 ring-primary-500' : ''}`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                                )}
                            </button>
                            {showNotifications && (
                                <NotificationDropdown
                                    notifications={notifications}
                                    onClose={() => setShowNotifications(false)}
                                    onMarkAsRead={markAllAsRead}
                                />
                            )}
                        </div>
                    </div>
                </header>

                <Outlet />

                {/* Floating AI Assistant */}
                <AIAssistant />
            </main>
        </div>
    );
};

export const PublicLayout: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white overflow-x-hidden">
            <nav className="border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center fixed top-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-50 transition-all duration-300">
                {/* Logo */}
                <div className="hidden dark:block">
                    <img src="/logos/izibrokerz-escuro.png" alt="iziBrokerz" className="h-10 w-auto" />
                </div>
                <div className="block dark:hidden">
                    <img src="/logos/izibrokerz-claro.png" alt="iziBrokerz" className="h-10 w-auto" />
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8 font-medium">
                    <a href="#/" className="hover:text-primary-500">Início</a>
                    <a href="#/search" className="hover:text-primary-500">Buscar Imóveis</a>
                    <a href="#/partner" className="hover:text-primary-500">Anunciar</a>
                    <a href="#/about" className="hover:text-primary-500">Sobre</a>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center space-x-4">
                    <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <a href="#/login" className="hidden md:block px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium">
                        Entrar
                    </a>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
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

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed top-[73px] left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 z-40 shadow-lg">
                    <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                        <a href="#/" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Início</a>
                        <a href="#/search" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Buscar Imóveis</a>
                        <a href="#/partner" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Anunciar</a>
                        <a href="#/about" className="hover:text-primary-500 py-2" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
                        <a href="#/login" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium text-center">
                            Entrar
                        </a>
                    </div>
                </div>
            )}

            <div className="pt-[73px]">
                <Outlet />
            </div>
        </div>
    )
}