import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building2, Building, MapPinHouse, MapPinned, Tractor, Map as MapIcon, Map, Trees, TreePalm, ArrowRight } from 'lucide-react';
import { SearchFilter } from '../components/SearchFilter';
import { PropertyCard } from '../components/PropertyCard';
import { PublicAIAssistant } from '../components/PublicAIAssistant';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { supabase } from '../lib/supabaseClient';
import { Footer } from '../components/Footer';
import { getRandomBackground } from '../lib/backgrounds';
import { PartnersCarousel } from '../components/PartnersCarousel';
import { PropertyGridSkeleton, CityCardSkeleton } from '../components/LoadingSkeleton';
import { SEOHead, generateSchemaOrg } from '../components/SEOHead';
import { useLocation } from '../components/LocationContext';


interface Property {
    id: string;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number;
    valor_locacao: number;
    valor_diaria?: number;   // Temporada
    valor_mensal?: number;   // Temporada
    fotos: string[];
    operacao: string;
    tipo_imovel: string;
    latitude?: number;
    longitude?: number;
    quartos?: number;
    banheiros?: number;
    vagas?: number;
    area_priv?: number;
}

export const PublicHome: React.FC = () => {
    const navigate = useNavigate();
    const [recentProperties, setRecentProperties] = useState<Property[]>([]);
    const [allMapMarkers, setAllMapMarkers] = useState<Property[]>([]); // TODOS os imóveis para o mapa
    const [cities, setCities] = useState<string[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [showMap, setShowMap] = useState(false);
    const [PropertyMap, setPropertyMap] = useState<React.ComponentType<any> | null>(null);
    const [bgImage, setBgImage] = useState(getRandomBackground());
    const { location } = useLocation();
    const [activeCity, setActiveCity] = useState<string | null>(null);

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
        if (location.loading) return; // Wait for location check to finish

        fetchData(location.city);
        fetchCategoryCounts();

        // Dynamically import PropertyMap to avoid SSR issues
        import('../components/PropertyMap').then(module => {
            setPropertyMap(() => module.PropertyMap);
        });

    }, [location.loading, location.city]);

    const fetchCategoryCounts = async () => {
        try {
            const propertyTypes = ['Apartamento', 'Casa', 'Comercial', 'Rural', 'Terreno'];
            const counts: Record<string, number> = {};

            // Parallelize counting tasks
            const typePromises = propertyTypes.map(async (type) => {
                const { data: typeData } = await supabase
                    .from('tipo_imovel')
                    .select('id')
                    .ilike('tipo', type)
                    .single();

                if (typeData) {
                    const { count } = await supabase
                        .from('anuncios')
                        .select('*', { count: 'exact', head: true })
                        .eq('tipo_imovel', typeData.id)
                        .eq('status', 'ativo');
                    return { type: type.toLowerCase(), count: count || 0 };
                }
                return { type: type.toLowerCase(), count: 0 };
            });

            const temporadaPromise = (async () => {
                const { data: temporadaOp } = await supabase
                    .from('operacao')
                    .select('id')
                    .ilike('tipo', 'temporada')
                    .single();

                if (temporadaOp) {
                    const { count } = await supabase
                        .from('anuncios')
                        .select('*', { count: 'exact', head: true })
                        .eq('operacao', temporadaOp.id)
                        .eq('status', 'ativo');
                    return { type: 'temporada', count: count || 0 };
                }
                return { type: 'temporada', count: 0 };
            })();

            const locationsPromise = supabase
                .from('anuncios')
                .select('cidade, bairro')
                .eq('status', 'ativo');

            const [typeResults, temporadaResult, locationsResult] = await Promise.all([
                Promise.all(typePromises),
                temporadaPromise,
                locationsPromise
            ]);

            // Fill counts record
            typeResults.forEach(r => counts[r.type] = r.count);
            counts[temporadaResult.type] = temporadaResult.count;

            if (!locationsResult.error && locationsResult.data) {
                const locationCountsMap: Record<string, number> = {};

                locationsResult.data.forEach(item => {
                    if (item.cidade) {
                        const cityKey = `city_${item.cidade}`;
                        locationCountsMap[cityKey] = (locationCountsMap[cityKey] || 0) + 1;
                    }
                    if (item.bairro) {
                        const neighborhoodKey = `bairro_${item.bairro}`;
                        locationCountsMap[neighborhoodKey] = (locationCountsMap[neighborhoodKey] || 0) + 1;
                    }
                });

                setCategoryCounts(prev => ({ ...prev, ...counts, ...locationCountsMap }));

                // Derive Sorted Cities
                const cityCountsArray = Object.entries(locationCountsMap)
                    .filter(([key]) => key.startsWith('city_'))
                    .map(([key, count]) => ({ name: key.replace('city_', ''), count }));

                cityCountsArray.sort((a, b) => b.count - a.count);
                setCities(cityCountsArray.slice(0, 10).map(c => c.name));

                // Derive Sorted Neighborhoods
                const neighborhoodCountsArray = Object.entries(locationCountsMap)
                    .filter(([key]) => key.startsWith('bairro_'))
                    .map(([key, count]) => ({ name: key.replace('bairro_', ''), count }));

                neighborhoodCountsArray.sort((a, b) => b.count - a.count);
                setNeighborhoods(neighborhoodCountsArray.slice(0, 16).map(c => c.name));
            }

        } catch (error) {
            console.error('Error fetching category counts:', error);
        }
    };

    const fetchData = async (cityFilter?: string | null) => {
        setLoading(true);
        try {
            // 1. Fetch 16 Recent Properties (Filtered by city if exists)
            const recentQuery = supabase
                .from('anuncios')
                .select(`
                    id, cod_imovel, titulo, cidade, bairro, valor_venda, valor_locacao, valor_diaria, valor_mensal, 
                    fotos, quartos, banheiros, vagas, area_priv, latitude, longitude, operacao(tipo), tipo_imovel(tipo)
                `)
                .eq('status', 'ativo')
                .order('created_at', { ascending: false })
                .limit(16);

            if (cityFilter) {
                recentQuery.ilike('cidade', cityFilter);
            }

            // 2. Fetch ALL Map Markers (Global - no limit, no city filter to show platform scale)
            const markersQuery = supabase
                .from('anuncios')
                .select(`
                    id, cod_imovel, titulo, cidade, bairro, valor_venda, valor_locacao, valor_diaria, valor_mensal, 
                    fotos, quartos, banheiros, vagas, area_priv, latitude, longitude, operacao(tipo), tipo_imovel(tipo)
                `)
                .eq('status', 'ativo')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
                .order('created_at', { ascending: false });

            const [recentRes, markersRes] = await Promise.all([recentQuery, markersQuery]);

            if (recentRes.data) {
                const transformed = recentRes.data.map(p => ({
                    ...p,
                    fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                    operacao: (p.operacao as any)?.tipo || '',
                    tipo_imovel: (p.tipo_imovel as any)?.tipo || ''
                }));
                setRecentProperties(transformed as any);
                setActiveCity(cityFilter || null);

                // If not in city mode, use these as fallback for city/neighborhood lists
                if (!cityFilter) {
                    const uniqueCities = Array.from(new Set(recentRes.data.map(p => p.cidade).filter(Boolean)));
                    setCities(uniqueCities);
                    const uniqueNeighborhoods = Array.from(new Set(recentRes.data.map(p => p.bairro).filter(Boolean))).slice(0, 16);
                    setNeighborhoods(uniqueNeighborhoods);
                }
            }

            if (markersRes.data) {
                const transformedMarkers = markersRes.data.map(p => ({
                    ...p,
                    fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                    operacao: (p.operacao as any)?.tipo || '',
                    tipo_imovel: (p.tipo_imovel as any)?.tipo || ''
                }));
                setAllMapMarkers(transformedMarkers as any);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-midnight-950 text-white font-sans transition-colors duration-200">
            {/* SEO Meta Tags */}
            <SEOHead
                title="iziBrokerz - Encontre seu Imóvel Ideal | Compra, Venda e Locação"
                description="Plataforma imobiliária digital que conecta você aos melhores corretores. Milhares de imóveis para compra, venda, locação e temporada em todo Brasil."
                type="website"
                tags={['imóveis', 'corretores', 'compra', 'venda', 'locação', 'brasil']}
            />

            {generateSchemaOrg({
                type: 'Organization',
                name: 'iziBrokerz',
                description: 'Plataforma Imobiliária Digital',
                url: 'https://izibrokerz.com',
            })}

            {/* Hero Section */}
            <section className="relative h-[700px] flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src={bgImage}
                        alt="Background"
                        className="w-full h-full object-cover transition-opacity duration-500"
                        fetchPriority="high"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-midnight-950/95"></div>
                </div>

                <div className="container mx-auto px-4 z-10 text-center relative mt-[-100px]">
                    <h1 className="text-4xl md:text-7xl font-heading font-bold text-white mb-6 leading-tight animate-float">
                        Seu próximo imóvel...<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 drop-shadow-sm">a Um Clique de Distância</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto font-medium tracking-wide">
                        A Plataforma que conecta você às melhores oportunidades do mercado imobiliário.
                    </p>
                </div>
            </section>

            {/* Search Filter Component - Floating & Glass */}
            <div className="container mx-auto px-4 relative z-20 -mt-32 mb-0">
                <SearchFilter />
            </div>

            {/* Browse by Type Section (Glass Tiles) */}
            <section className="py-24 bg-midnight-950 relative overflow-hidden">

                <div className="container mx-auto px-4 relative z-10">
                    <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                        <span className="w-2 h-8 bg-blue-500 rounded-full" /> Explore por <span className="text-blue-400">Categoria</span>
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                        {[
                            { label: 'Apartamentos', type: 'apartamento', icon: <Building size={28} />, count: '24' },
                            { label: 'Casas', type: 'casa', icon: <MapPinHouse size={28} />, count: '12' },
                            { label: 'Comerciais', type: 'comercial', icon: <Building2 size={28} />, count: '8' },
                            { label: 'Rurais', type: 'rural', icon: <Trees size={28} />, count: '5' },
                            { label: 'Temporada', type: 'temporada', icon: <TreePalm size={28} />, count: '18' },
                            { label: 'Terrenos', type: 'terreno', icon: <MapPinned size={28} />, count: '7' },
                        ]
                            .filter(category => {
                                // Ocultar cards com 0 imóveis
                                const actualCount = categoryCounts[category.type];
                                return actualCount !== undefined && actualCount > 0;
                            })
                            .map((category, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (category.type === 'temporada') {
                                            navigate('/search?operacao=temporada');
                                        } else {
                                            navigate(`/search?tipo=${category.type}`);
                                        }
                                    }}
                                    className="group relative h-40 rounded-3xl bg-midnight-900/40 backdrop-blur-sm border border-white/5 hover:border-emerald-500/30 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-3 hover:-translate-y-2 overflow-hidden"
                                >
                                    {/* Hover Gradient Background */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative z-10 text-gray-400 group-hover:text-emerald-400 transition-colors duration-300 p-3 bg-white/5 rounded-full group-hover:bg-emerald-500/10 group-hover:scale-110 transform">
                                        {category.icon}
                                        {/* Notification Badge */}
                                        <div className="absolute -top-2 -right-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white shadow-sm ring-1 ring-white transition-transform duration-300 group-hover:scale-110">
                                            {categoryCounts[category.type]}
                                        </div>
                                    </div>

                                    <div className="relative z-10 text-center">
                                        <h3 className="font-bold text-white text-base group-hover:text-emerald-100 transition-colors">{category.label}</h3>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </section>

            {/* Recent Properties (Midnight Lux Style) */}
            <section className="py-24 bg-midnight-900 relative border-t border-white/5">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 text-white flex flex-col md:flex-row md:items-center gap-3">
                                <div>
                                    <span className="w-2 h-8 bg-red-500 rounded-full inline-block mr-3 align-middle" />
                                    Acabaram <span className="text-red-400">de Chegar</span>
                                    {activeCity && (
                                        <span className="ml-2 text-red-400 text-3xl animate-fade-in inline-block">
                                            em {activeCity}
                                        </span>
                                    )}
                                </div>
                            </h2>
                            <p className="text-xl text-gray-400 font-bold max-w-lg">
                                {activeCity
                                    ? `Selecionamos as melhores oportunidades em ${activeCity} para você.`
                                    : "Confira os imóveis mais novos cadastrados em nossa plataforma."}
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
                        <div className="mb-12 h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-20">
                            <PropertyMap properties={allMapMarkers} />
                        </div>
                    )}

                    {/* Cards View */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Carregando imóveis...</div>
                    ) : (
                        <HorizontalScroll itemWidth={330} gap={24} itemsPerPage={4}>
                            {recentProperties.map((property) => (
                                <div key={property.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                    <PropertyCard property={property} />
                                </div>
                            ))}
                        </HorizontalScroll>
                    )}
                </div>
            </section>

            {/* Cities & Neighborhoods (Destination Cards) */}
            <section className="py-24 bg-midnight-950 relative">
                <div className="container mx-auto px-4">
                    {/* Cities */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-pink-500 rounded-full" /> Principais <span className="text-pink-400">Cidades</span>
                        </h2>
                        {/* Note: cityCounts needs to be populated in fetchData */}
                        <HorizontalScroll itemWidth={280} gap={20} itemsPerPage={4}>
                            {cities.map((city, idx) => (
                                <div key={idx} className="flex-none w-[280px]" style={{ scrollSnapAlign: 'center' }}>
                                    <div
                                        className="relative h-[400px] rounded-3xl overflow-hidden cursor-pointer group hover:-translate-y-2 transition-transform duration-500 isolate" // Added isolate to help with rendering
                                        style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }} // Fix for border-radius on zoom in some browsers
                                        onClick={() => navigate(`/search?cidade=${encodeURIComponent(city)}`)}
                                    >
                                        <div
                                            className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110`}
                                            style={{
                                                backgroundImage: cityImages[city.toLowerCase()]
                                                    ? `url(${cityImages[city.toLowerCase()]})`
                                                    : undefined
                                            }}
                                        >
                                            {/* Gradient Overlay for fallback or over image */}
                                            <div className={`absolute inset-0 ${cityImages[city.toLowerCase()]
                                                ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent'
                                                : `bg-gradient-to-br ${idx % 3 === 0 ? 'from-emerald-900 via-teal-900 to-slate-900' : idx % 3 === 1 ? 'from-indigo-900 via-purple-900 to-slate-900' : 'from-cyan-900 via-blue-900 to-slate-900'}`
                                                }`} />
                                        </div>

                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                                        {/* Big Count Badge (Instagram Style) */}
                                        <div className="absolute top-8 left-8 z-20 flex flex-col items-start p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-black/10 group-hover:bg-black/10 transition-colors">
                                            <span className="text-3xl font-heading font-black text-white leading-none">
                                                {categoryCounts[`city_${city}`] || Math.floor(Math.random() * 15) + 3}
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
                            {cities.length === 0 && <p className="text-gray-500">Nenhuma cidade encontrada.</p>}
                        </HorizontalScroll>
                    </div>

                    {/* Neighborhoods (Pills Style) */}
                    <div>
                        <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-emerald-500 rounded-full" /> Bairros <span className="text-emerald-400">em Alta</span>
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {neighborhoods.map((bairro, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(`/search?bairro=${encodeURIComponent(bairro)}`)}
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
                            {neighborhoods.length === 0 && <p className="text-gray-500">Nenhum bairro encontrado.</p>}
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners Carousel */}
            <PartnersCarousel />

            {/* Footer */}
            <Footer />

            {/* AI Assistant */}
            {/* AI Assistant - Moved to PublicLayout for persistence */}
        </div>
    );
};
