import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_PROPERTIES } from '../constants';
import { MapPin, Bed, Bath, Square, Filter, Search, Grid, Map as MapIcon, CheckSquare, Loader2, Edit2, Trash2, X, TrendingUp, Key, Pause, AlertTriangle, Home, ChevronDown, List, UserCheck, UserX, BedDouble, Car, Ruler, ArrowUp, ArrowDown, Eye, Globe, ChevronUp, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PropertyCard } from '../components/PropertyCard';
import { NoPropertiesFound } from '../components/NoPropertiesFound';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { PropertyMap } from '../components/PropertyMap';
import { getRandomBackground } from '../lib/backgrounds';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { Footer } from '../components/Footer';
import { DeactivatePropertyModal } from '../components/DeactivatePropertyModal';
import { useHeader } from '../components/HeaderContext';
import { generatePropertySlug } from '../lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarFilter, FilterState } from '../components/SidebarFilter';

export const PropertiesList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, role } = useAuth();
    const { addToast } = useToast();

    const [view, setView] = useState<'grid' | 'map' | 'list'>('grid');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [propertyTypes, setPropertyTypes] = useState<{ tipo: string; disponivel_temporada: boolean }[]>([]);
    const [allNeighborhoods, setAllNeighborhoods] = useState<string[]>([]);

    // Advanced Filters State
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize filters from URL params
    const [filters, setFilters] = useState<FilterState>(() => {
        const getParamArray = (key: string) => {
            const val = searchParams.get(key);
            return val ? val.split(',') : [];
        };
        const getParamNumber = (key: string) => {
            const val = searchParams.get(key);
            return val ? Number(val) : null;
        };
        const getParamStringNum = (key: string) => {
            const val = searchParams.get(key);
            return val ? Number(val) : '';
        };

        // Support both internal params (ops, types) and SearchFilter params (operacao, tipo, q)
        const operacaoParam = searchParams.get('operacao');
        const tipoParam = searchParams.get('tipo');
        const bairroParam = searchParams.get('bairro'); // From PublicHome "Bairros em Alta"
        const cidadeParam = searchParams.get('cidade'); // From PublicHome "Principais Cidades"
        const queryParam = searchParams.get('q'); // Text search from SearchFilter

        // Map operacao from SearchFilter to internal format
        let operations = getParamArray('ops');
        if (operacaoParam && operations.length === 0) {
            operations = [operacaoParam]; // e.g., 'venda', 'locacao', 'temporada'
        }

        // Map tipo from SearchFilter to internal format
        let types = getParamArray('types');
        if (tipoParam && types.length === 0) {
            types = [tipoParam];
        }

        // Map cidade from PublicHome to cities
        let cities = getParamArray('cities');
        if (cidadeParam && cities.length === 0) {
            cities = [cidadeParam];
        }

        // Map bairro from PublicHome to neighborhoods
        let neighborhoods = getParamArray('neighborhoods');
        if (bairroParam && neighborhoods.length === 0) {
            neighborhoods = [bairroParam];
        }

        return {
            operations,
            types,
            bedrooms: getParamNumber('beds'),
            bathrooms: getParamNumber('baths'),
            parking: getParamNumber('parking'),
            minPrice: getParamStringNum('minPrice'),
            maxPrice: getParamStringNum('maxPrice'),
            minArea: getParamStringNum('minArea'),
            maxArea: getParamStringNum('maxArea'),
            cities,
            neighborhoods,
            searchQuery: queryParam || ''
        };
    });

    // Read cidade param for backwards compatibility (for filtering)
    const cidadeParam = searchParams.get('cidade');

    // Sync filters to URL (preserve mode param for dashboard)
    const modeParam = searchParams.get('mode');
    useEffect(() => {
        const params: any = {};
        if (filters.operations.length) params.ops = filters.operations.join(',');
        if (filters.types.length) params.types = filters.types.join(',');
        if (filters.bedrooms) params.beds = filters.bedrooms;
        if (filters.bathrooms) params.baths = filters.bathrooms;
        if (filters.parking) params.parking = filters.parking;
        if (filters.minPrice !== '') params.minPrice = filters.minPrice;
        if (filters.maxPrice !== '') params.maxPrice = filters.maxPrice;
        if (filters.minArea !== '') params.minArea = filters.minArea;
        if (filters.maxArea !== '') params.maxArea = filters.maxArea;
        if (filters.cities.length) params.cities = filters.cities.join(',');
        if (filters.neighborhoods.length) params.neighborhoods = filters.neighborhoods.join(',');
        if (filters.searchQuery) params.q = filters.searchQuery;

        // Preserve mode param for dashboard (market mode)
        if (modeParam) params.mode = modeParam;

        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams, modeParam]);

    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [showMap, setShowMap] = useState(true); // Default map open on desktop

    // Fetch initial data (types, neighborhoods)
    useEffect(() => {
        fetchPropertyTypes();
        fetchNeighborhoods();
    }, []);

    // Fetch properties (public search only - all active)
    useEffect(() => {
        fetchProperties();
    }, []);


    // Dynamic Header - Public search only
    const { setHeaderContent } = useHeader();
    useEffect(() => {
        const title = 'Buscar Imóveis';
        const subtitle = 'Encontre o imóvel ideal para sua Família.';

        setHeaderContent(
            <div className="flex flex-col justify-center">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
                    {title}
                </h2>
                <p className="text-slate-400 text-xs font-medium leading-tight">
                    {subtitle}
                </p>
            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent]);


    const fetchPropertyTypes = async () => {
        const { data } = await supabase.from('tipo_imovel').select('tipo, disponivel_temporada').order('tipo');
        if (data) setPropertyTypes(data);
    };

    const fetchNeighborhoods = async () => {
        // Fetch distinct neighborhoods. This is a bit heavy, realistically should be an RPC or distinct query.
        // For now, grabbing from recent active ads is a safe enough proxy or using a separate table if exists.
        // We'll query 'anuncios' and extract unique neighborhoods.
        const { data } = await supabase
            .from('anuncios')
            .select('bairro')
            .eq('status', 'ativo')
            .not('bairro', 'is', null);

        if (data) {
            const unique = Array.from(new Set(data.map(i => i.bairro))).sort();
            setAllNeighborhoods(unique);
        }
    };


    const fetchProperties = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('anuncios')
                .select(`
                    *,
                    tipo_imovel!inner (tipo),
                    operacao (tipo)
                `)
                .order('created_at', { ascending: false });

            // Base Filters - Public search only shows active properties
            query = query.eq('status', 'ativo');

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                // Map to format
                const formatted = data.map(p => ({
                    id: p.id,
                    cod_imovel: p.cod_imovel,
                    titulo: p.titulo,
                    cidade: p.cidade,
                    bairro: p.bairro,
                    logradouro: p.logradouro, // Endereco
                    valor_venda: p.valor_venda,
                    valor_locacao: p.valor_locacao,
                    valor_diaria: p.valor_diaria,
                    valor_mensal: p.valor_mensal,
                    fotos: p.fotos ? p.fotos.split(',') : [],
                    operacao: p.operacao?.tipo || p.operacao,
                    tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                    caracteristicas: p.caracteristicas || '', // Amenidades como piscina, churrasqueira, etc
                    quartos: p.quartos,
                    banheiros: p.banheiros,
                    vagas: p.vagas,
                    area_priv: p.area_priv,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    user_id: p.user_id,
                    status: p.status
                }));
                setProperties(formatted);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    // Derived Data for Dynamic Filters (from ALL active properties matching base context)
    const { availableOperations, availableTypes, availableCities, availableNeighborhoods } = useMemo(() => {
        const ops = new Set<string>();
        const types = new Set<string>();
        const cities = new Set<string>();
        const neighs = new Set<string>();

        properties.forEach(p => {
            // Extract Operation
            const op = p.operacao?.toLowerCase();
            if (op) {
                if (op.includes('venda')) ops.add('venda');
                if (op.includes('locac') || op.includes('locaç')) ops.add('locacao');
                if (op.includes('temporada')) ops.add('temporada');
            }

            // Extract Type
            const type = typeof p.tipo_imovel === 'string' ? p.tipo_imovel : p.tipo_imovel?.tipo;
            if (type) types.add(type);

            // Extract City
            if (p.cidade) cities.add(p.cidade);

            // Extract Neighborhood
            if (p.bairro) neighs.add(p.bairro);
        });

        return {
            availableOperations: Array.from(ops),
            availableTypes: Array.from(types).sort(),
            availableCities: Array.from(cities).sort(),
            availableNeighborhoods: Array.from(neighs).sort()
        };
    }, [properties]);

    // Client-side filtering because Supabase doesn't support complex OR filters easily with JSON joins in SDK without complex builder
    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            // City filter
            if (filters.cities.length > 0) {
                if (!p.cidade || !filters.cities.some(c => c.toLowerCase() === p.cidade.toLowerCase())) {
                    return false;
                }
            }

            // Operation
            if (filters.operations.length > 0) {
                const op = p.operacao.toLowerCase();
                // Handle 'Venda/Locação' matching 'venda' or 'locacao'
                const matches = filters.operations.some(filterOp => {
                    if (filterOp === 'venda') return op.includes('venda');
                    if (filterOp === 'locacao' || filterOp === 'locação') return op.includes('locac') || op.includes('locaç');
                    return op.includes(filterOp);
                });
                if (!matches) return false;
            }

            // Type (case-insensitive comparison)
            if (filters.types.length > 0) {
                const type = (typeof p.tipo_imovel === 'string' ? p.tipo_imovel : p.tipo_imovel?.tipo) || '';
                const matches = filters.types.some(filterType =>
                    type.toLowerCase() === filterType.toLowerCase()
                );
                if (!matches) return false;
            }

            // Neighborhoods
            if (filters.neighborhoods.length > 0) {
                if (!filters.neighborhoods.includes(p.bairro)) return false;
            }

            // Text Search (searchQuery) - matches cidade, bairro, titulo, endereco, tipo_imovel, caracteristicas
            if (filters.searchQuery && filters.searchQuery.trim() !== '') {
                const query = filters.searchQuery.toLowerCase().trim();
                const matchesCidade = p.cidade?.toLowerCase().includes(query);
                const matchesBairro = p.bairro?.toLowerCase().includes(query);
                const matchesTitulo = p.titulo?.toLowerCase().includes(query);
                const matchesEndereco = p.logradouro?.toLowerCase().includes(query);
                const matchesTipo = (typeof p.tipo_imovel === 'string' ? p.tipo_imovel : p.tipo_imovel?.tipo)?.toLowerCase().includes(query);
                const matchesCaracteristicas = p.caracteristicas?.toLowerCase().includes(query);

                if (!matchesCidade && !matchesBairro && !matchesTitulo && !matchesEndereco && !matchesTipo && !matchesCaracteristicas) {
                    return false;
                }
            }

            // Rooms (Bedrooms, Bathrooms, Parking - Logic 4+ matches >= 4)
            if (filters.bedrooms !== null) {
                if (filters.bedrooms === 4) { if ((p.quartos || 0) < 4) return false; }
                else { if ((p.quartos || 0) !== filters.bedrooms) return false; }
            }
            if (filters.bathrooms !== null) {
                if (filters.bathrooms === 4) { if ((p.banheiros || 0) < 4) return false; }
                else { if ((p.banheiros || 0) !== filters.bathrooms) return false; }
            }
            if (filters.parking !== null) {
                if (filters.parking === 4) { if ((p.vagas || 0) < 4) return false; }
                else { if ((p.vagas || 0) !== filters.parking) return false; }
            }

            // Price
            const price = p.valor_venda || p.valor_locacao || p.valor_diaria || 0;
            if (filters.minPrice !== '' && price < Number(filters.minPrice)) return false;
            if (filters.maxPrice !== '' && price > Number(filters.maxPrice)) return false;

            // Area
            const area = p.area_priv || 0;
            if (filters.minArea !== '' && area < Number(filters.minArea)) return false;
            if (filters.maxArea !== '' && area > Number(filters.maxArea)) return false;

            return true;
        });
    }, [properties, filters, cidadeParam]);

    // Sorted
    const sortedProperties = useMemo(() => {
        let sorted = [...filteredProperties];
        if (sortConfig) {
            sorted.sort((a, b) => {
                // Simple sort logic for now
                const valA = a[sortConfig.key] || 0;
                const valB = b[sortConfig.key] || 0;
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            });
        }
        return sorted;
    }, [filteredProperties, sortConfig]);


    // View Properties (Paginated for List)
    const viewProperties = useMemo(() => {
        // Show only last 6 for the grid list, as requested for "little space"
        return sortedProperties.slice(0, 6);
    }, [sortedProperties]);

    const heroBackground = useMemo(() => getRandomBackground(), []);

    return (
        <div className="bg-slate-950 min-h-screen flex flex-col">

            {/* Hero Section - Public Search */}
            <div className="relative py-24 md:py-32 bg-slate-900">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-50"
                    style={{ backgroundImage: `url(${heroBackground})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>

                {/* Botão Voltar */}
                <div className="container mx-auto px-4 relative z-10 mb-12">
                    <div className="absolute top-0 left-4 md:left-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-medium backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft size={18} />
                            Voltar
                        </button>
                    </div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center mt-8">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Encontre <span className="text-emerald-400">seu Imóvel</span>
                    </h2>
                    <p className="text-slate-200 max-w- text-center text-xl">
                        Utilize os filtros para encontrar o imóvel ideal para você e sua Família.
                    </p>
                </div>
            </div>

            <div className="flex-1 container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar (Desktop) */}
                    <aside className="hidden lg:block w-80 shrink-0">
                        <div className="sticky top-24 bg-slate-900 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                            <div className="p-5 border-b border-white/5 bg-slate-800/50">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Filter size={18} className="text-emerald-400" />
                                    Filtros
                                </h3>
                            </div>
                            <SidebarFilter
                                filters={filters}
                                setFilters={setFilters}
                                availableCities={availableCities}
                                availableNeighborhoods={availableNeighborhoods}
                                availableOperations={availableOperations}
                                availableTypes={availableTypes}
                                totalResults={filteredProperties.length}
                            />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">

                        {/* Map Toggle & Mobile Filter Button */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-white hidden md:block">
                                {filteredProperties.length} Imóveis Encontrados
                            </h2>

                            {/* Mobile Filter Toggle */}
                            <button
                                onClick={() => setShowMobileFilter(true)}
                                className="lg:hidden flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Filter size={20} />
                                Filtrar ({filteredProperties.length})
                            </button>

                            {/* View & Sort Controls */}
                            <div className="flex items-center gap-3 ml-auto">
                                <button
                                    onClick={() => setShowMap(!showMap)}
                                    className={`px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all ${showMap
                                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                                >
                                    <MapIcon size={16} />
                                    {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
                                </button>

                                <div className="h-8 w-px bg-white/10 mx-1"></div>

                                <select
                                    onChange={(e) => {
                                        const [key, dir] = e.target.value.split('-');
                                        setSortConfig({ key, direction: dir as 'asc' | 'desc' });
                                    }}
                                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-emerald-500"
                                >
                                    <option value="">Ordenar por</option>
                                    <option value="valor_venda-asc">Menor Preço</option>
                                    <option value="valor_venda-desc">Maior Preço</option>
                                    <option value="area_priv-desc">Maior Área</option>
                                    <option value="created_at-desc">Mais Recentes</option>
                                </select>
                            </div>
                        </div>

                        {/* Map Section - Collapsible - SHOWS ALL FILTERED PROPERTIES */}
                        <AnimatePresence>
                            {showMap && filteredProperties.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 400, opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-8 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-0"
                                >
                                    <PropertyMap
                                        properties={filteredProperties}
                                        center={{ lat: -5.79448, lng: -35.211 }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Property Grid - SHOWS ONLY LAST 12 */}
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 size={40} className="text-emerald-500 animate-spin" />
                            </div>
                        ) : viewProperties.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {viewProperties.map(property => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-slate-900/50 rounded-3xl border border-white/5">
                                <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search size={32} className="text-slate-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Nenhum imóvel encontrado</h3>
                                <p className="text-slate-400 max-w-md mx-auto mb-6">
                                    Tente ajustar seus filtros para encontrar o que procura ou limpe a busca.
                                </p>
                                <button
                                    onClick={() => setFilters({
                                        operations: [], types: [], bedrooms: null, bathrooms: null, parking: null,
                                        minPrice: '', maxPrice: '', minArea: '', maxArea: '', cities: [], neighborhoods: [], searchQuery: ''
                                    })}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        )}

                        {/* Pagination Notice */}
                        {!loading && filteredProperties.length > viewProperties.length && (
                            <div className="mt-8 text-center text-slate-500 text-sm">
                                Mostrando os {viewProperties.length} imóveis mais recentes de {filteredProperties.length} encontrados.
                                <br />Utilize o mapa para visualizar todas as opções.
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal/Drawer */}
            <AnimatePresence>
                {showMobileFilter && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden"
                            onClick={() => setShowMobileFilter(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-slate-900 shadow-2xl border-r border-white/10 lg:hidden"
                        >
                            <SidebarFilter
                                filters={filters}
                                setFilters={setFilters}
                                availableCities={availableCities}
                                availableNeighborhoods={availableNeighborhoods}
                                availableOperations={availableOperations}
                                availableTypes={availableTypes}
                                totalResults={filteredProperties.length}
                                onClose={() => setShowMobileFilter(false)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}

