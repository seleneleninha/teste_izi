
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { PropertyCard } from '../components/PropertyCard';
import { NoPropertiesFound } from '../components/NoPropertiesFound';
import { BrokerFooter } from '../components/BrokerFooter';
import { BrokerNavbar } from '../components/BrokerNavbar';
import { MapPin, Phone, Mail, Building2, Home, MessageCircle, CheckCircle2, Search, Heart, ArrowLeft, Loader2, X, Grid, Filter, Map as MapIcon } from 'lucide-react';
import { PropertyMap } from '../components/PropertyMap';
import { formatCurrency } from '../lib/formatters';
import { getRandomBackground } from '../lib/backgrounds';
import { getVerificationConfig } from '../lib/verificationHelper';
import { SidebarFilter, FilterState } from '../components/SidebarFilter';
import { motion, AnimatePresence } from 'framer-motion';

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
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
}

export const BrokerSearchPage: React.FC = () => {
    const { slug: rawSlug } = useParams<{ slug: string }>();
    const slug = rawSlug?.split('/')[0] || '';

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [broker, setBroker] = useState<BrokerProfile | null>(null);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Random background for header
    const [background] = useState(() => getRandomBackground());

    // Verification badge based on broker's plan
    const verificationConfig = React.useMemo(
        () => getVerificationConfig(broker?.plano_id),
        [broker?.plano_id]
    );

    // Advanced Filters State (synced with URL)
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
        const bairroParam = searchParams.get('bairro'); // From BrokerPage "Bairros em Alta"
        const cidadeParam = searchParams.get('cidade'); // From BrokerPage "Principais Cidades"
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

        // Map cidade from BrokerPage to cities
        let cities = getParamArray('cities');
        if (cidadeParam && cities.length === 0) {
            cities = [cidadeParam];
        }

        // Map bairro from BrokerPage to neighborhoods
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

    // Sync filters to URL
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

        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [showMap, setShowMap] = useState(true);

    useEffect(() => {
        if (slug) {
            fetchBrokerAndProperties();
        }
    }, [slug]);

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
                navigate('/');
                return;
            }

            setBroker(brokerData);

            const brokerId = brokerData.id;

            // Fetch own properties
            let ownPropertiesQuery = supabase
                .from('anuncios')
                .select(`*, tipo_imovel!inner (tipo), operacao (tipo)`)
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
                    .select(`*, tipo_imovel!inner (tipo), operacao (tipo)`)
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

            // Map to PropertyCard format
            const formattedProperties = uniqueData.map(p => ({
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
                caracteristicas: p.caracteristicas || '', // Amenidades
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

    // Derived Data for Dynamic Filters
    const { availableOperations, availableTypes, availableCities, availableNeighborhoods } = useMemo(() => {
        const ops = new Set<string>();
        const types = new Set<string>();
        const cities = new Set<string>();
        const neighs = new Set<string>();

        properties.forEach(p => {
            const op = p.operacao?.toLowerCase();
            if (op) {
                if (op.includes('venda')) ops.add('venda');
                if (op.includes('locac') || op.includes('locaç')) ops.add('locacao');
                if (op.includes('temporada')) ops.add('temporada');
            }
            const type = typeof p.tipo_imovel === 'string' ? p.tipo_imovel : p.tipo_imovel?.tipo;
            if (type) types.add(type);
            if (p.cidade) cities.add(p.cidade);
            if (p.bairro) neighs.add(p.bairro);
        });

        return {
            availableOperations: Array.from(ops),
            availableTypes: Array.from(types).sort(),
            availableCities: Array.from(cities).sort(),
            availableNeighborhoods: Array.from(neighs).sort()
        };
    }, [properties]);

    // Client-side filtering
    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            // City filter
            if (filters.cities.length > 0) {
                if (!p.cidade || !filters.cities.some(c => c.toLowerCase() === p.cidade.toLowerCase())) {
                    return false;
                }
            }

            if (filters.operations.length > 0) {
                const op = p.operacao?.toLowerCase() || '';
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

            const price = p.valor_venda || p.valor_locacao || p.valor_diaria || 0;
            if (filters.minPrice !== '' && price < Number(filters.minPrice)) return false;
            if (filters.maxPrice !== '' && price > Number(filters.maxPrice)) return false;

            const area = p.area_priv || 0;
            if (filters.minArea !== '' && area < Number(filters.minArea)) return false;
            if (filters.maxArea !== '' && area > Number(filters.maxArea)) return false;

            return true;
        });
    }, [properties, filters]);

    // Show only 6 for the grid
    const viewProperties = useMemo(() => {
        return filteredProperties.slice(0, 6);
    }, [filteredProperties]);

    if (loading) {
        return (
            <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    if (!broker) return null;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <BrokerNavbar brokerSlug={broker.slug} />

            {/* Broker Header (Hero) */}
            <div className="relative py-24 md:py-32 overflow-hidden mt-20">
                {/* Background Image - Random */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={background}
                        alt="Background"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-slate-950/95"></div>
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
                        <div className={`relative w-20 h-20 md:w-28 md:h-28 rounded-full p-[3px] ${verificationConfig ? `${verificationConfig.gradientClass} ${verificationConfig.pulseClass}` : 'bg-white/20'}`}>
                            <div className="absolute inset-[3px] bg-slate-900 rounded-full z-0"></div>
                            <img
                                src={broker.avatar || `https://ui-avatars.com/api/?name=${broker.nome}`}
                                alt={broker.nome}
                                className="w-full h-full rounded-full object-cover border-4 border-slate-900 relative z-10"
                            />
                            {verificationConfig && (
                                <div className="absolute -top-1 -right-1 z-20" title={verificationConfig.title}>
                                    <img src={verificationConfig.badgeUrl} alt={verificationConfig.title} className={`md:w-8 md:h-8 w-6 h-6 drop-shadow-xl ${verificationConfig.pulseClass}`} />
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-emerald-400 font-bold text-xl md:text-2xl lg:text-3xl max-w-2xl mx-auto">
                        Encontre o imóvel ideal para sua Família. <span className="text-white">Estou à disposição para realizarmos seu sonho juntos!</span>
                    </p>
                </div>
            </div>

            {/* Main Content: Sidebar + Cards + Map */}
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
                            </div>
                        </div>

                        {/* Map Section - Collapsible */}
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
                                        brokerSlug={broker.slug}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Property Grid - SHOWS ONLY 6 */}
                        {viewProperties.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {viewProperties.map(property => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property}
                                        brokerSlug={broker.slug}
                                    />
                                ))}
                            </div>
                        ) : (
                            <NoPropertiesFound
                                filters={{
                                    operacao: filters.operations.join(','),
                                    tipoImovel: filters.types.join(','),
                                    cidade: '',
                                }}
                                onShowMore={() => setFilters({
                                    operations: [], types: [], bedrooms: null, bathrooms: null, parking: null,
                                    minPrice: '', maxPrice: '', minArea: '', maxArea: '', cities: [], neighborhoods: [], searchQuery: ''
                                })}
                            />
                        )}

                        {/* Pagination Notice */}
                        {filteredProperties.length > viewProperties.length && (
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
                endereço: broker.logradouro,
                numero: broker.numero,
                bairro: broker.bairro,
                cidade: broker.cidade,
                uf: broker.uf,
                instagram: broker.instagram,
                facebook: broker.facebook,
                linkedin: broker.linkedin,
                youtube: broker.youtube,
                x: broker.x
            }} />
        </div>
    );
};
