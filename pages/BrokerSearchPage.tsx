
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { PropertyCard } from '../components/PropertyCard';
import { BrokerFooter } from '../components/BrokerFooter';
import { BrokerNavbar } from '../components/BrokerNavbar';
// ... (imports)
import { Loader2, Search, X, ArrowLeft, Map as MapIcon, Grid } from 'lucide-react';
import { PropertyMap } from '../components/PropertyMap';
import { formatCurrency } from '../lib/formatters';

interface BrokerProfile {
    id: string;
    nome: string;
    sobrenome: string;
    creci: string;
    uf_creci: string;
    whatsapp: string;
    email: string;
    avatar: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    x?: string;
    slug: string;
}

export const BrokerSearchPage: React.FC = () => {
    const { slug: rawSlug } = useParams<{ slug: string }>();
    // Remove trailing slash and any path segments (like /buscar)
    const slug = rawSlug?.split('/')[0] || ''; // Take only the first segment

    const navigate = useNavigate();
    const [broker, setBroker] = useState<BrokerProfile | null>(null);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [propertyTypes, setPropertyTypes] = useState<{ tipo: string; disponivel_temporada: boolean }[]>([]);

    // Filters State
    const [selectedType, setSelectedType] = useState('');
    const [selectedPriceRange, setSelectedPriceRange] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOperation, setSelectedOperation] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

    const standardTypes = ['Apartamento', 'Casa', 'Comercial', 'Rural', 'Terreno'];

    useEffect(() => {
        if (slug) {
            fetchBrokerAndProperties();
            fetchPropertyTypes();
        }
    }, [slug, location.search]); // Re-fetch if search params change

    // Compute filtered types based on operation
    const filteredPropertyTypes = propertyTypes.filter(type => {
        if (selectedOperation === 'temporada') {
            return type.disponivel_temporada === true;
        } else {
            return standardTypes.some(st => st.toLowerCase() === type.tipo.toLowerCase());
        }
    });

    const fetchPropertyTypes = async () => {
        try {
            const { data, error } = await supabase.from('tipo_imovel').select('tipo, disponivel_temporada').order('tipo');
            if (data) setPropertyTypes(data);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };

    const fetchBrokerAndProperties = async () => {
        setLoading(true);
        try {
            // 1. Fetch Broker Profile
            const { data: brokerData, error: brokerError } = await supabase
                .from('perfis')
                .select('*')
                .eq('slug', slug)
                .single();

            if (brokerError || !brokerData) {
                console.error('Broker not found:', brokerError);
                navigate('/'); // Redirect home if broker not found
                return;
            }

            setBroker(brokerData);

            // 2. Fetch Properties
            const searchParams = new URLSearchParams(window.location.hash.split('?')[1]); // Hash router support

            const type = searchParams.get('tipo') || '';
            const operacao = searchParams.get('operacao') || '';
            const term = searchParams.get('q') || '';
            const priceRange = searchParams.get('price') || '';

            // Sync state with URL params
            setSelectedType(type);
            setSelectedOperation(operacao);
            setSearchTerm(term);
            setSelectedPriceRange(priceRange);

            // Fetch logic similar to PropertiesList.fetchProperties, but scoped to this broker
            // For simplicity, we can fetch all broker's active properties and filter client-side 
            // OR implement the same scoped query. Let's do the scoped query for performance.

            const brokerId = brokerData.id;

            // ... (Query logic similar to PropertiesList but with user_id = brokerId)
            // Including partnerships logic if needed.

            let ownPropertiesQuery = supabase
                .from('anuncios')
                .select(`
            *,
            tipo_imovel!inner (tipo),
            operacao (tipo)
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

            const [ownResult, partnerResult] = await Promise.all([
                ownPropertiesQuery,
                partnerPropertiesQuery
            ]);

            const combinedData = [
                ...(ownResult.data || []),
                ...(partnerResult?.data || [])
            ];

            // Remove duplicates
            const uniqueData = Array.from(new Map(combinedData.map(item => [item.id, item])).values());

            let filteredData = uniqueData;

            // Apply filters
            if (type) {
                filteredData = filteredData.filter(p => p.tipo_imovel?.tipo?.toLowerCase().includes(type.toLowerCase()));
            }
            if (operacao) {
                filteredData = filteredData.filter(p => {
                    const opType = p.operacao?.tipo?.toLowerCase();
                    if (operacao === 'venda') return opType === 'venda' || opType === 'venda/locação' || opType === 'venda/locacao';
                    if (operacao === 'locacao') return opType === 'locação' || opType === 'locacao' || opType === 'venda/locação' || opType === 'venda/locacao';
                    return opType?.includes(operacao.toLowerCase());
                });
            }
            if (term) {
                const lowerTerm = term.toLowerCase();
                filteredData = filteredData.filter(p =>
                    p.titulo?.toLowerCase().includes(lowerTerm) ||
                    p.bairro?.toLowerCase().includes(lowerTerm) ||
                    p.cidade?.toLowerCase().includes(lowerTerm)
                );
            }
            if (priceRange) {
                const [min, max] = priceRange.split('-').map(Number);
                filteredData = filteredData.filter(p => {
                    const price = p.valor_venda || p.valor_locacao || 0;
                    return price >= min && price <= max;
                });
            }

            // Map to PropertyCard format
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
                status: p.status,
                latitude: p.latitude,
                longitude: p.longitude
            }));

            setProperties(formattedProperties);

        } catch (error) {
            console.error('Error fetching broker search data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (selectedOperation) params.append('operacao', selectedOperation);
        if (selectedType) params.append('tipo', selectedType);
        if (searchTerm) params.append('q', searchTerm);
        if (selectedPriceRange) params.append('price', selectedPriceRange);

        navigate(`/corretor/${broker.slug}/buscar?${params.toString()}`);
    };

    const clearFilters = () => {
        setSelectedOperation('');
        setSelectedType('');
        setSelectedPriceRange('');
        setSearchTerm('');
        navigate(`/corretor/${broker.slug}/buscar`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    if (!broker) return null;

    return (
        <div className="min-h-screen bg-midnight-950 flex flex-col">
            <BrokerNavbar brokerSlug={broker.slug} />

            {/* Broker Header (Simplified Hero) */}
            <div className="relative py-12 md:py-20 bg-midnight-950 overflow-hidden mt-20">
                {/* Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center mb-12">
                    <div className="absolute top-0 left-4 md:left-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full font-medium shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft size={18} />
                            Voltar
                        </button>
                    </div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4 mt-8 md:mt-0">
                        Buscar Imóveis
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Encontre o imóvel ideal para sua Família. Estou à disposição para realizarmos seu sonho juntos!
                    </p>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="container mx-auto px-4 -mt-8 relative z-20 mb-12">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        {/* Filter Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto flex-1">
                            <select
                                value={selectedOperation}
                                onChange={e => setSelectedOperation(e.target.value)}
                                className="bg-midnight-900 border border-white/10 text-white text-sm rounded-full px-4 py-3 outline-none focus:border-emerald-500 w-full"
                            >
                                <option value="">Operação</option>
                                <option value="venda">Venda</option>
                                <option value="locacao">Locação</option>
                                <option value="temporada">Temporada</option>
                            </select>

                            <select
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="bg-midnight-900 border border-white/10 text-white text-sm rounded-full px-4 py-3 outline-none focus:border-emerald-500 w-full"
                            >
                                <option value="">Tipo de Imóvel</option>
                                {filteredPropertyTypes.map((type, idx) => (
                                    <option key={idx} value={type.tipo}>
                                        {type.tipo.charAt(0).toUpperCase() + type.tipo.slice(1)}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedPriceRange}
                                onChange={e => setSelectedPriceRange(e.target.value)}
                                className="bg-midnight-900 border border-white/10 text-white text-sm rounded-full px-4 py-3 outline-none focus:border-emerald-500 w-full"
                            >
                                <option value="">Faixa de Preço</option>
                                <option value="0-200000">até R$200mil</option>
                                <option value="200000-500000">R$200k - R$500k</option>
                                <option value="500000-1000000">R$500k - R$1M</option>
                                <option value="1000000-2000000">R$1M - R$2M</option>
                                <option value="2000000-100000000">acima de R$2M</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row justify-center gap-4 w-full md:w-auto">
                            <button
                                onClick={handleSearch}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                <Search size={20} />
                                Buscar
                            </button>
                            <button
                                onClick={clearFilters}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 px-4 rounded-full transition-colors border border-red-500/20"
                            >
                                <X size={20} />
                                Limpar
                            </button>
                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-full transition-colors shadow-lg ${viewMode === 'map'
                                    ? 'bg-blue-600 text-white shadow-blue-500/20'
                                    : 'bg-midnight-800 text-gray-300 border border-white/10 hover:bg-midnight-700'
                                    }`}
                            >
                                {viewMode === 'grid' ? <MapIcon size={20} /> : <Grid size={20} />}
                                {viewMode === 'grid' ? 'Ver Mapa' : 'Ver Lista'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="container mx-auto px-4 pb-20 flex-1">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {properties.map(property => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                brokerSlug={broker.slug} // Ensures clicks keep context
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-0">
                        <PropertyMap properties={properties} />
                    </div>
                )}

                {properties.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        Nunhum imóvel encontrado com estes filtros.
                    </div>
                )}
            </div>

            <BrokerFooter partner={{
                name: `${broker.nome} ${broker.sobrenome}`,
                creci: `${broker.creci}/${broker.uf_creci}`,
                phone: broker.whatsapp,
                email: broker.email,
                instagram: broker.instagram,
                facebook: broker.facebook,
                linkedin: broker.linkedin,
                youtube: broker.youtube,
                x: broker.x
            }} />
        </div >
    );
};
