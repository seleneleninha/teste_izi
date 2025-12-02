import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map-clusters.css';
import { Property } from '../types';
import { useNavigate } from 'react-router-dom';
import MarkerClusterGroup from 'react-leaflet-cluster';

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
}

const defaultCenter: [number, number] = [-5.79448, -35.211]; // Natal, RN

export const PropertyMap: React.FC<PropertyMapProps> = ({ properties }) => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup chunkedLoading>
          {properties.map((prop) => {
            const p = prop as any;
            // Only render marker if coords exist
            if (!p.latitude || !p.longitude) {
              console.log('Skipping property without coords:', p.id, p.titulo);
              return null;
            }

            const price = p.valor_venda || p.valor_locacao || 0;
            const location = `${p.bairro}, ${p.cidade}`;
            const imageUrl = p.fotos && p.fotos.length > 0 ? p.fotos[0] : 'https://via.placeholder.com/300x200?text=Sem+Imagem';

            return (
              <Marker
                key={prop.id}
                position={[Number(p.latitude), Number(p.longitude)]}
              >
                <Popup>
                  <div className="min-w-[200px] p-1">
                    <img
                      src={imageUrl}
                      alt={p.titulo}
                      className="w-full h-24 object-cover rounded-md mb-2"
                    />
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{p.titulo}</h3>
                    <p className="text-gray-600 text-xs mb-2">{location}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-primary-600">
                        R$ {price.toLocaleString('pt-BR')}
                      </span>
                      <button
                        onClick={() => navigate(`/properties/${prop.id}`)}
                        className="text-xs bg-primary-500 text-white px-2 py-1 rounded hover:bg-primary-600 transition-colors"
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
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-2 rounded-lg text-xs font-medium text-gray-500 shadow-sm z-[1000]">
        {properties.length} imóveis encontrados
      </div>
    </div>
  );
};