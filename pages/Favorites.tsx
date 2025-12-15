import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { PropertyCard } from '../components/PropertyCard';
import { Heart, Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';

export const Favorites: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { addToast } = useToast();

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(curr => curr !== id));
        } else {
            if (selectedIds.length >= 4) {
                addToast('Você pode selecionar no máximo 4 imóveis para comparar.', 'error');
                return;
            }
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleCompare = () => {
        if (selectedIds.length < 2) {
            addToast('Selecione pelo menos 2 imóveis para comparar.', 'error');
            return;
        }
        navigate(`/compare?ids=${selectedIds.join(',')}`);
    };

    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            // First get favorite IDs
            const { data: favs } = await supabase
                .from('favoritos')
                .select('anuncio_id')
                .eq('user_id', user?.id);

            if (favs && favs.length > 0) {
                const ids = favs.map(f => f.anuncio_id);

                // Then fetch properties
                const { data: properties } = await supabase
                    .from('anuncios')
                    .select(`
                        *,
                        tipo_imovel (tipo),
                        operacao (tipo)
                    `)
                    .in('id', ids);

                if (properties) {
                    const formatted = properties.map(p => ({
                        ...p,
                        tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                        operacao: p.operacao?.tipo || p.operacao
                    }));
                    setFavorites(formatted);
                }
            } else {
                setFavorites([]);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;
    }

    return (
        <div className="pt-6 pb-20 md:pb-0">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Heart className="text-red-500 fill-current" size={28} />
                    Meus Favoritos
                </h2>
                <p className="text-slate-400 mt-1">Imóveis que você salvou para ver depois.</p>
            </div>

            {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-800 rounded-3xl border border-slate-700">
                    <div className="w-20 h-20 bg-slate-700 rounded-3xl flex items-center justify-center mb-6">
                        <Heart size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Você ainda não tem favoritos</h3>
                    <p className="text-slate-400 text-center max-w-md mb-8">
                        Explore nossa lista de imóveis e clique no coração para salvar os que mais gostar.
                    </p>
                    <button
                        onClick={() => navigate('/properties')}
                        className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-full transition-colors flex items-center gap-2"
                    >
                        <Search size={20} />
                        Buscar Imóveis
                    </button>
                </div>
            ) : (
                <div className="pb-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map(property => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                isDashboard={true}
                                isSelected={selectedIds.includes(property.id)}
                                onSelect={(e) => toggleSelection(property.id, e)}
                            />
                        ))}
                    </div>

                    {/* Comparison Floating Bar */}
                    {selectedIds.length > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 shadow-2xl rounded-full px-6 py-3 border border-slate-700 flex items-center gap-4 z-50 animate-fade-in-up">
                            <span className="text-white font-medium">
                                {selectedIds.length} selecionado{selectedIds.length !== 1 && 's'}
                            </span>
                            <div className="h-6 w-px bg-slate-600"></div>
                            <button
                                onClick={handleCompare}
                                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-full font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={selectedIds.length < 2}
                            >
                                Comparar
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-gray-500 hover:text-red-500 p-1"
                                title="Limpar seleção"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
