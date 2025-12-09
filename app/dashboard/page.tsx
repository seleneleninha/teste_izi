"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Home, Building2, Users, Handshake, Eye, Plus,
    TrendingUp, Loader2, ExternalLink, ArrowUp
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';

interface Stats {
    properties: number;
    leads: number;
    acceptedPartnerships: number;
    availablePartnerships: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, role } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [userSlug, setUserSlug] = useState('');
    const [stats, setStats] = useState<Stats>({
        properties: 0,
        leads: 0,
        acceptedPartnerships: 0,
        availablePartnerships: 0
    });
    const [recentProperties, setRecentProperties] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        if (!user) return;

        try {
            // Fetch counts for current user
            const { count: propCount } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: leadCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: acceptedCount } = await supabase
                .from('parcerias')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // Fetch user profile
            const { data: profile } = await supabase
                .from('perfis')
                .select('nome, apelido, slug, uf')
                .eq('id', user.id)
                .single();

            let availableCount = 0;
            if (profile?.uf) {
                const { count } = await supabase
                    .from('anuncios')
                    .select('*', { count: 'exact', head: true })
                    .eq('uf', profile.uf)
                    .neq('user_id', user.id)
                    .eq('status_aprovacao', 'aprovado')
                    .eq('aceita_parceria', true);
                availableCount = count || 0;
            }

            setStats({
                properties: propCount || 0,
                leads: leadCount || 0,
                acceptedPartnerships: acceptedCount || 0,
                availablePartnerships: availableCount
            });

            if (profile) {
                setUserName(profile.apelido || profile.nome || 'Corretor');
                setUserSlug(profile.slug || '');
            }

            // Fetch recent properties
            const { data: props } = await supabase
                .from('anuncios')
                .select(`*, tipo_imovel (tipo), operacao (tipo)`)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(4);

            if (props) {
                setRecentProperties(props.map(p => ({
                    ...p,
                    fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                    operacao: p.operacao?.tipo || p.operacao,
                    tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
                })));
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    // Client view (simplified)
    if (role === 'Cliente') {
        return (
            <div className="p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Olá, {userName}! 👋
                </h1>
                <div className="grid md:grid-cols-2 gap-6">
                    <Link href="/search" className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all group">
                        <Home className="text-emerald-500 mb-4" size={32} />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Buscar Imóveis</h3>
                        <p className="text-gray-500 dark:text-gray-400">Encontre o imóvel ideal para você</p>
                    </Link>
                    <Link href="/dashboard/favorites" className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all group">
                        <TrendingUp className="text-emerald-500 mb-4" size={32} />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Meus Favoritos</h3>
                        <p className="text-gray-500 dark:text-gray-400">Veja os imóveis que você salvou</p>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Olá, {userName}! 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Veja como está seu desempenho hoje
                    </p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <button
                        onClick={() => router.push('/dashboard/add-property')}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg"
                    >
                        <Plus size={20} />
                        Novo Imóvel
                    </button>
                    {userSlug && (
                        <a
                            href={`/corretor/${userSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold flex items-center gap-2 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            <ExternalLink size={20} />
                            Meu Site
                        </a>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                            <Building2 className="text-emerald-500" size={24} />
                        </div>
                        <span className="flex items-center text-emerald-500 text-sm font-semibold">
                            <ArrowUp size={16} />
                            Ativos
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.properties}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Meus Imóveis</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                            <Users className="text-blue-500" size={24} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.leads}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Leads</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                            <Handshake className="text-purple-500" size={24} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.acceptedPartnerships}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Parcerias Aceitas</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                            <Eye className="text-orange-500" size={24} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.availablePartnerships}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Disponíveis</p>
                </div>
            </div>

            {/* Recent Properties */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meus Imóveis Recentes</h2>
                    <Link href="/dashboard/properties" className="text-emerald-500 hover:text-emerald-600 font-medium text-sm">
                        Ver todos →
                    </Link>
                </div>

                {recentProperties.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentProperties.map((prop) => (
                            <div key={prop.id} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-32 bg-gray-200 dark:bg-slate-600 relative">
                                    {prop.fotos.length > 0 ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={prop.fotos[0]} alt={prop.titulo} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Home className="text-gray-400" size={32} />
                                        </div>
                                    )}
                                    <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold text-white ${prop.status_aprovacao === 'aprovado' ? 'bg-emerald-500' :
                                            prop.status_aprovacao === 'pendente' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}>
                                        {prop.status_aprovacao?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{prop.titulo}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{prop.bairro}, {prop.cidade}</p>
                                    <p className="text-sm font-bold text-emerald-500 mt-1">
                                        R$ {(prop.valor_venda || prop.valor_locacao || 0).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Building2 className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Você ainda não cadastrou nenhum imóvel</p>
                        <button
                            onClick={() => router.push('/dashboard/add-property')}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
                        >
                            Cadastrar Primeiro Imóvel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
