/**
 * Distance calculation utilities using Haversine formula
 * Used for filtering partner properties by radius
 */

/**
 * Calculate distance between two geographic points
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Distance in kilometers (rounded to 1 decimal)
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Filter properties by distance from user location
 * @param properties Array of properties with latitude/longitude
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param radiusKm Maximum distance in kilometers (null = no filter)
 * @returns Filtered array of properties within radius
 */
export function filterPropertiesByRadius<T extends { latitude?: number | null; longitude?: number | null }>(
    properties: T[],
    userLat: number | null | undefined,
    userLon: number | null | undefined,
    radiusKm: number | null
): T[] {
    // If no radius specified or no user location, return all properties
    if (!radiusKm || !userLat || !userLon) {
        return properties;
    }

    return properties.filter(property => {
        // Skip properties without coordinates
        if (!property.latitude || !property.longitude) {
            return false;
        }

        const distance = calculateDistance(
            userLat,
            userLon,
            property.latitude,
            property.longitude
        );

        return distance <= radiusKm;
    });
}
