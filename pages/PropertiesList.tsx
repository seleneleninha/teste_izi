import React, { useState, useEffect } from 'react';
import { MOCK_PROPERTIES } from '../constants';
import { MapPin, Bed, Bath, Square, Filter, Search, Grid, Map as MapIcon, CheckSquare, Loader2, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PropertyCard } from '../components/PropertyCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { PropertyMap } from '../components/PropertyMap';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { Footer } from '../components/Footer';

export const PropertiesList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, role } = useAuth();
    const { addToast } = useToast();
    const [view, setView] = useState<'grid' | 'map'>('grid');
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [propertyTypes, setPropertyTypes] = useState<{ tipo: string; disponivel_temporada: boolean }[]>([]);

    // Tipos padrão para Comprar/Alugar (sem temporada)
    const standardTypes = ['Apartamento', 'Casa', 'Comercial', 'Rural', 'Terreno'];

    // Filters
    const [selectedType, setSelectedType] = useState('');
    const [selectedPriceRange, setSelectedPriceRange] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOperation, setSelectedOperation] = useState('');

    // Determine context based on route
    const isDashboardRoute = location.pathname === '/properties';

    const searchParams = new URLSearchParams(location.search);
    const isMarketMode = searchParams.get('mode') === 'market';

    // "My Properties" mode only applies if we are on the dashboard route AND not a client AND not in market mode
    const isMyProperties = isDashboardRoute && role !== 'Cliente' && !isMarketMode;

    // Consolidated effect to handle URL params and fetching
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const typeParam = params.get('tipo') || '';
        let qParam = params.get('q') || '';
        const viewParam = params.get('view');
        const operacaoParam = params.get('operacao') || '';
        const priceParam = params.get('price') || '';
        const cidadeParam = params.get('cidade');
        const bairroParam = params.get('bairro');
        const brokerParam = params.get('broker') || '';

        // If city or neighborhood params exist, use them as search term if q is empty
        if (!qParam) {
            if (cidadeParam) qParam = cidadeParam;
            if (bairroParam) qParam = bairroParam;
        }

        setSelectedType(typeParam);
        setSearchTerm(qParam);
        if (viewParam === 'map') setView('map');
        setSelectedOperation(operacaoParam);
        setSelectedPriceRange(priceParam);

        // Fetch properties with these params directly to avoid race conditions
        fetchProperties(typeParam, operacaoParam, qParam, priceParam, brokerParam);
    }, [location.search, isMyProperties, user]);

    useEffect(() => {
        fetchPropertyTypes();
    }, []);

    const fetchPropertyTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('tipo_imovel')
                .select('tipo, disponivel_temporada')
                .order('tipo');

            if (error) throw error;
            if (data) {
                setPropertyTypes(data);
            }
        } catch (error) {
            console.error('Error fetching property types:', error);
        }
    };

    // Filtrar tipos baseado na operação selecionada
    const filteredPropertyTypes = propertyTypes.filter(type => {
        if (selectedOperation === 'temporada') {
            // Temporada: mostrar apenas tipos com disponivel_temporada = true
            return type.disponivel_temporada === true;
        } else {
            // Comprar/Alugar: mostrar apenas os 5 tipos padrão
            return standardTypes.some(st => st.toLowerCase() === type.tipo.toLowerCase());
        }
    });

    const fetchProperties = async (
        typeOverride?: string,
        operacaoOverride?: string,
        termOverride?: string,
        priceOverride?: string,
        brokerSlugOverride?: string
    ) => {
        setLoading(true);
        try {
            // Use overrides if provided, otherwise use state
            const type = typeOverride !== undefined ? typeOverride : selectedType;
            const operacao = operacaoOverride !== undefined ? operacaoOverride : selectedOperation;
            const term = termOverride !== undefined ? termOverride : searchTerm;
            const priceRange = priceOverride !== undefined ? priceOverride : selectedPriceRange;
            const brokerSlug = brokerSlugOverride !== undefined ? brokerSlugOverride : '';

            // If broker slug is provided, fetch broker's properties and partnerships
            if (brokerSlug) {
                // First, get broker's user_id from slug
                const { data: brokerData, error: brokerError } = await supabase
                    .from('perfis')
                    .select('id')
                    .eq('slug', brokerSlug)
                    .single();

                if (brokerError || !brokerData) {
                    console.error('Error fetching broker:', brokerError);
                    setLoading(false);
                    return;
                }

                const brokerId = brokerData.id;

                // Fetch broker's own properties
                let ownPropertiesQuery = supabase
                    .from('anuncios')
                    .select(`
                        *,
                        tipo_imovel!inner (
                            tipo
                        ),
                        operacao (
                            tipo
                        )
                    `)
                    .eq('user_id', brokerId)
                    .eq('status_aprovacao', 'aprovado')
                    .order('created_at', { ascending: false });

                // Fetch partnership properties
                const { data: partnershipsData } = await supabase
                    .from('parcerias')
                    .select('property_id')
                    .eq('user_id', brokerId);

                const partnershipPropertyIds = partnershipsData?.map(p => p.property_id) || [];

                let partnerPropertiesQuery = partnershipPropertyIds.length > 0
                    ? supabase
                        .from('anuncios')
                        .select(`
                            *,
                            tipo_imovel!inner (
                                tipo
                            ),
                            operacao (
                                tipo
                            )
                        `)
                        .in('id', partnershipPropertyIds)
                        .eq('status_aprovacao', 'aprovado')
                        .order('created_at', { ascending: false })
                    : null;

                // Execute queries
                const [ownResult, partnerResult] = await Promise.all([
                    ownPropertiesQuery,
                    partnerPropertiesQuery
                ]);

                // Combine results
                const combinedData = [
                    ...(ownResult.data || []),
                    ...(partnerResult?.data || [])
                ];

                // Remove duplicates by id
                const uniqueData = Array.from(new Map(combinedData.map(item => [item.id, item])).values());

                // Apply filters
                let filteredData = uniqueData;

                if (type) {
                    filteredData = filteredData.filter(p =>
                        p.tipo_imovel?.tipo?.toLowerCase().includes(type.toLowerCase())
                    );
                }

                if (term) {
                    const searchLower = term.toLowerCase();
                    filteredData = filteredData.filter(p =>
                        p.titulo?.toLowerCase().includes(searchLower) ||
                        p.descricao?.toLowerCase().includes(searchLower) ||
                        p.bairro?.toLowerCase().includes(searchLower) ||
                        p.cidade?.toLowerCase().includes(searchLower) ||
                        p.uf?.toLowerCase().includes(searchLower)
                    );
                }

                if (operacao) {
                    filteredData = filteredData.filter(p => {
                        const operacaoTipo = p.operacao?.tipo?.toLowerCase();
                        if (operacao === 'venda') {
                            return operacaoTipo === 'venda' || operacaoTipo === 'venda/locação' || operacaoTipo === 'venda/locacao';
                        } else if (operacao === 'locacao') {
                            return operacaoTipo === 'locação' || operacaoTipo === 'locacao' || operacaoTipo === 'venda/locação' || operacaoTipo === 'venda/locacao';
                        } else if (operacao === 'temporada') {
                            return operacaoTipo === 'temporada';
                        }
                        return true;
                    });
                }

                if (priceRange) {
                    const [min, max] = priceRange.split('-').map(Number);
                    filteredData = filteredData.filter(p => {
                        const price = p.valor_venda || p.valor_locacao || 0;
                        return price >= min && price <= max;
                    });
                }

                const formattedProperties = filteredData.map(p => ({
                    id: p.id,
                    cod_imovel: p.cod_imovel,
                    titulo: p.titulo,
                    cidade: p.cidade,
                    bairro: p.bairro,
                    valor_venda: p.valor_venda,
                    valor_locacao: p.valor_locacao,
                    valor_diaria: p.valor_diaria,
                    valor_mensal: p.valor_mensal,
                    fotos: p.fotos ? p.fotos.split(',') : [],
                    operacao: p.operacao?.tipo || p.operacao,
                    tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                    quartos: p.quartos,
                    banheiros: p.banheiros,
                    vagas: p.vagas,
                    area_priv: p.area_priv,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    user_id: p.user_id,
                    status_aprovacao: p.status_aprovacao
                }));

                setProperties(formattedProperties);
                setLoading(false);
                return;
            }

            // Regular query (no broker filter)
            let query = supabase
                .from('anuncios')
                .select(`
                    *,
                    tipo_imovel!inner (
                        tipo
                    ),
                    operacao (
                        tipo
                    )
                `)
                .order('created_at', { ascending: false });

            // Filter by user if on "Meus Imóveis"
            if (isMyProperties && user) {
                query = query.eq('user_id', user.id);
                query = query.neq('status_aprovacao', 'inativo');
            } else {
                query = query.neq('status_aprovacao', 'inativo');
            }

            // Apply filters using local variables
            if (type) {
                // Use ilike for case-insensitive matching
                query = query.ilike('tipo_imovel.tipo', type);
            }
            if (term) {
                const searchFilter = `titulo.ilike.%${term}%,descricao.ilike.%${term}%,bairro.ilike.%${term}%,cidade.ilike.%${term}%,uf.ilike.%${term}%`;
                query = query.or(searchFilter);
            }

            const { data, error } = await query;

            if (data) {
                let filteredData = data;

                // Client-side filtering for complex relations or logic
                if (operacao) {
                    filteredData = filteredData.filter(p => {
                        const operacaoTipo = p.operacao?.tipo?.toLowerCase();
                        if (operacao === 'venda') {
                            return operacaoTipo === 'venda' || operacaoTipo === 'venda/locação' || operacaoTipo === 'venda/locacao';
                        } else if (operacao === 'locacao') {
                            return operacaoTipo === 'locação' || operacaoTipo === 'locacao' || operacaoTipo === 'venda/locação' || operacaoTipo === 'venda/locacao';
                        } else if (operacao === 'temporada') {
                            return operacaoTipo === 'temporada';
                        }
                        return true;
                    });
                }
                if (priceRange) {
                    const [min, max] = priceRange.split('-').map(Number);
                    filteredData = filteredData.filter(p => {
                        const price = p.valor_venda || p.valor_locacao || 0;
                        return price >= min && price <= max;
                    });
                }

                const formattedProperties = filteredData.map(p => ({
                    id: p.id,
                    cod_imovel: p.cod_imovel,
                    titulo: p.titulo,
                    cidade: p.cidade,
                    bairro: p.bairro,
                    valor_venda: p.valor_venda,
                    valor_locacao: p.valor_locacao,
                    valor_diaria: p.valor_diaria,
                    valor_mensal: p.valor_mensal,
                    fotos: p.fotos ? p.fotos.split(',') : [],
                    operacao: p.operacao?.tipo || p.operacao,
                    tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                    quartos: p.quartos,
                    banheiros: p.banheiros,
                    vagas: p.vagas,
                    area_priv: p.area_priv,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    user_id: p.user_id,
                    status_aprovacao: p.status_aprovacao
                }));
                setProperties(formattedProperties);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (!confirm('Tem certeza que deseja inativar este imóvel? Ele não aparecerá mais nas buscas.')) return;

        try {
            const { error } = await supabase
                .from('anuncios')
                .update({ status_aprovacao: 'inativo' })
                .eq('id', id)
                .eq('user_id', user?.id);

            if (error) throw error;

            addToast('Imóvel inativado com sucesso!', 'success');
            fetchProperties(); // Refresh list
        } catch (error) {
            console.error('Error inactivating property:', error);
            addToast('Erro ao inativar imóvel.', 'error');
        }
    };

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedProperties.includes(id)) {
            setSelectedProperties(prev => prev.filter(p => p !== id));
        } else {
            if (selectedProperties.length < 3) {
                setSelectedProperties(prev => [...prev, id]);
            } else {
                addToast('You can compare up to 3 properties.', 'warning');
            }
        }
    };

    const clearFilters = () => {
        setSelectedOperation('');
        setSelectedType('');
        setSelectedPriceRange('');
        setSearchTerm('');
        fetchProperties('', '', '', '', '');
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen flex flex-col">
            <div className="container mx-auto px-4 py-8 flex-1">
                {/* Header Controls */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {isMyProperties ? 'Meus Imóveis' : isMarketMode ? 'Mercado Imobiliário' : 'Buscar Imóveis'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {isMyProperties ? 'Gerencie seus anúncios.' : 'Explore oportunidades e parcerias.'}
                        </p>
                    </div>

                    <div className="w-full xl:w-auto flex flex-col md:flex-row gap-4">
                        {/* Filters Row */}
                        <div className="flex-1 grid grid-cols-2 md:flex gap-2">
                            <select
                                value={selectedOperation}
                                onChange={e => setSelectedOperation(e.target.value)}
                                className="col-span-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="" className="dark:bg-slate-800">Operação</option>
                                <option value="venda" className="dark:bg-slate-800">Venda</option>
                                <option value="locacao" className="dark:bg-slate-800">Locação</option>
                                <option value="temporada" className="dark:bg-slate-800">Temporada</option>
                            </select>
                            <select
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="col-span-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="" className="dark:bg-slate-800">Tipo</option>
                                {filteredPropertyTypes.map((type, idx) => (
                                    <option key={idx} value={type.tipo} className="dark:bg-slate-800">
                                        {type.tipo.charAt(0).toUpperCase() + type.tipo.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedPriceRange}
                                onChange={e => setSelectedPriceRange(e.target.value)}
                                className="col-span-2 md:w-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="" className="dark:bg-slate-800">Faixa de Preço</option>
                                <option value="0-200000" className="dark:bg-slate-800">até R$200mil</option>
                                <option value="200000-500000" className="dark:bg-slate-800">R$200k - R$500k</option>
                                <option value="500000-1000000" className="dark:bg-slate-800">R$500k - R$1M</option>
                                <option value="1000000-2000000" className="dark:bg-slate-800">R$1M - R$2M</option>
                                <option value="2000000-100000000" className="dark:bg-slate-800">acima de R$2M</option>
                            </select>
                        </div>

                        {/* Actions Row */}
                        <div className="flex gap-2 items-center justify-between md:justify-start">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchProperties()}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    <Search size={18} />
                                    <span className="hidden sm:inline">Buscar</span>
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="bg-red-500 dark:bg-red-700 text-white hover:bg-red-600 dark:hover:bg-red-600 font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <X size={18} />
                                    <span className="hidden sm:inline">Limpar</span>
                                </button>
                            </div>

                            <div className="h-8 w-px bg-gray-300 dark:bg-slate-700 hidden md:block mx-1"></div>

                            <div className="flex gap-2">
                                <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setView('grid')}
                                        className={`p-2 rounded-md transition-all ${view === 'grid' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                        title="Visualização Horizontal"
                                    >
                                        <Grid size={20} />
                                    </button>
                                    <button
                                        onClick={() => setView('map')}
                                        className={`p-2 rounded-md transition-all ${view === 'map' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                        title="Mapa"
                                    >
                                        <MapIcon size={20} />
                                    </button>
                                </div>

                                {user && (
                                    <button
                                        onClick={() => navigate('/add-property')}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
                                    >
                                        + Anunciar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-[400px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-emerald-500" size={48} />
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Nenhum imóvel encontrado.</p>
                            <p className="text-sm">Tente ajustar seus filtros.</p>
                        </div>
                    ) : (
                        <>
                            {view === 'map' ? (
                                <div className="h-[400px] rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-lg">
                                    <PropertyMap properties={properties} />
                                </div>
                            ) : view === 'grid' ? (
                                <div className="w-full">
                                    {/* Horizontal Scroll Layout */}
                                    <HorizontalScroll itemsPerPage={undefined} itemWidth={320}>
                                        {properties.map(prop => (
                                            <div key={prop.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                                <PropertyCard
                                                    property={prop}
                                                    showStatus={isMyProperties}
                                                    isDashboard={isDashboardRoute}
                                                    actions={
                                                        (user && prop.user_id === user.id) ? (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/add-property?id=${prop.id}`);
                                                                    }}
                                                                    className="flex-1 px-3 py-2 bg-yellow-600/10 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-600/20 flex items-center justify-center transition-colors"
                                                                >
                                                                    <Edit2 size={16} className="mr-1.5" /> Editar
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteProperty(prop.id);
                                                                    }}
                                                                    className="flex-1 px-3 py-2 bg-red-600/10 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/20 flex items-center justify-center transition-colors"
                                                                >
                                                                    <Trash2 size={16} className="mr-1.5" /> Inativar
                                                                </button>
                                                            </>
                                                        ) : undefined
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </HorizontalScroll>
                                </div>
                            ) : (
                                /* List View (Vertical Grid) */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {properties.map(prop => (
                                        <PropertyCard
                                            key={prop.id}
                                            property={prop}
                                            showStatus={isMyProperties}
                                            isDashboard={isDashboardRoute}
                                            actions={
                                                (user && prop.user_id === user.id) ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/add-property?id=${prop.id}`);
                                                            }}
                                                            className="flex-1 px-3 py-2 bg-yellow-600/10 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-600/20 flex items-center justify-center transition-colors"
                                                        >
                                                            <Edit2 size={16} className="mr-1.5" /> Editar
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteProperty(prop.id);
                                                            }}
                                                            className="flex-1 px-3 py-2 bg-red-600/10 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/20 flex items-center justify-center transition-colors"
                                                        >
                                                            <Trash2 size={16} className="mr-1.5" /> Inativar
                                                        </button>
                                                    </>
                                                ) : undefined
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
};