import React, { useState } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Home, Bed, Bath, Car, Maximize, Edit2, Trash2, Check, X, Eye, Image as ImageIcon, TrendingUp, Key, Pause, AlertTriangle, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { formatCurrency, formatArea, generatePropertySlug } from '../lib/formatters';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastContext';
import { LoginPromptModal } from './LoginPromptModal';
import { getOptimizedImageUrl } from '../lib/imageUtils';

interface PropertyCardProps {
    property: {
        id: string;
        cod_imovel?: number;
        titulo: string;
        cidade: string;
        bairro: string;
        valor_venda: number;
        valor_locacao: number;
        valor_diaria?: number;
        valor_mensal?: number;
        fotos: string | string[];
        operacao: string;
        tipo_imovel?: string | { tipo: string }; // Handle object or string
        quartos?: number;
        banheiros?: number;
        vagas?: number;
        area_priv?: number;
        status?: string;
        aceita_parceria?: boolean;
    };
    actions?: React.ReactNode;
    showStatus?: boolean;
    compact?: boolean;
    onClick?: () => void;
    brokerSlug?: string;
    isDashboard?: boolean;
    isSelected?: boolean;
    onSelect?: (e: React.MouseEvent) => void;
    onFavoriteRemove?: (propertyId: string) => void; // New prop for unfavoriting
}

const OPERATION_LABELS: { [key: string]: string } = {
    venda: 'Venda',
    locacao: 'Locação',
    venda_locacao: 'Venda/Locação',
    temporada: 'Temporada',
};

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

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, actions, showStatus = false, compact = false, onClick, brokerSlug, isDashboard = false, isSelected = false, onSelect, onFavoriteRemove }) => {
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const isClient = role === 'Cliente';
    const { addToast } = useToast();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [[page, direction], setPage] = useState([0, 0]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const photosArray = Array.isArray(property.fotos)
        ? property.fotos
        : (property.fotos ? property.fotos.split(',') : []);

    const imageIndex = Math.abs(page % photosArray.length);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
        setCurrentImageIndex((prev) => (prev + newDirection + photosArray.length) % photosArray.length);
    };

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (photosArray.length > 0) {
            paginate(1);
        }
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (photosArray.length > 0) {
            paginate(-1);
        }
    };

    const [isDragging, setIsDragging] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Check if property is in favorites
    React.useEffect(() => {
        const checkFavorite = async () => {
            if (!user || !property.id) return;

            try {
                const { data } = await supabase
                    .from('favoritos')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('anuncio_id', property.id)
                    .maybeSingle();

                if (data) setIsFavorite(true);
            } catch (error) {
                // Ignore error if not found
            }
        };
        checkFavorite();
    }, [user, property.id]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            setShowLoginModal(true);
            return;
        }

        try {
            if (isFavorite) {
                // Remove from favorites
                await supabase
                    .from('favoritos')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('anuncio_id', property.id);

                setIsFavorite(false);
                addToast('Removido dos favoritos', 'success');
            } else {
                // Add to favorites
                await supabase
                    .from('favoritos')
                    .insert([{ user_id: user.id, anuncio_id: property.id }]);

                setIsFavorite(true);
                addToast('Adicionado aos favoritos', 'success');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            addToast('Erro ao atualizar favoritos', 'error');
        }
    };

    const handleCardClick = () => {
        if (isDragging) return;

        if (onClick) {
            onClick();
        } else {
            const slug = generatePropertySlug(property);
            if (isDashboard) {
                // Modified: Broker dashboard should stay in protected route
                navigate(`/properties/${slug}`);
            } else if (brokerSlug) {
                navigate(`/${brokerSlug}/imovel/${slug}`);
            } else {
                navigate(`/imovel/${slug}`);
            }
        }
    };

    const hasImages = photosArray.length > 0;
    const operationLabel = OPERATION_LABELS[property.operacao] || property.operacao;

    const operationTagClass = () => {
        const op = property.operacao?.toLowerCase()?.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (op === 'venda') return 'bg-red-500 text-white shadow-lg shadow-red-500/40 border border-red-400/50';
        if (op === 'locacao') return 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 border border-blue-500/50';
        if (op === 'temporada') return 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 border border-orange-400/50';
        if (op?.includes('venda') && op?.includes('locacao')) return 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 border border-emerald-500/50';
        return 'bg-gray-700 text-white shadow-lg border border-gray-600';
    };

    const statusColors = {
        pendente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        ativo: 'bg-green-100 text-green-700 border-green-200',
        reprovado: 'bg-red-100 text-red-700 border-red-200'
    };

    return (
        <>
            <motion.div
                layout
                className={`relative bg-midnight-950 rounded-3xl overflow-hidden shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 group cursor-pointer flex flex-col ${compact ? 'h-64' : 'h-[450px]'}`}
                onClick={handleCardClick}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
            >
                {/* Full Background Image */}
                <div className="absolute inset-0 z-0 bg-gray-900 overflow-hidden">
                    {hasImages ? (
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.img
                                key={page}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 400, damping: 40 },
                                    opacity: { duration: 0.15 }
                                }}
                                drag={!isMobile ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={(e, { offset, velocity }) => {
                                    setTimeout(() => setIsDragging(false), 100);
                                    const swipe = swipePower(offset.x, velocity.x);

                                    if (swipe < -swipeConfidenceThreshold) {
                                        paginate(1);
                                    } else if (swipe > swipeConfidenceThreshold) {
                                        paginate(-1);
                                    }
                                }}
                                className="absolute w-full h-full object-cover"
                                alt={property.titulo}
                                loading="lazy"
                                decoding="async"
                                src={getOptimizedImageUrl(photosArray[imageIndex], { width: 800, quality: 75 })}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Sem+Foto';
                                }}
                            />
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 via-20% to-transparent opacity-100 group-hover:opacity-95 transition-opacity pointer-events-none z-10" />
                        </AnimatePresence>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-midnight-900 text-gray-600">
                            <Home size={48} className="opacity-50" />
                        </div>
                    )}
                </div>

                {/* Badges (Over Image) */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start pointer-events-none">
                    <div className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg backdrop-blur-md transition-all duration-200 ${operationTagClass()}`}>
                        {operationLabel}
                    </div>
                    {/* Status Badge - Mostra status real quando ativo */}
                    {showStatus && property.status && (
                        <div className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-md border backdrop-blur-md ${property.status === 'pendente'
                            ? 'bg-yellow-500 text-white border-yellow-200'
                            : property.status === 'reprovado'
                                ? 'bg-red-500 text-white border-red-200'
                                : property.status === 'venda_faturada'
                                    ? 'bg-emerald-500 text-white border-emerald-200'
                                    : property.status === 'locacao_faturada'
                                        ? 'bg-blue-500 text-white border-blue-200'
                                        : property.status === 'imovel_espera'
                                            ? 'bg-orange-500 text-white border-orange-200'
                                            : property.status === 'imovel_perdido'
                                                ? 'bg-red-700 text-white border-red-200'
                                                : 'bg-emerald-700 text-white border-green-200'
                            }`}>
                            {property.status === 'pendente'
                                ? 'Pendente'
                                : property.status === 'reprovado'
                                    ? 'Reprovado'
                                    : property.status === 'venda_faturada'
                                        ? 'Vendido'
                                        : property.status === 'locacao_faturada'
                                            ? 'Alugado'
                                            : property.status === 'imovel_espera'
                                                ? 'Standby'
                                                : property.status === 'imovel_perdido'
                                                    ? 'Perdido'
                                                    : 'Ativo'
                            }
                        </div>
                    )}
                </div>


                {/* Favorite Button - Only in Favorites Page (Above Compare) */}
                {onFavoriteRemove && (
                    <div
                        className="absolute top-4 right-4 z-20 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFavoriteRemove(property.id);
                        }}
                    >
                        <div className="w-10 h-10 rounded-full bg-red-500 border-2 border-red-400 flex items-center justify-center shadow-lg shadow-red-500/50 hover:bg-red-600 transition-all">
                            <Heart size={20} className="text-white fill-white" strokeWidth={2} />
                        </div>
                    </div>
                )}

                {/* Selection Checkbox - Enhanced for Comparison */}
                {onSelect && (
                    <div
                        className={`absolute z-20 cursor-pointer flex flex-col items-center gap-1 ${onFavoriteRemove ? 'top-16 left-56' : 'top-4 left-56'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(e);
                        }}
                    >
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                            ? 'bg-emerald-500 border-emerald-500 shadow-glow shadow-emerald-500/50'
                            : 'bg-black/60 border-white/80 hover:bg-emerald-500/20 hover:border-emerald-400'
                            }`}>
                            {isSelected && <Check size={20} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm transition-colors ${isSelected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-black/60 text-white'
                            }`}>
                            Comparar
                        </span>
                    </div>
                )}

                {/* Favorite Button - Only show if not in selection mode */}
                {!onSelect && (
                    <button
                        onClick={toggleFavorite}
                        className={`absolute top-4 right-4 z-20 p-2 rounded-full border-2 transition-all ${isFavorite
                            ? 'bg-red-50 border-red-200 text-red-500'
                            : 'bg-black/60 border-white/80 hover:bg-red-500/20 hover:border-red-400 text-white'
                            }`}
                        title={isFavorite
                            ? (isClient ? "Remover dos favoritos" : "Remover do comparativo")
                            : (isClient ? "Adicionar aos favoritos" : "Adicionar ao comparativo")}
                    >
                        <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                )}

                {/* Navigation Arrows (Desktop - Hover Only) */}
                {hasImages && photosArray.length > 1 && (
                    <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/3 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                            aria-label="Imagem anterior"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/3 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                            aria-label="Próxima imagem"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}

                {/* Navigation Arrows (Mobile - Always Visible - Top 1/3) */}
                {hasImages && photosArray.length > 1 && (
                    <div className="md:hidden block">
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/3 -translate-y-1/2 z-20 bg-black/30 active:bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full transition-colors"
                            aria-label="Imagem anterior"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/3 -translate-y-1/2 z-20 bg-black/30 active:bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full transition-colors"
                            aria-label="Próxima imagem"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {/* Dots Indicator */}
                {hasImages && photosArray.length > 1 && (
                    <div className="absolute top-60 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 transition-opacity duration-500 pointer-events-none">
                        {photosArray.slice(0, 5).map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === imageIndex ? 'bg-emerald-400 w-6' : 'bg-white/40 w-1.5'}`}
                            />
                        ))}
                    </div>
                )}

                {/* Content (Overlay at Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end h-full pointer-events-none">
                    <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm text-xs">
                                {typeof property.tipo_imovel === 'string' ? property.tipo_imovel : property.tipo_imovel?.tipo}
                            </span>
                        </div>
                        <h3 className={`font-bold text-white mb-1 drop-shadow-md truncate ${compact ? 'text-md line-clamp-1' : 'text-md line-clamp-2'}`}>
                            {property.titulo}
                        </h3>

                        <p className="text-gray-200 text-xs mb-3 flex items-center gap-1.5 drop-shadow-sm">
                            <MapPin size={14} className="text-emerald-400" />
                            <span className="truncate">{property.bairro}, {property.cidade} | Cód: {property.cod_imovel}</span>
                        </p>

                        <div className="flex items-center gap-2 text-gray-100 text-xs font-medium mb-3">
                            {(property.quartos || 0) > 0 && (
                                <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
                                    <Bed size={14} /> {property.quartos}
                                </span>
                            )}
                            {(property.banheiros || 0) > 0 && (
                                <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
                                    <Bath size={14} /> {property.banheiros}
                                </span>
                            )}
                            {(property.vagas || 0) > 0 && (
                                <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
                                    <Car size={14} /> {property.vagas}
                                </span>
                            )}
                            {(property.area_priv || 0) > 0 && (
                                <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
                                    <Maximize size={14} /> {formatArea(property.area_priv)}m²
                                </span>
                            )}
                        </div>

                        <div className="flex items-end justify-between border-t border-white/30 pt-3 pointer-events-auto">
                            <div className="flex flex-col">
                                {property.operacao?.toLowerCase().includes('temporada') ? (
                                    <>
                                        {property.valor_diaria ? (
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-xl font-bold text-white tracking-tight drop-shadow-lg leading-none">
                                                    {formatCurrency(property.valor_diaria || 0)}
                                                </p>
                                                <span className="text-xs font-normal text-gray-300">/dia</span>
                                            </div>
                                        ) : null}

                                        {property.valor_mensal ? (
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <p className={`${property.valor_diaria ? 'text-xl font-bold text-white/90' : 'text-xl font-bold text-white'} tracking-tight drop-shadow-lg`}>
                                                    {formatCurrency(property.valor_mensal || 0)}
                                                </p>
                                                <span className="text-xs font-normal text-gray-300">/mês</span>
                                            </div>
                                        ) : null}

                                        {!property.valor_diaria && !property.valor_mensal && (
                                            <p className="text-md font-bold text-white">Sob Consulta</p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {property.valor_venda && property.valor_locacao ? (
                                            <>
                                                <p className="text-xl font-bold text-white tracking-tight drop-shadow-lg leading-none">
                                                    {formatCurrency(property.valor_venda || 0)}
                                                </p>
                                                <p className="text-xl font-bold text-white mt-1">
                                                    {formatCurrency(property.valor_locacao || 0)} <span className="text-xs font-normal text-gray-300">/mês</span>
                                                </p>
                                            </>
                                        ) : property.valor_locacao ? (
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-xl font-bold text-white tracking-tight drop-shadow-lg">
                                                    {formatCurrency(property.valor_locacao || 0)}
                                                </p>
                                                <span className="text-xs font-normal text-gray-300">/mês</span>
                                            </div>
                                        ) : property.valor_venda ? (
                                            <p className="text-xl font-bold text-white tracking-tight drop-shadow-lg">
                                                {formatCurrency(property.valor_venda || 0)}
                                            </p>
                                        ) : (
                                            <p className="text-lg font-bold text-white">Sob Consulta</p>
                                        )}
                                    </>
                                )}
                            </div>
                            {!actions && (
                                <button
                                    className="self-end bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-110 active:scale-100 group-hover:bg-emerald-400"
                                    aria-label={`Ver detalhes de ${property.titulo}`}
                                >
                                    <Eye size={20} />
                                </button>
                            )}
                            {actions && (
                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                    {actions}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Login Prompt Modal */}
            <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </>
    );
};
