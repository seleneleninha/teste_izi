import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Loader2, Heart, Video, Globe, Car, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { generatePropertySlug } from '../lib/formatters';

interface ComparisonProperty {
    id: string;
    titulo: string;

    // Localização
    cidade: string;
    bairro: string;

    // Tipo e Operação
    tipo_imovel: string;
    operacao: string;

    // Preços
    valor_venda: number | null;
    valor_locacao: number | null;
    valor_diaria: number | null;
    valor_mensal: number | null;

    // Características Físicas
    area_priv: number;
    quartos: number;
    banheiros: number;
    vagas: number;

    // Extras
    caracteristicas: string[];
    video: string | null;
    tour_virtual: string | null;

    // Imagem
    fotos: string[];
    slug: string;

    // Favorite status
    isFavorite?: boolean;
}

export const PropertyComparison: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const { addToast } = useToast();
    const isClient = role === 'Cliente';
    const [properties, setProperties] = useState<ComparisonProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const idsString = searchParams.get('ids');
    const ids = idsString?.split(',') || [];

    useEffect(() => {
        if (ids.length > 0) {
            fetchProperties();
        } else {
            setLoading(false);
        }
    }, [idsString]);

    const fetchProperties = async () => {
        try {
            setLoading(true);

            // Fetch properties with joins
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
                    *,
                    tipo_imovel (tipo),
                    operacao (tipo)
                `)
                .in('id', ids);

            if (error) throw error;

            if (data) {
                // Check favorites if user is logged in
                let favoriteIds: string[] = [];
                if (user) {
                    const { data: favData } = await supabase
                        .from('favoritos')
                        .select('anuncio_id')
                        .eq('user_id', user.id)
                        .in('anuncio_id', ids);

                    favoriteIds = favData?.map(f => f.anuncio_id) || [];
                    setFavorites(new Set(favoriteIds));
                }

                const mapped: ComparisonProperty[] = data.map(p => ({
                    id: p.id,
                    titulo: p.titulo,
                    cidade: p.cidade || 'N/A',
                    bairro: p.bairro || 'N/A',
                    tipo_imovel: p.tipo_imovel?.tipo || 'N/A',
                    operacao: p.operacao?.tipo || 'N/A',
                    valor_venda: p.valor_venda,
                    valor_locacao: p.valor_locacao,
                    valor_diaria: p.valor_diaria,
                    valor_mensal: p.valor_mensal,
                    area_priv: p.area_priv || 0,
                    quartos: p.quartos || 0,
                    banheiros: p.banheiros || 0,
                    vagas: p.vagas || 0,
                    caracteristicas: p.caracteristicas ? p.caracteristicas.split(', ') : [],
                    video: p.video,
                    tour_virtual: p.tour_virtual,
                    fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                    slug: generatePropertySlug({
                        ...p,
                        tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                        operacao: p.operacao?.tipo || p.operacao
                    }),
                    isFavorite: favoriteIds.includes(p.id)
                }));

                setProperties(mapped);
            }
        } catch (error) {
            console.error('Erro ao buscar propriedades:', error);
            addToast('Erro ao carregar imóveis para comparação', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        addToast('Link de comparação copiado! Agora você pode enviar para seu cliente.', 'success');

        // Optional: Use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'Comparativo de Imóveis - iziBrokerz',
                text: 'Confira estes imóveis que selecionei para você comparar:',
                url: url
            }).catch(() => { });
        }
    };

    const toggleFavorite = async (propertyId: string) => {
        if (!user) {
            addToast('Faça login para favoritar imóveis', 'info');
            navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}&type=client`);
            return;
        }

        try {
            const isFav = favorites.has(propertyId);

            if (isFav) {
                // Remove from favorites
                await supabase
                    .from('favoritos')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('anuncio_id', propertyId);

                setFavorites(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(propertyId);
                    return newSet;
                });
                addToast(isClient ? 'Removido dos favoritos' : 'Removido do comparativo', 'success');
            } else {
                // Add to favorites
                await supabase
                    .from('favoritos')
                    .insert([{ user_id: user.id, anuncio_id: propertyId }]);

                setFavorites(prev => new Set(prev).add(propertyId));
                addToast(isClient ? 'Adicionado aos favoritos' : 'Adicionado ao comparativo', 'success');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            addToast('Erro ao atualizar favoritos', 'error');
        }
    };

    const getOperationBadgeClass = (operacao: string) => {
        const op = operacao.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (op === 'venda') return 'bg-red-500 text-white';
        if (op === 'locacao' || op === 'locação') return 'bg-blue-600 text-white';
        if (op === 'temporada') return 'bg-orange-500 text-white';
        if (op.includes('venda') && op.includes('locacao')) return 'bg-emerald-600 text-white';
        return 'bg-gray-700 text-white';
    };

    // Helper functions to check if all properties have empty/null values
    const allEmpty = (field: keyof ComparisonProperty) => {
        return properties.every(prop => !prop[field] || prop[field] === 0);
    };

    const hasAnyValue = (field: keyof ComparisonProperty) => {
        return properties.some(prop => prop[field] && prop[field] !== 0);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Nenhum imóvel selecionado para comparação.</p>
                <button
                    onClick={() => navigate('/favorites')}
                    className="px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600"
                >
                    Voltar para {role === 'Cliente' ? 'Favoritos' : 'Comparativo'}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex items-center mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="mr-4 p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white">Comparativo de Imóveis</h2>
                    <p className="text-slate-400 text-sm">Comparando {properties.length} imóveis lado a lado.</p>
                    <p className="text-yellow-500 text-sm md:hidden">💡 Gire o celular para ver melhor.</p>
                </div>

                {!isClient && (
                    <button
                        onClick={handleShare}
                        className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Share2 size={18} />
                        <span className="hidden sm:inline">Compartilhar com Cliente</span>
                        <span className="sm:hidden">Enviar</span>
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="max-w-auto min-w-auto border-collapse">
                    <thead>
                        <tr>
                            <th className="p-4 text-left w-48 bg-slate-900/50 sticky left-0 border-b border-slate-700"></th>
                            {properties.map(prop => (
                                <th key={prop.id} className="p-4 border-b border-slate-700 min-w-[300px]">
                                    <div className="relative rounded-3xl overflow-hidden h-48 mb-4 shadow-md">
                                        <img
                                            src={prop.fotos[0] || 'https://picsum.photos/seed/prop1/400/300'}
                                            alt={prop.titulo}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Remove button */}
                                        <button
                                            className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-gray-700 hover:text-red-500 transition-colors"
                                            onClick={() => {
                                                navigate(`/compare?ids=${ids.filter(id => id !== prop.id).join(',')}`);
                                            }}
                                            title="Remover da comparação"
                                        >
                                            <X size={16} />
                                        </button>

                                        {/* Favorite button */}
                                        <button
                                            className={`absolute top-2 left-2 p-1.5 rounded-full border transition-colors ${favorites.has(prop.id)
                                                ? 'bg-red-50 border-red-200 text-red-500'
                                                : 'bg-white/80 border-white text-gray-700 hover:text-red-500'
                                                }`}
                                            onClick={() => toggleFavorite(prop.id)}
                                            title={favorites.has(prop.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                        >
                                            <Heart size={16} fill={favorites.has(prop.id) ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{prop.titulo}</h3>
                                    <p className="text-sm text-slate-400 font-normal">{prop.bairro}, {prop.cidade}</p>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-slate-300">
                        {/* Operação */}
                        <tr>
                            <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Oper.</td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4 border-b border-slate-800">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOperationBadgeClass(prop.operacao)}`}>
                                        {prop.operacao}
                                    </span>
                                </td>
                            ))}
                        </tr>

                        {/* Tipo Imóvel */}
                        <tr>
                            <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Tipo</td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4 border-b border-slate-800">
                                    <span className="px-3 py-1 rounded-full bg-slate-700 text-xs font-medium">
                                        {prop.tipo_imovel}
                                    </span>
                                </td>
                            ))}
                        </tr>

                        {/* Cidade/Bairro */}
                        <tr>
                            <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Cid/Bairro</td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4 border-b border-slate-800">
                                    {prop.cidade} - {prop.bairro}
                                </td>
                            ))}
                        </tr>

                        {/* Preço Venda */}
                        {hasAnyValue('valor_venda') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Venda</td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800 text-lg font-bold text-red-400">
                                        {prop.valor_venda ? `R$ ${prop.valor_venda.toLocaleString('pt-BR')}` : '-'}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Preço Locação */}
                        {hasAnyValue('valor_locacao') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Locação</td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800 text-lg font-bold text-blue-400">
                                        {prop.valor_locacao ? `R$ ${prop.valor_locacao.toLocaleString('pt-BR')}` : '-'}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Preço Diária */}
                        {hasAnyValue('valor_diaria') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Diária</td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800 text-lg font-bold text-orange-400">
                                        {prop.valor_diaria ? `R$ ${prop.valor_diaria.toLocaleString('pt-BR')}` : '-'}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Preço Mensal */}
                        {hasAnyValue('valor_mensal') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Mensal</td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800 text-lg font-bold text-orange-300">
                                        {prop.valor_mensal ? `R$ ${prop.valor_mensal.toLocaleString('pt-BR')}` : '-'}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Área Privativa */}
                        {hasAnyValue('area_priv') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Á. Priv</td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800">
                                        {prop.area_priv > 0 ? `${prop.area_priv} m²` : '-'}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Quartos */}
                        {hasAnyValue('quartos') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Quartos</td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800">
                                        {prop.quartos || '-'}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Banheiros */}
                        {hasAnyValue('banheiros') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Banheiros</td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800">
                                        {prop.banheiros || '-'}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Vagas */}
                        {hasAnyValue('vagas') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">Vagas</td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800">
                                        {prop.vagas || '-'}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Características */}
                        {properties.some(p => p.caracteristicas.length > 0) && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800 align-top">Caract.</td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800 align-top">
                                        <ul className="space-y-2">
                                            {prop.caracteristicas.length > 0 ? prop.caracteristicas.map((feat, i) => (
                                                <li key={i} className="flex items-center text-sm">
                                                    <Check size={14} className="text-green-500 mr-2 shrink-0" /> {feat}
                                                </li>
                                            )) : (
                                                <li className="text-sm text-gray-400">Sem características</li>
                                            )}
                                        </ul>
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Vídeo */}
                        {hasAnyValue('video') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Video size={18} />
                                        Vídeo
                                    </div>
                                </td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800">
                                        {prop.video ? (
                                            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                                                <iframe
                                                    src={prop.video.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')}
                                                    title="Vídeo do Imóvel"
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Tour 360° */}
                        {hasAnyValue('tour_virtual') && (
                            <tr>
                                <td className="p-4 font-bold text-white bg-slate-900/50 sticky left-0 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Globe size={18} />
                                        360°
                                    </div>
                                </td>
                                {properties.map(prop => (
                                    <td key={prop.id} className="p-4 border-b border-slate-800">
                                        {prop.tour_virtual ? (
                                            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                                                <iframe
                                                    src={prop.tour_virtual}
                                                    title="Tour Virtual 360°"
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        )}

                        {/* Ações */}
                        <tr>
                            <td className="p-4 bg-slate-900/50 sticky left-0"></td>
                            {properties.map(prop => (
                                <td key={prop.id} className="p-4">
                                    <button
                                        onClick={() => navigate(`/properties/${prop.slug}`)}
                                        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-full transition-colors shadow-md"
                                    >
                                        Ver Detalhes
                                    </button>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
