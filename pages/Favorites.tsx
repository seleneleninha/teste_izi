import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { PropertyCard } from '../components/PropertyCard';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { Heart, Search, X, Loader2, Check, CheckCircle, Building2, Handshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';

export const Favorites: React.FC = () => {
    const { user, role } = useAuth();
    const isClient = role === 'Cliente';
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'meus' | 'parcerias' | 'favoritos'>(isClient ? 'favoritos' : 'meus');

    // Data States
    const [myProperties, setMyProperties] = useState<any[]>([]);
    const [partnershipProperties, setPartnershipProperties] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(curr => curr !== id));
        } else {
            if (selectedIds.length >= 3) {
                addToast('Você pode selecionar no máximo 3 imóveis para comparar.', 'error');
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

    const fetchData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            if (isClient) {
                // Client only cares about favorites
                await fetchOnlyFavorites();
            } else {
                // Broker only cares about My Properties and Partnerships
                const [my, partners] = await Promise.all([
                    fetchMyProperties(),
                    fetchPartnershipProperties()
                ]);

                // Intelligent default tab
                if (my.length > 0) setActiveTab('meus');
                else if (partners.length > 0) setActiveTab('parcerias');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            addToast('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyProperties = async () => {
        const { data, error } = await supabase
            .from('anuncios')
            .select(`
                *,
                tipo_imovel (tipo),
                operacao (tipo)
            `)
            .eq('user_id', user?.id)
            .eq('status', 'ativo')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const transformed = data?.map(p => ({
            ...p,
            tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
            operacao: p.operacao?.tipo || p.operacao
        })) || [];

        setMyProperties(transformed);
        return transformed;
    };

    const fetchPartnershipProperties = async () => {
        // First get accepted partnership IDs
        const { data: partnerships } = await supabase
            .from('parcerias')
            .select('property_id')
            .eq('user_id', user?.id);

        if (partnerships && partnerships.length > 0) {
            const ids = partnerships.map(p => p.property_id);
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
                    *,
                    tipo_imovel (tipo),
                    operacao (tipo)
                `)
                .in('id', ids)
                .eq('status', 'ativo')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformed = data?.map(p => ({
                ...p,
                tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                operacao: p.operacao?.tipo || p.operacao
            })) || [];

            setPartnershipProperties(transformed);
            return transformed;
        } else {
            setPartnershipProperties([]);
            return [];
        }
    };

    const fetchOnlyFavorites = async () => {
        const { data: favs } = await supabase
            .from('favoritos')
            .select('anuncio_id')
            .eq('user_id', user?.id);

        if (favs && favs.length > 0) {
            const ids = favs.map(f => f.anuncio_id);
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
                    *,
                    tipo_imovel (tipo),
                    operacao (tipo)
                `)
                .in('id', ids)
                .eq('status', 'ativo')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformed = data?.map(p => ({
                ...p,
                tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                operacao: p.operacao?.tipo || p.operacao
            })) || [];

            setFavorites(transformed);
            return transformed;
        } else {
            setFavorites([]);
            return [];
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, role]);

    const getActiveList = () => {
        if (isClient) return favorites;
        switch (activeTab) {
            case 'meus': return myProperties;
            case 'parcerias': return partnershipProperties;
            default: return [];
        }
    };

    const hasAnyData = isClient
        ? favorites.length > 0
        : (myProperties.length > 0 || partnershipProperties.length > 0);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
                <Loader2 className="animate-spin text-primary-500" size={48} />
                <p className="text-slate-400 animate-pulse">Organizando seu comparativo...</p>
            </div>
        );
    }

    return (
        <div className="pt-6 pb-24 md:pb-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {isClient ? (
                        <>
                            <Heart className="text-red-500 fill-current" size={28} />
                            Meus Favoritos
                        </>
                    ) : (
                        <>
                            <CheckCircle className="text-emerald-400" size={28} />
                            Comparativo de Imóveis
                        </>
                    )}
                </h2>
                <p className="text-slate-400 mt-1">
                    {isClient
                        ? 'Imóveis que você salvou para ver depois.'
                        : 'Ferramenta de seleção para criar apresentações aos seus clientes.'}
                </p>
            </div>

            {/* Broker Tabs */}
            {!isClient && (
                <div className="flex p-1 bg-slate-900/50 border border-slate-700/50 rounded-2xl mb-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('meus')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'meus'
                            ? 'bg-primary-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <Building2 size={18} />
                        Meus Imóveis
                        {myProperties.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px]">{myProperties.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('parcerias')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'parcerias'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <Handshake size={18} />
                        Minhas Parcerias
                        {partnershipProperties.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px]">{partnershipProperties.length}</span>
                        )}
                    </button>
                </div>
            )}

            {/* Comparison Logic Tip */}
            {hasAnyData && (
                <div className="mb-8 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                            <Check className="text-emerald-400" size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-xl mb-1">
                                {isClient ? 'Compare seus favoritos!' : 'Monte seu Comparativo Campeão!'}
                            </h3>
                            <p className="text-slate-300">
                                {isClient
                                    ? 'Selecione até 3 imóveis para ver os detalhes lado a lado.'
                                    : 'Abaixo listamos seu estoque e parcerias. Clique em "Comparar" e envie a melhor seleção para seu lead.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {getActiveList().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-800/50 rounded-[2.5rem] border border-slate-700/50 border-dashed">
                    <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl border border-slate-700">
                        {activeTab === 'meus' ? <Building2 size={48} className="text-slate-500" /> :
                            activeTab === 'parcerias' ? <Handshake size={48} className="text-slate-500" /> :
                                <Heart size={48} className="text-slate-500" />}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {activeTab === 'meus' ? 'Você não tem imóveis cadastrados' :
                            activeTab === 'parcerias' ? 'Nenhuma parceria aceita ainda' :
                                'Sua lista de favoritos está vazia'}
                    </h3>
                    <p className="text-slate-400 text-center max-w-md mb-8 px-4">
                        {activeTab === 'meus' ? 'Cadastre seus imóveis para que eles apareçam aqui prontos para comparação.' :
                            activeTab === 'parcerias' ? 'Explore o mercado e aceite parcerias para aumentar seu portfólio.' :
                                'Salve imóveis do mercado aqui para organizar suas opções externas.'}
                    </p>
                    <button
                        onClick={() => navigate(activeTab === 'meus' ? '/add-property' : activeTab === 'parcerias' ? '/partner-properties' : '/properties?mode=market')}
                        className="px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-black rounded-2xl transition-all flex items-center gap-3 shadow-lg shadow-primary-500/30 active:scale-95 hover:-translate-y-1"
                    >
                        {activeTab === 'meus' ? <Building2 size={20} /> : <Search size={20} />}
                        {activeTab === 'meus' ? 'Cadastrar Imóvel' : activeTab === 'parcerias' ? 'Explorar Parcerias' : 'Buscar no Mercado'}
                    </button>
                </div>
            ) : (
                <div className="pb-24">
                    <HorizontalScroll gap={24}>
                        {getActiveList().map(property => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                isDashboard={true}
                                isSelected={selectedIds.includes(property.id)}
                                onSelect={(e) => toggleSelection(property.id, e)}
                                onFavoriteRemove={activeTab === 'favoritos' ? async (propertyId) => {
                                    try {
                                        await supabase
                                            .from('favoritos')
                                            .delete()
                                            .eq('user_id', user?.id)
                                            .eq('anuncio_id', propertyId);
                                        setFavorites(prev => prev.filter(p => p.id !== propertyId));
                                        setSelectedIds(prev => prev.filter(id => id !== propertyId));
                                        addToast('Removido dos favoritos', 'success');
                                    } catch (error) {
                                        addToast('Erro ao remover favorito', 'error');
                                    }
                                } : undefined}
                            />
                        ))}
                    </HorizontalScroll>

                    {/* Comparison Floating Bar */}
                    {selectedIds.length > 0 && (
                        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl px-8 py-4 border border-white/10 flex items-center gap-6 z-[100] animate-fade-in-up md:w-auto w-[90%]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                                    <span className="text-emerald-400 font-black text-lg">{selectedIds.length}</span>
                                </div>
                                <span className="text-white font-bold hidden sm:inline">
                                    Selecionado{selectedIds.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="h-8 w-px bg-white/10"></div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCompare}
                                    className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-2.5 rounded-2xl font-black text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 active:scale-95 flex items-center gap-2"
                                    disabled={selectedIds.length < 2}
                                >
                                    <CheckCircle size={18} />
                                    Comparar Agora
                                </button>

                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                    title="Limpar seleção"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
