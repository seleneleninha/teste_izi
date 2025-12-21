import React from 'react';
import { MapPin, Bed, Bath, Square, Heart } from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

interface CompactPropertyCardProps {
    property: any;
    onClick?: () => void;
    onFavoriteToggle?: (id: string) => void;
    isFavorited?: boolean;
}

export const CompactPropertyCard: React.FC<CompactPropertyCardProps> = ({
    property,
    onClick,
    onFavoriteToggle,
    isFavorited = false
}) => {
    const photos = property.fotos ? (typeof property.fotos === 'string' ? JSON.parse(property.fotos) : property.fotos) : [];
    const firstPhoto = photos[0] || '/placeholder-property.jpg';

    const operacaoLabel = property.operacao === 'venda' ? 'VENDA' :
        property.operacao === 'locacao' ? 'LOCAÇÃO' :
            'TEMPORADA';

    const valor = property.valor_venda || property.valor_locacao || 0;

    return (
        <div
            onClick={onClick}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 active:scale-[0.98] transition-transform cursor-pointer"
        >
            <div className="flex gap-3 p-3">
                {/* Imagem */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-700">
                    <img
                        src={firstPhoto}
                        alt={property.titulo}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                                {operacaoLabel}
                            </span>
                            {onFavoriteToggle && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFavoriteToggle(property.id);
                                    }}
                                    className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                                    aria-label="Favoritar"
                                >
                                    <Heart
                                        size={16}
                                        className={isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400'}
                                    />
                                </button>
                            )}
                        </div>

                        <h4 className="text-sm font-bold text-white truncate mb-1">
                            {property.titulo}
                        </h4>

                        <p className="text-xs text-slate-400 truncate mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{property.bairro}, {property.cidade}</span>
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            {property.quartos > 0 && (
                                <span className="flex items-center gap-1">
                                    <Bed className="w-3 h-3" /> {property.quartos}
                                </span>
                            )}
                            {property.banheiros > 0 && (
                                <span className="flex items-center gap-1">
                                    <Bath className="w-3 h-3" /> {property.banheiros}
                                </span>
                            )}
                            {property.area_priv > 0 && (
                                <span className="flex items-center gap-1">
                                    <Square className="w-3 h-3" /> {property.area_priv}m²
                                </span>
                            )}
                        </div>

                        <p className="text-base md:text-lg font-bold text-emerald-400 whitespace-nowrap">
                            {formatCurrency(valor)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
