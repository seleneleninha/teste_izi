import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import { User, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Initial check for scroll
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        // Call once to set initial state
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    // Determine if we are on the home page for specific styling
    const isHomePage = pathname === '/';

    // Logo logic
    // Always use the logo compatible with Dark Mode (previously 'escuro' was used for dark theme in context)
    // We assume 'izibrokerz-escuro.png' is the one that looks good on dark based on previous context logic.
    const getLogo = () => {
        return '/logos/izibrokerz-escuro.png';
    };

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${scrolled
                ? 'bg-midnight-950/80 backdrop-blur-xl shadow-glass border-b border-white/5 py-3'
                : 'bg-midnight-950/60 backdrop-blur-md py-5'
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={getLogo()}
                            alt="iziBrokerz"
                            className="h-10 md:h-12 object-contain transition-transform group-hover:scale-105"
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            to="/"
                            className={`font-medium transition-colors ${scrolled
                                ? 'text-gray-200 hover:text-emerald-400'
                                : 'text-white hover:text-emerald-400'
                                }`}
                        >
                            Início
                        </Link>
                        <Link
                            to="/search"
                            className={`font-medium transition-colors ${scrolled
                                ? 'text-gray-200 hover:text-emerald-400'
                                : 'text-white hover:text-emerald-400'
                                }`}
                        >
                            Buscar Imóveis
                        </Link>
                        <Link
                            to="/about"
                            className={`font-medium transition-colors ${scrolled
                                ? 'text-gray-200 hover:text-emerald-400'
                                : 'text-white hover:text-emerald-400'
                                }`}
                        >
                            Sobre
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* User Actions */}
                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    to="/dashboard"
                                    className={`flex items-center gap-2 font-medium px-4 py-2 rounded-full transition-all ${scrolled
                                        ? 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40'
                                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                                        }`}
                                >
                                    <User size={18} />
                                    <span>Dashboard</span>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className={`p-2 rounded-full transition-colors ${scrolled
                                        ? 'text-red-400 hover:bg-red-900/20'
                                        : 'text-white/80 hover:bg-white/20 hover:text-red-300'
                                        }`}
                                    title="Sair"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${scrolled
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                                    : 'bg-white text-emerald-600 hover:bg-emerald-50'
                                    }`}
                            >
                                Entrar
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-200 hover:text-emerald-400"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-midnight-950 shadow-xl border-t border-white/10 p-4 flex flex-col gap-4">
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-right text-gray-200 font-medium py-2">Início</Link>
                    <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="text-right text-gray-200 font-medium py-2">Buscar Imóveis</Link>
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-right text-gray-200 font-medium py-2">Sobre</Link>
                    <hr className="border-white/10" />

                    {user ? (
                        <>
                            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-emerald-400 font-bold py-2 text-right">Meu Painel</Link>
                            <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="text-red-400 font-medium py-2 text-right w-full">Sair</button>
                        </>
                    ) : (
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="bg-emerald-500 text-white text-center font-bold py-3 rounded-full">Entrar</Link>
                    )}
                </div>
            )}

        </nav>
    );
};
