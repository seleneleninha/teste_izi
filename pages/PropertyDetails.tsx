import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bed, Bath, Car, MapPin, Home, Share2, Heart, Phone, Mail, Calendar, ChevronLeft, ChevronRight, Check, Compass, Coffee, GraduationCap, ShieldCheck, Square, User, Search, LayoutGrid, List, Map, HomeIcon, SearchCode, SearchIcon, MessageCircle, X, PlayCircle, Video, CheckCircle, Handshake } from 'lucide-react';
import { SearchFilter } from '../components/SearchFilter';
import { supabase } from '../lib/supabaseClient';
import { analyzeNeighborhood } from '../lib/geminiHelper';

export const PropertyDetails: React.FC = () => {
    const { id, slug } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
    const [neighborhoodInfo, setNeighborhoodInfo] = useState<{
        educacao: string;
        lazer: string;
        seguranca: string;
        resumo: string;
    } | null>(null);
    const [loadingNeighborhood, setLoadingNeighborhood] = useState(false);
    const [partnershipBroker, setPartnershipBroker] = useState<any>(null);

    const propertyId = id;

    // Extrair código ou ID do slug
    // Formatos esperados:
    // ...-cod1234 (novo)
    // ...-cod-1234 (antigo - manter compatibilidade temporária se desejar, ou remover)
    // ...-id-uuid (antigo)
    let slugCode: string | null = null;
    let slugId: string | null = null;

    if (slug) {
        // Tenta encontrar padrão "cod" seguido de números no final da string
        const codMatch = slug.match(/-cod(\d+)$/);
        if (codMatch) {
            slugCode = codMatch[1];
        } else if (slug.includes('-id-')) {
            slugId = slug.split('-id-').pop() || null;
        } else if (slug.includes('-cod-')) {
            // Fallback para formato antigo ...-cod-1234
            slugCode = slug.split('-cod-').pop() || null;
        } else {
            // Fallback: assume que o slug é o próprio ID (para rotas /properties/:id migradas para :slug)
            slugId = slug;
        }
    }

    useEffect(() => {
        const fetchPropertyTypes = async () => {
            try {
                const { data, error } = await supabase
                    .from('tipo_imovel')
                    .select('tipo')
                    .order('tipo');

                if (error) throw error;
                if (data) {
                    setPropertyTypes(data.map(item => item.tipo));
                }
            } catch (error) {
                console.error('Error fetching property types:', error);
            }
        };

        fetchPropertyTypes();
    }, []);

    useEffect(() => {
        const fetchProperty = async () => {
            if (!propertyId && !slugCode && !slugId) {
                setLoading(false);
                return;
            }
            try {
                let query = supabase
                    .from('anuncios')
                    .select(`
                        *,
                        perfis:user_id (
                            nome,
                            sobrenome,
                            avatar,
                            email,
                            whatsapp,
                            creci,
                            cargo,
                            slug
                        )
                    `);

                if (propertyId) {
                    query = query.eq('id', propertyId);
                } else if (slugCode) {
                    // Verificar se é numérico (cod_imovel) ou UUID (fallback)
                    if (!isNaN(Number(slugCode))) {
                        query = query.eq('cod_imovel', Number(slugCode));
                    } else {
                        // Assume que é UUID se não for número
                        query = query.eq('id', slugCode);
                    }
                } else if (slugId) {
                    query = query.eq('id', slugId);
                } else {
                    setLoading(false);
                    return;
                }

                const { data, error } = await query.single();

                if (error) throw error;

                if (data) {
                    const agentData = data.perfis as any;

                    // Verificar se o imóvel é uma parceria
                    // Isso acontece quando acessado via /corretor/:slug e o imóvel não pertence ao corretor da slug
                    // Vamos verificar se existe um referrer na URL ou sessionStorage
                    const referrerSlug = sessionStorage.getItem('brokerSlug');
                    let finalAgentData = agentData;

                    if (referrerSlug) {
                        // Buscar dados do corretor da slug (referrer)
                        const { data: brokerData } = await supabase
                            .from('perfis')
                            .select('id, nome, sobrenome, avatar, email, whatsapp, creci, cargo, slug')
                            .eq('slug', referrerSlug)
                            .single();

                        if (brokerData && brokerData.id !== data.user_id) {
                            // Verificar se é realmente uma parceria
                            const { data: partnershipData } = await supabase
                                .from('parcerias')
                                .select('id')
                                .eq('user_id', brokerData.id)
                                .eq('property_id', data.id)
                                .single();

                            if (partnershipData) {
                                // É uma parceria! Usar dados do corretor da slug
                                finalAgentData = brokerData;
                                setPartnershipBroker(brokerData);
                            }
                        }
                    }

                    setProperty({
                        id: data.id,
                        title: data.titulo,
                        price: data.valor_venda || data.valor_locacao || 0,
                        location: `${data.bairro}, ${data.cidade}`,
                        beds: data.quartos || 0,
                        baths: data.banheiros || 0,
                        area: data.area_priv || 0,
                        totalArea: data.area_total || 0,
                        garage: data.vagas || 0,
                        suites: data.suites || 0,
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
                            name: finalAgentData ? `${finalAgentData.nome} ${finalAgentData.sobrenome}` : 'Anunciante',
                            avatar: finalAgentData?.avatar || 'https://i.pravatar.cc/150?u=default',
                            email: finalAgentData?.email || 'contato@izibrokerz.com',
                            phone: finalAgentData?.whatsapp || '(11) 99999-9999',
                            creci: finalAgentData?.creci || '',
                            role: finalAgentData?.cargo || 'Corretor',
                            slug: finalAgentData?.slug || ''
                        },
                        // Campos adicionais
                        tipo_imovel: data.tipo_imovel,
                        operacao: data.operacao,
                        aceita_financiamento: data.aceita_financiamento,
                        aceita_parceria: data.aceita_parceria,
                        status_aprovacao: data.status_aprovacao,
                        video: data.video,
                        tour_virtual: data.tour_virtual,
                        observacoes: data.observacoes,
                        isPartnership: !!partnershipBroker
                    });
                }
            } catch (error) {
                console.error('Error fetching property details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [propertyId, slugCode, slugId]);

    // Buscar informações do bairro com Gemini
    useEffect(() => {
        const fetchNeighborhoodInfo = async () => {
            if (!property?.address?.neighborhood || !property?.address?.city || !property?.address?.state) {
                return;
            }

            setLoadingNeighborhood(true);
            try {
                const info = await analyzeNeighborhood({
                    bairro: property.address.neighborhood,
                    cidade: property.address.city,
                    uf: property.address.state
                });

                if (info) {
                    setNeighborhoodInfo(info);
                }
            } catch (error) {
                console.error('Erro ao buscar informações do bairro:', error);
            } finally {
                setLoadingNeighborhood(false);
            }
        };

        if (property) {
            fetchNeighborhoodInfo();
        }
    }, [property]);

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

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    if (!property) {
        return <div className="text-center py-12">Imóvel não encontrado.</div>;
    }

    return (
        <div className="bg-gray-50 dark:bg-slate-900">

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto pb-12">
                    {/* Navigation Header */}
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() => {
                                if (window.history.length > 1) {
                                    navigate(-1);
                                } else {
                                    navigate('/');
                                }
                            }}
                            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft size={20} />
                            <span>Voltar</span>
                        </button>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    const url = window.location.href;
                                    navigator.clipboard.writeText(url);
                                    // Using a custom toast implementation since useToast might not be available in this scope
                                    // Ideally we should use the ToastContext
                                    const toast = document.createElement('div');
                                    toast.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-fade-in-up flex items-center gap-2';
                                    toast.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Link copiado com sucesso!';
                                    document.body.appendChild(toast);
                                    setTimeout(() => {
                                        toast.remove();
                                    }, 3000);
                                }}
                                className="p-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 hover:text-primary-500 transition-colors"
                                title="Copiar Link"
                            >
                                <Share2 size={20} />
                            </button>
                            <button
                                onClick={() => {
                                    // Redirect to login with return url
                                    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                                    navigate(`/login?returnUrl=${returnUrl}&type=client`);
                                }}
                                className="p-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 hover:text-red-500 transition-colors"
                                title="Salvar Favorito"
                            >
                                <Heart size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Hero Image Gallery */}
                    <div className="relative rounded-2xl overflow-hidden h-[500px] mb-8 shadow-lg group">
                        <img
                            src={property.images && property.images.length > 0 ? property.images[currentImageIndex] : 'https://picsum.photos/seed/prop1/800/600'}
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-500 cursor-pointer hover:scale-105"
                            onClick={() => setIsGalleryOpen(true)}
                        />

                        {/* Carousel Controls */}
                        {property.images && property.images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ArrowLeft size={24} className="rotate-180" />
                                </button>

                                {/* Indicators */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {property.images.map((_: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 pointer-events-none">
                            <h1 className="text-4xl font-bold text-white mb-2">{property.title}</h1>
                            <div className="flex items-center text-gray-200 text-lg">
                                <MapPin size={20} className="mr-2" />
                                {property.location}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Stats Strip */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
                                <div className="text-center min-w-[80px]">
                                    <p className="text-gray-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">Preço</p>
                                    <p className="text-2xl font-bold text-primary-500">
                                        {property.price > 0 ? `R$${property.price.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                                    </p>
                                </div>

                                {(property.area || 0) > 0 && (
                                    <>
                                        <div className="h-10 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>
                                        <div className="text-center min-w-[80px]">
                                            <p className="text-gray-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">Área Priv.</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{property.area} <span className="text-sm font-normal">m²</span></p>
                                        </div>
                                    </>
                                )}

                                {(property.garage || 0) > 0 && (
                                    <>
                                        <div className="h-10 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>
                                        <div className="text-center min-w-[80px]">
                                            <p className="text-gray-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">Vagas</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{property.garage}</p>
                                        </div>
                                    </>
                                )}

                                {(property.beds || 0) > 0 && (
                                    <>
                                        <div className="h-10 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>
                                        <div className="text-center min-w-[80px]">
                                            <p className="text-gray-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">Quartos</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{property.beds}</p>
                                        </div>
                                    </>
                                )}

                                {(property.baths || 0) > 0 && (
                                    <>
                                        <div className="h-10 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block"></div>
                                        <div className="text-center min-w-[80px]">
                                            <p className="text-gray-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">Banheiros</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{property.baths}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sobre este imóvel</h2>
                                <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                                    {property.description}
                                </p>
                            </div>

                            {/* Image Lightbox */}
                            {isGalleryOpen && (
                                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
                                    <button
                                        onClick={() => setIsGalleryOpen(false)}
                                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                                    >
                                        <X size={32} />
                                    </button>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
                                    >
                                        <ArrowLeft size={32} />
                                    </button>

                                    <img
                                        src={property.images[currentImageIndex]}
                                        alt={property.title}
                                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                                    />

                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
                                    >
                                        <ArrowLeft size={32} className="rotate-180" />
                                    </button>

                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                                        {currentImageIndex + 1} / {property.images.length}
                                    </div>
                                </div>
                            )}

                            {/* Property Details Grid - Cleaned up */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Informações Adicionais</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700">
                                    {property.iptu > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">IPTU (Anual)</p>
                                            <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.iptu)}
                                            </p>
                                        </div>
                                    )}
                                    {property.condoFee > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Condomínio</p>
                                            <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.condoFee)}
                                            </p>
                                        </div>
                                    )}
                                    {property.totalArea > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Área Total</p>
                                            <p className="font-semibold text-gray-900 dark:text-white text-lg">{property.totalArea} m²</p>
                                        </div>
                                    )}
                                    {property.suites > 0 && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Suítes</p>
                                            <p className="font-semibold text-gray-900 dark:text-white text-lg">{property.suites}</p>
                                        </div>
                                    )}
                                    {property.aceita_financiamento && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Financiamento</p>
                                            <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-lg flex items-center gap-1">
                                                <CheckCircle size={18} />
                                                Aceita
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Diferenciais</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {property.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            <Check size={18} className="text-primary-500 mr-2" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Media Section */}
                            {(property.video || property.tour_virtual) && (
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mídia</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {property.video && (
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <PlayCircle className="text-red-500" size={20} />
                                                    Vídeo do Imóvel
                                                </h3>
                                                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                                    <iframe
                                                        src={property.video.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')}
                                                        title="Vídeo do Imóvel"
                                                        className="w-full h-full"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {property.tour_virtual && (
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Video className="text-blue-500" size={20} />
                                                    Tour Virtual 360º
                                                </h3>
                                                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-900 flex items-center justify-center relative group cursor-pointer" onClick={() => window.open(property.tour_virtual, '_blank')}>
                                                    <img
                                                        src={property.images[0]}
                                                        alt="Tour Virtual"
                                                        className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full group-hover:scale-110 transition-transform">
                                                            <Compass size={48} className="text-white" />
                                                        </div>
                                                    </div>
                                                    <p className="absolute bottom-4 text-white font-medium">Clique para iniciar o tour</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Neighborhood Intelligence (Gemini) */}
                            {/* Resumo do Bairro */}
                            {neighborhoodInfo?.resumo && (
                                <div className="mt-6 pt-6 border-t border-blue-200 dark:border-slate-600">
                                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <MapPin size={18} className="text-blue-500" />
                                        Localização do Imóvel / Sobre o Bairro {property.address.neighborhood}
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {neighborhoodInfo.resumo}
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic text-center">
                                *Análise gerada via Gemini AI. Informações podem variar.
                            </p>
                        </div>

                        {/* Sidebar / Contact */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 sticky top-24">
                                <div className="flex items-center space-x-4 mb-6">
                                    <img src={property.agent.avatar} alt="Agent" className="w-16 h-16 rounded-full object-cover border-2 border-primary-500 p-1" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">Anunciado por</p>
                                        <h3
                                            className="text-lg font-bold text-gray-900 dark:text-white cursor-pointer hover:text-primary-500 transition-colors"
                                            onClick={() => {
                                                if (property.agent.slug) {
                                                    navigate(`/corretor/${property.agent.slug}`);
                                                }
                                            }}
                                        >
                                            {property.agent.name}
                                        </h3>
                                        <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{property.agent.role}</p>
                                        {property.agent.creci && (
                                            <p className="text-xs text-gray-500 dark:text-slate-500">CRECI: {property.agent.creci}</p>
                                        )}
                                        <div className="flex text-yellow-500 text-xs mt-1">★★★★★</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <a
                                        href={`https://wa.me/${property.agent.phone.replace(/\D/g, '')}?text=Olá, gostaria de mais informações sobre o imóvel: ${property.title}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center"
                                    >
                                        <MessageCircle size={18} className="mr-2" /> WhatsApp
                                    </a>
                                    <a
                                        href={`mailto:${property.agent.email}?subject=Interesse no imóvel: ${property.title}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <Mail size={18} className="mr-2" /> Enviar E-mail
                                    </a>
                                    <button
                                        onClick={() => {
                                            if (property.agent.slug) {
                                                navigate(`/corretor/${property.agent.slug}`);
                                            } else {
                                                // Fallback if no slug
                                                alert('Página do corretor indisponível');
                                            }
                                        }}
                                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <SearchIcon size={18} className="mr-2" />+ Imóveis Desse Corretor
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};