import React, { useState } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Home, Bed, Bath, Car, Maximize, Edit2, Trash2, Check, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { formatCurrency, formatArea } from '../lib/formatters';

interface PropertyCardProps {
    property: {
        id: string;
        cod_imovel?: number;
        titulo: string;
        cidade: string;
        bairro: string;
        valor_venda: number;
        valor_locacao: number;
        valor_diaria?: number;  // Temporada
        valor_mensal?: number;  // Temporada
        fotos: string | string[]; // Support both string (comma separated) and array
        operacao: string;
        tipo_imovel?: string;
        quartos?: number;
        banheiros?: number;
        vagas?: number;
        area_priv?: number;
        status_aprovacao?: string;
        aceita_parceria?: boolean;
    };
    actions?: React.ReactNode;
    showStatus?: boolean;
    compact?: boolean;
    onClick?: () => void;
    brokerSlug?: string; // Pass broker context for partnership navigation
    isDashboard?: boolean; // If true, navigate to /properties/:slug (dashboard route)
    isSelected?: boolean;
    onSelect?: (e: React.MouseEvent) => void;
}

const OPERATION_LABELS: { [key: string]: string } = {
    venda: 'Venda',
    locacao: 'Locação',
    venda_locacao: 'Venda/Locação',
    temporada: 'Temporada',
};

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, actions, showStatus = false, compact = false, onClick, brokerSlug, isDashboard = false, isSelected = false, onSelect }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Normalize photos to array
    const photosArray = Array.isArray(property.fotos)
        ? property.fotos
        : (property.fotos ? property.fotos.split(',') : []);

    // Usando formatCurrency e formatArea do lib/formatters

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (photosArray.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % photosArray.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (photosArray.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + photosArray.length) % photosArray.length);
        }
    };

    const generateSlug = () => {
        const tipo = (property.tipo_imovel || 'imovel').toLowerCase().replace(/\s+/g, '-');
        const quartos = property.quartos || 0;
        const bairro = (property.bairro || '').toLowerCase().replace(/\s+/g, '-');
        const cidade = (property.cidade || '').toLowerCase().replace(/\s+/g, '-');
        const area = property.area_priv || 0;
        const operacao = (property.operacao || '').toLowerCase().replace('_', '-').replace('/', '-');
        const valor = property.valor_venda || property.valor_locacao || 0;
        const garagem = (property.vagas || 0) > 0 ? '-com-garagem' : '';
        const codigo = property.cod_imovel || property.id;

        return `${tipo}-${quartos}-quartos-${bairro}-${cidade}${garagem}-${area}m2-${operacao}-RS${valor}-cod${codigo}`;
    };

    const handleCardClick = () => {
        if (onClick) {
            onClick();
        } else {
            const slug = generateSlug();
            // Determine the base path based on context
            if (isDashboard) {
                // Dashboard context: stay within protected routes
                navigate(`/properties/${slug}`);
            } else if (brokerSlug) {
                // Broker page context: add broker query param
                navigate(`/${slug}?broker=${brokerSlug}`);
            } else {
                // Public context: use public slug route
                navigate(`/${slug}`);
            }
        }
    };

    const hasImages = photosArray.length > 0;
    const operationLabel = OPERATION_LABELS[property.operacao] || property.operacao;

    const operationTagClass = () => {
        const op = property.operacao?.toLowerCase()?.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (op === 'venda') return 'bg-red-600 text-white shadow-lg shadow-red-600/20';
        if (op === 'locacao') return 'bg-blue-600 text-white shadow-lg shadow-blue-600/20';
        if (op === 'temporada') return 'bg-orange-500 text-white shadow-lg shadow-orange-500/20';
        if (op?.includes('venda') && op?.includes('locacao')) return 'bg-green-600 text-white shadow-lg shadow-green-600/20';
        return 'bg-gray-600 text-white shadow-lg shadow-gray-600/20';
    };

    const statusColors = {
        pendente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        aprovado: 'bg-green-100 text-green-700 border-green-200',
        reprovado: 'bg-red-100 text-red-700 border-red-200'
    };

    return (
        <div
            className={`bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full ${compact ? 'text-sm' : ''}`}
            onClick={handleCardClick}
        >
            {/* Image Section */}
            <div className={`relative overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0 ${compact ? 'h-40' : 'h-56'}`}>
                {hasImages ? (
                    <>
                        <img
                            src={photosArray[currentImageIndex]}
                            alt={property.titulo}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                        {photosArray.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                                >
                                    <ChevronRight size={18} />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {photosArray.slice(0, 5).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/40 w-1.5 hover:bg-white/60'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-slate-800">
                        <Home size={compact ? 32 : 48} className="opacity-20" />
                    </div>
                )}

                {/* Tags Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 items-start z-10">
                    <div className={`px-3 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${operationTagClass()}`}>
                        {operationLabel}
                    </div>
                    {showStatus && property.status_aprovacao && (
                        <div className={`px-3 py-1 text-xs font-bold rounded-lg border backdrop-blur-md ${statusColors[property.status_aprovacao as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>
                            {property.status_aprovacao.toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Selection Checkbox */}
                {onSelect && (
                    <div
                        className="absolute top-3 right-3 z-20"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(e);
                        }}
                    >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                            ? 'bg-primary-500 border-primary-500 shadow-md'
                            : 'bg-white/50 border-white hover:bg-white hover:border-white'
                            }`}>
                            {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className={`flex flex-col flex-grow ${compact ? 'p-4' : 'p-5'}`}>
                <div className="mb-auto">
                    <h3 className={`font-bold text-gray-900 dark:text-white line-clamp-1 ${compact ? 'text-base' : 'text-lg'}`}>
                        {property.titulo}
                    </h3>
                    <p className="text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-1 truncate">
                        <span className="truncate">{property.tipo_imovel} para {property.operacao}</span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 flex items-center gap-1 truncate">
                        <MapPin size={14} className="flex-shrink-0 text-primary-500" />
                        <span className="truncate">{property.bairro}, {property.cidade}</span>
                    </p>


                    <div className="flex gap-4">
                        {(property.area_priv || 0) > 0 && (
                            <div className="flex flex-col items-center justify-center p-2">
                                <Maximize size={16} className="text-gray-400 mb-1" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{formatArea(property.area_priv)}m²</span>
                            </div>
                        )}
                        {(property.quartos || 0) > 0 && (
                            <div className="flex flex-col items-center justify-center p-2">
                                <Bed size={16} className="text-gray-400 mb-1" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{property.quartos}</span>
                            </div>
                        )}
                        {(property.banheiros || 0) > 0 && (
                            <div className="flex flex-col items-center justify-center p-2">
                                <Bath size={16} className="text-gray-400 mb-1" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{property.banheiros}</span>
                            </div>
                        )}
                        {(property.vagas || 0) > 0 && (
                            <div className="flex flex-col items-center justify-center p-2">
                                <Car size={16} className="text-gray-400 mb-1" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{property.vagas}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-700 mt-1">
                    <div className="flex items-end justify-between mb-2">
                        {/* Temporada: Show Diária/Mensal */}
                        {property.operacao?.toLowerCase() === 'temporada' ? (
                            <>
                                {property.valor_diaria && (
                                    <div>
                                        <p className="text-xs text-orange-500">Diária</p>
                                        <p className="text-xl font-bold text-orange-500">
                                            {formatCurrency(property.valor_diaria)}
                                        </p>
                                    </div>
                                )}
                                {property.valor_mensal && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Mensal</p>
                                        <p className="text-md font-bold text-gray-600 dark:text-gray-400">
                                            {formatCurrency(property.valor_mensal)}
                                        </p>
                                    </div>
                                )}
                                {!property.valor_diaria && !property.valor_mensal && (
                                    <div>
                                        <p className="text-xs text-gray-500">Valor</p>
                                        <p className="text-md font-bold text-gray-400">Consulte</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Venda/Locação: Normal display */
                            <>
                                <div>
                                    <p className="text-xs text-primary-500 dark:text-primary-400">Valor</p>
                                    <p className="text-xl font-bold text-primary-600 dark:text-primary-500">
                                        {property.valor_venda ? formatCurrency(property.valor_venda) : formatCurrency(property.valor_locacao)}
                                    </p>
                                </div>
                                {property.valor_locacao && property.valor_venda && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Locação</p>
                                        <p className="text-md font-bold text-gray-600 dark:text-gray-400">
                                            {formatCurrency(property.valor_locacao)}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {actions ? (
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            {actions}
                        </div>
                    ) : (
                        <button className="w-full py-2.5 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 text-primary-600 dark:text-primary-400 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-600 dark:group-hover:text-white">
                            <Eye size={18} />
                            Ver Detalhes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
