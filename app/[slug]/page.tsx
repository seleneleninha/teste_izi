"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bed, Bath, Car, MapPin, Home, Share2, Heart, Phone, ChevronLeft, ChevronRight, X, Square, User, MessageCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { supabase } from '@/lib/supabaseClient';
import { PropertyCard } from '@/components/PropertyCard';
import { HorizontalScroll } from '@/components/HorizontalScroll';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ToastContext';

// Dynamic import for map to avoid SSR issues
const PropertyMapSection = dynamic(() => import('@/components/PropertyMap'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center rounded-xl">Carregando mapa...</div>
});

interface Property {
    id: string;
    title: string;
    price: number;
    location: string;
    beds: number;
    baths: number;
    area: number;
    garage: number;
    images: string[];
    description: string;
    features: string[];
    address: {
        street: string;
        number: string;
        complement: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
    agent: {
        name: string;
        avatar: string;
        email: string;
        phone: string;
        creci: string;
        uf_creci: string;
        slug: string;
    };
    tipo_imovel: string;
    operacao: string;
    valor_venda: number;
    valor_locacao: number;
    latitude?: number;
    longitude?: number;
    condoFee?: number;
    iptu?: number;
}

export default function PropertyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { addToast } = useToast();

    const slug = params?.slug as string;

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [relatedProperties, setRelatedProperties] = useState<any[]>([]);

    // Extract code from slug (format: ...-cod1234)
    let slugCode: string | null = null;
    if (slug) {
        const codMatch = slug.match(/-cod(\d+)$/);
        if (codMatch) {
            slugCode = codMatch[1];
        }
    }

    useEffect(() => {
        const fetchProperty = async () => {
            if (!slug) {
                setLoading(false);
                return;
            }

            try {
                let query = supabase
                    .from('anuncios')
                    .select(`
                        *,
                        tipo_imovel (tipo),
                        operacao (tipo),
                        perfis:user_id (
                            nome,
                            sobrenome,
                            avatar,
                            email,
                            whatsapp,
                            creci,
                            uf_creci,
                            slug
                        )
                    `);

                if (slugCode && !isNaN(Number(slugCode))) {
                    query = query.eq('cod_imovel', Number(slugCode));
                } else {
                    // Try as UUID
                    query = query.eq('id', slug);
                }

                const { data, error } = await query.single();

                if (error) throw error;

                if (data) {
                    const agentData = data.perfis as any;

                    setProperty({
                        id: data.id,
                        title: data.titulo,
                        price: data.valor_venda || data.valor_locacao || 0,
                        location: `${data.bairro}, ${data.cidade}`,
                        beds: data.quartos || 0,
                        baths: data.banheiros || 0,
                        area: data.area_priv || 0,
                        garage: data.vagas || 0,
                        images: data.fotos ? data.fotos.split(',').filter(Boolean) : [],
                        description: data.descricao || 'Sem descrição disponível.',
                        features: data.caracteristicas ? data.caracteristicas.split(', ') : [],
                        condoFee: data.valor_condo || 0,
                        iptu: data.valor_iptu || 0,
                        address: {
                            street: data.logradouro,
                            number: data.numero,
                            complement: data.complemento,
                            neighborhood: data.bairro,
                            city: data.cidade,
                            state: data.uf,
                            zipCode: data.cep
                        },
                        agent: {
                            name: agentData ? `${agentData.nome} ${agentData.sobrenome}` : 'Anunciante',
                            avatar: agentData?.avatar || 'https://i.pravatar.cc/150?u=default',
                            email: agentData?.email || 'contato@izibrokerz.com',
                            phone: agentData?.whatsapp || '(11) 99999-9999',
                            creci: agentData?.creci || '',
                            uf_creci: agentData?.uf_creci || '',
                            slug: agentData?.slug || ''
                        },
                        tipo_imovel: data.tipo_imovel?.tipo || data.tipo_imovel,
                        operacao: data.operacao?.tipo || data.operacao,
                        valor_venda: data.valor_venda,
                        valor_locacao: data.valor_locacao,
                        latitude: data.latitude,
                        longitude: data.longitude
                    });

                    // Fetch related properties
                    const { data: related } = await supabase
                        .from('anuncios')
                        .select(`*, tipo_imovel (tipo), operacao (tipo)`)
                        .eq('cidade', data.cidade)
                        .neq('id', data.id)
                        .eq('status_aprovacao', 'aprovado')
                        .limit(8);

                    if (related) {
                        const transformed = related.map(p => ({
                            id: p.id,
                            cod_imovel: p.cod_imovel,
                            titulo: p.titulo,
                            cidade: p.cidade,
                            bairro: p.bairro,
                            valor_venda: p.valor_venda,
                            valor_locacao: p.valor_locacao,
                            fotos: p.fotos ? p.fotos.split(',').filter(Boolean) : [],
                            operacao: p.operacao?.tipo || p.operacao,
                            tipo_imovel: p.tipo_imovel?.tipo || p.tipo_imovel,
                            quartos: p.quartos || 0,
                            banheiros: p.banheiros || 0,
                            vagas: p.vagas || 0,
                            area_priv: p.area_priv || 0
                        }));
                        setRelatedProperties(transformed);
                    }
                }
            } catch (error) {
                console.error('Error fetching property details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [slug, slugCode]);

    // Check favorites
    useEffect(() => {
        const checkFavorite = async () => {
            if (!user || !property) return;
            try {
                const { data } = await supabase
                    .from('favoritos')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('anuncio_id', property.id)
                    .single();
                if (data) setIsFavorite(true);
            } catch (error) {
                // Not found is expected
            }
        };
        checkFavorite();
    }, [user, property]);

    const toggleFavorite = async () => {
        if (!user) {
            router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        if (!property) return;

        try {
            if (isFavorite) {
                await supabase.from('favoritos').delete().eq('user_id', user.id).eq('anuncio_id', property.id);
                setIsFavorite(false);
                addToast('Removido dos favoritos', 'success');
            } else {
                await supabase.from('favoritos').insert([{ user_id: user.id, anuncio_id: property.id }]);
                setIsFavorite(true);
                addToast('Adicionado aos favoritos', 'success');
            }
        } catch (error) {
            addToast('Erro ao atualizar favoritos', 'error');
        }
    };

    const nextImage = () => {
        if (property?.images) {
            setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
        }
    };

    const prevImage = () => {
        if (property?.images) {
            setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        addToast('Link copiado!', 'success');
    };

    const openWhatsApp = () => {
        if (!property) return;
        const text = `Olá! Vi o imóvel "${property.title}" no iziBrokerz e gostaria de mais informações.`;
        const phone = property.agent.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-slate-900 pt-20">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-slate-900 pt-20">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Imóvel não encontrado</h1>
                <Link href="/search" className="text-emerald-500 hover:underline">Voltar para busca</Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Navigation */}
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft size={20} />
                            <span>Voltar</span>
                        </button>

                        <div className="flex space-x-3">
                            <button onClick={copyLink} className="p-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 hover:text-emerald-500 transition-colors" title="Copiar Link">
                                <Share2 size={20} />
                            </button>
                            <button
                                onClick={toggleFavorite}
                                className={`p-2 rounded-full border transition-colors ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 hover:text-red-500'}`}
                                title={isFavorite ? "Remover dos Favoritos" : "Salvar Favorito"}
                            >
                                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>

                    {/* Hero Image Gallery */}
                    <div className="relative rounded-2xl overflow-hidden h-[300px] md:h-[500px] mb-8 shadow-lg group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={property.images.length > 0 ? property.images[currentImageIndex] : 'https://via.placeholder.com/800x600?text=Sem+Imagem'}
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-500 cursor-pointer hover:scale-105"
                            onClick={() => setIsGalleryOpen(true)}
                        />

                        {property.images.length > 1 && (
                            <>
                                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronLeft size={24} />
                                </button>
                                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight size={24} />
                                </button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1} / {property.images.length}
                                </div>
                            </>
                        )}

                        {/* Operation Badge */}
                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full font-bold text-white text-sm ${property.operacao?.toLowerCase().includes('venda') ? 'bg-red-600' : 'bg-blue-600'}`}>
                            {property.operacao}
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Title and Price */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{property.title}</h1>
                                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-4">
                                    <MapPin size={18} className="text-emerald-500" />
                                    {property.location}
                                </p>
                                <div className="flex flex-wrap gap-4 text-3xl font-bold text-emerald-600">
                                    {property.valor_venda > 0 && (
                                        <span>R$ {property.valor_venda.toLocaleString('pt-BR')}</span>
                                    )}
                                    {property.valor_locacao > 0 && (
                                        <span className="text-blue-600">R$ {property.valor_locacao.toLocaleString('pt-BR')}/mês</span>
                                    )}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Características</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                                        <Bed className="text-emerald-500" size={24} />
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{property.beds}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Quartos</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                                        <Bath className="text-emerald-500" size={24} />
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{property.baths}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Banheiros</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                                        <Car className="text-emerald-500" size={24} />
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{property.garage}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Vagas</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                                        <Square className="text-emerald-500" size={24} />
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{property.area}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">m²</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Descrição</h2>
                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                                    {property.description}
                                </p>
                            </div>

                            {/* Map */}
                            {property.latitude && property.longitude && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Localização</h2>
                                    <div className="h-[300px] rounded-xl overflow-hidden">
                                        <PropertyMapSection properties={[{
                                            id: property.id,
                                            titulo: property.title,
                                            cidade: property.address.city,
                                            bairro: property.address.neighborhood,
                                            valor_venda: property.valor_venda,
                                            valor_locacao: property.valor_locacao,
                                            fotos: property.images,
                                            operacao: property.operacao,
                                            latitude: property.latitude,
                                            longitude: property.longitude
                                        }]} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Agent Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg sticky top-24">
                                <div className="flex items-center gap-4 mb-6">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={property.agent.avatar}
                                        alt={property.agent.name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
                                    />
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{property.agent.name}</h3>
                                        {property.agent.creci && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                CRECI {property.agent.creci}/{property.agent.uf_creci}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={openWhatsApp}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mb-3"
                                >
                                    <MessageCircle size={20} />
                                    Contato via WhatsApp
                                </button>

                                <button
                                    onClick={() => window.location.href = `tel:${property.agent.phone.replace(/\D/g, '')}`}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Phone size={20} />
                                    Ligar Agora
                                </button>

                                {/* Costs */}
                                {(property.condoFee || property.iptu) && (
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-3">Custos</h4>
                                        {property.condoFee && property.condoFee > 0 && (
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-500 dark:text-gray-400">Condomínio</span>
                                                <span className="font-medium text-gray-900 dark:text-white">R$ {property.condoFee.toLocaleString('pt-BR')}</span>
                                            </div>
                                        )}
                                        {property.iptu && property.iptu > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">IPTU</span>
                                                <span className="font-medium text-gray-900 dark:text-white">R$ {property.iptu.toLocaleString('pt-BR')}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Related Properties */}
                    {relatedProperties.length > 0 && (
                        <section className="mt-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Imóveis Similares</h2>
                            <HorizontalScroll itemsPerPage={4} itemWidth={320}>
                                {relatedProperties.map(prop => (
                                    <div key={prop.id} className="flex-none w-80" style={{ scrollSnapAlign: 'start' }}>
                                        <PropertyCard property={prop} />
                                    </div>
                                ))}
                            </HorizontalScroll>
                        </section>
                    )}
                </div>
            </div>

            {/* Fullscreen Gallery */}
            {isGalleryOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setIsGalleryOpen(false)}>
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setIsGalleryOpen(false)}>
                        <X size={32} />
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 text-white hover:text-gray-300">
                        <ChevronLeft size={48} />
                    </button>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={property.images[currentImageIndex]}
                        alt={`${property.title} - ${currentImageIndex + 1}`}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 text-white hover:text-gray-300">
                        <ChevronRight size={48} />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
                        {currentImageIndex + 1} / {property.images.length}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
