import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { formatCurrency } from '../lib/formatters';
import { useHeader } from '../components/HeaderContext';
import {
    Grid, List, Map, Search, Loader2, MapPin, Home, Building, ChevronDown,
    ArrowUpDown, ChevronUp, Users, Handshake, Eye, Bed, Bath, Car, Maximize2
} from 'lucide-react';

export const MarketPage: React.FC = () => {
    const navigate = useNavigate();
    const { setHeaderContent } = useHeader();
    const { user, profile } = useAuth();
    const { addToast } = useToast();

    const [view, setView] = useState<'grid' | 'list' | 'map'>('list');
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOperation, setFilterOperation] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');
    const [filterCity, setFilterCity] = useState<string>('');

    // Set up Header
    useEffect(() => {
        setHeaderContent(
            <div className="flex flex-col justify-center">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
                    Mercado Imobiliário
                </h1>
                <p className="text-slate-400 text-xs font-medium leading-tight">
                    Visualize imóveis disponíveis na plataforma
                </p>
            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent]);

    // Fetch all active properties from the market
    useEffect(() => {
        fetchMarketProperties();
    }, [profile]);

    const fetchMarketProperties = async () => {
        setLoading(true);
        try {
            // Get broker's state from profile
            const brokerState = profile?.estado || profile?.uf;

            let query = supabase
                .from('anuncios')
                .select(`
                    *,
                    tipo_imovel (tipo),
                    operacao (tipo),
                    usuario:user_id (nome, sobrenome, avatar, slug, whatsapp)
                `)
                .eq('status', 'ativo')
                .order('created_at', { ascending: false });

            // Filter by broker's state if available
            if (brokerState) {
                query = query.eq('uf', brokerState);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Exclude own properties - show only from other brokers
            const filtered = user ? data?.filter(p => p.user_id !== user.id) : data;

            // Format properties: convert fotos string to array
            const formatted = (filtered || []).map(p => ({
                ...p,
                fotos: p.fotos ? (Array.isArray(p.fotos) ? p.fotos : p.fotos.split(',')) : [],
                operacao: typeof p.operacao === 'string' ? p.operacao : p.operacao?.tipo || ''
            }));

            setProperties(formatted);
        } catch (error) {
            console.error('Erro ao buscar imóveis do mercado:', error);
            addToast('Erro ao carregar imóveis do mercado', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Get unique values for filters
    const filterOptions = useMemo(() => {
        const operations = new Set<string>();
        const types = new Set<string>();
        const cities = new Set<string>();

        properties.forEach(p => {
            if (p.operacao) operations.add(p.operacao);
            const tipo = typeof p.tipo_imovel === 'string' ? p.tipo_imovel : p.tipo_imovel?.tipo;
            if (tipo) types.add(tipo);
            if (p.cidade) cities.add(p.cidade);
        });

        return {
            operations: Array.from(operations).sort(),
            types: Array.from(types).sort(),
            cities: Array.from(cities).sort()
        };
    }, [properties]);

    // Filter and sort properties
    const filteredProperties = useMemo(() => {
        let result = properties;

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.titulo?.toLowerCase().includes(term) ||
                p.bairro?.toLowerCase().includes(term) ||
                p.cidade?.toLowerCase().includes(term) ||
                p.logradouro?.toLowerCase().includes(term) ||
                p.usuario?.nome?.toLowerCase().includes(term)
            );
        }

        // Operation filter
        if (filterOperation) {
            result = result.filter(p => p.operacao?.toLowerCase().includes(filterOperation.toLowerCase()));
        }

        // Type filter
        if (filterType) {
            result = result.filter(p => {
                const pTipo = typeof p.tipo_imovel === 'string' ? p.tipo_imovel : p.tipo_imovel?.tipo;
                return pTipo?.toLowerCase().includes(filterType.toLowerCase());
            });
        }

        // City filter
        if (filterCity) {
            result = result.filter(p => p.cidade === filterCity);
        }

        // Sorting
        if (sortConfig) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [properties, searchTerm, filterOperation, filterType, filterCity, sortConfig]);

    // Handle sort
    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // Get sort icon
    const getSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <ArrowUpDown size={14} className="text-slate-500" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className="text-emerald-400" />
            : <ChevronDown size={14} className="text-emerald-400" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header removido - agora via useHeader Context */}


            {/* Filters & View Toggle */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por título, bairro, cidade, corretor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                        />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={filterOperation}
                            onChange={(e) => setFilterOperation(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                        >
                            <option value="">Todas Operações</option>
                            {filterOptions.operations.map(op => (
                                <option key={op} value={op}>{op}</option>
                            ))}
                        </select>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                        >
                            <option value="">Todos os Tipos</option>
                            {filterOptions.types.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>

                        <select
                            value={filterCity}
                            onChange={(e) => setFilterCity(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                        >
                            <option value="">Todas as Cidades</option>
                            {filterOptions.cities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>

                        {/* View Toggle */}
                        <div className="flex bg-slate-900 rounded-xl border border-slate-700 p-1">
                            <button
                                onClick={() => setView('grid')}
                                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Visualização em Grid"
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Visualização em Lista"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setView('map')}
                                className={`p-2 rounded-lg transition-all ${view === 'map' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Visualização no Mapa"
                            >
                                <Map size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-slate-400">
                    <span className="text-white font-bold">{filteredProperties.length}</span> imóveis encontrados
                </p>
            </div>

            {/* Content */}
            {view === 'grid' && (
                <HorizontalScroll gap={24}>
                    {filteredProperties.map(property => (
                        <div key={property.id} className="relative group" style={{ minWidth: '320px', maxWidth: '360px' }}>
                            <PropertyCard
                                property={property}
                                isDashboard={true}
                                actions={
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/properties/${property.slug || property.id}`); }}
                                            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all"
                                            title="Ver Detalhes"
                                        >
                                            <Eye size={20} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/partner-properties?request=${property.id}`); }}
                                            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all"
                                            title="Aceitar Parceria"
                                        >
                                            <Handshake size={20} />
                                        </button>
                                    </div>
                                }
                            />
                            {/* Broker Badge - Below operation badge area */}
                            {property.usuario && (
                                <div className="absolute top-16 left-3 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
                                    {property.usuario.avatar ? (
                                        <img src={property.usuario.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                                            <span className="text-xs text-white font-bold">
                                                {property.usuario.nome?.[0]}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-white text-xs font-medium">
                                        {property.usuario.nome} {property.usuario.sobrenome?.[0]}.
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </HorizontalScroll>
            )}

            {view === 'list' && (
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-900/80 border-b border-white/10 text-xs uppercase tracking-wider">
                                    <th className="p-3 text-center text-slate-400 font-semibold w-20">AÇÕES</th>
                                    <th className="p-3 text-left text-slate-400 font-semibold min-w-[150px]">
                                        <button onClick={() => handleSort('titulo')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                            IMÓVEL {getSortIcon('titulo')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-left text-slate-400 font-semibold min-w-[140px]">
                                        <button onClick={() => handleSort('usuario.nome')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                            CORRETOR {getSortIcon('usuario.nome')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-left text-slate-400 font-semibold">
                                        <button onClick={() => handleSort('cidade')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                            CIDADE {getSortIcon('cidade')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-left text-slate-400 font-semibold">
                                        <button onClick={() => handleSort('bairro')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                            BAIRRO {getSortIcon('bairro')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Quartos">
                                        <button onClick={() => handleSort('quartos')} className="flex items-center gap-1 mx-auto text-slate-400 hover:text-white transition-colors">
                                            <Bed size={14} /> {getSortIcon('quartos')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Banheiros">
                                        <button onClick={() => handleSort('banheiros')} className="flex items-center gap-1 mx-auto text-slate-400 hover:text-white transition-colors">
                                            <Bath size={14} /> {getSortIcon('banheiros')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Vagas">
                                        <button onClick={() => handleSort('vagas')} className="flex items-center gap-1 mx-auto text-slate-400 hover:text-white transition-colors">
                                            <Car size={14} /> {getSortIcon('vagas')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-center text-slate-400 font-semibold w-16" title="Área">
                                        <button onClick={() => handleSort('area_priv')} className="flex items-center gap-1 mx-auto text-slate-400 hover:text-white transition-colors">
                                            <Maximize2 size={14} /> {getSortIcon('area_priv')}
                                        </button>
                                    </th>
                                    <th className="p-3 text-right text-slate-400 font-semibold min-w-[100px]">
                                        <button onClick={() => handleSort('valor_venda')} className="flex items-center gap-1 ml-auto text-slate-400 hover:text-white transition-colors">
                                            VALORES {getSortIcon('valor_venda')}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProperties.map((property) => {
                                    const tipoImovel = typeof property.tipo_imovel === 'string' ? property.tipo_imovel : property.tipo_imovel?.tipo || '';
                                    const operacao = property.operacao || '';

                                    return (
                                        <tr
                                            key={property.id}
                                            className="border-b border-white/5 hover:bg-slate-800/50 transition-colors"
                                        >
                                            {/* Ações */}
                                            <td className="p-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => navigate(`/properties/${property.slug || property.id}`)}
                                                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                                                        title="Ver Detalhes"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/partner-properties?request=${property.id}`)}
                                                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-400 transition-all"
                                                        title="Aceitar Parceria"
                                                    >
                                                        <Handshake size={14} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Imóvel (Título + Badges) */}
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1">
                                                    <span
                                                        onClick={() => navigate(`/properties/${property.slug || property.id}`)}
                                                        className="text-white font-medium line-clamp-1 hover:text-emerald-400 cursor-pointer transition-colors"
                                                    >
                                                        {property.titulo || 'Sem título'}
                                                    </span>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {tipoImovel && (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-600 text-slate-200 uppercase tracking-wider">
                                                                {tipoImovel}
                                                            </span>
                                                        )}
                                                        {operacao && (
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${(() => {
                                                                const op = operacao.toLowerCase();
                                                                if (op.includes('venda') && op.includes('loca')) return 'bg-emerald-600 text-white';
                                                                if (op.includes('venda')) return 'bg-red-500 text-white';
                                                                if (op.includes('temporada')) return 'bg-orange-500 text-white';
                                                                return 'bg-blue-600 text-white';
                                                            })()}`}>
                                                                {operacao}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Corretor */}
                                            <td className="p-3">
                                                {property.usuario && (
                                                    <div className="flex items-center gap-2">
                                                        {property.usuario.avatar ? (
                                                            <img src={property.usuario.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                                                                <span className="text-xs text-white font-bold">{property.usuario.nome?.[0]}</span>
                                                            </div>
                                                        )}
                                                        <span className="text-slate-300 text-sm">
                                                            {property.usuario.nome} {property.usuario.sobrenome?.[0]}.
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Cidade */}
                                            <td className="p-3 text-slate-300 font-medium">
                                                {property.cidade || '-'}
                                            </td>

                                            {/* Bairro */}
                                            <td className="p-3 text-slate-300">
                                                {property.bairro || '-'}
                                            </td>

                                            {/* Quartos */}
                                            <td className="p-3 text-center text-slate-300">
                                                {property.quartos || '-'}
                                            </td>

                                            {/* Banheiros */}
                                            <td className="p-3 text-center text-slate-300">
                                                {property.banheiros || '-'}
                                            </td>

                                            {/* Vagas */}
                                            <td className="p-3 text-center text-slate-300">
                                                {property.vagas || '-'}
                                            </td>

                                            {/* Área */}
                                            <td className="p-3 text-center text-slate-300">
                                                {property.area_priv ? `${property.area_priv}m²` : '-'}
                                            </td>

                                            {/* Valores */}
                                            <td className="p-3 text-right">
                                                <span className="text-emerald-400 font-bold">
                                                    {property.valor_venda
                                                        ? formatCurrency(property.valor_venda)
                                                        : property.valor_locacao
                                                            ? formatCurrency(property.valor_locacao)
                                                            : '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredProperties.length === 0 && (
                        <div className="p-12 text-center">
                            <Building size={48} className="text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Nenhum imóvel encontrado</h3>
                            <p className="text-slate-400">Não há imóveis de outros corretores na sua região.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'map' && (
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden" style={{ height: '600px' }}>
                    <PropertyMap
                        properties={filteredProperties}
                    />
                </div>
            )}
        </div>
    );
};
