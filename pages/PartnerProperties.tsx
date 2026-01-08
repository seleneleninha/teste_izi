import React, { useState, useEffect } from 'react';
import { useHeader } from '../components/HeaderContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { MapPin, Home, Bed, Bath, Car, Maximize, Handshake, AlertCircle, CheckCircle, Grid, List, Map as MapIcon, Eye, ArrowDown, Square, Ruler, HandshakeIcon, BedDouble } from 'lucide-react';
import { filterPropertiesByRadius } from '../lib/distanceHelper';
import { PropertyMap } from '../components/PropertyMap';
import { navigateToProperty } from '../lib/propertyHelpers';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { PropertyCard } from '../components/PropertyCard';
import { Area } from 'recharts';
import { formatCurrency, formatArea } from '../lib/formatters';

interface Property {
    id: string;
    user_id: string;
    cod_imovel: number;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number | null;
    valor_locacao: number | null;
    valor_diaria: number | null;
    valor_mensal: number | null;
    fotos: string;
    operacao: any;
    tipo_imovel: any;
    quartos: number | null;
    banheiros: number | null;
    vagas: number | null;
    area_priv: number;
    aceita_parceria: boolean;
    isPartnership?: boolean;
    latitude?: number | null;
    longitude?: number | null;
}

interface PartnershipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    property: Property | null;
    isActivating: boolean;
}

const PartnershipModal: React.FC<PartnershipModalProps> = ({ isOpen, onClose, onConfirm, property, isActivating }) => {
    if (!isOpen || !property) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 bg-emerald-900/30 rounded-3xl flex items-center justify-center">
                        <Handshake className="text-emerald-600 text-emerald-400" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                        {isActivating ? 'Aceitar Parceria "fifty"' : 'Remover Parceria'}
                    </h3>
                </div>

                <div className="mb-6">
                    {isActivating ? (
                        <>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="text-sm text-amber-200/80">
                                        <p className="font-semibold text-amber-200 mb-1">Como funciona a parceria?</p>
                                        <p>Ao aceitar esta parceria, você concorda em dividir a comissão <strong>50/50</strong> com o corretor proprietário em caso de venda ou locação.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50">
                                <h4 className="font-semibold text-white mb-2">Imóvel Selecionado:</h4>
                                <p className="text-sm text-slate-300 mb-1">{property.titulo}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <MapPin size={12} />
                                    {property.bairro}, {property.cidade}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50">
                            <p className="text-sm text-slate-400">
                                Tem certeza que deseja remover este imóvel das suas parcerias? Ele não aparecerá mais na sua página pública.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 ${isActivating
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                            : 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
                            } text-white rounded-xl transition-all shadow-lg font-bold flex items-center justify-center gap-2`}
                    >
                        <Handshake size={20} />
                        {isActivating ? 'Confirmar' : 'Remover'}
                    </button>
                </div>
            </div>
        </div>
    );
};



export const PartnerProperties: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { setHeaderContent } = useHeader();
    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [isActivating, setIsActivating] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [missingCity, setMissingCity] = useState(false);
    const [userRadius, setUserRadius] = useState<number | null>(999); // Default to Estado (state-wide)
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Property; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: keyof Property) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortProperties = (props: Property[]) => {
        if (!sortConfig) return props;
        return [...props].sort((a, b) => {
            // Handle null values
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];

            if (valA === null && valB === null) return 0;
            if (valA === null) return 1;
            if (valB === null) return -1;

            if (valA < valB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getOperationBadge = (op: string) => {
        const normalizedOp = op?.toLowerCase() || '';
        if (normalizedOp.includes('venda')) return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (normalizedOp.includes('loca')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        if (normalizedOp.includes('temporada')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        return 'bg-slate-700 text-slate-400 border-slate-600';
    };

    const onToggle = (property: Property, currentState: boolean) => {
        handleTogglePartnership(property, currentState);
    };

    const [isTrialUser, setIsTrialUser] = useState(false);

    useEffect(() => {
        setHeaderContent(
            <div className="flex flex-col justify-center">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">
                    Imóveis Parceiros
                </h2>
                <p className="text-slate-400 text-xs font-medium leading-tight">Aceite parcerias com outros Corretores e aumente seu Faturamento!</p>
            </div>
        );
        return () => setHeaderContent(null);
    }, [setHeaderContent]);

    useEffect(() => {
        if (user) {
            fetchAllProperties();
        }
    }, [user]);

    const fetchAllProperties = async () => {
        try {
            setLoading(true);

            const { data: userProfile, error: profileError } = await supabase
                .from('perfis')
                .select('cidade, uf, latitude, longitude, raio_atuacao, is_trial')
                .eq('id', user?.id)
                .single();

            if (profileError) throw profileError;

            setIsTrialUser(userProfile?.is_trial || false);

            // Check if user has city/UF configured
            if (!userProfile?.cidade || !userProfile?.uf) {
                addToast('Configure seu endereço para ver imóveis parceiros', 'warning');
                setProperties([]);
                setMissingCity(true);
                setLoading(false);
                return;
            }

            setMissingCity(false);

            // Get user's location
            // Always default to 999 (Estado - state-wide) for better UX
            setUserRadius(999); // Ignore saved raio_atuacao, always start with Estado

            if (userProfile.latitude && userProfile.longitude) {
                setUserLocation({
                    lat: parseFloat(userProfile.latitude),
                    lon: parseFloat(userProfile.longitude)
                });
            }

            const { data: acceptedPartnerships } = await supabase
                .from('parcerias')
                .select('property_id')
                .eq('user_id', user?.id);

            const acceptedIds = acceptedPartnerships?.map(p => p.property_id) || [];

            // Fetch properties from the SAME STATE (UF)
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
          *,
          tipo_imovel (tipo),
          operacao (tipo),
          anunciante:user_id (id, nome, sobrenome, whatsapp)
        `)
                .eq('uf', userProfile.uf) // Filter by STATE, not city
                .neq('user_id', user?.id)
                .eq('status', 'ativo')
                .eq('aceita_parceria', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedProps = data?.map(p => ({
                ...p,
                fotos: p.fotos ? p.fotos : '',
                operacao: p.operacao?.tipo || p.operacao,
                tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                isPartnership: acceptedIds.includes(p.id),
                latitude: p.latitude ? parseFloat(p.latitude) : null,
                longitude: p.longitude ? parseFloat(p.longitude) : null
            })) || [];

            setProperties(transformedProps as any);
        } catch (error) {
            console.error('Erro ao buscar imóveis:', error);
            addToast('Erro ao carregar imóveis', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filter properties by radius whenever properties, userLocation, or userRadius changes
    useEffect(() => {
        if (!properties.length) {
            setFilteredProperties([]);
            return;
        }

        // If radius is >= 999, show all properties (entire state)
        if (!userRadius || userRadius >= 999) {
            setFilteredProperties(properties);
            return;
        }

        // Filter by radius
        const filtered = filterPropertiesByRadius(
            properties,
            userLocation?.lat,
            userLocation?.lon,
            userRadius
        );

        setFilteredProperties(filtered);
    }, [properties, userLocation, userRadius]);

    const handleTogglePartnership = (property: Property, currentState: boolean) => {
        setSelectedProperty(property);
        setIsActivating(!currentState);
        setModalOpen(true);
    };

    const confirmToggle = async () => {
        if (!selectedProperty || !user) return;

        try {
            setProcessing(true);

            if (isActivating) {
                // --- Trial Enforcement Logic ---
                const { data: profile } = await supabase
                    .from('perfis')
                    .select('is_trial, trial_fim')
                    .eq('id', user.id)
                    .single();

                if (profile?.is_trial) {
                    // Check Expiration
                    if (new Date() > new Date(profile.trial_fim)) {
                        addToast('Seu período de teste expirou. Faça upgrade para aceitar novas parcerias.', 'error');
                        setProcessing(false);
                        return;
                    }

                    // Check Quantity Limit
                    const { data: configData } = await supabase
                        .from('admin_config')
                        .select('value')
                        .eq('key', 'trial_max_partnerships')
                        .single();

                    const trialPartnershipLimit = configData ? parseInt(configData.value) : 3;

                    const { count } = await supabase
                        .from('parcerias')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.id);

                    if (count !== null && count >= trialPartnershipLimit) {
                        addToast(`Limite de ${trialPartnershipLimit} parcerias atingido no plano Trial. Faça upgrade para aumentar.`, 'error');
                        setProcessing(false);
                        return;
                    }
                }
                // -------------------------------

                const { error } = await supabase
                    .from('parcerias')
                    .insert({
                        user_id: user.id,
                        property_id: selectedProperty.id
                    });

                if (error) throw error;
                addToast('Parceria aceita com sucesso!', 'success');
            } else {
                const { error } = await supabase
                    .from('parcerias')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('property_id', selectedProperty.id);

                if (error) throw error;
                addToast('Parceria removida com sucesso!', 'success');
            }

            setModalOpen(false);
            setSelectedProperty(null);
            fetchAllProperties();
        } catch (error: any) {
            console.error('Erro ao alterar parceria:', error);
            if (error.code === '23505') {
                addToast('Você já aceitou parceria com este imóvel', 'error');
            } else {
                addToast('Erro ao alterar parceria', 'error');
            }
        } finally {
            setProcessing(false);
        }
    };


    // Split properties first BEFORE applying radius filter
    const allAvailableProperties = properties.filter(p => !p.isPartnership);
    const allAcceptedProperties = properties.filter(p => p.isPartnership);

    // Apply radius filter ONLY to available properties
    let availableProperties = allAvailableProperties;
    if (userRadius && userRadius < 999 && userLocation) {
        availableProperties = filterPropertiesByRadius(
            allAvailableProperties,
            userLocation.lat,
            userLocation.lon,
            userRadius
        );
    }

    // Accepted properties are NOT filtered by radius
    const acceptedProperties = allAcceptedProperties;


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Carregando imóveis...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-6">
                {/* Header moved to Layout via context */}

                {/* Radius Filter */}
                {userLocation && !missingCity && (
                    <div className="mb-8 bg-slate-800 rounded-3xl p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                    <MapPin size={20} className="text-emerald-400" />
                                </div>
                                Filtrar por Raio de Atuação
                            </h3>
                            <span className="font-bold text-white">
                                {filteredProperties.length} {filteredProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                            {[1, 3, 5, 10, 20, null].map((radius) => (
                                <button
                                    key={radius || 'all'}
                                    onClick={() => setUserRadius(radius || 999)}
                                    className={`px-3 py-2.5 rounded-2xl font-bold transition-all border ${(radius === null && userRadius >= 999) || userRadius === radius
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border-emerald-400'
                                        : 'bg-slate-700/50 text-slate-400 border-slate-600/50 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    {radius ? `${radius}km` : '+20km'}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mt-4 text-md text-yellow-400 bg-slate-900/40 p-3 rounded-2xl border border-slate-700/30">
                            <span className="text-yellow-400">💡</span>
                            <p>Escolha um raio menor para focar em imóveis próximos à sua região de atuação</p>
                        </div>
                    </div>
                )}

                {/* Alert for missing city */}
                {missingCity && (
                    <div className="mb-8 bg-amber-50 bg-amber-900/20 border-2 border-amber-200 border-amber-800 rounded-3xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-amber-100 bg-amber-900/30 rounded-3xl flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="text-amber-600 text-amber-300" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-amber-300 text-amber-100 mb-2">
                                    Configure sua cidade para ver imóveis parceiros
                                </h3>
                                <p className="text-sm text-amber-300 text-amber-200 mb-4">
                                    Para visualizar imóveis disponíveis para parceria, você precisa configurar sua cidade no seu perfil.
                                    Isso permite que mostremos apenas imóveis da sua região.
                                </p>
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-medium transition-colors flex items-center gap-2"
                                >
                                    <MapPin size={16} />
                                    Ir para Configurações
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Available Properties Section */}
                {!missingCity && availableProperties.length > 0 && (
                    <div className="mb-12">
                        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                            <div>
                                {/* Results Count */}
                                <div className="flex items-center justify-between mb-2 mt-4">
                                    <p className="text-slate-400">
                                        <span className="text-white font-bold">{availableProperties.length}</span> imóveis disponíveis para Parceria
                                    </p>
                                </div>
                                {isTrialUser && (
                                    <p className="text-sm font-bold text-amber-500 mt-1 animate-pulse">
                                        No período de teste, você NÃO PODE OFERECER/ACEITAR PARCERIAS, somente ver.
                                        <br />
                                        <span onClick={() => navigate('/upgrade')} className="underline cursor-pointer hover:text-amber-400">Faça UPGRADE do plano.</span>
                                    </p>
                                )}
                            </div>
                            <div>

                            </div>
                            {/* View Mode Toggle */}
                            <div className="flex gap-1 bg-slate-900 border border-slate-700 p-1 justify-between rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'grid'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                    title="Visualização em Cards"
                                >
                                    <Grid size={16} />
                                    Cards
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                    title="Visualização em Lista"
                                >
                                    <List size={16} />
                                    Lista
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'map'
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                    title="Visualização em Mapa"
                                >
                                    <MapIcon size={16} />
                                    Mapa
                                </button>
                            </div>
                        </div>

                        {/* Grid View (Horizontal Scroll for consistency) */}
                        {viewMode === 'grid' && (
                            <HorizontalScroll itemWidth={320} gap={24} itemsPerPage={3}>
                                {availableProperties.map((property) => (
                                    <div key={property.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                        <PropertyCard
                                            property={property}
                                            isDashboard={true}
                                            actions={
                                                <div className="flex gap-2 w-full">
                                                    <button
                                                        onClick={() => navigateToProperty(navigate, property, true)}
                                                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-3xl text-xs transition-colors border border-slate-600 flex items-center justify-center gap-2"
                                                        title="Ver Anúncio"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {!isTrialUser && (
                                                        <button
                                                            onClick={() => onToggle(property, false)}
                                                            className="flex-[1.5] px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                                        >
                                                            <Handshake size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            }
                                        />
                                    </div>
                                ))}
                            </HorizontalScroll>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-900/80 border-b border-white/10 text-xs uppercase tracking-wider">
                                                <th className="p-3 text-center text-slate-400 font-semibold w-16">AÇÕES</th>
                                                <th className="p-3 text-center text-slate-400 font-semibold w-16">
                                                    <button onClick={() => handleSort('cod_imovel' as any)} className="flex items-center gap-1 mx-auto text-slate-400 hover:text-white">
                                                        CÓD. {sortConfig?.key === 'cod_imovel' ? (sortConfig.direction === 'asc' ? <ArrowDown size={12} className="rotate-180" /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-30" />}
                                                    </button>
                                                </th>
                                                <th className="p-3 text-left text-slate-400 font-semibold min-w-[150px]">
                                                    <button onClick={() => handleSort('titulo')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                                        IMÓVEL {sortConfig?.key === 'titulo' ? (sortConfig.direction === 'asc' ? <ArrowDown size={12} className="rotate-180" /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-30" />}
                                                    </button>
                                                </th>
                                                <th className="p-3 text-left text-slate-400 font-semibold">
                                                    <button onClick={() => handleSort('cidade')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                                        CIDADE {sortConfig?.key === 'cidade' ? (sortConfig.direction === 'asc' ? <ArrowDown size={12} className="rotate-180" /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-30" />}
                                                    </button>
                                                </th>
                                                <th className="p-3 text-left text-slate-400 font-semibold">
                                                    <button onClick={() => handleSort('bairro')} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                                                        BAIRRO {sortConfig?.key === 'bairro' ? (sortConfig.direction === 'asc' ? <ArrowDown size={12} className="rotate-180" /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-30" />}
                                                    </button>
                                                </th>
                                                <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Quartos">
                                                    <button onClick={() => handleSort('quartos')} className="mx-auto flex items-center justify-center gap-1 hover:text-white transition-colors">
                                                        <BedDouble size={14} /> {sortConfig?.key === 'quartos' ? (sortConfig.direction === 'asc' ? <ArrowDown size={12} className="rotate-180" /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-30" />}
                                                    </button>
                                                </th>
                                                <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Banheiros">
                                                    <button onClick={() => handleSort('banheiros')} className="mx-auto flex items-center justify-center gap-1 hover:text-white transition-colors">
                                                        <Bath size={14} /> {sortConfig?.key === 'banheiros' ? (sortConfig.direction === 'asc' ? <ArrowDown size={12} className="rotate-180" /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-30" />}
                                                    </button>
                                                </th>
                                                <th className="p-3 text-center text-slate-400 font-semibold w-10" title="Vagas">
                                                    <button onClick={() => handleSort('vagas')} className="mx-auto flex items-center justify-center gap-1 hover:text-white transition-colors">
                                                        <Car size={14} /> {sortConfig?.key === 'vagas' ? (sortConfig.direction === 'asc' ? <ArrowDown size={12} className="rotate-180" /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-30" />}
                                                    </button>
                                                </th>
                                                <th className="p-3 text-center text-slate-400 font-semibold w-16" title="Área Privativa">
                                                    <button onClick={() => handleSort('area_priv')} className="mx-auto flex items-center justify-center gap-1 hover:text-white transition-colors">
                                                        <Ruler size={14} /> {sortConfig?.key === 'area_priv' ? (sortConfig.direction === 'asc' ? <ArrowDown size={12} className="rotate-180" /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-30" />}
                                                    </button>
                                                </th>
                                                <th className="p-3 text-right text-slate-400 font-semibold min-w-[100px]">
                                                    <button onClick={() => handleSort('valor_venda')} className="flex items-center gap-1 ml-auto text-slate-400 hover:text-white transition-colors">
                                                        VALORES {sortConfig?.key === 'valor_venda' ? (sortConfig.direction === 'asc' ? <ArrowDown size={12} className="rotate-180" /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-30" />}
                                                    </button>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortProperties(availableProperties).map((property) => {
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
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigateToProperty(navigate, property, true); }}
                                                                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                                                                    title="Ver Anúncio"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                                {!isTrialUser ? (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); onToggle(property, false); }}
                                                                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-400 transition-all"
                                                                        title="Aceitar Parceria"
                                                                    >
                                                                        <Handshake size={14} />
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-xs text-amber-500 font-medium px-1">Trial</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Código */}
                                                        <td className="p-3 text-center">
                                                            <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-mono">
                                                                {property.cod_imovel || property.id?.slice(0, 6)}
                                                            </span>
                                                        </td>

                                                        {/* Imóvel (Título + Badges) */}
                                                        <td className="p-3">
                                                            <div className="flex flex-col gap-1">
                                                                <span
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigateToProperty(navigate, property, true); }}
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
                            </div>
                        )}

                        {/* Map View */}
                        {viewMode === 'map' && (
                            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden" style={{ height: '400px' }}>
                                <PropertyMap
                                    properties={availableProperties as any}
                                    isDashboard={true}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!missingCity && filteredProperties.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Handshake className="text-gray-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            Nenhum imóvel disponível. Aumente o Raio de Atuação.
                        </h3>
                        <p className="text-gray-400">
                            Não há imóveis disponíveis para parceria na sua região no momento.
                        </p>
                    </div>
                )}

                {/* Accepted Partnerships Section */}
                {!missingCity && acceptedProperties.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Handshake className="text-emerald-500" size={24} />
                                    {acceptedProperties.length} {acceptedProperties.length === 1 ? 'parceria ativa' : 'parcerias ativas'}
                                </h2>
                            </div>
                        </div>

                        <HorizontalScroll itemWidth={320} gap={24} itemsPerPage={3}>
                            {acceptedProperties.map((property) => (
                                <div key={property.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                    <PropertyCard
                                        property={property}
                                        isDashboard={true}
                                        onToggle={onToggle}
                                        actions={
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigateToProperty(navigate, property, true)}
                                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-medium transition-colors flex items-center justify-center gap-2"
                                                    title="Ver Anúncio"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => onToggle(property, true)}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors"
                                                    title="Remover"
                                                >
                                                    <Handshake size={18} />
                                                </button>
                                            </div>
                                        }
                                    />
                                </div>
                            ))}
                        </HorizontalScroll>
                    </div>
                )}
            </div >

            <PartnershipModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={confirmToggle}
                property={selectedProperty}
                isActivating={isActivating}
            />
        </>
    );
};
