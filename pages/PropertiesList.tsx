import React, { useState, useEffect } from 'react';
import { MOCK_PROPERTIES } from '../constants';
import { MapPin, Bed, Bath, Square, Filter, Search, Grid, Map as MapIcon, CheckSquare, Loader2, Edit2, Trash2, X, TrendingUp, Key, Pause, AlertTriangle, Home, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PropertyCard } from '../components/PropertyCard';
import { NoPropertiesFound } from '../components/NoPropertiesFound';
import { useNavigate, useLocation } from 'react-router-dom';
import { PropertyMap } from '../components/PropertyMap';
import { useToast } from '../components/ToastContext';
import { useAuth } from '../components/AuthContext';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { Footer } from '../components/Footer';
import { DeactivatePropertyModal } from '../components/DeactivatePropertyModal';

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

    // Fetch broker's state (UF) when in Market Mode
    useEffect(() => {
        const fetchBrokerUF = async () => {
            if (isMarketMode && user) {
                const { data, error } = await supabase
                    .from('perfis')
                    .select('uf')
                    .eq('id', user.id)
                    .single();

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
                addToast('You can compare up to 3 properties.', 'warning');
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

    return (
        <div className="bg-slate-900 min-h-screen flex flex-col">
            <div className="container mx-auto px-4 py-8 flex-1">
                {/* Header Controls */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white">
                            {isMyProperties ? 'Meus Imóveis' : isMarketMode ? 'Mercado Imobiliário' : 'Buscar Imóveis'}
                        </h2>
                        <p className="text-gray-400 mt-1">
                            {isMyProperties ? 'Gerencie e mantenha seus anúncios atualizados.' : isMarketMode ? 'Você está visualizando todos os imóveis de sua Cidade' : 'Encontre o imóvel ideal para sua Família.'}
                        </p>
                    </div>

                    {/* Filtros - Mobile First Layout */}
                    <div className="w-full space-y-3 mb-6">
                        {/* Linha 1: Filtros Principais */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Operação */}
                            <select
                                value={selectedOperation}
                                onChange={e => setSelectedOperation(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-gray-300 text-sm cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            >
                                <option value="" className="bg-slate-800">📍 Operação</option>
                                <option value="venda" className="bg-slate-800">Venda</option>
                                <option value="locacao" className="bg-slate-800">Locação</option>
                                <option value="temporada" className="bg-slate-800">Temporada</option>
                            </select>

                            {/* Tipo */}
                            <select
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-gray-300 text-sm cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            >
                                <option value="" className="bg-slate-800">🏠 Tipo</option>
                                {filteredPropertyTypes.map((type, idx) => (
                                    <option key={idx} value={type.tipo} className="bg-slate-800">
                                        {type.tipo.charAt(0).toUpperCase() + type.tipo.slice(1)}
                                    </option>
                                ))}
                            </select>

                            {/* Faixa de Preço */}
                            <select
                                value={selectedPriceRange}
                                onChange={e => setSelectedPriceRange(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-gray-300 text-sm cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all col-span-2 md:col-span-1"
                            >
                                <option value="" className="bg-slate-800">💰 Preço</option>
                                <option value="0-200000" className="bg-slate-800">Até R$200mil</option>
                                <option value="200000-500000" className="bg-slate-800">R$200mil - R$500mil</option>
                                <option value="500000-1000000" className="bg-slate-800">R$500mil - R$1M</option>
                                <option value="1000000-2000000" className="bg-slate-800">R$1M - R$2M</option>
                                <option value="2000000-999999999" className="bg-slate-800">Acima de R$2M</option>

                            </select>

                            {/* Status - NOVO (apenas para Meus Imóveis) */}
                            {isMyProperties && (
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="bg-slate-800 border border-emerald-700/50 rounded-xl px-4 py-3 text-gray-300 text-sm cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all col-span-2 md:col-span-1 font-medium"
                                >
                                    <option value="todos" className="bg-slate-800">📋 Todos ({stats.total})</option>
                                    <option value="pendente" className="bg-slate-800">⏳ Pendentes ({properties.filter(p => p.status === 'pendente').length})</option>
                                    <option value="reprovado" className="bg-slate-800">❌ Reprovados ({properties.filter(p => p.status === 'reprovado').length})</option>
                                    <option value="ativo" className="bg-slate-800">✅ Ativos ({stats.ativos})</option>
                                    <option value="venda_faturada" className="bg-slate-800">🎉 Vendidos ({stats.vendas})</option>
                                    <option value="locacao_faturada" className="bg-slate-800">💰 Alugados ({stats.locacoes})</option>
                                    <option value="imovel_espera" className="bg-slate-800">⏸️ Standby ({stats.standby})</option>
                                    <option value="imovel_perdido" className="bg-slate-800">⚠️ Perdidos ({stats.perdidos})</option>
                                </select>
                            )}
                        </div>

                        {/* Linha 2: Botões de Ação */}
                        <div className="flex flex-wrap gap-3">
                            {/* Buscar */}
                            <button
                                onClick={() => fetchProperties()}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <Search size={18} />
                                <span>Buscar</span>
                            </button>

                            {/* Limpar */}
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <X size={18} />
                                <span>Limpar</span>
                            </button>

                            {/* Toggle Cards/Map */}
                            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                                <button
                                    onClick={() => setView('grid')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${view === 'grid'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    <Grid size={18} />
                                    <span className="hidden sm:inline">Cards</span>
                                </button>
                                <button
                                    onClick={() => setView('map')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${view === 'map'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    <MapIcon size={18} />
                                    <span className="hidden sm:inline">Mapa</span>
                                </button>
                            </div>

                            {/* Botão Anunciar - DESTACADO */}
                            {user && isDashboardRoute && (
                                <button
                                    onClick={() => navigate('/add-property')}
                                    className="ml-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 flex items-center gap-2"
                                >
                                    <Home size={20} />
                                    <span>+ Anunciar Imóvel</span>
                                </button>
                            )}
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
                        <NoPropertiesFound
                            onShowMore={() => window.location.href = '/'}
                        />
                    ) : (
                        <>
                            {view === 'map' ? (
                                <div className="h-[500px] rounded-3xl overflow-hidden border border-slate-700 shadow-lg">
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
                                                                (user && prop.user_id === user.id) ? (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                navigate(`/add-property?id=${prop.id}`);
                                                                            }}
                                                                            className="flex-1 px-2 py-2 bg-yellow-600/50 text-white rounded-full text-sm font-medium hover:bg-yellow-600/20 flex items-center justify-center transition-colors"
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
                                                                            className="flex-1 px-2 py-2 bg-red-600/50 text-white rounded-full text-sm font-medium hover:bg-red-600/20 flex items-center justify-center transition-colors"
                                                                            title="Inativar Imóvel"
                                                                        >
                                                                            Inativar
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
                                /* List View com Seções Colapsáveis por Status - Apenas Meus Imóveis */
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
                                                                            (user && prop.user_id === user.id) ? (
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
        </div>
    );
};