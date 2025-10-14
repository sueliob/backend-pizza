import { PIZZERIA_ADDRESS, DELIVERY_CONFIG, CEP_COORDINATES } from '@shared/constants';
// Haversine formula to calculate distance between two coordinates
function calculateHaversineDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(coord2.lat - coord1.lat);
    const dLng = toRadians(coord2.lng - coord1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
// Get coordinates from CEP using lookup table or approximation
function getCoordinatesFromCEP(cep) {
    const cleanCEP = cep.replace(/\D/g, '');
    // Try exact match first
    if (CEP_COORDINATES[cleanCEP.substring(0, 5)]) {
        const coords = CEP_COORDINATES[cleanCEP.substring(0, 5)];
        console.log(`CEP ${cleanCEP}: Coordenadas encontradas ${cleanCEP.substring(0, 5)} ->`, coords);
        return coords;
    }
    // Try matching first 4 digits
    const cep4 = cleanCEP.substring(0, 4);
    for (const key in CEP_COORDINATES) {
        if (key.substring(0, 4) === cep4) {
            return CEP_COORDINATES[key];
        }
    }
    // Try matching first 3 digits  
    const cep3 = cleanCEP.substring(0, 3);
    for (const key in CEP_COORDINATES) {
        if (key.substring(0, 3) === cep3) {
            return CEP_COORDINATES[key];
        }
    }
    // Fallback: estimate based on CEP number pattern in São Paulo
    const cepNum = parseInt(cleanCEP);
    let estimatedCoords;
    if (cepNum >= 1000000 && cepNum < 3000000) {
        // Centro region
        estimatedCoords = { lat: -23.5505, lng: -46.6333 };
    }
    else if (cepNum >= 4000000 && cepNum < 6000000) {
        // South/West regions
        estimatedCoords = { lat: -23.5800, lng: -46.6800 };
    }
    else if (cepNum >= 5000000 && cepNum < 6000000) {
        // West region (closer to pizzeria)
        estimatedCoords = { lat: -23.5400, lng: -46.7200 };
    }
    else {
        // Default fallback (Centro)
        estimatedCoords = { lat: -23.5505, lng: -46.6333 };
    }
    return estimatedCoords;
}
// Calculate distance from pizzeria to destination CEP
function calculateDistanceFromCEP(destinationCEP) {
    const pizzeriaCoords = PIZZERIA_ADDRESS.coordinates;
    const destinationCoords = getCoordinatesFromCEP(destinationCEP);
    const distance = calculateHaversineDistance(pizzeriaCoords, destinationCoords);
    // Round to 1 decimal place and ensure minimum 1km
    return Math.max(1, Math.round(distance * 10) / 10);
}
export function calculateDeliveryFee(destinationCEP) {
    const distance = calculateDistanceFromCEP(destinationCEP);
    // Calculate delivery fee using range-based pricing
    // Formula: ceil(distance / 3km) * R$ 9,00 (minimum R$ 9,00)
    const ranges = Math.ceil(distance / DELIVERY_CONFIG.kmRange);
    const deliveryFee = Math.max(ranges * DELIVERY_CONFIG.feePerRange, DELIVERY_CONFIG.baseFee);
    // Estimate delivery time based on distance (moto é mais rápida)
    const estimatedMinutes = Math.max(DELIVERY_CONFIG.baseTime, DELIVERY_CONFIG.baseTime + (distance * 1.5));
    return {
        distance,
        deliveryFee: deliveryFee.toFixed(2),
        estimatedTime: `${Math.round(estimatedMinutes)} min`
    };
}
