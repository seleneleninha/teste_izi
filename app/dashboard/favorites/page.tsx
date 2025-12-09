"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Heart, Home, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';
import { PropertyCard } from '@/components/PropertyCard';

export default function FavoritesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user]);

    const fetchFavorites = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('favoritos')
                .select(`
                    id,
                    anuncios:property_id (
                        *,
                        tipo_imovel (tipo),
                        operacao (tipo)
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            if (data) {
                const properties = data
                    .map(f => f.anuncios)
                    .filter(Boolean)
                    .map((p: any) => ({
                        ...p,
                        fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                        operacao: p.operacao?.tipo || p.operacao,
                        tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel
                    }));
                setFavorites(properties);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (propertyId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('favoritos')
                .delete()
                .eq('user_id', user.id)
                .eq('property_id', propertyId);

            if (error) throw error;

            setFavorites(favorites.filter(f => f.id !== propertyId));
            addToast('Removido dos favoritos', 'success');
        } catch (error) {
            console.error('Error removing favorite:', error);
            addToast('Erro ao remover favorito', 'error');
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Heart className="text-red-500" size={32} />
                    Meus Favoritos
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{favorites.length} imóvel(is) salvo(s)</p>
            </div>

            {/* Favorites Grid */}
            {favorites.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map((property) => (
                        <PropertyCard
                            key={property.id}
                            property={property}
                            actions={
                                <button
                                    onClick={() => removeFavorite(property.id)}
                                    className="w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={16} />
                                    Remover
                                </button>
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <Heart className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Nenhum favorito ainda
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Explore imóveis e salve seus favoritos para encontrá-los facilmente
                    </p>
                    <button
                        onClick={() => router.push('/search')}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
                    >
                        Explorar Imóveis
                    </button>
                </div>
            )}
        </div>
    );
}
