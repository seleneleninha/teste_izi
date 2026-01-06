import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyMap } from '../components/PropertyMap';
import { formatCurrency } from '../lib/formatters';
import { useHeader } from '../components/HeaderContext';
import {
    Grid, List, Map, Search, Loader2, MapPin, Home, Building, ChevronDown,
    ArrowUpDown, ChevronUp, Users, Handshake
} from 'lucide-react';

export const MarketPage: React.FC = () => {
    const navigate = useNavigate();
    const { setHeaderContent } = useHeader();
    const { user, profile } = useAuth();
    const { addToast } = useToast();

    const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProperties.map(property => (
                        <div key={property.id} className="relative group">
                            {/* Broker Badge */}
                            {property.usuario && (
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
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
                            <PropertyCard property={property} />
                            {/* Partnership Button */}
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => navigate(`/partner-properties?request=${property.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-all"
                                    title="Solicitar Parceria"
                                >
                                    <Handshake size={16} />
                                    Parceria
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'list' && (
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-900/50 border-b border-white/5">
                                    <th className="p-4 text-left">
                                        <button onClick={() => handleSort('titulo')} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium text-sm">
                                            Imóvel {getSortIcon('titulo')}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left">Corretor</th>
                                    <th className="p-4 text-left">
                                        <button onClick={() => handleSort('operacao')} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium text-sm">
                                            Operação {getSortIcon('operacao')}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left">
                                        <button onClick={() => handleSort('bairro')} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium text-sm">
                                            Localização {getSortIcon('bairro')}
                                        </button>
                                    </th>
                                    <th className="p-4 text-right">
                                        <button onClick={() => handleSort('valor_venda')} className="flex items-center gap-2 text-slate-400 hover:text-white font-medium text-sm ml-auto">
                                            Valor {getSortIcon('valor_venda')}
                                        </button>
                                    </th>
                                    <th className="p-4 text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProperties.map((property) => (
                                    <tr
                                        key={property.id}
                                        className="border-b border-white/5 hover:bg-slate-800/50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
                                                    {property.fotos?.[0] ? (
                                                        <img src={property.fotos[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Home size={20} className="text-slate-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium line-clamp-1">{property.titulo || 'Sem título'}</p>
                                                    <p className="text-slate-500 text-sm">
                                                        {typeof property.tipo_imovel === 'string' ? property.tipo_imovel : property.tipo_imovel?.tipo}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {property.usuario && (
                                                <div className="flex items-center gap-2">
                                                    {property.usuario.avatar ? (
                                                        <img src={property.usuario.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                                                            <span className="text-sm text-white font-bold">{property.usuario.nome?.[0]}</span>
                                                        </div>
                                                    )}
                                                    <span className="text-slate-300 text-sm">
                                                        {property.usuario.nome} {property.usuario.sobrenome?.[0]}.
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-300 capitalize">{typeof property.operacao === 'string' ? property.operacao : property.operacao?.tipo || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <MapPin size={14} className="text-slate-500" />
                                                <span>{property.bairro || '-'}, {property.cidade || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-emerald-400 font-bold">
                                                {property.valor_venda ? formatCurrency(property.valor_venda) :
                                                    property.valor_locacao ? formatCurrency(property.valor_locacao) : '-'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => navigate(`/partner-properties?request=${property.id}`)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-all"
                                            >
                                                <Handshake size={14} />
                                                Parceria
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
