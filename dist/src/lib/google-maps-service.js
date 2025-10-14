/**
 * Converte endereço completo em coordenadas usando Google Geocoding API
 */
export async function getCoordinatesFromAddress(fullAddress, apiKey) {
    const key = apiKey || process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
        console.error('GOOGLE_MAPS_API_KEY não encontrada');
        return null;
    }
    try {
        const encodedAddress = encodeURIComponent(fullAddress);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${key}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng
            };
        }
        console.error(`Geocoding falhou: ${data.status}. Verifique se as APIs Geocoding e Routes estão habilitadas no Google Cloud Console.`);
        return null;
    }
    catch (error) {
        console.error('Erro ao obter coordenadas:', error);
        return null;
    }
}
/**
 * Calcula rota entre dois pontos usando Google Routes API (Compute Routes Essentials)
 */
export async function calculateRoute(origin, destination, apiKey) {
    const key = apiKey || process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
        console.error('GOOGLE_MAPS_API_KEY não encontrada');
        return null;
    }
    try {
        const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;
        const requestBody = {
            origin: {
                location: {
                    latLng: {
                        latitude: origin.lat,
                        longitude: origin.lng
                    }
                }
            },
            destination: {
                location: {
                    latLng: {
                        latitude: destination.lat,
                        longitude: destination.lng
                    }
                }
            },
            travelMode: 'TWO_WHEELER', // Modo moto para entrega
            routingPreference: 'TRAFFIC_UNAWARE', // Essentials tier
            computeAlternativeRoutes: false,
            routeModifiers: {
                avoidTolls: false,
                avoidHighways: false,
                avoidFerries: false
            }
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': key,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
            },
            body: JSON.stringify(requestBody)
        });
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            // Converter duration string (e.g., "1234s") para número
            const durationInSeconds = parseInt(route.duration.replace('s', ''));
            return {
                distance: route.distanceMeters,
                duration: durationInSeconds
            };
        }
        console.error('Nenhuma rota encontrada');
        return null;
    }
    catch (error) {
        console.error('Erro ao calcular rota:', error);
        return null;
    }
}
