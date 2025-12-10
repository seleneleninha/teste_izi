// Geocoding helper using free Nominatim API (OpenStreetMap)
// No API key required, completely free

interface GeocodingResult {
    lat: string;
    lon: string;
    display_name: string;
}

/**
 * Get coordinates from address using Nominatim (OpenStreetMap)
 * Free, no API key required
 * Rate limit: ~1 request per second (fair use)
 */
export async function geocodeAddress(address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
}): Promise<{ latitude: number; longitude: number } | null> {
    try {
        console.log('Geocoding address:', address);

        // Add small delay to respect rate limits (1 req/sec)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Strategy 1: Structured Query with Postal Code (Most Precise)
        let params = new URLSearchParams({
            format: 'json',
            limit: '1',
            countrycodes: 'br',
            addressdetails: '1',
            street: `${address.number} ${address.street}`,
            city: address.city,
            state: address.state,
            postalcode: address.postalCode
        });

        let url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        console.log('Strategy 1 URL:', url);

        let response = await fetch(url, { headers: { 'User-Agent': 'iziBrokerz/1.0' } });
        if (!response.ok) throw new Error(`Nominatim API error: ${response.statusText}`);

        let data: GeocodingResult[] = await response.json();

        if (data && data.length > 0) {
            console.log('Strategy 1 Success:', data[0]);
            return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }

        // Strategy 2: Structured Query without Postal Code (If Postal Code is wrong/new)
        await new Promise(resolve => setTimeout(resolve, 1000));
        params = new URLSearchParams({
            format: 'json',
            limit: '1',
            countrycodes: 'br',
            addressdetails: '1',
            street: `${address.number} ${address.street}`,
            city: address.city,
            state: address.state
        });

        url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        console.log('Strategy 2 URL:', url);

        response = await fetch(url, { headers: { 'User-Agent': 'iziBrokerz/1.0' } });
        if (!response.ok) throw new Error(`Nominatim API error: ${response.statusText}`);

        data = await response.json();

        if (data && data.length > 0) {
            console.log('Strategy 2 Success:', data[0]);
            return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }

        // Strategy 3: Structured Query without Number (Street Center)
        await new Promise(resolve => setTimeout(resolve, 1000));
        params = new URLSearchParams({
            format: 'json',
            limit: '1',
            countrycodes: 'br',
            addressdetails: '1',
            street: address.street,
            city: address.city,
            state: address.state
        });

        url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        console.log('Strategy 3 URL:', url);

        response = await fetch(url, { headers: { 'User-Agent': 'iziBrokerz/1.0' } });
        if (!response.ok) throw new Error(`Nominatim API error: ${response.statusText}`);

        data = await response.json();

        if (data && data.length > 0) {
            console.log('Strategy 3 Success:', data[0]);
            return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        }

        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
}

/**
 * Reverse geocode - get address from coordinates
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'iziBrokerz/1.0'
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.display_name || null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
}
