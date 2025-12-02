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
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DraggableMapProps {
    latitude: number;
    longitude: number;
    onLocationChange: (lat: number, lng: number) => void;
    address?: string;
}

export const DraggableMap: React.FC<DraggableMapProps> = ({
    latitude,
    longitude,
    onLocationChange,
    address
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

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

        marker.on('dragend', () => {
            const position = marker.getLatLng();
            onLocationChange(position.lat, position.lng);
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
                className="w-full h-80 rounded-xl border-2 border-gray-300 dark:border-slate-600 overflow-hidden shadow-lg z-0"
            />
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>💡 Dica:</strong> Arraste o marcador para ajustar a localização exata do imóvel
                </p>
            </div>
        </div>
    );
};
