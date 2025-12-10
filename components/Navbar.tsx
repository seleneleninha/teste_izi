"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import { Moon, Sun, User, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
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
        router.push('/login');
    };

    // Determine if we are on the home page for specific styling
    const isHomePage = pathname === '/';

    // Logo logic
    // Theme 'dark' -> bg is likely dark -> use light logo (claro)
    // Theme 'light' -> bg is likely light -> use dark logo (escuro)
    // UNLESS we are on Home page and NOT scrolled (Hero section has dark bg) -> use light logo
    const getLogo = () => {
        if (isHomePage && !scrolled) {
            return '/logos/izibrokerz-escuro.png';
        }
        return theme === 'dark'
            ? '/logos/izibrokerz-escuro.png'
            : '/logos/izibrokerz-claro.png';
    };

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg py-3'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
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
                            href="/"
                            className={`font-medium transition-colors ${scrolled
                                ? 'text-gray-700 dark:text-gray-200 hover:text-emerald-500'
                                : 'text-white hover:text-emerald-400'
                                }`}
                        >
                            Início
                        </Link>
                        <Link
                            href="/search"
                            className={`font-medium transition-colors ${scrolled
                                ? 'text-gray-700 dark:text-gray-200 hover:text-emerald-500'
                                : 'text-white hover:text-emerald-400'
                                }`}
                        >
                            Buscar Imóveis
                        </Link>
                        <Link
                            href="/about"
                            className={`font-medium transition-colors ${scrolled
                                ? 'text-gray-700 dark:text-gray-200 hover:text-emerald-500'
                                : 'text-white hover:text-emerald-400'
                                }`}
                        >
                            Sobre
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full transition-colors ${scrolled
                                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                : 'text-white hover:bg-white/20'
                                }`}
                            aria-label="Alternar tema"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        {/* User Actions */}
                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className={`flex items-center gap-2 font-medium px-4 py-2 rounded-full transition-all ${scrolled
                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
                                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                                        }`}
                                >
                                    <User size={18} />
                                    <span>Dashboard</span>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className={`p-2 rounded-full transition-colors ${scrolled
                                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                        : 'text-white/80 hover:bg-white/20 hover:text-red-300'
                                        }`}
                                    title="Sair"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${scrolled
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                                    : 'bg-white text-red-600 hover:bg-gray-100'
                                    }`}
                            >
                                Entrar
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-red-500"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-45 w-52 bg-white dark:bg-slate-900 shadow-xl border-t border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-4">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-right text-gray-700 dark:text-gray-200 font-medium py-2">Início</Link>
                    <Link href="/search" onClick={() => setMobileMenuOpen(false)} className="text-right text-gray-700 dark:text-gray-200 font-medium py-2">Buscar Imóveis</Link>
                    <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-right text-gray-700 dark:text-gray-200 font-medium py-2">Sobre</Link>
                    <hr className="border-gray-100 dark:border-slate-800" />
                    <button onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} className="flex justify-end gap-2 text-gray-700 dark:text-gray-200 font-medium py-2">
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        <span>Alternar Tema</span>

                    </button>
                    {user ? (
                        <>
                            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-emerald-500 font-bold py-2">Meu Painel</Link>
                            <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="text-red-500 font-medium py-2 text-left">Sair</button>
                        </>
                    ) : (
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="bg-emerald-500 text-white text-center font-bold py-3 rounded-lg">Entrar</Link>
                    )}
                </div>
            )}

        </nav>
    );
};
