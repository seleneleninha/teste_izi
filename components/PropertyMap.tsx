"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

interface Property {
    id: string;
    cod_imovel?: number;
    titulo: string;
    cidade: string;
    bairro: string;
    valor_venda: number;
    valor_locacao: number;
    fotos: string | string[];
    operacao: string;
    tipo_imovel?: string;
    quartos?: number;
    banheiros?: number;
    vagas?: number;
    area_priv?: number;
    latitude?: number;
    longitude?: number;
}

interface PropertyMapProps {
    properties: Property[];
}

const defaultCenter: [number, number] = [-5.79448, -35.211]; // Natal, RN

// Image carousel component for popup
const ImageCarousel: React.FC<{ images: string[]; title: string }> = ({ images, title }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src="https://via.placeholder.com/300x200?text=Sem+Imagem"
                alt={title}
                className="w-full h-32 object-cover rounded-md mb-2"
            />
        );
    }

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={images[currentIndex]}
                alt={`${title} - ${currentIndex + 1}`}
                className="w-full h-32 object-cover rounded-md mb-2"
                onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Erro+ao+Carregar';
                }}
            />

            {images.length > 1 && (
                <>
                    {/* Navigation Arrows */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Imagem anterior"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Próxima imagem"
                    >
                        <ChevronRight size={16} />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-3 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {currentIndex + 1} / {images.length}
                    </div>
                </>
            )}
        </div>
    );
};

// Component to handle markers rendering and map interaction
const PropertyMarkers: React.FC<{ properties: Property[] }> = ({ properties }) => {
    const map = useMap();
    const router = useRouter();

    return (
        <MarkerClusterGroup
            maxClusterRadius={40}
            iconCreateFunction={(cluster: any) => {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div style="
                        background: linear-gradient(135deg, #390404ff, #ff0000ff);
                        color: white;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 14px;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">${count}</div>`,
                    className: 'custom-cluster-icon',
                    iconSize: L.point(40, 40, true),
                });
            }}
        >
            {properties.map((prop) => {
                const p = prop as any;
                // Only render marker if coords exist
                if (!p.latitude || !p.longitude) {
                    // console.log('Skipping property without coords:', p.id, p.titulo);
                    return null;
                }

                const price = p.valor_venda || p.valor_locacao || 0;
                const operation = p.operacao;
                const type = p.tipo_imovel;
                const location = `${p.bairro}, ${p.cidade}`;

                // Handle both string (comma-separated) and array formats for fotos
                let images: string[] = [];
                if (typeof p.fotos === 'string' && p.fotos.length > 0) {
                    images = p.fotos.split(',').filter(Boolean);
                } else if (Array.isArray(p.fotos)) {
                    images = p.fotos;
                }

                const lat = Number(p.latitude);
                const lng = Number(p.longitude);

                // Generate SEO-friendly slug for public navigation
                const generateSlug = () => {
                    const tipoSlug = (type || 'imovel').toLowerCase().replace(/\s+/g, '-');
                    const quartos = p.quartos || 0;
                    const bairro = (p.bairro || '').toLowerCase().replace(/\s+/g, '-');
                    const cidade = (p.cidade || '').toLowerCase().replace(/\s+/g, '-');
                    const area = p.area_priv || 0;
                    const operacaoSlug = (operation || '').toLowerCase().replace('_', '-').replace('/', '-');
                    const valor = p.valor_venda || p.valor_locacao || 0;
                    const garagem = (p.vagas || 0) > 0 ? '-com-garagem' : '';
                    const codigo = p.cod_imovel || p.id;

                    return `${tipoSlug}-${quartos}-quartos-${bairro}-${cidade}${garagem}-${area}m2-${operacaoSlug}-RS${valor}-cod${codigo}`;
                };

                return (
                    <Marker
                        key={prop.id}
                        position={[lat, lng]}
                        eventHandlers={{
                            click: () => {
                                map.setView([lat, lng], map.getZoom(), {
                                    animate: true
                                });
                            },
                        }}
                    >
                        <Popup maxWidth={280} minWidth={250}>
                            <div className="min-w-[240px] p-1">
                                <ImageCarousel images={images} title={p.titulo} />

                                <h3 className="font-bold text-gray-900 text-lg truncate">{p.titulo}</h3>

                                {/* Operation and Type Badges */}
                                <div className="flex items-center gap-2 mt-1 mb-2">
                                    {/* Type Badge */}
                                    <span className="text-[16px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                        {type || 'Imóvel'}
                                    </span>

                                    {/* Operation Badge */}
                                    {(() => {
                                        const op = (operation || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                        const isVenda = op === 'venda';
                                        const isLocacao = op === 'locacao';
                                        const isAmbos = op.includes('venda') && op.includes('locacao');

                                        return (
                                            <span className={`text-[16px] px-2 py-0.5 rounded-full font-medium ${isVenda ? 'bg-red-600 text-white'
                                                : isLocacao ? 'bg-blue-600 text-white'
                                                    : isAmbos ? 'bg-green-600 text-white'
                                                        : 'bg-gray-600 text-white'
                                                }`}>
                                                {operation || 'N/A'}
                                            </span>
                                        );
                                    })()}
                                </div>

                                <p className="font-bold text-[16px] text-gray-600 text-xs uppercase">{location}</p>

                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-bold text-primary-600 text-lg">
                                        R$ {price.toLocaleString('pt-BR')}
                                    </span>
                                    <button
                                        onClick={() => router.push(`/${generateSlug()}`)}
                                        className="text-xs bg-primary-500 text-white px-3 py-1.5 rounded hover:bg-primary-600 transition-colors"
                                    >
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MarkerClusterGroup>
    );
};

// Helper to fix map rendering issues (grey tiles)
const MapInvalidator = () => {
    const map = useMap();
    useEffect(() => {
        // Force map invalidation after mount and small delay
        // This fixes the "grey area" issue when map renders inside a hidden/resized container
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

export default function PropertyMap({ properties }: PropertyMapProps) {
    // Debug: Log properties to check coordinates
    const propertiesWithCoords = properties.filter(p => {
        const prop = p as any;
        return prop.latitude && prop.longitude;
    });

    // Use a unique key to force re-render when properties change
    // This helps when switching between filtered results
    const mapKey = properties.map(p => p.id).join(',');

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 z-0">
            <MapContainer
                key={mapKey} // Force re-mount on property change if needed, or remove if too expensive
                center={defaultCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
            >
                <MapInvalidator />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <PropertyMarkers properties={propertiesWithCoords} />
            </MapContainer>

            <div className="absolute bottom-4 left-4 bg-red-700 backdrop-blur px-4 py-2 rounded-lg text-xs font-medium text-white shadow-sm z-[1000]">
                {propertiesWithCoords.length} imóveis no mapa
            </div>
        </div>
    );
};
