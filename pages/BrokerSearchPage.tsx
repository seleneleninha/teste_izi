
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { PropertyCard } from '../components/PropertyCard';
import { NoPropertiesFound } from '../components/NoPropertiesFound';
import { BrokerFooter } from '../components/BrokerFooter';
import { BrokerNavbar } from '../components/BrokerNavbar';
// ... (imports)
import { MapPin, Phone, Mail, Building2, Home, MessageCircle, CheckCircle2, Search, Heart, Instagram, Facebook, Linkedin, Youtube, Twitter, AtSign, Map as MapIcon, Building, MapPinHouse, MapPinned, Tractor, Trees, TreePalm, ArrowRight, Heading2Icon, ArrowLeft, Loader2, X, Grid } from 'lucide-react';
import { PropertyMap } from '../components/PropertyMap';
import { formatCurrency } from '../lib/formatters';
import { getRandomBackground } from '../lib/backgrounds';
import { getVerificationConfig } from '../lib/verificationHelper';

interface BrokerProfile {
    id: string;
    nome: string;
    sobrenome: string;
    creci: string;
    uf_creci: string;
    whatsapp: string;
    email: string;
    avatar: string;
    watermark_dark?: string;
    marca_dagua?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    x?: string;
    slug: string;
    plano_id?: string;
}

export const BrokerSearchPage: React.FC = () => {
    const { slug: rawSlug } = useParams<{ slug: string }>();
    // Remove trailing slash and any path segments (like /buscar)
    const slug = rawSlug?.split('/')[0] || ''; // Take only the first segment

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
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

    // Random background for header
    const [background] = useState(() => getRandomBackground());

    // Verification badge based on broker's plan
    const verificationConfig = React.useMemo(
        () => getVerificationConfig(broker?.plano_id),
        [broker?.plano_id]
    );

    const standardTypes = ['Apartamento', 'Casa', 'Comercial', 'Rural', 'Terreno'];

    useEffect(() => {
        if (slug) {
            fetchBrokerAndProperties();
            fetchPropertyTypes();
        }
    }, [slug, searchParams]); // Re-fetch when search params change

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

            // 2. Fetch Properties - Read URL params from BrowserRouter
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

        navigate(`/${broker.slug}/buscar?${params.toString()}`);
    };

    const clearFilters = () => {
        setSelectedOperation('');
        setSelectedType('');
        setSelectedPriceRange('');
        setSearchTerm('');
        navigate(`/${broker.slug}/buscar`);
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
            <div className="relative py-12 md:py-20 overflow-hidden mt-20">
                {/* Background Image - Random */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={background}
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    {/* Dark Overlay Mask */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-midnight-950/95"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center mb-12">
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

                <div className="container mx-auto px-4 relative z-10 text-center mt-20">
                    {/* AVATAR + VERIFIED BADGE */}
                    <div className="flex justify-center mb-6">
                        <div className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full p-[3px] ${verificationConfig ? `${verificationConfig.gradientClass} ${verificationConfig.pulseClass}` : 'bg-white/20'}`}>
                            <div className="absolute inset-[3px] bg-slate-900 rounded-full z-0"></div>
                            <img
                                src={broker.avatar || `https://ui-avatars.com/api/?name=${broker.nome}`}
                                alt={broker.nome}
                                className="w-full h-full rounded-full object-cover border-4 border-slate-900 relative z-10"
                            />
                            {verificationConfig && (
                                <div className="absolute -bottom-1 -right-1 z-20" title={verificationConfig.title}>
                                    <img src={verificationConfig.badgeUrl} alt={verificationConfig.title} className={`w-10 h-10 drop-shadow-xl ${verificationConfig.pulseClass}`} />
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4 mt-2 flex items-center justify-center gap-3">
                        {broker.nome} {broker.sobrenome}
                        {verificationConfig && (
                            <img src={verificationConfig.badgeUrl} alt={verificationConfig.title} className="w-8 h-8 object-contain drop-shadow-md" />
                        )}
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Encontre o imóvel ideal para sua Família. Estou à disposição para realizarmos seu sonho juntos!
                    </p>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="container mx-auto px-4 -mt-2 relative z-20 mb-12">
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
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500/50 hover:bg-red-500/80 text-red-400 font-bold py-3 px-4 rounded-full transition-colors border border-red-500/20"
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
                                {viewMode === 'grid' ? 'Ver Mapa' : 'Ocultar Mapa'}
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
                    <div className="h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-0">
                        <PropertyMap properties={properties} brokerSlug={broker.slug} />
                    </div>
                )}

                {properties.length === 0 && (
                    <NoPropertiesFound
                        filters={{
                            operacao: selectedOperation,
                            tipoImovel: selectedType,
                            cidade: '', // Can be extracted from search term if needed
                        }}
                        onShowMore={clearFilters}
                    />
                )}
            </div>

            {/* CTA */}
            <section className="py-20 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/parceria.png"
                        alt="Parceria"
                        className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/30 to-slate-900/30"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center text-white">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para <span className="text-emerald-400">Achar o Lar dos Sonhos?</span></h2>
                    <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
                        Deixe-me <span className="text-yellow-400 font-bold">ajudar você e sua Família</span> a realizar esse sonho tão importante na vida de vocês.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={`https://wa.me/55${broker.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center text-center w-full sm:w-auto gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-8 py-5 rounded-full transition-all shadow-xl shadow-emerald-500/40 hover:scale-105 active:scale-95"
                        >
                            <MessageCircle size={24} className="animate-pulse" />
                            <span className="text-xl uppercase tracking-tighter">Fale Comigo no WhatsApp</span>
                        </a>
                    </div>
                </div>
            </section>


            <BrokerFooter partner={{
                name: `${broker.nome} ${broker.sobrenome}`,
                creci: `${broker.creci}/${broker.uf_creci}`,
                phone: broker.whatsapp,
                email: broker.email,
                slug: broker.slug,
                logo: broker.watermark_dark || broker.marca_dagua,
                instagram: broker.instagram,
                facebook: broker.facebook,
                linkedin: broker.linkedin,
                youtube: broker.youtube,
                x: broker.x
            }} />
        </div >
    );
};
