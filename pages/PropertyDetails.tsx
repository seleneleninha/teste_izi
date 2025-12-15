import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Bed, Bath, Car, MapPin, Home, Share2, Heart, Phone, Mail, Calendar, ChevronLeft, ChevronRight, Check, Compass, Coffee, GraduationCap, ShieldCheck, Square, User, Search, LayoutGrid, List, Map, HomeIcon, SearchCode, SearchIcon, MessageCircle, X, PlayCircle, Video, CheckCircle, Handshake, Sparkles, AreaChart } from 'lucide-react';
import { HorizontalScroll } from '../components/HorizontalScroll';
import { ScheduleVisitModal } from '../components/ScheduleVisitModal';
import { PropertyCard } from '../components/PropertyCard';
import { SearchFilter } from '../components/SearchFilter';
import { supabase } from '../lib/supabaseClient';
import { analyzeNeighborhood } from '../lib/geminiHelper';
import { useAuth } from '../components/AuthContext'; // Import useAuth
import { useToast } from '../components/ToastContext'; // Import useToast
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
    })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
};

// Fix Leaflet default marker icon issue
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export const PropertyDetails: React.FC = () => {
    const { id, slug, brokerSlug } = useParams();
    const routeParams = useParams(); // Keep full object for compatibility if needed
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [[page, direction], setPage] = useState([0, 0]);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // Derived index
    const imageIndex = property?.images ? Math.abs(page % property.images.length) : 0;
    // Sync external currentImageIndex for other components if needed, or just use imageIndex
    const currentImageIndex = imageIndex;

    // Paginate function
    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [neighborhoodInfo, setNeighborhoodInfo] = useState<{
        educacao: string;
        lazer: string;
        seguranca: string;
        resumo: string;
    } | null>(null);
    const [loadingNeighborhood, setLoadingNeighborhood] = useState(false);
    const [partnershipBroker, setPartnershipBroker] = useState<any>(null);
    const [relatedProperties, setRelatedProperties] = useState<any[]>([]);

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

    // Check for auto-open action from URL (e.g. returning from login)
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'openSchedule' && user) {
            setIsScheduleModalOpen(true);
        }
    }, [searchParams, user]);

    const handleScheduleClick = () => {
        if (!user) {
            addToast('Faça login ou cadastre-se para agendar uma visita.', 'info');
            // Encode the current path with the action param as the return destination
            const returnUrl = `${location.pathname}?action=openSchedule`;
            navigate(`/login?redirectTo=${encodeURIComponent(returnUrl)}&register=true`);
            return;
        }
        setIsScheduleModalOpen(true);
    };

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
        const fetchPropertyOperations = async () => {
            try {
                const { data, error } = await supabase
                    .from('operacao')
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
                    // Usar query param 'broker' ou route param 'brokerSlug' para determinar o contexto do corretor
                    const useParamsBrokerSlug = (routeParams as any).brokerSlug; // Cast to access custom param
                    const brokerSlugParam = searchParams.get('broker') || useParamsBrokerSlug;
                    let finalAgentData = agentData;

                    if (brokerSlugParam) {
                        // Buscar dados do corretor da URL (contexto de BrokerPage)
                        const { data: brokerData } = await supabase
                            .from('perfis')
                            .select('id, nome, sobrenome, avatar, email, whatsapp, creci, uf_creci, slug')
                            .eq('slug', brokerSlugParam)
                            .single();

                        if (brokerData) {
                            // BYPASS: Se o corretor foi passado na URL, usamos seus dados como contato principal
                            // Isso permite enviar links para leads mesmo sem parceria formalizada no sistema ainda
                            finalAgentData = brokerData;

                            // Se não for o dono, marcamos como contexto de parceria (visual apenas)
                            if (brokerData.id !== data.user_id) {
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
                            uf_creci: finalAgentData?.uf_creci || '',
                            slug: finalAgentData?.slug || ''
                        },
                        // Campos adicionais - extrair texto dos joins
                        tipo_imovel: data.tipo_imovel?.tipo || data.tipo_imovel,
                        operacao: data.operacao?.tipo || data.operacao,
                        aceita_financiamento: data.aceita_financiamento,
                        aceita_parceria: data.aceita_parceria,
                        status_aprovacao: data.status_aprovacao,
                        video: data.video,
                        tour_virtual: data.tour_virtual,
                        observacoes: data.observacoes,
                        isPartnership: !!partnershipBroker,
                        valor_venda: data.valor_venda,
                        valor_locacao: data.valor_locacao,
                        valor_diaria: data.valor_diaria,
                        valor_mensal: data.valor_mensal,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        taxas_inclusas: data.taxas_inclusas
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

    // Buscar imóveis relacionados
    useEffect(() => {
        const fetchRelated = async () => {
            // BYPASS: Se houver um corretor na URL (contexto de oferta enviada), 
            // NÃO buscamos imóveis relacionados para evitar que o lead saia do fluxo exclusivo
            const useParamsBrokerSlug = (routeParams as any)?.brokerSlug;
            if (!property || searchParams.get('broker') || useParamsBrokerSlug) return;

            try {
                const { data } = await supabase
                    .from('anuncios')
                    .select(`
                        *,
                        tipo_imovel (tipo),
                        operacao (tipo)
                    `)
                    .eq('cidade', property.address.city)
                    .neq('id', property.id)
                    .eq('status_aprovacao', 'aprovado')
                    .limit(8);

                if (data) {
                    const transformed = data.map(p => ({
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
            } catch (error) {
                console.error('Erro ao buscar imóveis relacionados:', error);
            }
        };

        fetchRelated();
    }, [property]);



    const nextImage = () => {
        if (property?.images) {
            paginate(1);
        }
    };

    const prevImage = () => {
        if (property?.images) {
            paginate(-1);
        }
    };

    // Check if property is in favorites
    useEffect(() => {
        const checkFavorite = async () => {
            if (!user || !property) return;

            try {
                const { data, error } = await supabase
                    .from('favoritos')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('anuncio_id', property.id)
                    .single();

                if (data) setIsFavorite(true);
            } catch (error) {
                // Ignore error if not found (standard Supabase behavior calls error on .single() if null)
            }
        };
        checkFavorite();
    }, [user, property]);

    const toggleFavorite = async () => {
        if (!user) {
            // Redirect to login with return url only if NOT logged in
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            navigate(`/login?returnUrl=${returnUrl}&type=client`);
            return;
        }

        if (!property) return;

        try {
            if (isFavorite) {
                // Remove from favorites
                const { error } = await supabase
                    .from('favoritos')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('anuncio_id', property.id);

                if (error) throw error;
                setIsFavorite(false);
                addToast('Removido dos favoritos', 'success');
            } else {
                // Add to favorites
                const { error } = await supabase
                    .from('favoritos')
                    .insert([{ user_id: user.id, anuncio_id: property.id }]);

                if (error) throw error;
                setIsFavorite(true);
                addToast('Adicionado aos favoritos', 'success');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            addToast('Erro ao atualizar favoritos', 'error');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    if (!property) {
        return <div className="text-center py-12">Imóvel não encontrado.</div>;
    }

    return (
        <div className="bg-slate-900">

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
                            className="px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors flex items-center gap-2"
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
                                    toast.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-fade-in-up flex items-center gap-2';
                                    toast.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Link copiado com sucesso!';
                                    document.body.appendChild(toast);
                                    setTimeout(() => {
                                        toast.remove();
                                    }, 3000);
                                }}
                                className="p-2 rounded-full bg-slate-800 border border-slate-700 text-gray-600 hover:text-primary-500 transition-colors"
                                title="Copiar Link"
                            >
                                <Share2 size={20} />
                            </button>
                            <button
                                onClick={toggleFavorite}
                                className={`p-2 rounded-full border transition-colors ${isFavorite
                                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                                    : 'bg-slate-800 border-slate-700 text-gray-600 hover:text-red-500'
                                    }`}
                                title={isFavorite ? "Remover dos Favoritos" : "Salvar Favorito"}
                            >
                                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>

                    {/* Hero Image Gallery */}
                    <div className="relative rounded-3xl overflow-hidden h-[300px] md:h-[500px] mb-8 shadow-lg group">
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.img
                                key={page}
                                src={property.images && property.images.length > 0 ? property.images[imageIndex] : 'https://picsum.photos/seed/prop1/800/600'}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = swipePower(offset.x, velocity.x);

                                    if (swipe < -swipeConfidenceThreshold) {
                                        paginate(1);
                                    } else if (swipe > swipeConfidenceThreshold) {
                                        paginate(-1);
                                    }
                                }}
                                alt={property.title}
                                className="w-full h-full object-cover transition-transform duration-500 cursor-pointer absolute top-0 left-0" // Absolute is key for stack effect
                                onClick={() => setIsGalleryOpen(true)}
                            />
                        </AnimatePresence>

                        {/* Carousel Controls */}
                        {property.images && property.images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <ArrowLeft size={24} className="rotate-180" />
                                </button>

                                {/* Indicators */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {property.images.map((_: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setPage([page + (idx - imageIndex), idx > imageIndex ? 1 : -1])}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 pointer-events-none z-20">
                            <h1 className="text-2xl font-bold text-white mb-2 truncate">{property.title}</h1>
                            <div className="flex items-center gap-2 mb-2">
                                {/* Tipo Imovel Badge */}
                                <span className="text-md px-2 py-1 rounded-full font-medium bg-white/20 text-white backdrop-blur-sm">
                                    {property.tipo_imovel || 'Imóvel'}
                                </span>

                                {/* Operação Badge */}
                                {(() => {
                                    const op = (property.operacao || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                    const isVenda = op === 'venda';
                                    const isLocacao = op === 'locacao';
                                    const isTemporada = op === 'temporada';
                                    const isAmbos = op.includes('venda') && op.includes('locacao');

                                    return (
                                        <span className={`text-md px-2 py-1 rounded-full font-medium ${isVenda ? 'bg-red-600 text-white'
                                            : isLocacao ? 'bg-blue-600 text-white'
                                                : isTemporada ? 'bg-orange-500 text-white'
                                                    : isAmbos ? 'bg-green-600 text-white'
                                                        : 'bg-gray-600 text-white'
                                            }`}>
                                            {property.operacao || 'N/A'}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center text-gray-200 text-md">
                                <MapPin size={14} className="mr-2" />
                                {property.location}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Stats Strip */}
                            <div className="bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 flex flex-wrap justify-between items-center gap-4">
                                <div className="text-center min-w-[80px]">
                                    <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Preço</p>
                                    <div className="flex flex-col items-center">
                                        {/* Temporada: Show Diária/Mensal */}
                                        {property.operacao?.toLowerCase() === 'temporada' ? (
                                            <>
                                                {property.valor_diaria > 0 && (
                                                    <p className="text-2xl font-bold text-orange-500">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(property.valor_diaria)}
                                                        <span className="text-sm font-normal text-gray-400 ml-1">(Diária)</span>
                                                    </p>
                                                )}
                                                {property.valor_mensal > 0 && (
                                                    <p className="text-xl font-bold text-orange-400 mt-1">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(property.valor_mensal)}
                                                        <span className="text-sm font-normal text-gray-400 ml-1">(Mensal)</span>
                                                    </p>
                                                )}
                                                {(!property.valor_diaria && !property.valor_mensal) && (
                                                    <p className="text-2xl font-bold text-primary-500">Sob Consulta</p>
                                                )}
                                            </>
                                        ) : (
                                            /* Venda/Locação: Normal display */
                                            <>
                                                {(property.valor_venda > 0) && (
                                                    <p className="text-2xl font-bold text-primary-600 text-primary-400">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(property.valor_venda)}
                                                        <div className="text-sm font-normal text-gray-400 ml-1">(Venda)</div>
                                                    </p>
                                                )}
                                                {(property.valor_locacao > 0) && (
                                                    <p className="text-xl font-bold text-blue-600 text-blue-400">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(property.valor_locacao)}
                                                        <div className="text-sm font-normal text-gray-400 ml-1">
                                                            (Locação{property.taxas_inclusas ? ' - Taxas Inclusas' : ''})
                                                        </div>
                                                    </p>
                                                )}
                                                {(!property.valor_venda && !property.valor_locacao) && (
                                                    <p className="text-2xl font-bold text-primary-500">Sob Consulta</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {(property.area || 0) > 0 && (
                                    <>
                                        <div className="h-10 w-px bg-slate-700 hidden sm:block"></div>
                                        <div className="flex flex-col items-center text-center min-w-[80px]">
                                            <div className="mr-2 mb-2"> Área Priv.</div>
                                            <p className="text-xl font-bold text-white">{property.area}m²</p>
                                        </div>
                                    </>
                                )}

                                {(property.garage || 0) > 0 && (
                                    <>
                                        <div className="h-10 w-px bg-slate-700 hidden sm:block"></div>
                                        <div className="flex flex-col items-center text-center min-w-[80px]">
                                            <Car size={20} className="mr-2 mb-2" />
                                            <p className="text-xl font-bold text-white">{property.garage}</p>
                                        </div>
                                    </>
                                )}

                                {(property.beds || 0) > 0 && (
                                    <>
                                        <div className="h-10 w-px bg-slate-700 hidden sm:block"></div>
                                        <div className="flex flex-col items-center text-center min-w-[80px]">
                                            <Bed size={20} className="mr-2 mb-2" />
                                            <p className="text-xl font-bold text-white">{property.beds}</p>
                                        </div>
                                    </>
                                )}

                                {(property.baths || 0) > 0 && (
                                    <>
                                        <div className="h-10 w-px bg-slate-700 hidden sm:block"></div>
                                        <div className="flex flex-col items-center text-center min-w-[80px]">
                                            <Bath size={20} className="mr-2 mb-2" />
                                            <p className="text-xl font-bold text-white">{property.baths}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Sobre este imóvel</h2>
                                <p className="text-slate-300 leading-relaxed">
                                    {property.description}
                                </p>
                            </div>

                            {/* Image Lightbox */}
                            {isGalleryOpen && (
                                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
                                    <button
                                        onClick={() => setIsGalleryOpen(false)}
                                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-[60]"
                                    >
                                        <X size={32} />
                                    </button>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-sm z-[60]"
                                    >
                                        <ArrowLeft size={32} />
                                    </button>

                                    <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center overflow-hidden">
                                        <AnimatePresence initial={false} custom={direction}>
                                            <motion.img
                                                key={page}
                                                src={property.images[imageIndex]}
                                                custom={direction}
                                                variants={variants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{
                                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                                    opacity: { duration: 0.2 }
                                                }}
                                                drag="x"
                                                dragConstraints={{ left: 0, right: 0 }}
                                                dragElastic={1}
                                                onDragEnd={(e, { offset, velocity }) => {
                                                    const swipe = swipePower(offset.x, velocity.x);

                                                    if (swipe < -swipeConfidenceThreshold) {
                                                        paginate(1);
                                                    } else if (swipe > swipeConfidenceThreshold) {
                                                        paginate(-1);
                                                    }
                                                }}
                                                alt={property.title}
                                                className="max-h-full max-w-full object-contain absolute"
                                            />
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-sm z-[60]"
                                    >
                                        <ArrowLeft size={32} className="rotate-180" />
                                    </button>

                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm z-[60]">
                                        {imageIndex + 1} / {property.images.length}
                                    </div>
                                </div>
                            )}

                            {/* Property Details Grid - Cleaned up */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Informações Adicionais</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 bg-slate-800 p-6 rounded-3xl border border-slate-700">
                                    {property.iptu > 0 && (
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">IPTU (Anual)</p>
                                            <p className="font-semibold text-white text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.iptu)}
                                            </p>
                                        </div>
                                    )}
                                    {property.condoFee > 0 && (
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">Condomínio</p>
                                            <p className="font-semibold text-white text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.condoFee)}
                                            </p>
                                        </div>
                                    )}
                                    {property.totalArea > 0 && (
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">Área Total</p>
                                            <p className="font-semibold text-white text-lg">{property.totalArea} m²</p>
                                        </div>
                                    )}
                                    {property.suites > 0 && (
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">Suítes</p>
                                            <p className="font-semibold text-white text-lg">{property.suites}</p>
                                        </div>
                                    )}
                                    {property.aceita_financiamento && (
                                        <div>
                                            <p className="text-sm text-slate-400 mb-1">Financiamento</p>
                                            <p className="font-semibold text-emerald-600 text-emerald-400 text-lg flex items-center gap-1">
                                                <CheckCircle size={18} />
                                                Aceita
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Features */}
                            {property.features && property.features.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Diferenciais</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {property.features.map((feature: string, idx: number) => (
                                            <div key={idx} className="flex items-center text-slate-300 bg-slate-800/50 p-3 rounded-full">
                                                <Check size={18} className="text-primary-500 mr-2" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Observações */}
                            {property.observacoes && (
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Observações</h2>
                                    <div className="bg-amber-50 bg-amber-900/20 p-4 rounded-3xl border border-amber-200 border-amber-800">
                                        <p className="text-gray-300 whitespace-pre-line">
                                            {property.observacoes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Media Section */}
                            {(property.video || property.tour_virtual) && (
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Mídia</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {property.video && (
                                            <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700">
                                                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                                    <PlayCircle className="text-red-500" size={20} />
                                                    Vídeo do Imóvel
                                                </h3>
                                                <div className="aspect-video rounded-3xl overflow-hidden bg-black">
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
                                            <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700">
                                                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                                    <Video className="text-blue-500" size={20} />
                                                    Tour Virtual 360º
                                                </h3>
                                                <div className="aspect-video rounded-3xl overflow-hidden bg-slate-900 flex items-center justify-center relative group cursor-pointer" onClick={() => window.open(property.tour_virtual, '_blank')}>
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
                                <div className="mt-6 pt-6 border-t border-blue-200 border-slate-600">
                                    <h4 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                                        <MapPin size={18} className="text-blue-500" />
                                        Localização do Imóvel | Sobre o Bairro {property.address.neighborhood}
                                    </h4>
                                    {/* Mini Map */}
                                    {property.latitude && property.longitude && (
                                        <div className="mt-8">
                                            <div className="h-[300px] w-3xl rounded-3xl overflow-hidden border border-slate-700 shadow-md">
                                                <MapContainer
                                                    center={[parseFloat(property.latitude), parseFloat(property.longitude)]}
                                                    zoom={15}
                                                    style={{ height: '100%', width: '100%' }}
                                                >
                                                    <TileLayer
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <Marker position={[parseFloat(property.latitude), parseFloat(property.longitude)]}>
                                                        <Popup>
                                                            {property.title} <br /> {property.location}
                                                        </Popup>
                                                    </Marker>
                                                </MapContainer>
                                            </div>
                                        </div>
                                    )}

                                    <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                                        {neighborhoodInfo.resumo}
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-gray-400 mt-4 italic text-center">
                                *Análise gerada via Gemini AI. Informações podem variar.
                            </p>
                        </div>

                        {/* Sidebar / Contact */}
                        <div className="space-y-6">
                            <div className="bg-slate-800 p-6 rounded-3xl shadow-lg border border-slate-700 sticky top-24">
                                <div className="flex items-center space-x-4 mb-6">
                                    <img src={property.agent.avatar} alt="Agent" className="w-16 h-16 rounded-full object-cover border-2 border-primary-500 p-1" />
                                    <div>
                                        <p className="text-sm text-slate-400">Anunciante</p>
                                        <h3
                                            className="text-lg font-bold text-white cursor-pointer hover:text-primary-500 transition-colors"
                                            onClick={() => {
                                                if (property.agent.slug) {
                                                    navigate(`/corretor/${property.agent.slug}`);
                                                }
                                            }}
                                        >
                                            {property.agent.name}
                                        </h3>
                                        <p className="text-md text-primary-600 text-primary-400 font-medium">WhatsApp {property.agent.phone}</p>
                                        {property.agent.creci && (
                                            <p className="text-md text-blue-500 text-blue-500 font-bold">CRECI: {property.agent.creci}/{property.agent.uf_creci}</p>
                                        )}
                                        <div className="flex text-yellow-500 text-md">★★★★★</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            if (property.agent.slug) {
                                                navigate(`/corretor/${property.agent.slug}`);
                                            } else {
                                                // Fallback if no slug
                                                alert('Página do corretor indisponível');
                                            }
                                        }}
                                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full transition-colors flex items-center justify-center"
                                    >
                                        <SearchIcon size={18} className="mr-2" />+ Imóveis Desse Corretor
                                    </button>
                                    <a
                                        href={`https://wa.me/${property.agent.phone.replace(/\D/g, '')}?text=Olá, gostaria de mais informações sobre o imóvel: ${property.title}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center"
                                    >
                                        <MessageCircle size={18} className="mr-2" /> WhatsApp
                                    </a>

                                    <button
                                        onClick={handleScheduleClick}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors flex items-center justify-center cursor-pointer"
                                    >
                                        <Calendar size={18} className="mr-2" /> Agendar Visita
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ScheduleVisitModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    propertyId={property.id}
                    propertyTitle={property.titulo}
                    ownerId={property.user_id}
                    ownerName={property.agent.name}
                    ownerPhone={property.agent.phone}
                />

                {/* Você também pode gostar */}
                {relatedProperties.length > 0 && (
                    <div className="mt-16">
                        <div className="flex items-center gap-2 mb-8">
                            <Sparkles className="text-primary-500" size={24} />
                            <h2 className="text-2xl font-bold text-white">Você também pode gostar</h2>
                        </div>
                        <HorizontalScroll itemWidth={288} gap={24} itemsPerPage={4}>
                            {relatedProperties.map((prop) => (
                                <div key={prop.id} className="flex-none w-72" style={{ scrollSnapAlign: 'start' }}>
                                    <PropertyCard property={prop} />
                                </div>
                            ))}
                        </HorizontalScroll>
                    </div>
                )}
            </div>
        </div >
    );
};