import React, { useState } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Home, Bed, Bath, Car, Maximize, Edit2, Trash2, Check, X, Eye, Image as ImageIcon, TrendingUp, Key, Pause, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { formatCurrency, formatArea, generatePropertySlug } from '../lib/formatters';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

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

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, actions, showStatus = false, compact = false, onClick, brokerSlug, isDashboard = false, isSelected = false, onSelect }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [[page, direction], setPage] = useState([0, 0]);

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

    const handleCardClick = () => {
        if (isDragging) return;

        if (onClick) {
            onClick();
        } else {
            const slug = generatePropertySlug(property);
            if (isDashboard) {
                navigate(`/properties/${slug}`);
            } else if (brokerSlug) {
                navigate(`/corretor/${brokerSlug}/${slug}`);
            } else {
                navigate(`/${slug}`);
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
        <motion.div
            layout
            className={`relative bg-midnight-950 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group cursor-pointer flex flex-col ${compact ? 'h-64' : 'h-[450px]'}`}
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
                            src={photosArray[imageIndex]}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            drag={!isMobile ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
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
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Sem+Foto';
                            }}
                        />
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 via-20% to-transparent opacity-90 group-hover:opacity-95 transition-opacity pointer-events-none z-10" />
                    </AnimatePresence>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-midnight-900 text-gray-600">
                        <Home size={48} className="opacity-50" />
                    </div>
                )}
            </div>

            {/* Badges (Over Image) */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start pointer-events-none">
                <div className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-md backdrop-blur-md ${operationTagClass()}`}>
                    {operationLabel}
                </div>
                {/* Status Badge - Mostra status real quando ativo */}
                {showStatus && property.status && (
                    <div className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-md border backdrop-blur-md ${property.status === 'pendente'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        : property.status === 'reprovado'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : property.status === 'venda_faturada'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : property.status === 'locacao_faturada'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : property.status === 'imovel_espera'
                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        : property.status === 'imovel_perdido'
                                            ? 'bg-red-100 text-red-700 border-red-200'
                                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}>
                        {property.status === 'pendente'
                            ? '⏳ Pendente'
                            : property.status === 'reprovado'
                                ? '❌ Reprovado'
                                : property.status === 'venda_faturada'
                                    ? '🎉 Vendido'
                                    : property.status === 'locacao_faturada'
                                        ? '💰 Alugado'
                                        : property.status === 'imovel_espera'
                                            ? '⏸️ Standby'
                                            : property.status === 'imovel_perdido'
                                                ? '⚠️ Perdido'
                                                : '✅ Ativo'
                        }
                    </div>
                )}
            </div>

            {/* Selection Checkbox */}
            {onSelect && (
                <div
                    className="absolute top-4 right-4 z-20 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(e);
                    }}
                >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                        ? 'bg-emerald-500 border-emerald-500 shadow-glow'
                        : 'bg-black/40 border-white/60 hover:bg-white hover:border-white'
                        }`}>
                        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                </div>
            )}

            {/* Navigation Arrows (Desktop - Hover Only) */}
            {hasImages && photosArray.length > 1 && (
                <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/3 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white p-2 rounded-full transition-colors hover:scale-110 active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/3 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white p-2 rounded-full transition-colors hover:scale-110 active:scale-95"
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
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/3 -translate-y-1/2 z-20 bg-black/30 active:bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Dots Indicator */}
            {hasImages && photosArray.length > 1 && (
                <div className="absolute bottom-60 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 transition-opacity duration-500 pointer-events-none">
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
                        <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm text-xs">{property.tipo_imovel}</span>
                    </div>
                    <h3 className={`font-bold text-white mb-1 drop-shadow-md truncate ${compact ? 'text-lg line-clamp-1' : 'text-xl line-clamp-2'}`}>
                        {property.titulo}
                    </h3>

                    <p className="text-gray-200 text-sm mb-3 flex items-center gap-1.5 drop-shadow-sm">
                        <MapPin size={14} className="text-emerald-400" />
                        <span className="truncate">{property.bairro}, {property.cidade}</span>
                    </p>

                    <div className="flex items-center gap-4 text-gray-100 text-sm font-medium mb-3">
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
                                            <p className="text-2xl font-bold text-white tracking-tight drop-shadow-lg leading-none">
                                                {formatCurrency(property.valor_diaria || 0)}
                                            </p>
                                            <span className="text-sm font-normal text-gray-300">/ dia</span>
                                        </div>
                                    ) : null}

                                    {property.valor_mensal ? (
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <p className={`${property.valor_diaria ? 'text-xl font-bold text-white/90' : 'text-2xl font-bold text-white'} tracking-tight drop-shadow-lg`}>
                                                ou {formatCurrency(property.valor_mensal || 0)}
                                            </p>
                                            <span className="text-sm font-normal text-gray-300">/ mês</span>
                                        </div>
                                    ) : null}

                                    {!property.valor_diaria && !property.valor_mensal && (
                                        <p className="text-lg font-bold text-white">Sob Consulta</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    {property.valor_venda && property.valor_locacao ? (
                                        <>
                                            <p className="text-2xl font-bold text-white tracking-tight drop-shadow-lg leading-none">
                                                {formatCurrency(property.valor_venda || 0)}
                                            </p>
                                            <p className="text-xl font-bold text-white mt-1">
                                                ou {formatCurrency(property.valor_locacao || 0)} <span className="text-sm font-normal text-gray-300">/ mês</span>
                                            </p>
                                        </>
                                    ) : property.valor_locacao ? (
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                                                {formatCurrency(property.valor_locacao || 0)}
                                            </p>
                                            <span className="text-sm font-normal text-gray-300">/ mês</span>
                                        </div>
                                    ) : property.valor_venda ? (
                                        <p className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                                            {formatCurrency(property.valor_venda || 0)}
                                        </p>
                                    ) : (
                                        <p className="text-lg font-bold text-white">Sob Consulta</p>
                                    )}
                                </>
                            )}
                        </div>
                        {!actions && (
                            <button className="self-end bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 group-hover:bg-emerald-400">
                                <Eye size={22} />
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
    );
};
