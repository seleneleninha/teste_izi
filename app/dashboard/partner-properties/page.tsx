"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Handshake, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';
import { PropertyCard } from '@/components/PropertyCard';
import dynamic from 'next/dynamic';

const PropertyMap = dynamic(() => import('@/components/PropertyMap'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center rounded-xl">Carregando mapa...</div>
});

export default function PartnerPropertiesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

    const [acceptedProperties, setAcceptedProperties] = useState<any[]>([]);
    const [availableProperties, setAvailableProperties] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchPartnerProperties();
        }
    }, [user]);

    const fetchPartnerProperties = async () => {
        if (!user) return;

        try {
            // Fetch user's state
            const { data: profile } = await supabase
                .from('perfis')
                .select('uf')
                .eq('id', user.id)
                .single();

            // Fetch accepted partnerships
            const { data: partnerships } = await supabase
                .from('parcerias')
                .select(`property_id, anuncios (*, tipo_imovel (tipo), operacao (tipo))`)
                .eq('user_id', user.id);

            if (partnerships) {
                const accepted = partnerships
                    .map(p => p.anuncios)
                    .filter(Boolean)
                    .map((p: any) => ({
                        ...p,
                        fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                        operacao: p.operacao?.tipo || p.operacao,
                        tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
                    }));
                setAcceptedProperties(accepted);
            }

            // Fetch available properties (in user's state, accepting partnerships)
            if (profile?.uf) {
                const { data: available } = await supabase
                    .from('anuncios')
                    .select(`*, tipo_imovel (tipo), operacao (tipo)`)
                    .eq('uf', profile.uf)
                    .eq('aceita_parceria', true)
                    .eq('status_aprovacao', 'aprovado')
                    .neq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (available) {
                    // Filter out already accepted
                    const acceptedIds = partnerships?.map(p => (p.anuncios as any)?.id) || [];
                    const filtered = available
                        .filter(p => !acceptedIds.includes(p.id))
                        .map(p => ({
                            ...p,
                            fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                            operacao: p.operacao?.tipo || p.operacao,
                            tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
                        }));
                    setAvailableProperties(filtered);
                }
            }
        } catch (error) {
            console.error('Error fetching partner properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptPartnership = async (propertyId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase.from('parcerias').insert({
                user_id: user.id,
                property_id: propertyId
            });

            if (error) throw error;

            addToast('Parceria aceita com sucesso!', 'success');
            fetchPartnerProperties(); // Refresh data
        } catch (error) {
            console.error('Error accepting partnership:', error);
            addToast('Erro ao aceitar parceria', 'error');
        }
    };

    const handleRemovePartnership = async (propertyId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('parcerias')
                .delete()
                .eq('user_id', user.id)
                .eq('property_id', propertyId);

            if (error) throw error;

            addToast('Parceria removida', 'success');
            fetchPartnerProperties();
        } catch (error) {
            console.error('Error removing partnership:', error);
            addToast('Erro ao remover parceria', 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Imóveis Parceiros</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {acceptedProperties.length} parceria(s) aceita(s) • {availableProperties.length} disponível(is)
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'cards' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}
                    >
                        Cards
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'map' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}
                    >
                        Mapa
                    </button>
                </div>
            </div>

            {viewMode === 'map' ? (
                <div className="h-[600px] rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    <PropertyMap properties={[...acceptedProperties, ...availableProperties]} />
                </div>
            ) : (
                <>
                    {/* Accepted Partnerships */}
                    {acceptedProperties.length > 0 && (
                        <section className="mb-12">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="text-emerald-500" size={24} />
                                Minhas Parcerias Aceitas
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {acceptedProperties.map(property => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property}
                                        actions={
                                            <button
                                                onClick={() => handleRemovePartnership(property.id)}
                                                className="w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <XCircle size={16} />
                                                Remover
                                            </button>
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Available Properties */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Handshake className="text-blue-500" size={24} />
                            Disponíveis para Parceria
                        </h2>

                        {availableProperties.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {availableProperties.map(property => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property}
                                        actions={
                                            <button
                                                onClick={() => handleAcceptPartnership(property.id)}
                                                className="w-full py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <CheckCircle size={16} />
                                                Aceitar Parceria
                                            </button>
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                                <Handshake className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Nenhum imóvel disponível
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Não há imóveis disponíveis para parceria na sua região no momento.
                                </p>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
