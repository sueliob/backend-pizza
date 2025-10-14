// Pizzaria address configuration with fixed coordinates
export const PIZZERIA_ADDRESS = {
  street: 'R. Passo da Pátria',
  number: '1685',
  neighborhood: 'Vila Leopoldina',
  city: 'São Paulo',
  state: 'SP',
  cep: '05085-080',
  fullAddress: 'R. Passo da Pátria, 1685 - Vila Leopoldina, São Paulo - SP, 05085-080',
  coordinates: {
    lat: -23.5236,
    lng: -46.7031
  }
};

// Delivery fee configuration
export const DELIVERY_CONFIG = {
  baseFee: 9.00,              // Minimum delivery fee (R$ 9,00)
  feePerRange: 9.00,          // R$ 9,00 per 3km range  
  kmRange: 3,                 // Each range is 3km
  baseTime: 20,               // Base delivery time in minutes (moto)
  // Legacy fields removed - using new calculation method
};

// CEP to approximate coordinates mapping for São Paulo areas
export const CEP_COORDINATES: Record<string, {lat: number, lng: number}> = {
  // Centro/República
  '01000': { lat: -23.5505, lng: -46.6333 },
  '01300': { lat: -23.5489, lng: -46.6388 },
  
  // Vila Madalena/Pinheiros
  '05014': { lat: -23.5448, lng: -46.6854 },
  '05422': { lat: -23.5616, lng: -46.7020 },
  
  // Vila Leopoldina (nearby areas)
  '05085': { lat: -23.5236, lng: -46.7031 }, // Pizzeria area - coordenadas corrigidas
  '05318': { lat: -23.5190, lng: -46.7350 },
  '05335': { lat: -23.547968, lng: -46.75071 }, // Jaguaré - coordenadas precisas
  
  // Butantã
  '05508': { lat: -23.5695, lng: -46.7295 },
  '05424': { lat: -23.5588, lng: -46.7186 },
  
  // Morumbi
  '05650': { lat: -23.6028, lng: -46.6982 },
  '05705': { lat: -23.6234, lng: -46.7020 },
  
  // Lapa
  '05040': { lat: -23.5280, lng: -46.7056 },
  '05077': { lat: -23.5173, lng: -46.6970 },
  
  // Perdizes
  '05015': { lat: -23.5356, lng: -46.6755 },
  '01238': { lat: -23.5420, lng: -46.6750 },
  
  // Jardins
  '01401': { lat: -23.5614, lng: -46.6563 },
  '01452': { lat: -23.5710, lng: -46.6692 },
  
  // Moema
  '04023': { lat: -23.5950, lng: -46.6647 },
  '04038': { lat: -23.6057, lng: -46.6628 },
  
  // Vila Olímpia
  '04551': { lat: -23.5951, lng: -46.6851 },
  '04552': { lat: -23.5988, lng: -46.6890 },
  
  // Itaim Bibi
  '04524': { lat: -23.5817, lng: -46.6754 },
  '04533': { lat: -23.5899, lng: -46.6799 }
};