import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue with CDN
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DraggableMapProps {
    latitude: number;
    longitude: number;
    onLocationChange: (lat: number, lng: number) => void;
    onAddressChange?: (addressData: {
        cep: string;
        address: string;
        neighborhood: string;
        city: string;
        state: string;
    }) => void;
    address?: string;
}

export const DraggableMap: React.FC<DraggableMapProps> = ({
    latitude,
    longitude,
    onLocationChange,
    onAddressChange,
    address
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    // Reverse geocoding function
    const reverseGeocode = async (lat: number, lng: number) => {
        if (!onAddressChange) return;

        setIsLoadingAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'pt-BR,pt;q=0.9'
                    }
                }
            );

            if (!response.ok) throw new Error('Geocoding failed');

            const data = await response.json();
            const addr = data.address;

            // Extract address components
            const cep = addr.postcode || '';
            const street = addr.road || addr.street || '';
            const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || '';
            const city = addr.city || addr.town || addr.village || addr.municipality || '';
            let state = addr.state || '';

            // Map state name to UF
            const STATE_TO_UF: { [key: string]: string } = {
                'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
                'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
                'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
                'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
                'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
                'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
                'Sergipe': 'SE', 'Tocantins': 'TO'
            };

            // Try to find the UF, otherwise keep original
            state = STATE_TO_UF[state] || state;

            onAddressChange({
                cep: cep,
                address: street,
                neighborhood: neighborhood,
                city: city,
                state: state
            });
        } catch (error) {
            console.error('Error fetching address:', error);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Initialize map
        const map = L.map(mapContainerRef.current).setView([latitude, longitude], 15);

        // Add OpenStreetMap tiles (free)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add draggable marker (no popup for cleaner UI)
        const marker = L.marker([latitude, longitude], {
            draggable: true,
            autoPan: true
        }).addTo(map);

        // Handle marker drag
        marker.on('dragstart', () => {
            setIsDragging(true);
        });

        marker.on('dragend', async () => {
            const position = marker.getLatLng();
            onLocationChange(position.lat, position.lng);

            // Fetch new address based on new coordinates
            await reverseGeocode(position.lat, position.lng);

            setIsDragging(false);
        });

        mapRef.current = map;
        markerRef.current = marker;

        // Cleanup
        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Update marker position when coordinates change
    useEffect(() => {
        if (markerRef.current && !isDragging) {
            const newLatLng = L.latLng(latitude, longitude);
            markerRef.current.setLatLng(newLatLng);

            if (mapRef.current) {
                mapRef.current.setView(newLatLng, 15);
            }
        }
    }, [latitude, longitude, isDragging]);

    return (
        <div className="relative">
            <div
                ref={mapContainerRef}
                className="w-full h-80 rounded-3xl border-2 border-midnight-800 overflow-hidden shadow-lg z-0"
            />
            <div className="mt-2 p-3 bg-midnight-950/20 border border-midnight-800 rounded-full">
                <p className="text-md text-gray-50">
                    <strong>💡 Dica:</strong> Arraste o marcador para ajustar a localização exata do imóvel
                </p>
            </div>
        </div>
    );
};
