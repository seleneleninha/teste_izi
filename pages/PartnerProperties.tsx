import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/AuthContext';
import { useToast } from '../components/ToastContext';
import { MapPin, Home, Bed, Bath, Car, Maximize, Handshake, AlertCircle, CheckCircle, Grid, List, Map as MapIcon, Eye } from 'lucide-react';
import { filterPropertiesByRadius } from '../lib/distanceHelper';
import { PropertyMap } from '../components/PropertyMap';
import { navigateToProperty } from '../lib/propertyHelpers';

interface Property {
    id: string;
    user_id: string;
    cod_imovel: number;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number | null;
    valor_locacao: number | null;
    fotos: string;
    operacao: any;
    tipo_imovel: any;
    quartos: number;
    banheiros: number;
    vagas: number;
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
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <Handshake className="text-emerald-600 dark:text-emerald-400" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isActivating ? 'Aceitar Parceria "fifty"' : 'Remover Parceria'}
                    </h3>
                </div>

                <div className="mb-6">
                    {isActivating ? (
                        <>
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="text-sm text-amber-800 dark:text-amber-200">
                                        <p className="font-semibold mb-1">Como funciona a parceria?</p>
                                        <p>Ao aceitar esta parceria, você concorda em dividir a comissão <strong>50/50</strong> com o corretor proprietário do imóvel em caso de venda ou locação.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Imóvel Selecionado:</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{property.titulo}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                                    <MapPin size={12} />
                                    {property.bairro}, {property.cidade}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Tem certeza que deseja remover este imóvel das suas parcerias? Ele não aparecerá mais na sua página pública.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 ${isActivating
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-red-600 hover:bg-red-700'
                            } text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-2`}
                    >
                        <Handshake size={18} />
                        {isActivating ? 'Confirmar Parceria' : 'Remover Parceria'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PropertyCard: React.FC<{ property: Property; onToggle: (property: Property, currentState: boolean) => void; compact?: boolean; actions?: React.ReactNode }> = ({ property, onToggle, compact, actions }) => {
    const navigate = useNavigate();
    const images = property.fotos ? property.fotos.split(',').filter(Boolean) : [];
    const price = property.valor_venda || property.valor_locacao || 0;
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const getOperationLabel = (op: any) => {
        if (!op) return '';
        const tipo = typeof op === 'string' ? op : op.tipo || op;
        if (tipo.toLowerCase() === 'venda') return 'Venda';
        if (tipo.toLowerCase() === 'locação' || tipo.toLowerCase() === 'locacao') return 'Locação';
        return tipo;
    };

    const getOperationColor = (op: any) => {
        const label = getOperationLabel(op);
        if (label === 'Venda') return 'bg-blue-500';
        if (label === 'Locação') return 'bg-orange-500';
        if (label.includes('/')) return 'bg-purple-500'; // Venda/Locação
        return 'bg-primary-500';
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200 dark:border-slate-700 flex flex-col h-full">
            {/* Imagem com Carrossel */}
            <div
                className={`relative ${compact ? 'h-32' : 'h-48'} bg-gray-200 dark:bg-slate-700 cursor-pointer group`}
                onClick={() => navigateToProperty(navigate, property, true)}
            >
                {images.length > 0 ? (
                    <>
                        <img
                            src={images[currentImageIndex]}
                            alt={property.titulo}
                            className="w-full h-full object-cover"
                        />
                        {images.length > 1 && (
                            <>
                                {/* Botão Anterior */}
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                {/* Botão Próximo */}
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                {/* Indicadores */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                    {images.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Home size={48} className="text-gray-400" />
                    </div>
                )}
                <div className={`absolute top-3 right-3 ${getOperationColor(property.operacao)} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                    {getOperationLabel(property.operacao)}
                </div>
                {property.isPartnership && (
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={12} />
                        Aceita
                    </div>
                )}
            </div>

            {/* Conteúdo */}
            <div className={`p-4 flex flex-col flex-grow ${compact ? 'p-3' : 'p-4'}`}>
                <div className="mb-auto cursor-pointer" onClick={() => navigateToProperty(navigate, property, true)}>
                    <h3 className={`font-bold text-gray-900 dark:text-white line-clamp-1 ${compact ? 'text-base' : 'text-lg'}`}>
                        {property.titulo}
                    </h3>
                    <p className="text-xs text-gray-900 dark:text-white mb-1 flex items-center gap-1 truncate">
                        {property.tipo_imovel} para {property.operacao}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-1 truncate">
                        <MapPin size={14} />
                        {property.bairro}, {property.cidade}
                    </p>
                </div>

                {/* Características */}
                <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {property.quartos > 0 && (
                        <div className="flex items-center gap-1" title="Quartos">
                            <Bed size={16} />
                            {property.quartos}
                        </div>
                    )}
                    {property.banheiros > 0 && (
                        <div className="flex items-center gap-1" title="Banheiros">
                            <Bath size={16} />
                            {property.banheiros}
                        </div>
                    )}
                    {property.vagas > 0 && (
                        <div className="flex items-center gap-1" title="Vagas">
                            <Car size={16} />
                            {property.vagas}
                        </div>
                    )}
                    {property.area_priv > 0 && (
                        <div className="flex items-center gap-1" title="Área Privativa">
                            <Maximize size={16} />
                            {property.area_priv}m²
                        </div>
                    )}
                </div>

                {/* Preço */}
                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl mb-4">
                    {formatCurrency(price)}
                </p>

                {/* Actions */}
                {actions ? actions : (
                    <div className="flex flex-col gap-2 mt-auto">
                        <button
                            onClick={() => navigateToProperty(navigate, property, true)}
                            className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Eye size={16} />
                            Ver Anúncio
                        </button>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Aceita Parceria?
                            </span>
                            <button
                                onClick={() => onToggle(property, property.isPartnership || false)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${property.isPartnership
                                    ? 'bg-emerald-600'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${property.isPartnership ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                )}
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
    const [userRadius, setUserRadius] = useState<number | null>(10);
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
                .select('cidade, uf, latitude, longitude, raio_atuacao')
                .eq('id', user?.id)
                .single();

            if (profileError) throw profileError;

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
            setUserRadius(userProfile.raio_atuacao || 10);

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
          operacao (tipo)
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Carregando imóveis...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-6">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Imóveis Parceiros</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Aceite parcerias com outros Corretores e aumente seu Faturamento!
                    </p>

                </div>

                {/* Radius Filter */}
                {userLocation && !missingCity && (
                    <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapPin size={20} className="text-primary-500" />
                                Filtrar por Raio de Atuação
                            </h3>
                            <span className="text-sm text-gray-500">
                                {filteredProperties.length} {filteredProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {[1, 3, 5, 10, 20, null].map((radius) => (
                                <button
                                    key={radius || 'all'}
                                    onClick={() => setUserRadius(radius || 999)}
                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${(radius === null && userRadius >= 999) || userRadius === radius
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    {radius ? `${radius}km` : 'Todo o Estado'}
                                </button>
                            ))}
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            💡 Dica: Escolha um raio menor para focar em imóveis próximos à sua região de atuação
                        </p>
                    </div>
                )}

                {/* Alert for missing city */}
                {missingCity && (
                    <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="text-amber-600 dark:text-amber-400" size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                                    Configure sua cidade para ver imóveis parceiros
                                </h3>
                                <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                                    Para visualizar imóveis disponíveis para parceria, você precisa configurar sua cidade no seu perfil.
                                    Isso permite que mostremos apenas imóveis da sua região.
                                </p>
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <MapPin size={16} />
                                    Ir para Configurações
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Available Properties Section - MOVED TO TOP */}
                {!missingCity && availableProperties.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Disponíveis para Parceria
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {availableProperties.length} {availableProperties.length === 1 ? 'imóvel disponível' : 'imóveis disponíveis'}
                                </p>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded transition-colors ${viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-700 text-primary-500 shadow'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    title="Visualização em Cards"
                                >
                                    <Grid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded transition-colors ${viewMode === 'list'
                                        ? 'bg-white dark:bg-slate-700 text-primary-500 shadow'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    title="Visualização em Lista"
                                >
                                    <List size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`p-2 rounded transition-colors ${viewMode === 'map'
                                        ? 'bg-white dark:bg-slate-700 text-primary-500 shadow'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                                        onToggle={onToggle}
                                    />
                                ))}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => handleSort('tipo_imovel')}>
                                                    Tipo
                                                </th>
                                                <th className="px-2 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => handleSort('operacao')}>
                                                    Op.
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => handleSort('bairro')}>
                                                    Bairro
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => handleSort('cidade')}>
                                                    Cidade
                                                </th>
                                                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => handleSort('quartos')} title="Quartos">
                                                    <Bed size={16} className="inline" />
                                                </th>
                                                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => handleSort('banheiros')} title="Banheiros">
                                                    <Bath size={16} className="inline" />
                                                </th>
                                                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => handleSort('vagas')} title="Vagas">
                                                    <Car size={16} className="inline" />
                                                </th>
                                                <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => handleSort('area_priv')} title="Área">
                                                    <Maximize size={16} className="inline" />
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => handleSort('valor_venda')}>
                                                    Valor
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                            {sortProperties(availableProperties).map((property) => {
                                                const price = property.valor_venda || property.valor_locacao || 0;
                                                const operacao = property.operacao?.replace('/', '/\n') || property.operacao;
                                                return (
                                                    <tr key={property.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{property.tipo_imovel}</td>
                                                        <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{operacao}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{property.bairro}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{property.cidade}</td>
                                                        <td className="px-2 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{property.quartos || '-'}</td>
                                                        <td className="px-2 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{property.banheiros || '-'}</td>
                                                        <td className="px-2 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{property.vagas || '-'}</td>
                                                        <td className="px-2 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{property.area_priv || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(price)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => navigateToProperty(navigate, property, true)}
                                                                    className="p-1.5 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                                                                    title="Ver Anúncio"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => onToggle(property, false)}
                                                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg transition-colors font-medium"
                                                                    title="Aceitar Parceria"
                                                                >
                                                                    <Handshake size={14} className="inline" />
                                                                </button>
                                                            </div>
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
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden" style={{ height: '600px' }}>
                                <PropertyMap
                                    properties={availableProperties as any}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Accepted Partnerships Section - MOVED TO BOTTOM */}
                {!missingCity && acceptedProperties.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CheckCircle className="text-emerald-500" size={28} />
                                    Minhas Parcerias Aceitas
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {acceptedProperties.length} {acceptedProperties.length === 1 ? 'parceria ativa' : 'parcerias ativas'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {acceptedProperties.map((property) => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    onToggle={onToggle}
                                    actions={
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigateToProperty(navigate, property, true)}
                                                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Eye size={16} />
                                                Ver Anúncio
                                            </button>
                                            <button
                                                onClick={() => onToggle(property, true)}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                                                title="Remover Parceria"
                                            >
                                                <Handshake size={16} />
                                            </button>
                                        </div>
                                    }
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!missingCity && filteredProperties.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Handshake className="text-gray-400" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Nenhum imóvel disponível. Aumente o Raio de Atuação.
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Não há imóveis disponíveis para parceria na sua região no momento.
                        </p>
                    </div>
                )}
            </div>

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
