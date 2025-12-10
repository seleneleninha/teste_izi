import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building2, Building, MapPinHouse, MapPinned, Tractor, Map as MapIcon, Map, Trees, TreePalm } from 'lucide-react';
import { SearchFilter } from '../components/SearchFilter';
import { PropertyCard } from '../components/PropertyCard';
import { PublicAIAssistant } from '../components/PublicAIAssistant';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { supabase } from '../lib/supabaseClient';
import { Footer } from '../components/Footer';
import { getRandomBackground } from '../lib/backgrounds';
import { PartnersCarousel } from '../components/PartnersCarousel';

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
    const [cities, setCities] = useState<string[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [showMap, setShowMap] = useState(false);
    const [PropertyMap, setPropertyMap] = useState<React.ComponentType<any> | null>(null);
    const [bgImage, setBgImage] = useState(getRandomBackground());

    useEffect(() => {
        fetchData();
        fetchCategoryCounts();

        // Dynamically import PropertyMap to avoid SSR issues
        import('../components/PropertyMap').then(module => {
            setPropertyMap(() => module.PropertyMap);
        });

    }, []);

    const fetchCategoryCounts = async () => {
        try {
            // Tipos de imóvel (buscados na tabela tipo_imovel)
            const propertyTypes = ['Apartamento', 'Casa', 'Comercial', 'Rural', 'Terreno'];
            const counts: Record<string, number> = {};

            for (const type of propertyTypes) {
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
                        .eq('status_aprovacao', 'aprovado');

                    counts[type.toLowerCase()] = count || 0;
                } else {
                    counts[type.toLowerCase()] = 0;
                }
            }

            // Temporada é uma OPERAÇÃO, não um tipo de imóvel
            // Buscar pela tabela operação
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
                    .eq('status_aprovacao', 'aprovado');

                counts['temporada'] = count || 0;
            } else {
                counts['temporada'] = 0;
            }

            setCategoryCounts(counts);
        } catch (error) {
            console.error('Error fetching category counts:', error);
        }
    };

    const fetchData = async () => {
        try {
            const { data: properties, error } = await supabase
                .from('anuncios')
                .select(`
                    id, 
                    cod_imovel, 
                    titulo, 
                    cidade, 
                    bairro, 
                    valor_venda, 
                    valor_locacao,
                    valor_diaria,
                    valor_mensal, 
                    fotos, 
                    quartos, 
                    banheiros, 
                    vagas, 
                    area_priv,
                    latitude,
                    longitude,
                    operacao(tipo),
                    tipo_imovel(tipo)
                `)
                .eq('status_aprovacao', 'aprovado')
                .order('created_at', { ascending: false })
                .limit(16);

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            if (properties && properties.length > 0) {
                const transformedProperties = properties.map(p => ({
                    id: p.id,
                    cod_imovel: p.cod_imovel,
                    titulo: p.titulo,
                    cidade: p.cidade,
                    bairro: p.bairro,
                    valor_venda: p.valor_venda,
                    valor_locacao: p.valor_locacao,
                    valor_diaria: p.valor_diaria,
                    valor_mensal: p.valor_mensal,
                    fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                    operacao: (p.operacao as any)?.tipo || '',
                    tipo_imovel: (p.tipo_imovel as any)?.tipo || '',
                    quartos: p.quartos || 0,
                    banheiros: p.banheiros || 0,
                    vagas: p.vagas || 0,
                    area_priv: p.area_priv || 0,
                    latitude: p.latitude,
                    longitude: p.longitude
                }));

                setRecentProperties(transformedProperties as any);

                const uniqueCities = Array.from(new Set(properties.map(p => p.cidade).filter(Boolean)));
                setCities(uniqueCities);

                const uniqueNeighborhoods = Array.from(new Set(properties.map(p => p.bairro).filter(Boolean))).slice(0, 16);
                setNeighborhoods(uniqueNeighborhoods);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
            {/* Hero Section */}
            <section className="relative h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src={bgImage}
                        alt="Background"
                        className="w-full h-full object-cover transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-black/70"></div>
                </div>

                <div className="container mx-auto px-4 z-10 text-center relative">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up delay-100">
                        Seu próximo imóvel...<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">a Um Clique de Distância</span>
                    </h1>
                    <p className="text-3xl text-white mb-10 max-w-3xl mx-auto animate-fade-in-up delay-200">
                        A Plataforma que conecta Você às melhores oportunidades do mercado.
                    </p>
                </div>
            </section>

            {/* Search Filter Component - Overlapping Hero */}
            <div className="container mx-auto px-4 relative z-20">
                <SearchFilter />
            </div>

            {/* Browse by Type Section */}
            <section className="py-16 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white text-center">Explore por Categoria</h2>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {[
                            { label: 'Apartamentos', type: 'apartamento', icon: <Building size={32} /> },
                            { label: 'Casas', type: 'casa', icon: <MapPinHouse size={32} /> },
                            { label: 'Comercial', type: 'comercial', icon: <Building2 size={32} /> },
                            { label: 'Rural', type: 'rural', icon: <Trees size={32} /> },
                            { label: 'Temporada', type: 'temporada', icon: <TreePalm size={32} /> },
                            { label: 'Terrenos', type: 'terreno', icon: <MapPinned size={32} /> },
                        ].map((category, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/search?tipo=${category.type}`)}
                                className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-primary-500 transition-all cursor-pointer group text-center"
                            >
                                <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                                    <div className="text-gray-400 group-hover:text-primary-500 transition-colors">
                                        {category.icon}
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{category.label}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {categoryCounts[category.type] !== undefined
                                        ? `${categoryCounts[category.type]} opções`
                                        : 'Carregando...'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent Properties */}
            <section className="py-20 bg-gray-50 dark:bg-slate-950">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Oportunidades que Acabaram de Chegar</h2>
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${showMap
                                ? 'bg-primary-500 text-white hover:bg-primary-600'
                                : 'bg-primary-500 dark:bg-primary-500 text-white dark:text-white border border-gray-200 dark:border-slate-700 hover:border-primary-500'
                                }`}
                        >
                            <MapIcon size={20} />
                            {showMap ? 'Ocultar' : 'Ver Mapa'}
                        </button>
                    </div>

                    {/* Map View */}
                    {showMap && PropertyMap && (
                        <div className="mb-8 h-[400px] rounded-2xl overflow-hidden shadow-lg">
                            <PropertyMap properties={recentProperties} />
                        </div>
                    )}

                    {/* Cards View */}
                    {loading ? (
                        <div className="text-center py-10">Carregando imóveis...</div>
                    ) : (
                        <HorizontalScroll itemWidth={288} gap={24} itemsPerPage={4}>
                            {recentProperties.map((property) => (
                                <div key={property.id} className="flex-none w-72" style={{ scrollSnapAlign: 'start' }}>
                                    <PropertyCard property={property} />
                                </div>
                            ))}
                        </HorizontalScroll>
                    )}
                </div>
            </section>

            {/* Cities & Neighborhoods */}
            <section className="py-20 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-4">
                    {/* Cities */}
                    <div className="mb-16">
                        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <Building2 className="text-primary-500" /> Imóveis por Cidade
                        </h3>
                        <HorizontalScroll itemWidth={256} gap={16} itemsPerPage={4}>
                            {cities.map((city, idx) => (
                                <div key={idx} className="flex-none w-64" style={{ scrollSnapAlign: 'start' }}>
                                    <div
                                        className="relative h-40 rounded-xl overflow-hidden cursor-pointer group bg-gradient-to-br from-primary-500 to-primary-700"
                                        onClick={() => navigate(`/search?cidade=${encodeURIComponent(city)}`)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                                            <span className="font-bold text-white text-lg p-4">{city}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {cities.length === 0 && <p className="text-gray-500">Nenhuma cidade encontrada.</p>}
                        </HorizontalScroll>
                    </div>

                    {/* Neighborhoods */}
                    <div>
                        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="text-blue-500" /> Bairros Populares
                        </h3>
                        <HorizontalScroll itemWidth={256} gap={16} itemsPerPage={4}>
                            {neighborhoods.map((neighborhood, idx) => (
                                <div key={idx} className="flex-none w-64" style={{ scrollSnapAlign: 'start' }}>
                                    <div
                                        className="relative h-40 rounded-xl overflow-hidden cursor-pointer group bg-gradient-to-br from-blue-500 to-blue-700"
                                        onClick={() => navigate(`/search?bairro=${encodeURIComponent(neighborhood)}`)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                                            <span className="font-bold text-white text-lg p-4">{neighborhood}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {neighborhoods.length === 0 && <p className="text-gray-500">Nenhum bairro encontrado.</p>}
                        </HorizontalScroll>
                    </div>
                </div>
            </section>

            {/* Partners Carousel */}
            <PartnersCarousel />

            {/* Footer */}
            <Footer />

            {/* AI Assistant */}
            <PublicAIAssistant />
        </div>
    );
};
