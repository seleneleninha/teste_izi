import React, { useState, useEffect } from 'react';
import { MOCK_PROPERTIES } from '../constants';
import { MapPin, Bed, Bath, Square, Filter, Search, Grid, Map as MapIcon, CheckSquare, Loader2, Edit2, Trash2, X, TrendingUp, Key, Pause, AlertTriangle, Home, ChevronDown, List, UserCheck, UserX, BedDouble, Car, Ruler, ArrowUp, ArrowDown, Eye, Globe } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PropertyCard } from '../components/PropertyCard';
import { NoPropertiesFound } from '../components/NoPropertiesFound';
import { useNavigate, useLocation } from 'react-router-dom';
import { PropertyMap } from '../components/PropertyMap';
import { getRandomBackground } from '../lib/backgrounds';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { Footer } from '../components/Footer';
import { DeactivatePropertyModal } from '../components/DeactivatePropertyModal';
import { useHeader } from '../components/HeaderContext';
import { generatePropertySlug } from '../lib/formatters';
import { div } from 'framer-motion/client';

export const PropertiesList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, role } = useAuth();
    const { addToast } = useToast();

    // Determine context based on route
    const isDashboardRoute = location.pathname === '/properties';

    const [view, setView] = useState<'grid' | 'map' | 'list'>(role === 'Cliente' ? 'grid' : (isDashboardRoute ? 'list' : 'grid')); // Default to Grid for public/clients, List for Command Center (brokers/admins)
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [propertyTypes, setPropertyTypes] = useState<{ tipo: string; disponivel_temporada: boolean }[]>([]);

    // Modal de inativação
    const [deactivateModal, setDeactivateModal] = useState<{ isOpen: boolean; propertyId: string; propertyTitle: string }>({
        isOpen: false,
        propertyId: '',
        propertyTitle: ''
    });

    // Tipos padrão para Comprar/Alugar (sem temporada)
    const standardTypes = ['Apartamento', 'Casa', 'Comercial', 'Rural', 'Terreno'];

    // Filters
    const [selectedType, setSelectedType] = useState('');
    const [selectedPriceRange, setSelectedPriceRange] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOperation, setSelectedOperation] = useState('');

    // Status Filter - Default to TODOS
    const [statusFilter, setStatusFilter] = useState<string>('todos');

    // Broker's state for market mode filtering
    const [brokerUF, setBrokerUF] = useState<string | null>(null);

    // Estatísticas - NOVO
    const [stats, setStats] = useState({
        ativos: 0,
        vendas: 0,
        locacoes: 0,
        standby: 0,
        perdidos: 0,
        total: 0
    });

    // Seções expandidas - NOVO
    const [expandedSections, setExpandedSections] = useState<string[]>(['ativo']); // Ativos expandido por padrão
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

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


    // Dynamic Header
    const { setHeaderContent } = useHeader();
    useEffect(() => {
        const title = isMyProperties ? 'Meus Imóveis' : isMarketMode ? 'Mercado Imobiliário' : 'Buscar Imóveis';
        const subtitle = isMyProperties ? 'Gerencie e mantenha seus anúncios atualizados.' : isMarketMode ? 'Você está visualizando todos os imóveis de sua Cidade' : 'Encontre o imóvel ideal para sua Família.';

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
    }, [isMyProperties, isMarketMode, setHeaderContent]);

    // Fetch broker's state (UF) when in Market Mode
    useEffect(() => {
        const fetchBrokerUF = async () => {
            if (isMarketMode && user) {
                const { data, error } = await supabase
                    .from('perfis')
                    .select('uf')
                    .eq('id', user.id)
                    .maybeSingle();

                if (data && !error) {
                    setBrokerUF(data.uf);
                }
            }
        };

        fetchBrokerUF();
    }, [isMarketMode, user]);

    // Calcular estatísticas após carregar properties - NOVO
    useEffect(() => {
        if (properties.length > 0 && isMyProperties) {
            setStats({
                ativos: properties.filter(p => p.status === 'ativo' || !p.status).length,
                vendas: properties.filter(p => p.status === 'venda_faturada').length,
                locacoes: properties.filter(p => p.status === 'locacao_faturada').length,
                standby: properties.filter(p => p.status === 'imovel_espera').length,
                perdidos: properties.filter(p => p.status === 'imovel_perdido').length,
                total: properties.length
            });
        }
    }, [properties, isMyProperties]);

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
                    .eq('status', 'ativo')
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
                        .eq('status', 'ativo')
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
                    status: p.status
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
                query = query.neq('status', 'inativo');
                // NÃO filtrar por status - corretor quer ver todos os seus imóveis
            } else {
                // Para visitantes: apenas imóveis ativos
                query = query.eq('status', 'ativo');

                // Para Market Mode: filtrar por estado do corretor
                if (isMarketMode && brokerUF) {
                    query = query.eq('uf', brokerUF);
                }
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
                    status: p.status
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
                .update({ status: 'inativo' })
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
                addToast('Você pode comparar até 3 imóveis.', 'warning');
            }
        }
    };

    const clearFilters = () => {
        setSelectedOperation('');
        setSelectedType('');
        setSelectedPriceRange('');
        setSearchTerm('');
        setStatusFilter('todos');
        fetchProperties('', '', '', '', '');
    };

    // Toggle de seção colapsável - NOVO
    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedProperties = React.useMemo(() => {
        // Apply Status Filter (Client-side)
        let filtered = properties;
        if (statusFilter !== 'todos') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        let sortableProperties = [...filtered];

        // Auto-sort by price (ascending) when price filter is active
        if (selectedPriceRange) {
            sortableProperties.sort((a, b) => {
                const priceA = a.valor_venda || a.valor_locacao || a.valor_diaria || a.valor_mensal || 0;
                const priceB = b.valor_venda || b.valor_locacao || b.valor_diaria || b.valor_mensal || 0;
                return priceA - priceB; // Ascending order (cheapest first)
            });
        }
        // Apply manual sorting if configured (and price filter is NOT active)
        else if (sortConfig !== null) {
            sortableProperties.sort((a, b) => {
                // Handle nested properties or specific keys
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Example: Values might be strings or numbers
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableProperties;
    }, [properties, sortConfig, statusFilter, selectedPriceRange]);

    const [backgroundImage] = useState(() => {
        return getRandomBackground();
    });

    return (
        <div className="bg-slate-900 min-h-screen flex flex-col">
            {/* Public Hero Section - Only for /search or /buscar */}
            {!isDashboardRoute && (
                <div className="relative py-16 md:py-24 overflow-hidden">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${backgroundImage})` }}
                    />

                    {/* Dark Overlay Mask */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-black/40 to-midnight-950/95" />

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-medium backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Voltar
                    </button>

                    <div className="container mx-auto px-4 relative z-20 text-center">
                        <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 animate-in slide-in-from-top duration-700 drop-shadow-2xl mt-10">
                            Encontre o Imóvel <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                dos seus Sonhos
                            </span>
                        </h1>
                        <p className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-in fade-in duration-1000 delay-300 drop-shadow-lg">
                            Várias oportunidades exclusivas para compra, locação ou temporada em um só lugar.
                        </p>
                    </div>
                </div>
            )}

            <div className={`container mx-auto px-4 ${!isDashboardRoute ? '-mt-12 md:-mt-16 relative z-30 pb-12' : 'py-8'} flex-1`}>
                {/* Header Controls */}
                <div className={`${(!isDashboardRoute || isMyProperties || isMarketMode) ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-[2.5rem] shadow-2xl mb-8' : 'flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6'}`}>
                    {/* Header Card UI for Meus Imóveis - Matching PartnerProperties pattern */}
                    {isMyProperties && (
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                    <Filter size={20} className="text-emerald-400" />
                                </div>
                                Filtros de Gestão
                            </h3>
                            <span className="bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5 font-black text-slate-300 text-[10px] uppercase tracking-widest">
                                {properties.length} {properties.length === 1 ? 'imóvel' : 'imóveis'}
                            </span>
                        </div>
                    )}

                    {isMarketMode && (
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                                    <Globe size={20} className="text-blue-400" />
                                </div>
                                Filtros do Mercado
                            </h3>
                            <span className="bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5 font-black text-slate-300 text-[10px] uppercase tracking-widest">
                                {properties.length} {properties.length === 1 ? 'imóvel' : 'imóveis'}
                            </span>
                        </div>
                    )}

                    {/* Filtros Container */}
                    <div className={`w-full ${!isDashboardRoute ? 'flex flex-col xl:flex-row xl:items-center gap-4' : 'flex flex-col gap-6'}`}>
                        {/* Linha 1: Filtros de Seleção */}
                        <div className={`grid ${!isDashboardRoute
                            ? 'grid-cols-1 md:grid-cols-3 w-full xl:flex-1'
                            : (isMyProperties || isMarketMode ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap xl:items-center')
                            } gap-4`}>
                            {/* Operação */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest leading-none">Operação</label>
                                <select
                                    value={selectedOperation}
                                    onChange={e => setSelectedOperation(e.target.value)}
                                    className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3.5 text-gray-300 text-sm cursor-pointer focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all w-full font-medium"
                                >
                                    <option value="" className="bg-slate-900 text-slate-500 italic">Todas Operações</option>
                                    <option value="venda" className="bg-slate-900 text-white">Venda</option>
                                    <option value="locacao" className="bg-slate-900 text-white">Locação</option>
                                    <option value="temporada" className="bg-slate-900 text-white">Temporada</option>
                                </select>
                            </div>

                            {/* Tipo */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest leading-none">Tipo</label>
                                <select
                                    value={selectedType}
                                    onChange={e => setSelectedType(e.target.value)}
                                    className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3.5 text-gray-300 text-sm cursor-pointer focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all w-full font-medium"
                                >
                                    <option value="" className="bg-slate-900 text-slate-500 italic">Todos os Tipos</option>
                                    {filteredPropertyTypes.map((type, idx) => (
                                        <option key={idx} value={type.tipo} className="bg-slate-900 text-white">
                                            {type.tipo.charAt(0).toUpperCase() + type.tipo.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Preço */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest leading-none">Preço</label>
                                <select
                                    value={selectedPriceRange}
                                    onChange={e => setSelectedPriceRange(e.target.value)}
                                    className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3.5 text-gray-300 text-sm cursor-pointer focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all w-full font-medium"
                                >
                                    <option value="" className="bg-slate-900 text-slate-500 italic">Faixa de Preço</option>
                                    <option value="0-200000" className="bg-slate-900 text-white">Até R$200mil</option>
                                    <option value="200000-500000" className="bg-slate-900 text-white">R$200mil - R$500mil</option>
                                    <option value="500000-1000000" className="bg-slate-900 text-white">R$500mil - R$1M</option>
                                    <option value="1000000-2000000" className="bg-slate-900 text-white">R$1M - R$2M</option>
                                    <option value="2000000-999999999" className="bg-slate-900 text-white">Acima de R$2M</option>
                                </select>
                            </div>

                            {/* Status Filter for Meus Imóveis */}
                            {isMyProperties && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest leading-none">Status</label>
                                    <div className="relative w-full z-40">
                                        <button
                                            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all bg-slate-900/60 ${statusDropdownOpen ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-white/5'}`}
                                        >
                                            <span className="font-bold text-white text-sm truncate uppercase tracking-tighter">
                                                {statusFilter === 'todos' ? 'Todos' :
                                                    statusFilter === 'pendente' ? 'Pendentes' :
                                                        statusFilter === 'reprovado' ? 'Reprovados' :
                                                            statusFilter === 'ativo' ? 'Ativos' :
                                                                statusFilter === 'venda_faturada' ? 'Vendidos' :
                                                                    statusFilter === 'locacao_faturada' ? 'Alugados' :
                                                                        statusFilter === 'imovel_espera' ? 'Standby' :
                                                                            statusFilter === 'imovel_perdido' ? 'Perdidos' : statusFilter
                                                }
                                            </span>
                                            <ChevronDown size={14} className={`transition-transform duration-300 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {statusDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-30" onClick={() => setStatusDropdownOpen(false)} />
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                                                    {[
                                                        { value: 'todos', label: 'Todos', count: stats.total },
                                                        { value: 'pendente', label: 'Pendentes', count: properties.filter(p => p.status === 'pendente').length },
                                                        { value: 'reprovado', label: 'Reprovados', count: properties.filter(p => p.status === 'reprovado').length },
                                                        { value: 'ativo', label: 'Ativos', count: stats.ativos },
                                                        { value: 'venda_faturada', label: 'Vendidos', count: stats.vendas },
                                                        { value: 'locacao_faturada', label: 'Alugados', count: stats.locacoes },
                                                        { value: 'imovel_espera', label: 'Standby', count: stats.standby },
                                                        { value: 'imovel_perdido', label: 'Perdidos', count: stats.perdidos }
                                                    ].filter(opt => opt.count > 0 || opt.value === 'todos').map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => { setStatusFilter(opt.value); setStatusDropdownOpen(false); }}
                                                            className={`w-full flex items-center justify-between p-4 hover:bg-slate-700 transition-colors border-b border-white/5 last:border-0 ${statusFilter === opt.value ? 'bg-slate-700/50' : ''}`}
                                                        >
                                                            <span className={`text-sm font-bold ${statusFilter === opt.value ? 'text-emerald-400' : 'text-slate-300'}`}>{opt.label}</span>
                                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-500">{opt.count}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Linha 2: Botões de Ação - SEPARADA do grid de filtros */}
                        <div className={`${!isDashboardRoute
                            ? 'flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto shrink-0 mt-3 xl:mt-5'
                            : 'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-white/5'
                            }`}>
                            {/* Buscar / Limpar */}
                            <div className={`flex items-center gap-2 ${!isDashboardRoute ? 'w-full sm:w-auto' : ''}`}>
                                <button
                                    onClick={() => fetchProperties()}
                                    className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 ${!isDashboardRoute ? 'flex-1 sm:flex-none' : 'flex-1 sm:flex-none'}`}
                                >
                                    <Search size={16} />
                                    <span className="uppercase text-xs tracking-wide">Buscar</span>
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className={`px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${!isDashboardRoute ? 'flex-1 sm:flex-none' : 'flex-1 sm:flex-none'}`}
                                >
                                    <X size={16} />
                                    <span className="uppercase text-xs tracking-wide">Limpar</span>
                                </button>
                            </div>

                            {/* View Switcher */}
                            <div className="flex bg-slate-900 px-1 py-1 border border-slate-700 rounded-xl self-start sm:self-center">
                                <button
                                    onClick={() => setView('grid')}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all font-bold text-xs ${view === 'grid' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Grid size={16} />
                                    <span className="hidden sm:inline">Cards</span>
                                </button>
                                {isDashboardRoute && (
                                    <button
                                        onClick={() => setView('list')}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all font-bold text-xs ${view === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <List size={16} />
                                        <span className="hidden sm:inline">Lista</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setView('map')}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all font-bold text-xs ${view === 'map' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <MapIcon size={16} />
                                    <span className="hidden sm:inline">Mapa</span>
                                </button>
                            </div>

                            {/* Botão de Anunciar */}
                            {(isDashboardRoute && role !== 'Cliente') && (
                                <button
                                    onClick={() => navigate('/add-property')}
                                    className="sm:ml-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 border border-white/10"
                                >
                                    <Home size={16} />
                                    <span className="text-xs uppercase tracking-wide whitespace-nowrap">Anunciar Imóvel</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Universal Counter - Shows property count for ALL contexts */}
            {!loading && properties.length > 0 && (
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <div className="w-2 h-8 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40"></div>
                            {properties.length} {properties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
                        </h2>
                        <span className="bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5 font-black text-slate-300 text-[10px] uppercase tracking-widest">
                            {isMyProperties ? 'Na sua gestão' : isMarketMode ? 'Mercado local' : 'Disponíveis'}
                        </span>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-emerald-500" size={48} />
                    </div>
                ) : properties.length === 0 ? (
                    <NoPropertiesFound
                        isBrokerView={isMyProperties}
                        onShowMore={() => window.location.href = '/'}
                    />
                ) : (
                    <>
                        {view === 'list' ? (
                            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden animate-in fade-in duration-500 shadow-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase border-b border-slate-700/50">
                                                <th onClick={() => handleSort('titulo')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors group">
                                                    Imóvel / Código {sortConfig?.key === 'titulo' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} className="inline ml-1" /> : <ArrowDown size={12} className="inline ml-1" />)}
                                                </th>
                                                <th onClick={() => handleSort('tipo_imovel')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors group">
                                                    Tipo {sortConfig?.key === 'tipo_imovel' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} className="inline ml-1" /> : <ArrowDown size={12} className="inline ml-1" />)}
                                                </th>
                                                <th onClick={() => handleSort('operacao')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors group">
                                                    Operação {sortConfig?.key === 'operacao' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} className="inline ml-1" /> : <ArrowDown size={12} className="inline ml-1" />)}
                                                </th>
                                                <th onClick={() => handleSort('cidade')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors group">
                                                    Cidade {sortConfig?.key === 'cidade' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} className="inline ml-1" /> : <ArrowDown size={12} className="inline ml-1" />)}
                                                </th>
                                                <th onClick={() => handleSort('bairro')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors group">
                                                    Bairro {sortConfig?.key === 'bairro' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} className="inline ml-1" /> : <ArrowDown size={12} className="inline ml-1" />)}
                                                </th>
                                                <th className="p-4 font-semibold text-center" title="Detalhes">
                                                    Características <div className="flex justify-center items-center gap-1"></div>
                                                </th>
                                                <th onClick={() => handleSort('valor_venda')} className="p-4 font-semibold cursor-pointer hover:text-white transition-colors group text-right">
                                                    Valores
                                                </th>
                                                <th className="p-4 font-semibold text-center">Status</th>
                                                <th className="p-4 font-semibold text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/30">
                                            {sortedProperties.map((prop) => {
                                                // Helper to format currency
                                                const formatCurrency = (val?: number) => val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val) : '-';

                                                // Status styling
                                                const getStatusStyle = (status: string) => {
                                                    const styles: any = {
                                                        'ativo': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                                                        'pendente': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                                                        'reprovado': 'bg-red-500/10 text-red-400 border-red-500/20',
                                                        'venda_faturada': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                                        'locacao_faturada': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                                                        'imovel_espera': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                                                        'imovel_perdido': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                                                    };
                                                    return styles[status] || styles['ativo'];
                                                };

                                                // Operation Badge Color (Updated Round 2)
                                                const getOperationBadge = (op: string) => {
                                                    const normalizedOp = op?.toLowerCase() || '';
                                                    if (normalizedOp.includes('venda')) return 'bg-red-500/10 text-red-500 border-red-500/20';
                                                    if (normalizedOp.includes('loca')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                                                    if (normalizedOp.includes('temporada')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
                                                    return 'bg-slate-700 text-slate-400 border-slate-600';
                                                }

                                                // Venda/Locação override if specific
                                                if (prop.operacao === 'Venda/Locação' || prop.operacao === 'Venda/Locacao') {
                                                    // Fallback is tricky with above helper, handled by if check above but maybe specific green needed?
                                                    // User requested Green for Venda/Locação. 
                                                    // My helper check .includes('venda') first so returns red.
                                                }

                                                return (
                                                    <tr key={prop.id} className="hover:bg-slate-800/50 transition-colors group">

                                                        {/* Imóvel / Código */}
                                                        <td className="p-4">
                                                            <div>
                                                                <div
                                                                    onClick={() => {
                                                                        const slug = generatePropertySlug(prop);
                                                                        navigate(`/properties/${slug}`);
                                                                    }}
                                                                    className="font-bold text-white text-sm hover:text-emerald-400 cursor-pointer transition-colors max-w-[175px] truncate"
                                                                    title={prop.titulo}
                                                                >
                                                                    {prop.titulo || 'Sem título'}
                                                                </div>
                                                                <div className="mt-1">
                                                                    <span className="text-sm font-mono font-black text-emerald-400 tracking-wider">
                                                                        CÓD: {prop.cod_imovel || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Tipo */}
                                                        <td className="p-4 text-sm text-slate-300">
                                                            {prop.tipo_imovel}
                                                        </td>

                                                        {/* Operação */}
                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${(prop.operacao === 'Venda/Locação' || prop.operacao === 'Venda/Locacao')
                                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                                : getOperationBadge(prop.operacao)
                                                                }`}>
                                                                {prop.operacao}
                                                            </span>
                                                        </td>

                                                        {/* Cidade */}
                                                        <td className="p-4 text-sm text-slate-300">
                                                            {prop.cidade || ''}
                                                        </td>

                                                        {/* Bairro */}
                                                        <td className="p-4 text-sm text-slate-300">
                                                            {prop.bairro || ''}
                                                        </td>

                                                        {/* Metrics Compacted */}
                                                        <td className="p-4">
                                                            <div className="flex justify-center items-center gap-2 text-slate-400 text-xs">
                                                                <div className="flex items-center gap-1" title="Quartos"><BedDouble size={14} /> {prop.quartos || '-'}</div>
                                                                <div className="flex items-center gap-1" title="Banheiros"><Bath size={14} /> {prop.banheiros || '-'}</div>
                                                                <div className="flex items-center gap-1" title="Vagas"><Car size={14} /> {prop.vagas || '-'}</div>
                                                                <div className="flex items-center gap-1" title="Área"><Ruler size={14} /> {prop.area_priv ? `${prop.area_priv}m²` : '-'}</div>
                                                            </div>
                                                        </td>

                                                        {/* Valores Stacked */}
                                                        <td className="p-4 text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                {(prop.valor_venda > 0) && (
                                                                    <div className="text-red-500 font-bold text-sm tracking-tight flex items-center gap-1">
                                                                        {formatCurrency(prop.valor_venda)}
                                                                        <span className="text-[10px] text-red-500/50 font-mono">V</span>
                                                                    </div>
                                                                )}
                                                                {(prop.valor_locacao > 0) && (
                                                                    <div className="text-blue-500 font-bold text-sm tracking-tight flex items-center gap-1">
                                                                        {formatCurrency(prop.valor_locacao)}
                                                                        <span className="text-[10px] text-blue-500/50 font-mono">L</span>
                                                                    </div>
                                                                )}
                                                                {/* Temporada Logic */}
                                                                {(prop.operacao?.toLowerCase().includes('temporada')) && (
                                                                    <>
                                                                        {prop.valor_diaria > 0 && (
                                                                            <div className="text-orange-500 font-bold text-sm tracking-tight flex items-center gap-1">
                                                                                {formatCurrency(prop.valor_diaria)}
                                                                                <span className="text-[10px] text-orange-500/50 font-mono">/dia</span>
                                                                            </div>
                                                                        )}
                                                                        {prop.valor_mensal > 0 && (
                                                                            <div className="text-orange-500 font-bold text-sm tracking-tight flex items-center gap-1">
                                                                                {formatCurrency(prop.valor_mensal)}
                                                                                <span className="text-[10px] text-orange-500/50 font-mono">/mês</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="p-4 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${getStatusStyle(prop.status)}`}>
                                                                {prop.status === 'venda_faturada' ? 'VENDIDO' :
                                                                    prop.status === 'locacao_faturada' ? 'ALUGADO' :
                                                                        prop.status || 'ATIVO'}
                                                            </span>
                                                        </td>

                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {(isDashboardRoute && user && prop.user_id === user.id) && (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); navigate(`/add-property?id=${prop.id}`); }}
                                                                            className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors border border-yellow-500/20"
                                                                            title="Editar"
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setDeactivateModal({
                                                                                    isOpen: true,
                                                                                    propertyId: prop.id,
                                                                                    propertyTitle: prop.titulo
                                                                                });
                                                                            }}
                                                                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                                                                            title="Inativar"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        const slug = generatePropertySlug(prop);
                                                                        navigate(`/properties/${slug}`);
                                                                    }}
                                                                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors border border-slate-600"
                                                                    title="Visualizar"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {sortedProperties.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">
                                        Nenhum imóvel encontrado nesta lista.
                                    </div>
                                )}
                            </div>
                        ) : view === 'map' ? (
                            <div className="h-[400px] rounded-3xl overflow-hidden border border-slate-700 shadow-lg">
                                <PropertyMap properties={properties} />
                            </div>
                        ) : view === 'grid' ? (
                            <div className="w-full">
                                {/* Horizontal Scroll Layout */}
                                {(() => {
                                    const filteredProps = isMyProperties
                                        ? statusFilter === 'todos'
                                            ? properties
                                            : properties.filter(p => p.status === statusFilter || (statusFilter === 'ativo' && !p.status))
                                        : properties;

                                    if (filteredProps.length === 0) {
                                        return (
                                            <NoPropertiesFound
                                                message="Nenhum imóvel nesta categoria no momento"
                                                onShowMore={() => setStatusFilter('todos')}
                                            />
                                        );
                                    }

                                    return (
                                        <HorizontalScroll itemsPerPage={undefined} itemWidth={320}>
                                            {filteredProps.map(prop => (
                                                <div key={prop.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                                    <PropertyCard
                                                        property={prop}
                                                        showStatus={isMyProperties}
                                                        isDashboard={isDashboardRoute}
                                                        actions={
                                                            (isDashboardRoute && user && prop.user_id === user.id) ? (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/add-property?id=${prop.id}`);
                                                                        }}
                                                                        className="p-1.5 bg-yellow-500 hover:bg-yellow-500 text-white rounded-full transition-colors border border-yellow-500/20"
                                                                        title="Editar"
                                                                    >
                                                                        <Edit2 size={16} className="mr-1.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDeactivateModal({
                                                                                isOpen: true,
                                                                                propertyId: prop.id,
                                                                                propertyTitle: prop.titulo
                                                                            });
                                                                        }}
                                                                        className="p-1.5 bg-red-500 hover:bg-red-500 text-white rounded-full transition-colors border border-red-500/20"
                                                                        title="Inativar Imóvel"
                                                                    >
                                                                        <Trash2 size={16} className="mr-1.5 align-items-center" />
                                                                    </button>
                                                                </>
                                                            ) : undefined
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </HorizontalScroll>
                                    );
                                })()}
                            </div>
                        ) : isMyProperties ? (
                            <div className="space-y-6">
                                {/* Definição das seções */}
                                {[
                                    { key: 'pendente', label: 'Pendentes', icon: <Home size={20} />, color: 'yellow', emoji: '⏳' },
                                    { key: 'reprovado', label: 'Reprovados', icon: <AlertTriangle size={20} />, color: 'red', emoji: '❌' },
                                    { key: 'ativo', label: 'Ativos', icon: <Home size={20} />, color: 'emerald', emoji: '✅' },
                                    { key: 'venda_faturada', label: 'Vendidos', icon: <TrendingUp size={20} />, color: 'emerald', emoji: '🎉' },
                                    { key: 'locacao_faturada', label: 'Alugados', icon: <Key size={20} />, color: 'blue', emoji: '💰' },
                                    { key: 'imovel_espera', label: 'Em Standby', icon: <Pause size={20} />, color: 'yellow', emoji: '⏸️' },
                                    { key: 'imovel_perdido', label: 'Perdidos', icon: <AlertTriangle size={20} />, color: 'red', emoji: '⚠️' },
                                ]
                                    .filter(section => {
                                        // Mostrar apenas se tiver properties nessa categoria OU se statusFilter for 'todos'
                                        const count = properties.filter(p =>
                                            p.status === section.key || (section.key === 'ativo' && !p.status)
                                        ).length;
                                        // Se está filtrando por status específico, só mostra essa seção
                                        if (statusFilter !== 'todos') {
                                            return section.key === statusFilter;
                                        }
                                        return count > 0;
                                    })
                                    .map(section => {
                                        const sectionProperties = properties.filter(p =>
                                            p.status === section.key || (section.key === 'ativo' && !p.status)
                                        );
                                        const isExpanded = expandedSections.includes(section.key);
                                        const colorClasses = {
                                            emerald: 'border-emerald-700/50 bg-emerald-900/20 text-emerald-400',
                                            blue: 'border-blue-700/50 bg-blue-900/20 text-blue-400',
                                            yellow: 'border-yellow-700/50 bg-yellow-900/20 text-yellow-400',
                                            red: 'border-red-700/50 bg-red-900/20 text-red-400',
                                        };

                                        return (
                                            <div key={section.key} className="rounded-2xl border border-slate-700/50 overflow-hidden">
                                                {/* Header Clicável */}
                                                <button
                                                    onClick={() => toggleSection(section.key)}
                                                    className={`w-full flex items-center justify-between px-5 py-4 transition-all ${isExpanded ? colorClasses[section.color as keyof typeof colorClasses] : 'bg-slate-800/50 hover:bg-slate-800'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpanded ? `bg-${section.color}-500/30` : 'bg-slate-700'
                                                            }`}>
                                                            {section.icon}
                                                        </div>
                                                        <span className="font-bold text-white text-lg">
                                                            {section.emoji} {section.label}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${isExpanded
                                                            ? `bg-${section.color}-500/30 text-${section.color}-300`
                                                            : 'bg-slate-700 text-slate-300'
                                                            }`}>
                                                            {sectionProperties.length}
                                                        </span>
                                                    </div>
                                                    <ChevronDown
                                                        size={24}
                                                        className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                                                            }`}
                                                    />
                                                </button>

                                                {/* Conteúdo Colapsável */}
                                                {isExpanded && sectionProperties.length > 0 && (
                                                    <div className="p-5 bg-slate-900/50">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                            {sectionProperties.map(prop => (
                                                                <PropertyCard
                                                                    key={prop.id}
                                                                    property={prop}
                                                                    showStatus={isMyProperties}
                                                                    isDashboard={isDashboardRoute}
                                                                    actions={
                                                                        (isDashboardRoute && user && prop.user_id === user.id) ? (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        navigate(`/add-property?id=${prop.id}`);
                                                                                    }}
                                                                                    className="flex-1 px-3 py-2 bg-yellow-600/20 text-yellow-400 rounded-full text-sm font-medium hover:bg-yellow-600/30 flex items-center justify-center transition-colors"
                                                                                >
                                                                                    <Edit2 size={16} className="mr-1.5" /> Editar
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setDeactivateModal({
                                                                                            isOpen: true,
                                                                                            propertyId: prop.id,
                                                                                            propertyTitle: prop.titulo
                                                                                        });
                                                                                    }}
                                                                                    className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 rounded-full text-sm font-medium hover:bg-red-600/30 flex items-center justify-center transition-colors"
                                                                                >
                                                                                    <Trash2 size={16} className="mr-1.5" /> Inativar
                                                                                </button>
                                                                            </>
                                                                        ) : undefined
                                                                    }
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            /* Grid Normal para visitantes */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {properties.map(prop => (
                                    <PropertyCard
                                        key={prop.id}
                                        property={prop}
                                        showStatus={false}
                                        isDashboard={false}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            { /* Modal de Inativação */}
            <DeactivatePropertyModal
                isOpen={deactivateModal.isOpen}
                onClose={() => setDeactivateModal({ isOpen: false, propertyId: '', propertyTitle: '' })}
                propertyId={deactivateModal.propertyId}
                propertyTitle={deactivateModal.propertyTitle}
                onSuccess={() => {
                    fetchProperties();
                    setDeactivateModal({ isOpen: false, propertyId: '', propertyTitle: '' });
                }}
            />
        </div>
    );
};