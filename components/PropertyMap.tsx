import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map-clusters.css';
import { Property } from '../types';
import { useNavigate } from 'react-router-dom';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatArea } from '../lib/formatters';
import { navigateToProperty } from '../lib/propertyHelpers';

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

interface PropertyMapProps {
  properties: Property[];
  brokerSlug?: string;
  isDashboard?: boolean;
}

const defaultCenter: [number, number] = [-5.79448, -35.211]; // Natal, RN

// Image carousel component for popup
const ImageCarousel: React.FC<{ images: string[]; title: string }> = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <img
        src="https://via.placeholder.com/300x200?text=Sem+Imagem"
        alt={title}
        className="w-full h-32 object-cover rounded-3xl mb-2"
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
      <img
        src={images[currentIndex]}
        alt={`${title} - ${currentIndex + 1}`}
        className="w-full h-32 object-cover rounded-3xl mb-2"
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
const PropertyMarkers: React.FC<{ properties: Property[]; brokerSlug?: string; isDashboard?: boolean }> = ({ properties, brokerSlug, isDashboard }) => {
  const map = useMap();
  const navigate = useNavigate();

  return (
    <MarkerClusterGroup maxClusterRadius={40}>
      {properties.map((prop) => {
        const p = prop as any;
        // Only render marker if coords exist
        if (!p.latitude || !p.longitude) {
          // console.log('Skipping property without coords:', p.id, p.titulo);
          return null;
        }

        // Determinar o preço a exibir
        const priceValue = p.valor_venda || p.valor_locacao || p.valor_diaria || p.valor_mensal || 0;
        const priceLabel = p.valor_diaria ? '/dia' : (p.valor_mensal ? '/mês' : '');

        // Fix: Handle object vs string for relations
        const operation = typeof p.operacao === 'object' ? p.operacao?.tipo : p.operacao;
        const type = typeof p.tipo_imovel === 'object' ? p.tipo_imovel?.tipo : p.tipo_imovel;

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
          const valor = p.valor_venda || p.valor_locacao || p.valor_diaria || p.valor_mensal || 0;
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
            <Popup minWidth={200} maxWidth={250} minHeight={250} maxHeight={350}>
              <div>
                <ImageCarousel images={images} title={p.titulo} type={p.tipo_imovel} operation={p.operacao} />

                <h3 className="font-bold text-gray-900 text-lg truncate">{p.titulo}</h3>

                {/* Operation and Type Badges */}
                <div className="flex items-center gap-2 mt-1 mb-2">
                  {/* Type Badge */}
                  <span className="text-[16px] px-2 py-0.5 rounded-full font-medium bg-midnight-800 text-white border border-gray-200">
                    {type || 'Imóvel'}
                  </span>

                  {/* Operation Badge */}
                  {(() => {
                    const op = (operation || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const isVenda = op === 'venda';
                    const isLocacao = op === 'locacao';
                    const isAmbos = op.includes('venda') && op.includes('locacao');
                    const isTemporada = op.includes('temporada');

                    return (
                      <span className={`text-[16px] px-2 py-0.5 rounded-full font-medium ${isVenda ? 'bg-red-600 text-white'
                        : isLocacao ? 'bg-blue-600 text-white'
                          : isAmbos ? 'bg-green-600 text-white'
                            : isTemporada ? 'bg-orange-600 text-white'
                              : 'bg-gray-600 text-white'
                        }`}>
                        {operation || 'N/A'}
                      </span>
                    );
                  })()}
                </div>

                <p className="font-bold text-[16px] text-gray-600 text-xs uppercase">{location}</p>

                {/* Price Display */}
                <div className="flex flex-col gap-1 mt-2">
                  {(() => {
                    const op = (operation || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const isVendaLocacao = op.includes('venda') && op.includes('locacao');
                    const isTemporada = op.includes('temporada');

                    if (isVendaLocacao) {
                      // Show both venda and locacao prices
                      return (
                        <>
                          {p.valor_venda > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Venda:</span>
                              <span className="font-bold text-primary-600 text-base">
                                {formatCurrency(p.valor_venda)}
                              </span>
                            </div>
                          )}
                          {p.valor_locacao > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Locação:</span>
                              <span className="font-bold text-blue-600 text-base">
                                {formatCurrency(p.valor_locacao)}/mês
                              </span>
                            </div>
                          )}
                        </>
                      );
                    } else if (isTemporada) {
                      // Show diaria and/or mensal for temporada
                      return (
                        <>
                          {p.valor_diaria > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Diária:</span>
                              <span className="font-bold text-orange-600 text-base">
                                {formatCurrency(p.valor_diaria)}/dia
                              </span>
                            </div>
                          )}
                          {p.valor_mensal > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Mensal:</span>
                              <span className="font-bold text-orange-600 text-base">
                                {formatCurrency(p.valor_mensal)}/mês
                              </span>
                            </div>
                          )}
                        </>
                      );
                    } else {
                      // Single price display for venda or locacao only
                      const priceValue = p.valor_venda || p.valor_locacao || p.valor_diaria || p.valor_mensal || 0;
                      const priceLabel = p.valor_locacao ? '/mês' : (p.valor_diaria ? '/dia' : (p.valor_mensal ? '/mês' : ''));

                      return (
                        <span className="font-bold text-primary-600 text-lg">
                          {priceValue > 0 ? formatCurrency(priceValue) + priceLabel : 'Sob Consulta'}
                        </span>
                      );
                    }
                  })()}
                </div>

                {/* Ver Detalhes Button */}
                <div className="flex justify-start mt-3">
                  <button
                    onClick={() => navigateToProperty(navigate, p, isDashboard, brokerSlug)}
                    className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 font-bold shadow-md shadow-black"
                  >
                    VER DETALHES
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
    // Force map invalidation after mount with multiple delays
    // This fixes the "grey area" issue when map renders inside animated/resized containers
    const timers = [
      setTimeout(() => map.invalidateSize(), 0),
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 500),
    ];

    // Also invalidate on window resize
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
};

export const PropertyMap: React.FC<PropertyMapProps> = ({ properties, brokerSlug, isDashboard }) => {
  // Debug: Log properties to check coordinates
  const propertiesWithCoords = properties.filter(p => {
    const prop = p as any;
    return prop.latitude && prop.longitude;
  });

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-midnight-800 z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <MapInvalidator />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <PropertyMarkers properties={properties} brokerSlug={brokerSlug} isDashboard={isDashboard} />
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-[#ab0505] border-white border-2 backdrop-blur px-4 py-2 rounded-3xl text-xs font-bold text-white shadow-[4px_4px_5px_rgba(0,0,0,0.9)] z-[1000]">
        {propertiesWithCoords.length} imóveis no mapa

      </div>
    </div>
  );
};