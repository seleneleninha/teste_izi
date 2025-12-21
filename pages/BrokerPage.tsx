import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Phone, Mail, Building2, Home, MessageCircle, CheckCircle2, Search, Heart, Instagram, Facebook, Linkedin, Youtube, Twitter, AtSign, Map as MapIcon, Building, MapPinHouse, MapPinned, Tractor, Trees, TreePalm, ArrowRight, Heading2Icon } from 'lucide-react';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { PropertyCard } from '../components/PropertyCard';
import { NoPropertiesFound } from '../components/NoPropertiesFound';
import { useTheme } from '../components/ThemeContext';
import { Footer } from '../components/Footer';
import { BrokerFooter } from '../components/BrokerFooter';
import { BrokerNavbar } from '../components/BrokerNavbar';
import { getRandomBackground } from '../lib/backgrounds';
import { SearchFilter } from '../components/SearchFilter';

interface BrokerProfile {
    id: string;  // UUID do usuário (chave primária)
    nome: string;
    sobrenome: string;
    email: string;
    whatsapp: string;
    creci: string;
    uf_creci: string;
    avatar: string;
    slug: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    show_address: boolean;
    watermark_light: string;
    watermark_dark: string;
    instagram?: string;
    facebook?: string;
    threads?: string;
    youtube?: string;
    linkedin?: string;
    x?: string;
    mensagem_boasvindas?: string;
    boasvindas2?: string;
}

interface Property {
    id: string;
    user_id: string;
    cod_imovel: number;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number | null;
    valor_locacao: number | null;
    valor_diaria?: number;
    valor_mensal?: number;
    fotos: string[];
    operacao: any;
    tipo_imovel: any;
    quartos: number;
    banheiros: number;
    vagas: number;
    area_priv: number;
    aceita_parceria: boolean;
    latitude?: number;
    longitude?: number;
    created_at: string;
}

export const BrokerPage: React.FC = () => {
    const { slug: rawSlug } = useParams<{ slug: string }>();
    // Remove trailing slash, /buscar, and any other path segments after the slug
    const slug = rawSlug?.replace(/\/$/, '').split('/')[0] || '';
    console.log('BrokerPage - Raw slug:', rawSlug, '- Sanitized slug:', slug);
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [broker, setBroker] = useState<BrokerProfile | null>(null);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [bgImage, setBgImage] = useState(getRandomBackground());
    const [showMap, setShowMap] = useState(false);
    const [PropertyMap, setPropertyMap] = useState<React.ComponentType<any> | null>(null);

    // Derived State
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [topCities, setTopCities] = useState<string[]>([]);
    const [topNeighborhoods, setTopNeighborhoods] = useState<string[]>([]);

    const cityImages: Record<string, string> = {
        'natal': '/cities/natal.png',
        'parnamirim': '/cities/parnamirim.png',
        'macaíba': '/cities/macaiba.png',
        'nísia floresta': '/cities/nisia_floresta.png',
        'são gonçalo do amarante': '/cities/sao_goncalo_amarante.png',
        'extremoz': '/cities/extremoz.png',
        'são josé de mipibu': '/cities/sao_jose_mipibu.png'
    };

    useEffect(() => {
        if (slug) {
            fetchBrokerData();
        }
        // Dynamically import PropertyMap
        import('../components/PropertyMap').then(module => {
            setPropertyMap(() => module.PropertyMap);
        });
    }, [slug]);

    const fetchBrokerData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Broker first (needed for user_id)
            const { data: brokerData, error: brokerError } = await supabase
                .from('perfis')
                .select('*')
                .eq('slug', slug)
                .single();

            // DEBUG: Ver exatamente o que vem do banco
            console.log('BrokerPage - brokerData completo:', brokerData);
            console.log('BrokerPage - brokerData.id:', brokerData?.id);
            console.log('BrokerPage - brokerData.user_id:', brokerData?.user_id);
            console.log('BrokerPage - Todas as chaves:', brokerData ? Object.keys(brokerData) : 'null');

            if (brokerError) throw brokerError;
            if (!brokerData) {
                navigate('/');
                return;
            }

            setBroker(brokerData);

            // ⚡ OPTIMIZATION: Paralelizar queries de propriedades e parcerias
            const [
                { data: ownPropsData, error: ownPropsError },
                { data: partnershipsData, error: partnershipsError }
            ] = await Promise.all([
                // 2. Fetch Own Properties
                supabase
                    .from('anuncios')
                    .select(`
                      *,
                      tipo_imovel (tipo),
                      operacao (tipo)
                    `)
                    .eq('user_id', brokerData.id)
                    .eq('status', 'ativo')
                    .order('created_at', { ascending: false }),

                // 3. Fetch Partnerships (only 'aceita' status)
                supabase
                    .from('parcerias')
                    .select(`
                      property_id,
                      anuncios (
                        *,
                        tipo_imovel (tipo),
                        operacao (tipo)
                      )
                    `)
                    .eq('user_id', brokerData.id)
                    .eq('status', 'aceita') // Só parcerias aceitas
                    .eq('anuncios.status', 'ativo') // Só imóveis ativos
            ]);

            if (ownPropsError) throw ownPropsError;

            // 4. Merge and Transform Data
            let allProps: Property[] = [];

            if (ownPropsData) {
                allProps = ownPropsData.map(p => ({
                    ...p,
                    fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                    operacao: p.operacao?.tipo || p.operacao,
                    tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                    aceita_parceria: false // Own property
                }));
            }

            if (!partnershipsError && partnershipsData) {
                const partnerProps = partnershipsData
                    .map(p => p.anuncios)
                    .filter(Boolean)
                    .map((p: any) => ({
                        ...p,
                        fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                        operacao: p.operacao?.tipo || p.operacao,
                        tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                        aceita_parceria: true // Partner property
                    }));
                allProps = [...allProps, ...partnerProps];
            }

            // Remove duplicates (just in case)
            const uniqueProps = Array.from(new Map(allProps.map(item => [item.id, item])).values());
            setAllProperties(uniqueProps as any);

            // 5. Calculate Counts and Top Lists LOCAL to this broker
            const counts: Record<string, number> = {
                'apartamento': 0, 'casa': 0, 'comercial': 0, 'rural': 0, 'terreno': 0, 'temporada': 0
            };
            const cityCounts: Record<string, number> = {};
            const neighborhoodCounts: Record<string, number> = {};

            uniqueProps.forEach((p: any) => {
                // Type counts
                const type = p.tipo_imovel?.toLowerCase();
                const op = p.operacao?.toLowerCase();

                if (op === 'temporada') counts['temporada']++;
                else if (counts[type] !== undefined) counts[type]++;

                // City counts
                if (p.cidade) {
                    cityCounts[p.cidade] = (cityCounts[p.cidade] || 0) + 1;
                }
                // Neighborhood counts
                if (p.bairro) {
                    neighborhoodCounts[p.bairro] = (neighborhoodCounts[p.bairro] || 0) + 1;
                    // Also store keyed by bairro_Name for the badge lookup similar to Home
                    counts[`bairro_${p.bairro}`] = (counts[`bairro_${p.bairro}`] || 0) + 1;
                    counts[`city_${p.cidade}`] = (counts[`city_${p.cidade}`] || 0) + 1;
                }
            });

            setCategoryCounts(counts);

            // Sort Cities
            const sortedCities = Object.entries(cityCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([name]) => name);
            setTopCities(sortedCities);

            // Sort Neighborhoods
            const sortedNeighborhoods = Object.entries(neighborhoodCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 20)
                .map(([name]) => name);
            setTopNeighborhoods(sortedNeighborhoods);

        } catch (error) {
            console.error('Erro ao buscar dados do corretor:', error);
            // TODO: Show error toast to user
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return null; // Render nothing during loading for cleaner experience
    }

    if (!broker) return null;

    // Split properties: Own properties in "Destaque", Partnered properties in "Outras Opções"
    const ownProperties = allProperties.filter(p => !p.aceita_parceria);
    const partneredProperties = allProperties.filter(p => p.aceita_parceria);

    // DEBUG: Verificar parcerias
    console.log('BrokerPage - Total properties:', allProperties.length);
    console.log('BrokerPage - Own properties:', ownProperties.length);
    console.log('BrokerPage - Partnered properties:', partneredProperties.length);
    console.log('BrokerPage - Partnered props detail:', partneredProperties);

    return (
        <div className="bg-midnight-950 text-white font-sans min-h-screen transition-colors duration-200">
            <BrokerNavbar brokerSlug={broker.slug} />
            {/* Hero Section */}
            <section className="relative h-[700px] flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src={bgImage}
                        alt="Background"
                        className="w-full h-full object-cover transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-midnight-950/95"></div>
                </div>

                <div className="container mx-auto px-4 z-10 text-center relative mt-[-60px]">
                    <h2 className="text-4xl md:text-7xl font-heading font-bold text-white mb-2 leading-tight animate-float">
                        {/* First Message - Emerald */}
                        {broker.mensagem_boasvindas && (
                            <p className="text-3xl md:text-4xl font-heading font-bold text-emerald-400 leading-tight">
                                {broker.mensagem_boasvindas}
                            </p>
                        )}
                    </h2>

                    <div className="container mx-auto px-4 z-10 relative">
                        <div className="flex flex-col items-center gap-6 justify-center animate-fadeIn max-w-4xl mx-auto">
                            {/* Welcome Messages - Outside Card, No Background */}
                            <div className="flex flex-col items-center text-center gap-3 mb-4">

                                {/* Second Message */}
                                {broker.boasvindas2 && (
                                    <p className="text-3xl md:text-4xl font-heading font-bold text-midnight-400 leading-tight animate-pulse">
                                        {broker.boasvindas2}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search Filter Component - Floating & Glass */}
            <div className="container mx-auto px-4 relative z-20 -mt-32 mb-0">
                <SearchFilter brokerSlug={slug} />
            </div>

            {/* Browse by Type Section */}
            <section className="py-24 bg-midnight-950 relative overflow-hidden">
                {/* Decorative background blob */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10">
                    <h3 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                        <span className="w-2 h-8 bg-blue-500 rounded-full" /> Explore por <span className="text-blue-400">Categoria</span>
                    </h3>
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-6">
                        {[
                            { label: 'Apto', type: 'apartamento', icon: <Building size={28} /> },
                            { label: 'Casa', type: 'casa', icon: <MapPinHouse size={28} /> },
                            { label: 'Comercial', type: 'comercial', icon: <Building2 size={28} /> },
                            { label: 'Rural', type: 'rural', icon: <Trees size={28} /> },
                            { label: 'Temporada', type: 'temporada', icon: <TreePalm size={28} /> },
                            { label: 'Terrenos', type: 'terreno', icon: <MapPinned size={28} /> },
                        ]
                            .filter(category => (categoryCounts[category.type] || 0) > 0) // ✅ Só exibir cards com imóveis
                            .map((category, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (category.type === 'temporada') {
                                            navigate(`/${slug}/buscar?operacao=temporada`);
                                        } else {
                                            navigate(`/${slug}/buscar?tipo=${category.type}`);
                                        }
                                    }}
                                    className="group relative h-40 rounded-3xl bg-midnight-900/40 backdrop-blur-sm border border-white/5 hover:border-emerald-500/30 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-3 hover:-translate-y-2 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-500" />

                                    <div className="relative z-10 text-gray-400 group-hover:text-emerald-400 transition-colors duration-300 p-3 bg-white/5 rounded-full group-hover:bg-emerald-500/10 group-hover:scale-110 transform">
                                        {category.icon}
                                    </div>

                                    <div className="relative z-10 text-center">
                                        <h3 className="font-bold text-white text-base group-hover:text-emerald-100 transition-colors">{category.label}</h3>
                                        <p className="text-xs text-gray-500 group-hover:text-emerald-400/80 transition-colors mt-1 font-medium">
                                            {categoryCounts[category.type] || 0} opções
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </section>

            {/* Imóveis em Destaque (Featured) */}
            <section className="py-24 bg-midnight-900 relative border-t border-white/5">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div>
                            <h3 className="text-3xl font-bold mb-2 text-white flex items-center gap-3">
                                <span className="w-2 h-8 bg-red-500 rounded-full" /> Imóveis em <span className="text-red-400">Destaque</span>
                            </h3>
                            <p className="text-xl text-gray-400 font-bold max-w-lg">
                                As melhores oportunidades selecionadas para você.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowMap(!showMap)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${showMap
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-emerald-500/50'
                                }`}
                        >
                            <MapIcon size={18} />
                            {showMap ? 'Ocultar Mapa' : 'Ver no Mapa'}
                        </button>
                    </div>

                    {/* Map View */}
                    {showMap && PropertyMap && (
                        <div className="mb-12 h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-20">
                            <PropertyMap properties={allProperties} />
                        </div>
                    )}

                    <HorizontalScroll itemWidth={330} gap={24} itemsPerPage={4}>
                        {ownProperties.map((property) => (
                            <div key={property.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                <PropertyCard property={property} brokerSlug={slug} />
                            </div>
                        ))}
                        {ownProperties.length === 0 && broker && (
                            <>
                                {console.log('BrokerPage - broker.id:', broker.id)}
                                <NoPropertiesFound
                                    message="Você ainda não cadastrou imóveis próprios"
                                    subtitle="Que tal começar adicionando seu primeiro imóvel? Ou então, explore oportunidades de parceria com outros corretores."
                                    onShowMore={() => window.location.href = `/${broker.slug}`}
                                    brokerId={broker.id}
                                />
                            </>
                        )}
                    </HorizontalScroll>
                </div>
            </section>

            {/* Veja Outras Opções - Imóveis de Parceria */}
            {partneredProperties.length > 0 && (
                <section className="py-24 bg-midnight-950/50 relative">
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                                <span className="w-2 h-8 bg-purple-500 rounded-full" /> Veja Outras <span className="text-purple-400">Opções</span>
                            </h3>
                        </div>

                        <HorizontalScroll itemWidth={330} gap={24} itemsPerPage={4}>
                            {partneredProperties.map((property) => (
                                <div key={property.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                    <PropertyCard property={property} brokerSlug={slug} />
                                </div>
                            ))}
                        </HorizontalScroll>
                    </div>
                </section>
            )}


            {/* Cities & Neighborhoods */}
            <section className="py-24 bg-midnight-900 relative">
                <div className="container mx-auto px-4">
                    {/* Cities */}
                    <div className="mb-20">
                        <h3 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-pink-500 rounded-full" /> Principais <span className="text-pink-400">Cidades</span>
                        </h3>
                        <HorizontalScroll itemWidth={280} gap={20} itemsPerPage={4}>
                            {topCities.map((city, idx) => (
                                <div key={idx} className="flex-none w-[280px]" style={{ scrollSnapAlign: 'center' }}>
                                    <div
                                        className="relative h-[400px] rounded-3xl overflow-hidden cursor-pointer group hover:-translate-y-2 transition-transform duration-500 isolate"
                                        style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                                        onClick={() => navigate(`/${slug}/buscar?q=${encodeURIComponent(city)}`)}
                                    >
                                        <div
                                            className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110`}
                                            style={{
                                                backgroundImage: cityImages[city.toLowerCase()]
                                                    ? `url(${cityImages[city.toLowerCase()]})`
                                                    : undefined
                                            }}
                                        >
                                            <div className={`absolute inset-0 ${cityImages[city.toLowerCase()]
                                                ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent'
                                                : `bg-gradient-to-br ${idx % 3 === 0 ? 'from-emerald-900 via-teal-900 to-slate-900' : idx % 3 === 1 ? 'from-indigo-900 via-purple-900 to-slate-900' : 'from-cyan-900 via-blue-900 to-slate-900'}`
                                                }`} />
                                        </div>

                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                                        {/* Count Badge */}
                                        <div className="absolute top-8 left-8 z-20 flex flex-col items-start p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-black/10 group-hover:bg-black/10 transition-colors">
                                            <span className="text-3xl font-heading font-black text-white leading-none">
                                                {categoryCounts[`city_${city}`]}
                                            </span>
                                            <span className="text-xs tracking-wider text-white font-bold mt-1">
                                                {categoryCounts[`city_${city}`] === 1 ? 'opção' : 'opções'}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-0 left-0 p-8 w-full z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                            <h3 className="text-2xl font-bold text-white mb-2 truncate pr-2" title={city}>
                                                {city}
                                            </h3>
                                            <div className="h-1 w-12 bg-emerald-500 rounded-full group-hover:w-full transition-all duration-500" />
                                            <p className="text-gray-300 text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 flex items-center">
                                                Ver disponíveis <ArrowRight size={14} className="inline ml-1" />
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {topCities.length === 0 && <p className="text-gray-500">Nenhuma cidade encontrada.</p>}
                        </HorizontalScroll>
                    </div>

                    {/* Neighborhoods (Pills Style) */}
                    <div>
                        <h3 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-emerald-500 rounded-full" /> Bairros <span className="text-emerald-400">em Alta</span>
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {topNeighborhoods.map((bairro, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(`/${slug}/buscar?q=${encodeURIComponent(bairro)}`)}
                                    className="group relative px-6 py-3 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-emerald-500/50 hover:text-white hover:scale-105 transition-all duration-300 font-medium"
                                >
                                    {bairro}
                                    {/* Notification Badge Count */}
                                    {categoryCounts[`bairro_${bairro}`] > 0 && (
                                        <span className="absolute -top-2 -right-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow-sm ring-1 ring-white transition-transform duration-300 group-hover:scale-110">
                                            {categoryCounts[`bairro_${bairro}`]}
                                        </span>
                                    )}
                                </button>
                            ))}
                            {topNeighborhoods.length === 0 && <p className="text-gray-500">Nenhum bairro encontrado.</p>}
                        </div>
                    </div>
                </div>
            </section>

            <BrokerFooter
                partner={{
                    name: `${broker.nome} ${broker.sobrenome}`,
                    email: broker.email,
                    phone: broker.whatsapp,
                    creci: `${broker.creci}/${broker.uf_creci}`,
                    logo: broker.watermark_dark,
                    slug: broker.slug,
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
                }}
            />
        </div>
    );
};
