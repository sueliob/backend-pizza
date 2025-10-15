/**
 * Google Maps Services - Geocoding & Routes API
 * 
 * Uses:
 * - Geocoding API: Convert address to coordinates
 * - Routes API v2: Calculate real driving distance and time
 */

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
}

/**
 * Converte endereço completo em coordenadas usando Google Geocoding API
 */
export async function getCoordinatesFromAddress(
  fullAddress: string, 
  apiKey?: string
): Promise<Coordinates | null> {
  const key = apiKey || process.env.GOOGLE_MAPS_API_KEY;
  
  if (!key) {
    console.error('❌ GOOGLE_MAPS_API_KEY não encontrada');
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

    console.error(`❌ Geocoding falhou: ${data.status}. Verifique se a API Geocoding está habilitada no Google Cloud Console.`);
    return null;
  } catch (error) {
    console.error('❌ Erro ao obter coordenadas:', error);
    return null;
  }
}

/**
 * Calcula rota real entre dois pontos usando Google Routes API v2
 * 
 * Retorna distância em metros/km e duração em segundos/minutos
 * Considera ruas reais, não linha reta!
 */
export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates,
  apiKey?: string
): Promise<RouteResult | null> {
  const key = apiKey || process.env.GOOGLE_MAPS_API_KEY;
  
  if (!key) {
    console.error('❌ GOOGLE_MAPS_API_KEY não encontrada');
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
      routingPreference: 'TRAFFIC_UNAWARE', // Essentials tier (sem trânsito real-time)
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
      const distanceMeters = route.distanceMeters;

      return {
        distanceMeters,
        durationSeconds: durationInSeconds,
        distanceKm: Math.round(distanceMeters / 100) / 10, // Arredonda para 1 casa decimal
        durationMinutes: Math.round(durationInSeconds / 60)
      };
    }

    console.error('❌ Nenhuma rota encontrada');
    return null;
  } catch (error) {
    console.error('❌ Erro ao calcular rota:', error);
    return null;
  }
}
