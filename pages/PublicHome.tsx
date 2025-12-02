import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, CheckCircle2, MapPin, Building2, Building, MapPinHouse, MapPinned, Tractor } from 'lucide-react';
import { SearchFilter } from '../components/SearchFilter';
import { PropertyCard } from '../components/PropertyCard';
import { PublicAIAssistant } from '../components/PublicAIAssistant';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { supabase } from '../lib/supabaseClient';
import { Footer } from '../components/Footer';

interface Property {
    id: string;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number;
    valor_locacao: number;
    fotos: string[];
    operacao: string;
    tipo_imovel: string;
}

export const PublicHome: React.FC = () => {
    const navigate = useNavigate();
    const [recentProperties, setRecentProperties] = useState<Property[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchData();
        fetchCategoryCounts();
    }, []);

    const fetchCategoryCounts = async () => {
        try {
            const types = ['Apartamento', 'Casa', 'Comercial', 'Rural', 'Terreno'];
            const counts: Record<string, number> = {};

            for (const type of types) {
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
                    fotos, 
                    quartos, 
                    banheiros, 
                    vagas, 
                    area_priv,
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
                    fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                    operacao: p.operacao?.tipo || '',
                    tipo_imovel: p.tipo_imovel?.tipo || '',
                    quartos: p.quartos || 0,
                    banheiros: p.banheiros || 0,
                    vagas: p.vagas || 0,
                    area_priv: p.area_priv || 0
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
                        src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1920"
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/70"></div>
                </div>

                <div className="container mx-auto px-4 z-10 text-center relative">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
                        O Seu Próximo Imóvel... <br />a Um Clique de Distância
                    </h1>
                    <p className="text-gray-200 text-3xl mb-24 max-w-2xl mx-auto">
                        A plataforma inteligente que conecta Você às melhores oportunidades do mercado.
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
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'Apartamentos', type: 'apartamento', icon: <Building size={32} /> },
                            { label: 'Casas', type: 'casa', icon: <MapPinHouse size={32} /> },
                            { label: 'Comercial', type: 'comercial', icon: <Building2 size={32} /> },
                            { label: 'Rural', type: 'rural', icon: <Tractor size={32} /> },
                            { label: 'Terrenos', type: 'terreno', icon: <MapPinned size={32} /> }
                        ].map((category, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/search?tipo=${category.type}`)}
                                className="bg-gray-50 dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-500 transition-all cursor-pointer group text-center"
                            >
                                <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                                    <div className="text-gray-400 group-hover:text-emerald-500 transition-colors">
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

            {/* Trust Signals Section */}
            <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold mb-2 text-emerald-400">+ de 25 Anos</div>
                            <p className="text-lg text-emerald-100">De Experiência no Mercado</p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2 text-emerald-400">+ de 1000</div>
                            <p className="text-lg text-emerald-100">Imóveis Cadastrados</p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2 text-emerald-400">+ de 500</div>
                            <p className="text-lg text-emerald-100">Corretores Parceiros</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Nossos Diferenciais</h2>
                        <p className="text-gray-600 dark:text-gray-400">Descubra porque somos a melhor escolha para encontrar seu novo lar.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Search className="w-8 h-8 text-emerald-500" />,
                                title: "Busca Inteligente",
                                description: "Nossa tecnologia encontra o imóvel dos seus sonhos em segundos."
                            },
                            {
                                icon: <Home className="w-8 h-8 text-emerald-500" />,
                                title: "Consultoria Especializada",
                                description: "Contamos com agentes especializados para garantir o melhor negócio."
                            },
                            {
                                icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
                                title: "Tour Virtual 360°",
                                description: "Visite imóveis sem sair de casa com nossa tecnologia imersiva."
                            }
                        ].map((feature, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-emerald-500/50 transition-colors text-center group shadow-sm hover:shadow-md">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500/10 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent Properties */}
            <section className="py-20 bg-gray-50 dark:bg-slate-950">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">Oportunidades que Acabaram de Chegar</h2>
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
                            <Building2 className="text-emerald-500" /> Imóveis por Cidade
                        </h3>
                        <HorizontalScroll itemWidth={256} gap={16} itemsPerPage={4}>
                            {cities.map((city, idx) => (
                                <div key={idx} className="flex-none w-64" style={{ scrollSnapAlign: 'start' }}>
                                    <div
                                        className="relative h-40 rounded-lg overflow-hidden cursor-pointer group bg-gradient-to-br from-emerald-500 to-emerald-700"
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
                                        className="relative h-40 rounded-lg overflow-hidden cursor-pointer group bg-gradient-to-br from-blue-500 to-blue-700"
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

            {/* Footer */}
            <Footer />

            {/* AI Assistant */}
            <PublicAIAssistant />
        </div>
    );
};
