"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard, Building2, Settings, LogOut, Users, X, Handshake,
    CreditCard, Ticket, DollarSign, CheckCircle, Search, Heart,
    User as UserIcon, Home, Globe, Menu
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, role, signOut } = useAuth();
    const [profile, setProfile] = useState<{ name: string; email: string; avatar: string }>({
        name: '',
        email: '',
        avatar: ''
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data } = await supabase
                .from('perfis')
                .select('nome, email, avatar')
                .eq('id', user?.id)
                .single();

            if (data) {
                setProfile({
                    name: data.nome || user?.user_metadata?.name || 'Usuário',
                    email: data.email || user?.email || '',
                    avatar: data.avatar || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${data.nome || 'User'}`
                });
            } else {
                setProfile({
                    name: user?.user_metadata?.name || 'Usuário',
                    email: user?.email || '',
                    avatar: user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}`
                });
            }
        } catch (error) {
            console.error('Erro ao buscar perfil sidebar:', error);
        }
    };

    const handleNavigation = (path: string) => {
        router.push(path);
        onClose();
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path;

    const isAdmin = role === 'Admin' || role === 'admin';
    const isClient = role === 'Cliente';

    const navItems = isAdmin ? [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Mercado', icon: Globe, path: '/search' },
        { label: 'Aprovar Anúncios', icon: CheckCircle, path: '/admin/approvals' },
        { label: 'Planos', icon: CreditCard, path: '/admin/plans' },
        { label: 'Config Trial', icon: Settings, path: '/admin/trial-settings' },
        { label: 'Cupons', icon: Ticket, path: '/admin/coupons' },
        { label: 'Financeiro', icon: DollarSign, path: '/admin/financial' },
        { label: 'Configurações', icon: Settings, path: '/dashboard/settings' },
    ] : isClient ? [
        { label: 'Início', icon: Home, path: '/dashboard' },
        { label: 'Buscar Imóveis', icon: Search, path: '/search' },
        { label: 'Favoritos', icon: Heart, path: '/dashboard/favorites' },
        { label: 'Meu Perfil', icon: UserIcon, path: '/dashboard/settings' },
    ] : [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Mercado', icon: Globe, path: '/search' },
        { label: 'Meus Imóveis', icon: Building2, path: '/dashboard/properties' },
        { label: 'Imóveis Parceiros', icon: Handshake, path: '/dashboard/partner-properties' },
        { label: 'Leads (CRM)', icon: Users, path: '/dashboard/leads' },
        { label: 'Configurações', icon: Settings, path: '/dashboard/settings' },
    ];

    return (
        <>
            <div className={`h-screen w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 fixed left-0 top-0 z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                        {profile.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.avatar}
                                alt="User"
                                className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-slate-800 flex items-center justify-center">
                                <span className="text-xs font-bold text-emerald-500">
                                    {profile.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="font-semibold text-sm truncate">{profile.name}</p>
                            <p className="text-xs text-slate-400 truncate w-32">{profile.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-slate-800 text-emerald-400 border-l-4 border-emerald-500'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">SAIR</span>
                    </button>
                </div>
            </div>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 md:hidden z-30"
                    onClick={onClose}
                />
            )}
        </>
    );
};
