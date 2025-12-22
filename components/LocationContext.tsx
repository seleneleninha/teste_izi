import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    state: string | null; // e.g., 'RN', 'SP'
    loading: boolean;
    error: string | null;
    permissionDenied: boolean;
}

interface LocationContextType {
    location: LocationState;
    requestLocation: () => Promise<void>;
    setLocation: (city: string, state: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location, setLocationState] = useState<LocationState>({
        latitude: null,
        longitude: null,
        city: null,
        state: null,
        loading: true,
        error: null,
        permissionDenied: false
    });

    useEffect(() => {
        // Check localStorage first
        const savedLocation = localStorage.getItem('izi_user_location');
        if (savedLocation) {
            try {
                const parsed = JSON.parse(savedLocation);
                setLocationState(prev => ({
                    ...prev,
                    ...parsed,
                    loading: false
                }));
            } catch (e) {
                console.error("Failed to parse saved location", e);
                requestLocation(); // Retry fetch if cache is corrupted
            }
        } else {
            // Attempt to get location automatically if not saved
            requestLocation();
        }
    }, []);

    const requestLocation = async () => {
        if (!('geolocation' in navigator)) {
            setLocationState(prev => ({ ...prev, loading: false, error: 'Geolocalização não suportada', permissionDenied: true }));
            return;
        }

        setLocationState(prev => ({ ...prev, loading: true }));

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Reverse Geocoding via Nominatim (Free/Open)
                    // Note: In production, consider a more robust API like BrasilAPI (depends on CEP) or Google Maps (paid)
                    // For now, Nominatim is excellent for "zero setup" city detection.
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                        {
                            headers: {
                                'User-Agent': 'iziBrokerz-Web/1.0',
                                'Accept-Language': 'pt-BR'
                            }
                        }
                    );

                    if (!response.ok) throw new Error('Falha ao buscar endereço');

                    const data = await response.json();

                    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality;

                    // State extraction is tricky across countries, but for Brazil 'state' is reliable or 'ISO3166-2-lvl4'
                    // Nominatim usually returns "Rio Grande do Norte" in address.state
                    // We might need to map it to "RN". 
                    // BrasilAPI is better for "RN" conversion, but let's try to map commonly or use full name.
                    // For simplicity, we'll store the full State name or use a mapping helper if needed.
                    let state = data.address?.state;

                    // Simple Map for main states if needed (or just use full name for display)
                    const stateMapping: Record<string, string> = {
                        "Rio Grande do Norte": "RN",
                        "São Paulo": "SP",
                        "Rio de Janeiro": "RJ",
                        "Minas Gerais": "MG",
                        // ... add others as needed or handle dynamically
                    };

                    const uf = stateMapping[state] || state; // Fallback to full name if not in map

                    if (city) {
                        const newLocation = { latitude, longitude, city, state: uf, permissionDenied: false, loading: false, error: null };
                        setLocationState(newLocation);
                        localStorage.setItem('izi_user_location', JSON.stringify({ latitude, longitude, city, state: uf }));
                    } else {
                        throw new Error('Cidade não detectada');
                    }

                } catch (error) {
                    console.error('Reverse Geocoding Error:', error);
                    setLocationState(prev => ({
                        ...prev,
                        loading: false,
                        // Keep simple error, don't block usage
                        error: 'Erro ao identificar cidade'
                    }));
                }
            },
            (error) => {
                console.log("Geolocation permission denied or error:", error.message);
                setLocationState(prev => ({
                    ...prev,
                    loading: false,
                    permissionDenied: true,
                    error: error.message
                }));
                // Save denial preference? No, let them try again later if they click a button.
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 3600000 } // Cache for 1 hour
        );
    };

    const setLocation = (city: string, state: string) => {
        const newLoc = { ...location, city, state, loading: false, error: null };
        setLocationState(newLoc);
        localStorage.setItem('izi_user_location', JSON.stringify({ city, state }));
    };

    return (
        <LocationContext.Provider value={{ location, requestLocation, setLocation }}>
            {children}
        </LocationContext.Provider>
    );
};
