import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { MapPin, Home, Bed, Bath, Car, Maximize, Handshake, AlertCircle, CheckCircle, Grid, List, Map as MapIcon, Eye, ArrowDown, Square, Ruler, HandshakeIcon } from 'lucide-react';
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
                            <div className="bg-amber-50 bg-amber-900/20 border border-amber-200 border-amber-800 rounded-3xl p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="text-amber-600 text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="text-sm text-amber-800 text-amber-200">
                                        <p className="font-semibold mb-1">Como funciona a parceria?</p>
                                        <p>Ao aceitar esta parceria, você concorda em dividir a comissão <strong>50/50</strong> com o corretor proprietário do imóvel em caso de venda ou locação.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 rounded-3xl p-4">
                                <h4 className="font-semibold text-white mb-2">Imóvel Selecionado:</h4>
                                <p className="text-sm text-gray-400 mb-1">{property.titulo}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin size={12} />
                                    {property.bairro}, {property.cidade}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="bg-slate-900/50 rounded-3xl p-4">
                            <p className="text-sm text-gray-400">
                                Tem certeza que deseja remover este imóvel das suas parcerias? Ele não aparecerá mais na sua página pública.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-600 rounded-full text-gray-300 hover:bg-slate-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 ${isActivating
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-red-600 hover:bg-red-700'
                            } text-white rounded-full transition-colors font-bold flex items-center justify-center gap-2`}
                    >
                        <Handshake size={24} />
                        {isActivating ? 'Confirmar Parceria' : 'Remover Parceria'}
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
    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [isActivating, setIsActivating] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [missingCity, setMissingCity] = useState(false);
    const [userRadius, setUserRadius] = useState<number | null>(null);
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

    const onToggle = (property: Property, currentState: boolean) => {
        handleTogglePartnership(property, currentState);
    };

    const [isTrialUser, setIsTrialUser] = useState(false);

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
                addToast('Configure sua cidade e estado nas Configurações para ver imóveis parceiros', 'warning');
                setProperties([]);
                setMissingCity(true);
                setLoading(false);
                return;
            }

            setMissingCity(false);

            // Get user's radius preference and location
            // If radius is not set, default to 10km
            setUserRadius(userProfile.raio_atuacao || null);

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
                .eq('status_aprovacao', 'aprovado')
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
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">Imóveis Parceiros</h1>
                    </div>
                    <p className="text-gray-400">
                        Aceite parcerias com outros Corretores e aumente seu Faturamento!
                    </p>
                </div>

                {/* Radius Filter */}
                {userLocation && !missingCity && (
                    <div className="mb-8 bg-slate-800 rounded-3xl p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <MapPin size={20} className="text-primary-500" />
                                Filtrar por Raio de Atuação
                            </h3>
                            <span className="text-sm text-gray-500">
                                {filteredProperties.length} {filteredProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                            {[1, 3, 5, 10, 20, null].map((radius) => (
                                <button
                                    key={radius || 'all'}
                                    onClick={() => setUserRadius(radius || 999)}
                                    className={`px-3 py-2 rounded-full font-medium transition-all ${(radius === null && userRadius >= 999) || userRadius === radius
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {radius ? `${radius}km` : 'Estado'}
                                </button>
                            ))}
                        </div>

                        <p className="text-md text-gray-400 mt-4">
                            💡 Dica: Escolha um raio menor para focar em imóveis próximos à sua região de atuação
                        </p>
                    </div>
                )}

                {/* Alert for missing city */}
                {missingCity && (
                    <div className="mb-8 bg-amber-50 bg-amber-900/20 border-2 border-amber-200 border-amber-800 rounded-full p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-amber-100 bg-amber-900/30 rounded-3xl flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="text-amber-600 text-amber-400" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-amber-900 text-amber-100 mb-2">
                                    Configure sua cidade para ver imóveis parceiros
                                </h3>
                                <p className="text-sm text-amber-800 text-amber-200 mb-4">
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
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {availableProperties.length} {availableProperties.length === 1 ? 'imóvel disponível' : 'imóveis disponíveis para Parceria'}
                                </h2>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex gap-2 bg-slate-800 p-1 rounded-3xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-3xl transition-colors ${viewMode === 'grid'
                                        ? 'bg-slate-700 text-primary-500 shadow'
                                        : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    title="Visualização em Cards"
                                >
                                    <Grid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-3xl transition-colors ${viewMode === 'list'
                                        ? 'bg-slate-700 text-primary-500 shadow'
                                        : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    title="Visualização em Lista"
                                >
                                    <List size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`p-2 rounded-3xl transition-colors ${viewMode === 'map'
                                        ? 'bg-slate-700 text-primary-500 shadow'
                                        : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    title="Visualização em Mapa"
                                >
                                    <MapIcon size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Grid View */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availableProperties.map((property) => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property}
                                        isDashboard={true}
                                        actions={
                                            <div className="flex flex-col gap-2 w-full">
                                                <button
                                                    onClick={() => navigateToProperty(navigate, property, true)}
                                                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Eye size={24} />
                                                    Detalhes
                                                </button>
                                                {!isTrialUser && (
                                                    <button
                                                        onClick={() => onToggle(property, property.isPartnership || false)}
                                                        className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${property.isPartnership
                                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                                                            }`}
                                                    >
                                                        <Handshake size={24} />
                                                        {property.isPartnership ? 'Remover' : 'Aceitar'}
                                                    </button>
                                                )}
                                                {isTrialUser && (
                                                    <div className="p-2 bg-amber-500/20 text-xs text-amber-300 rounded-full text-center border border-amber-500/30">
                                                        Faça UPGRADE para aceitar parcerias
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    />
                                ))}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="bg-slate-800 rounded-3xl shadow-sm border border-slate-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px]">
                                        <thead className="bg-slate-700/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('tipo_imovel')}>Tipo</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('operacao')}>Op.</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('cidade')}>Cidade</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('bairro')}>Bairro</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('area_priv')}><Maximize size={14} /></th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('quartos')}><Bed size={14} /></th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('banheiros')}><Bath size={14} /></th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('vagas')}><Car size={14} /></th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('valor_venda')}>Venda</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('valor_locacao')}>Locação</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('valor_diaria')}>Diária</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('valor_mensal')}>Mensal</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 divide-slate-700">
                                            {sortProperties(availableProperties).map((property) => (
                                                <tr key={property.id} className="hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-white capitalize">{property.tipo_imovel}</td>
                                                    <td className="px-4 py-3">
                                                        {(() => {
                                                            const op = (property.operacao || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                                            const isVenda = op === 'venda';
                                                            const isLocacao = op === 'locacao';
                                                            const isTemporada = op === 'temporada';
                                                            const isAmbos = op.includes('venda') && op.includes('locacao');

                                                            return (
                                                                <div className={`text-xs inline-flex px-2 py-0.5 rounded-full font-medium ${isVenda ? 'bg-red-600 text-white'
                                                                    : isLocacao ? 'bg-blue-600 text-white'
                                                                        : isTemporada ? 'bg-orange-500 text-white'
                                                                            : isAmbos ? 'bg-green-600 text-white'
                                                                                : 'bg-gray-600 text-white'
                                                                    }`}>
                                                                    {property.operacao || 'N/A'}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3">{property.cidade}</td>
                                                    <td className="px-4 py-3">{property.bairro}</td>
                                                    <td className="px-4 py-3 text-center">{formatArea(property.area_priv)}</td>
                                                    <td className="px-4 py-3 text-center">{property.quartos}</td>
                                                    <td className="px-4 py-3 text-center">{property.banheiros}</td>
                                                    <td className="px-4 py-3 text-center">{property.vagas}</td>
                                                    <td className="px-4 py-3 text-sm text-center font-semibold text-primary-600 text-primary-400">
                                                        {property.valor_venda ? formatCurrency(property.valor_venda) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center font-semibold text-blue-600 text-blue-400">
                                                        {property.valor_locacao ? formatCurrency(property.valor_locacao) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center font-semibold text-orange-600 text-orange-400">
                                                        {property.valor_diaria ? formatCurrency(property.valor_diaria) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-center font-semibold text-orange-600 text-orange-400">
                                                        {property.valor_mensal ? formatCurrency(property.valor_mensal) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => navigateToProperty(navigate, property, true)}
                                                                className="p-1.5 text-primary-500 hover:bg-primary-50 hover:bg-primary-900/20 rounded transition-colors"
                                                                title="Ver Anúncio"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            {!isTrialUser && (
                                                                <button
                                                                    onClick={() => onToggle(property, false)}
                                                                    className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs rounded-full transition-colors font-medium"
                                                                    title="Aceitar Parceria"
                                                                >
                                                                    <Handshake size={14} className="inline mr-1" />
                                                                    Aceitar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Map View */}
                        {viewMode === 'map' && (
                            <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden" style={{ height: '600px' }}>
                                <PropertyMap
                                    properties={availableProperties as any}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!missingCity && filteredProperties.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Handshake className="text-gray-400" size={40} />
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
                                    <Handshake className="text-emerald-500" size={28} />
                                    {acceptedProperties.length} {acceptedProperties.length === 1 ? 'parceria ativa' : 'parcerias ativas'}
                                </h2>
                            </div>
                        </div>

                        <HorizontalScroll itemWidth={320} gap={24} itemsPerPage={3}>
                            {acceptedProperties.map((property) => (
                                <div key={property.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                    <PropertyCard
                                        property={property}
                                        onToggle={onToggle}
                                        actions={
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigateToProperty(navigate, property, true)}
                                                    className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors flex items-center justify-center gap-2"
                                                    title="Ver Anúncio"
                                                >
                                                    <Eye size={24} />
                                                </button>
                                                <button
                                                    onClick={() => onToggle(property, true)}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors"
                                                    title="Remover"
                                                >
                                                    <Handshake size={24} />
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
