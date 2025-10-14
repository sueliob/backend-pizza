import { DatabaseStorage } from '../../src/storage';
import { bulkImportFlavorsSchema, bulkImportExtrasSchema, bulkImportDoughTypesSchema } from '../../shared/schema';
import { AuthService } from '../../src/services/auth-service';
import { AdminSeeder } from '../../src/services/admin-seeder';
// Initialize storage
const storage = new DatabaseStorage();
// 🌱 Initialize admin users only if explicitly enabled
if (process.env.ENABLE_AUTO_SEED === 'true') {
    (async () => {
        try {
            console.log('🌱 [SEEDER] Auto-seed habilitado, criando admins iniciais...');
            await AdminSeeder.createInitialAdmin();
        }
        catch (error) {
            console.warn('⚠️ [SEEDER] Não foi possível criar admins iniciais:', error);
        }
    })();
}
else {
    console.log('🔒 [READ-ONLY] Auto-seed desabilitado - modo produção somente leitura');
    // ⚠️ TEMPORÁRIO: Forçar criação de admin para debug  
    (async () => {
        try {
            console.log('🔧 [DEBUG] Tentando criar admin para debug...');
            await AdminSeeder.createInitialAdmin();
        }
        catch (error) {
            console.warn('⚠️ [DEBUG] Falha ao criar admin:', error);
        }
    })();
}
// Função helper para migrar configurações para o banco
async function migrateSettingsToDatabase() {
    try {
        // Migrar businessHours
        await storage.createSetting({
            section: 'businessHours',
            data: PIZZERIA_SETTINGS.businessHours
        });
        // Migrar contact
        await storage.createSetting({
            section: 'contact',
            data: PIZZERIA_SETTINGS.contact
        });
        // Migrar address
        await storage.createSetting({
            section: 'address',
            data: PIZZERIA_SETTINGS.address
        });
        // Migrar delivery
        await storage.createSetting({
            section: 'delivery',
            data: PIZZERIA_SETTINGS.delivery
        });
        // Migrar branding
        await storage.createSetting({
            section: 'branding',
            data: PIZZERIA_SETTINGS.branding
        });
        // Migrar social
        await storage.createSetting({
            section: 'social',
            data: PIZZERIA_SETTINGS.social
        });
        // Migrar categories
        await storage.createSetting({
            section: 'categories',
            data: PIZZERIA_SETTINGS.categories
        });
        console.log('✅ Configurações migradas para o banco de dados com sucesso');
    }
    catch (error) {
        console.error('Erro ao migrar configurações:', error);
        throw error;
    }
}
// ✅ REMOVIDO: Função queryDatabase() problemática (Architect Security Fix)
// Usando apenas @neondatabase/serverless driver seguro
// Pizzeria configuration
const PIZZERIA_ADDRESS = {
    coordinates: { lat: -23.5236, lng: -46.7031 } // Vila Leopoldina
};
// Variável global para armazenar configurações da pizzaria (será carregada do banco)
let PIZZERIA_SETTINGS = {
    businessHours: null,
    contact: null,
    address: null,
    delivery: null,
    branding: null,
    social: null,
    categories: null
};
// Delivery configuration - Fórmula Original
const DELIVERY_CONFIG = {
    baseFee: 9.00, // Taxa mínima R$ 9,00
    feePerRange: 9.00, // R$ 9,00 por cada 3km  
    kmRange: 3, // Cada faixa é 3km
    baseTime: 20, // Tempo base entrega (moto)
};
// CEP para coordenadas (principais áreas de São Paulo)
const CEP_COORDINATES = {
    // Centro/República
    '01000': { lat: -23.5505, lng: -46.6333 },
    '01300': { lat: -23.5489, lng: -46.6388 },
    // Vila Madalena/Pinheiros
    '05014': { lat: -23.5448, lng: -46.6854 },
    '05422': { lat: -23.5616, lng: -46.7020 },
    // Vila Leopoldina (áreas próximas)
    '05085': { lat: -23.5236, lng: -46.7031 }, // Área da pizzaria
    '05318': { lat: -23.5190, lng: -46.7350 },
    '05335': { lat: -23.547968, lng: -46.75071 }, // Jaguaré
    // Butantã
    '05508': { lat: -23.5695, lng: -46.7295 },
    '05424': { lat: -23.5588, lng: -46.7186 },
    // Morumbi
    '05650': { lat: -23.6028, lng: -46.6982 },
    '05705': { lat: -23.6234, lng: -46.7020 },
    // Lapa
    '05040': { lat: -23.5280, lng: -46.7056 },
    '05077': { lat: -23.5173, lng: -46.6970 },
    // Jardins
    '01401': { lat: -23.5614, lng: -46.6563 },
    '01452': { lat: -23.5710, lng: -46.6692 },
    // Vila Olímpia
    '04551': { lat: -23.5951, lng: -46.6851 },
    '04552': { lat: -23.5988, lng: -46.6890 }
};
// Fórmula de Haversine para calcular distância
function calculateHaversineDistance(coord1, coord2) {
    const R = 6371; // Raio da Terra em km
    const dLat = toRadians(coord2.lat - coord1.lat);
    const dLng = toRadians(coord2.lng - coord1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em km
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
// Obter coordenadas do CEP
function getCoordinatesFromCEP(cep) {
    const cleanCEP = cep.replace(/\D/g, '');
    // Buscar correspondência exata nos primeiros 5 dígitos
    if (CEP_COORDINATES[cleanCEP.substring(0, 5)]) {
        return CEP_COORDINATES[cleanCEP.substring(0, 5)];
    }
    // Buscar nos primeiros 4 dígitos
    const cep4 = cleanCEP.substring(0, 4);
    for (const key in CEP_COORDINATES) {
        if (key.substring(0, 4) === cep4) {
            return CEP_COORDINATES[key];
        }
    }
    // Estimativa baseada no padrão do CEP de São Paulo
    const cepNum = parseInt(cleanCEP);
    if (cepNum >= 1000000 && cepNum < 3000000) {
        return { lat: -23.5505, lng: -46.6333 }; // Centro
    }
    else if (cepNum >= 4000000 && cepNum < 6000000) {
        return { lat: -23.5800, lng: -46.6800 }; // Sul/Oeste
    }
    else if (cepNum >= 5000000 && cepNum < 6000000) {
        return { lat: -23.5400, lng: -46.7200 }; // Oeste (próximo à pizzaria)
    }
    else {
        return { lat: -23.5505, lng: -46.6333 }; // Fallback Centro
    }
}
// Calcular taxa usando fórmula original
function calculateDeliveryFromCEP(cep) {
    const pizzeriaCoords = PIZZERIA_ADDRESS.coordinates;
    const destinationCoords = getCoordinatesFromCEP(cep);
    const distance = calculateHaversineDistance(pizzeriaCoords, destinationCoords);
    const roundedDistance = Math.max(1, Math.round(distance * 10) / 10);
    // Fórmula Original: ceil(distância / 3km) * R$ 9,00 (mínimo R$ 9,00)
    const ranges = Math.ceil(roundedDistance / DELIVERY_CONFIG.kmRange);
    const deliveryFee = Math.max(ranges * DELIVERY_CONFIG.feePerRange, DELIVERY_CONFIG.baseFee);
    // Tempo estimado baseado na distância (moto)
    const estimatedMinutes = Math.max(DELIVERY_CONFIG.baseTime, DELIVERY_CONFIG.baseTime + (roundedDistance * 1.5));
    return {
        distance: roundedDistance,
        deliveryFee: deliveryFee.toFixed(2),
        estimatedTime: `${Math.round(estimatedMinutes)} min`
    };
}
// READ-ONLY MODE: No fallback data - only real database data
// Debug function for logging
function debugLog(message, data) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [NETLIFY] ${message}`);
    if (data) {
        console.log(`[${timestamp}] [NETLIFY] Data:`, JSON.stringify(data, null, 2));
    }
}
// CORS configuration from environment - Support for Cloudflare Pages
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'https://frontend-pizzaria.pages.dev,https://pizzaria.pages.dev,http://localhost:3000,http://localhost:5000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
// Also allow any *.pages.dev domains for Cloudflare Pages
const isCloudflarePagesDomain = (origin) => origin && origin.includes('.pages.dev');
// CORS helper function with Cloudflare Pages support
function getCorsHeaders(origin) {
    let allowedOrigin = '';
    if (!origin) {
        // curl/postman requests
        allowedOrigin = '*';
    }
    else if (ALLOWED_ORIGINS.includes(origin) || isCloudflarePagesDomain(origin)) {
        // Allow configured origins OR any Cloudflare Pages domain
        allowedOrigin = origin;
    }
    else {
        // For development and testing, be more permissive
        allowedOrigin = '*';
    }
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    };
}
// 🔧 Helper para verificar autenticação via Bearer token (novo método)
async function authenticateAdminViaBearerToken(authHeader) {
    try {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return null;
        }
        // Verificar access token
        const payload = AuthService.verifyAccessToken(token);
        if (!payload) {
            return null;
        }
        // Buscar dados atualizados do usuário
        const user = await storage.getAdminUser(payload.userId);
        if (!user || !user.isActive) {
            return null;
        }
        return {
            userId: user.id,
            username: user.username,
            role: user.role
        };
    }
    catch (error) {
        console.error('❌ [AUTH] Bearer token authentication failed:', error);
        return null;
    }
}
// 🔧 Helper para verificar autenticação via cookies HttpOnly (padronização)
async function authenticateAdminViaCookies(cookies) {
    try {
        // Extrair access token dos cookies
        const accessTokenMatch = cookies.match(/access_token=([^;]+)/);
        const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;
        if (!accessToken) {
            return null;
        }
        // Verificar access token
        const payload = AuthService.verifyAccessToken(accessToken);
        if (!payload) {
            return null;
        }
        // Buscar dados atualizados do usuário
        const user = await storage.getAdminUser(payload.userId);
        if (!user || !user.isActive) {
            return null;
        }
        return {
            userId: user.id,
            username: user.username,
            role: user.role
        };
    }
    catch (error) {
        console.error('❌ [AUTH] Cookie authentication error:', error);
        return null;
    }
}
export const handler = async (event) => {
    const startTime = Date.now();
    const origin = event.headers.origin;
    const headers = getCorsHeaders(origin);
    // Log CORS decision
    if (origin) {
        const allowed = ALLOWED_ORIGINS.includes(origin);
        debugLog(`🔒 CORS Check: ${origin} - ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
    }
    const rawPath = event.path.replace('/.netlify/functions/api', '') || '/';
    const path = ('/' + rawPath).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    const method = event.httpMethod;
    // Debug log da requisição entrante
    debugLog(`🔄 ${method} ${path}`, {
        origin,
        userAgent: event.headers['user-agent'],
        body: event.body ? JSON.parse(event.body) : null,
        queryStringParameters: event.queryStringParameters
    });
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        debugLog(`⚙️ CORS preflight request from ${origin}`);
        return {
            statusCode: 204,
            headers,
            body: ''
        };
    }
    // Block requests from non-allowed origins (except non-browser requests)
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        debugLog(`❌ Origin blocked: ${origin}`);
        return {
            statusCode: 403,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Origin not allowed' })
        };
    }
    try {
        // 🔒 READ-ONLY MODE protection for write operations
        const READ_ONLY_MODE = process.env.READ_ONLY_MODE === 'true';
        const writeOperations = ['POST', 'PUT', 'DELETE', 'PATCH'];
        if (READ_ONLY_MODE && writeOperations.includes(method)) {
            // Allow admin authentication in read-only mode
            const allowedWritePaths = ['/admin/auth', '/admin/login', '/admin/logout', '/admin/refresh'];
            if (!allowedWritePaths.some(allowedPath => path.startsWith(allowedPath))) {
                debugLog(`🔒 READ-ONLY MODE: Blocked ${method} ${path}`);
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({
                        error: 'Sistema em modo somente leitura',
                        message: 'Operações de escrita estão temporariamente desabilitadas. Use seeding manual para adicionar dados.',
                        readOnlyMode: true,
                        contactAdmin: 'Entre em contato com o administrador para modificações de dados'
                    })
                };
            }
        }
        // Root endpoint
        if (path === '/' && method === 'GET') {
            const response = {
                message: 'Pizzaria API Online com 10 Sabores!',
                status: 'ok',
                timestamp: new Date().toISOString()
            };
            debugLog(`✅ Root endpoint response`, response);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(response)
            };
        }
        // 🔍 DIAGNÓSTICO: Health check detalhado (conforme análise)
        if (path === '/health' && method === 'GET') {
            try {
                console.log('🔍 [Health] Running detailed health check...');
                // 1. Environment info
                const env = {
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development',
                    hasDatabase: !!process.env.DATABASE_URL,
                    databaseHost: process.env.DATABASE_URL ?
                        process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown' : 'none'
                };
                // 2. VERIFICAR SCHEMA REAL DO NETLIFY (diagnóstico Architect)
                const { db } = await import('../../src/db');
                const { sql } = await import('drizzle-orm');
                const schemaCheck = await db.execute(sql `
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = 'pizza_flavors' 
          ORDER BY ordinal_position
        `);
                console.log('🔍 [Health] Schema no Netlify:', JSON.stringify(schemaCheck));
                // 3. Test storage layer sem schema conflicts
                let testResults = { totalFlavors: 0, salgadasCount: 0, error: null };
                try {
                    const salgadasTest = await storage.getFlavorsByCategory('salgadas');
                    const allFlavorsTest = await storage.getAllFlavors();
                    testResults = { totalFlavors: allFlavorsTest.length, salgadasCount: salgadasTest.length, error: null };
                }
                catch (storageError) {
                    const errorMsg = storageError instanceof Error ? storageError.message : String(storageError);
                    testResults = { totalFlavors: 0, salgadasCount: 0, error: errorMsg };
                }
                console.log(`🔍 [Health] Storage test: ${JSON.stringify(testResults)}`);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        ...env,
                        netlifySchema: schemaCheck,
                        storageTest: {
                            ...testResults,
                            message: testResults.error ? `ERRO: ${testResults.error}` :
                                testResults.totalFlavors === 0 ? 'PROBLEMA: Nenhum sabor encontrado!' :
                                    'OK: Sabores encontrados',
                            schemaIssue: !schemaCheck.rows.some((col) => col.column_name === 'created_at') ? 'created_at MISSING!' : 'schema OK'
                        }
                    })
                };
            }
            catch (error) {
                console.error('❌ [Health] Health check failed:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        status: "error",
                        error: errorMessage,
                        timestamp: new Date().toISOString()
                    })
                };
            }
        }
        // Get all flavors
        if (path === '/flavors' && method === 'GET') {
            try {
                const flavors = await storage.getAllFlavors();
                debugLog(`✅ Retornando ${flavors.length} sabores do PostgreSQL`);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(flavors)
                };
            }
            catch (error) {
                debugLog(`❌ Erro ao buscar sabores do banco:`, error);
                // READ-ONLY MODE: Return empty array instead of mock data
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify([])
                };
            }
        }
        // Get flavors by category
        if (path.startsWith('/flavors/') && method === 'GET') {
            try {
                const category = path.split('/')[2];
                const categoryFlavors = await storage.getFlavorsByCategory(category);
                debugLog(`✅ Retornando ${categoryFlavors.length} sabores da categoria ${category} do PostgreSQL`);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(categoryFlavors)
                };
            }
            catch (error) {
                debugLog(`❌ Erro ao buscar sabores da categoria do banco:`, error);
                // READ-ONLY MODE: Return empty array instead of mock data
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify([])
                };
            }
        }
        // Get all extras (public route)
        if (path === '/extras' && method === 'GET') {
            try {
                const extras = await storage.getAllExtras();
                // READ-ONLY MODE: Return actual data or empty array, no fallbacks
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(extras || [])
                };
            }
            catch (error) {
                debugLog(`❌ Erro ao buscar extras do banco:`, error);
                // READ-ONLY MODE: Return empty array instead of mock data
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify([])
                };
            }
        }
        // Get all dough types (public route)
        if (path === '/dough-types' && method === 'GET') {
            try {
                const doughTypes = await storage.getAllDoughTypes();
                // READ-ONLY MODE: Return actual data or empty array, no fallbacks
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(doughTypes || [])
                };
            }
            catch (error) {
                debugLog(`❌ Erro ao buscar tipos de massa do banco:`, error);
                // READ-ONLY MODE: Return empty array instead of mock data
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify([])
                };
            }
        }
        // Calculate delivery distance and fee
        if (path === '/calculate-distance' && method === 'POST') {
            const { cep, address } = JSON.parse(event.body || '{}');
            // Primeiro tentar Google Maps (mais preciso)
            let deliveryData;
            try {
                const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
                if (GOOGLE_API_KEY && address) {
                    debugLog('🗺️ Usando Google Maps API para cálculo preciso', { cep, address });
                    const fullAddress = `${address.street}, ${address.number || ''}, ${address.neighborhood}, ${address.city} - ${address.state}, ${cep}`;
                    // 1. Geocoding: endereço → coordenadas
                    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_API_KEY}`;
                    const geocodingResponse = await fetch(geocodingUrl);
                    const geocodingData = await geocodingResponse.json();
                    if (geocodingData.status === 'OK' && geocodingData.results.length > 0) {
                        const destinationCoords = geocodingData.results[0].geometry.location;
                        // 2. Routes API: calcular rota real (moto)
                        const routesUrl = `https://routes.googleapis.com/directions/v2:computeRoutes`;
                        const routesBody = {
                            origin: {
                                location: {
                                    latLng: {
                                        latitude: PIZZERIA_ADDRESS.coordinates.lat,
                                        longitude: PIZZERIA_ADDRESS.coordinates.lng
                                    }
                                }
                            },
                            destination: {
                                location: {
                                    latLng: {
                                        latitude: destinationCoords.lat,
                                        longitude: destinationCoords.lng
                                    }
                                }
                            },
                            travelMode: 'TWO_WHEELER', // Modo moto para entrega
                            routingPreference: 'TRAFFIC_UNAWARE'
                        };
                        const routesResponse = await fetch(routesUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Goog-Api-Key': GOOGLE_API_KEY,
                                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
                            },
                            body: JSON.stringify(routesBody)
                        });
                        const routesData = await routesResponse.json();
                        if (routesData.routes && routesData.routes.length > 0) {
                            const route = routesData.routes[0];
                            const distanceKm = route.distanceMeters / 1000;
                            const durationMinutes = parseInt(route.duration.replace('s', '')) / 60;
                            // Fórmula Original: ceil(distância / 3km) * R$ 9,00
                            const ranges = Math.ceil(distanceKm / DELIVERY_CONFIG.kmRange);
                            const fee = Math.max(ranges * DELIVERY_CONFIG.feePerRange, DELIVERY_CONFIG.baseFee);
                            deliveryData = {
                                distance: Math.round(distanceKm * 10) / 10,
                                deliveryFee: fee.toFixed(2),
                                estimatedTime: `${Math.max(Math.round(durationMinutes), DELIVERY_CONFIG.baseTime)} min`,
                                usedGoogleMaps: true
                            };
                            debugLog('✅ Google Maps cálculo preciso', deliveryData);
                        }
                    }
                }
            }
            catch (error) {
                debugLog('❌ Erro Google Maps, usando fallback', error);
            }
            // Fallback: usar cálculo CEP se Google Maps falhar
            if (!deliveryData) {
                debugLog('🔄 Usando fallback CEP', { cep });
                const result = calculateDeliveryFromCEP(cep);
                deliveryData = {
                    ...result,
                    usedGoogleMaps: false
                };
            }
            debugLog('💰 Cálculo de entrega finalizado', deliveryData);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(deliveryData)
            };
        }
        // Create order
        if (path === '/orders' && method === 'POST') {
            const orderData = JSON.parse(event.body || '{}');
            const order = {
                id: Date.now().toString(),
                ...orderData,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(order)
            };
        }
        // ========== DEBUG ENDPOINTS ==========
        // 🔧 DEBUG: Forçar criação de admin
        if (path === '/debug/create-admin' && method === 'POST') {
            try {
                console.log('🔧 [DEBUG] Forçando criação de admin...');
                await AdminSeeder.createInitialAdmin();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ message: 'Admin creation forced' })
                };
            }
            catch (error) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Failed to create admin', message: error instanceof Error ? error.message : 'Unknown error' })
                };
            }
        }
        // 🔧 DEBUG: Verificar se admin existe no banco
        if (path === '/debug/admin-count' && method === 'GET') {
            try {
                const admins = await storage.getAllAdminUsers();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        count: admins.length,
                        admins: admins.map(a => ({
                            id: a.id,
                            username: a.username,
                            email: a.email,
                            role: a.role,
                            isActive: a.isActive
                        }))
                    })
                };
            }
            catch (error) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Database error', message: error instanceof Error ? error.message : 'Unknown error' })
                };
            }
        }
        // ========== ADMIN ENDPOINTS ==========
        // 🔐 SECURE Admin login with JWT + HttpOnly Cookies + Rate Limiting
        if (path === '/admin/login' && method === 'POST') {
            // ⚠️ TEMPORÁRIO: Rate limiting desabilitado para debug
            // const rateLimitCheck = RateLimiter.middleware(RateLimiter.CONFIGS.LOGIN)(event);
            // if (!rateLimitCheck.allowed) {
            //   return {
            //     statusCode: 429,
            //     headers: {
            //       ...headers,
            //       'Retry-After': rateLimitCheck.error!.retryAfter.toString()
            //     },
            //     body: JSON.stringify({
            //       success: false,
            //       message: rateLimitCheck.error!.message,
            //       retryAfter: rateLimitCheck.error!.retryAfter
            //     })
            //   };
            // }
            try {
                const { username, password } = JSON.parse(event.body || '{}');
                if (!username || !password) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ success: false, message: 'Username e password são obrigatórios' })
                    };
                }
                // Buscar usuário no banco de dados
                const user = await storage.getAdminByUsername(username);
                if (!user || !user.isActive) {
                    return {
                        statusCode: 401,
                        headers,
                        body: JSON.stringify({ success: false, message: 'Credenciais inválidas' })
                    };
                }
                // Verificar senha com bcrypt
                const isValidPassword = await AuthService.verifyPassword(password, user.passwordHash);
                if (!isValidPassword) {
                    return {
                        statusCode: 401,
                        headers,
                        body: JSON.stringify({ success: false, message: 'Credenciais inválidas' })
                    };
                }
                // Atualizar último login
                await storage.updateAdminLastLogin(user.id);
                // Gerar tokens JWT simples
                const tokens = AuthService.generateTokens(user);
                console.log(`✅ [AUTH] Login successful: ${user.username} (${user.role})`);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Login realizado com sucesso',
                        token: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role
                        }
                    })
                };
            }
            catch (error) {
                console.error('❌ [AUTH] Login error:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ success: false, message: 'Erro interno do servidor' })
                };
            }
        }
        // 🔐 SECURE Admin logout with token revocation
        if (path === '/admin/logout' && method === 'POST') {
            try {
                // Simple logout - client handles token clearing
                console.log('✅ [AUTH] Logout - client clearing token');
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Logout realizado com sucesso'
                    })
                };
            }
            catch (error) {
                console.error('❌ [AUTH] Logout error:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ success: false, message: 'Erro interno' })
                };
            }
        }
        // 🔍 SECURE Admin profile check via cookies
        if ((path === '/admin/me' || path.startsWith('/admin/me')) && method === 'GET') {
            try {
                const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
                if (!authResult) {
                    return {
                        statusCode: 401,
                        headers,
                        body: JSON.stringify({ success: false, message: 'Token de acesso inválido ou ausente' })
                    };
                }
                // Buscar dados atualizados do usuário
                const user = await storage.getAdminUser(authResult.userId);
                if (!user || !user.isActive) {
                    return {
                        statusCode: 401,
                        headers,
                        body: JSON.stringify({ success: false, message: 'Usuário não encontrado ou inativo' })
                    };
                }
                console.log(`✅ [AUTH] Profile check for: ${user.username}`);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role,
                            lastLogin: user.lastLogin
                        }
                    })
                };
            }
            catch (error) {
                console.error('❌ [AUTH] Profile check error:', error);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ success: false, message: 'Erro interno' })
                };
            }
        }
        // 🔄 Token refresh no longer needed with Bearer authentication
        if (path === '/admin/refresh' && method === 'POST') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Token refresh não necessário com Bearer authentication - faça novo login se necessário'
                })
            };
        }
        // Verificar refresh token
        const decoded = AuthService.verifyRefreshToken(refreshToken);
        if (!decoded) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, message: 'Refresh token inválido' })
            };
        }
        // Buscar usuário
        const user = await storage.getAdminUser(decoded.userId);
        if (!user || !user.isActive) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, message: 'Usuário inválido' })
            };
        }
        // Rotacionar tokens (gerar novos e invalidar antigos)
        const newTokens = AuthService.rotateRefreshToken(refreshToken, user);
        if (!newTokens) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, message: 'Falha na rotação do token' })
            };
        }
        const secureCookies = AuthService.generateSecureCookies(newTokens);
        console.log('🔄 [AUTH] Tokens rotacionados para:', user.username);
        return {
            statusCode: 200,
            headers,
            multiValueHeaders: {
                'Set-Cookie': secureCookies
            },
            body: JSON.stringify({
                success: true,
                message: 'Token renovado com sucesso',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            })
        };
    }
    catch (error) {
        console.error('❌ [AUTH] Refresh error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'Erro interno' })
        };
    }
};
// 🔒 Admin - Get all flavors with Bearer token authentication
if (path === '/admin/flavors' && method === 'GET') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        const flavors = await storage.getAllFlavors();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(flavors)
        };
    }
    catch (error) {
        // READ-ONLY MODE: Return empty array instead of fallback
        debugLog(`❌ Erro ao buscar sabores admin:`, error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify([])
        };
    }
}
// 🔒 Admin - Create flavor with JWT authentication  
if (path === '/admin/flavors' && method === 'POST') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token JWT inválido ou ausente' })
        };
    }
    try {
        const flavorData = JSON.parse(event.body || '{}');
        const newFlavor = await storage.createFlavor(flavorData);
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newFlavor)
        };
    }
    catch (error) {
        console.error('Erro ao criar sabor:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno do servidor' })
        };
    }
}
// Admin - Delete flavor
if (path.startsWith('/admin/flavors/') && method === 'DELETE') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        const flavorId = path.split('/admin/flavors/')[1];
        const success = await storage.deleteFlavor(flavorId);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Sabor removido' })
        };
    }
    catch (error) {
        console.error('Erro ao deletar sabor:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno do servidor' })
        };
    }
}
// Admin - Bulk import flavors (NEW ENDPOINT)
if (path === '/admin/bulk-import-flavors' && method === 'POST') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        // Validar dados de entrada
        const requestData = JSON.parse(event.body || '{}');
        const validatedData = bulkImportFlavorsSchema.parse(requestData);
        debugLog(`🍕 Iniciando import em massa de ${validatedData.flavors.length} sabores`);
        const results = {
            success: 0,
            errors: [],
            imported: []
        };
        // Importar cada sabor
        for (const [index, flavor] of validatedData.flavors.entries()) {
            try {
                const createdFlavor = await storage.createFlavor(flavor);
                results.success++;
                results.imported.push({
                    name: createdFlavor.name,
                    id: createdFlavor.id
                });
                debugLog(`✅ Sabor importado: ${createdFlavor.name}`);
            }
            catch (error) {
                const errorMsg = `Erro no sabor ${index + 1} (${flavor.name}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
                results.errors.push(errorMsg);
                debugLog(`❌ ${errorMsg}`);
            }
        }
        debugLog(`🎉 Import concluído: ${results.success} sucessos, ${results.errors.length} erros`);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: `Import concluído: ${results.success} sabores importados`,
                results: results
            })
        };
    }
    catch (error) {
        debugLog(`❌ Erro na validação/import:`, error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Dados inválidos',
                details: error instanceof Error ? error.message : 'Erro desconhecido'
            })
        };
    }
}
// Admin - Bulk import extras (NEW ENDPOINT)
if (path === '/admin/bulk-import-extras' && method === 'POST') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        const requestData = JSON.parse(event.body || '{}');
        const validatedData = bulkImportExtrasSchema.parse(requestData);
        debugLog(`🧀 Iniciando import em massa de ${validatedData.extras.length} extras`);
        const results = {
            success: 0,
            errors: [],
            imported: []
        };
        for (const [index, extra] of validatedData.extras.entries()) {
            try {
                const createdExtra = await storage.createExtra(extra);
                results.success++;
                results.imported.push({
                    name: createdExtra.name,
                    id: createdExtra.id
                });
                debugLog(`✅ Extra importado: ${createdExtra.name}`);
            }
            catch (error) {
                const errorMsg = `Erro no extra ${index + 1} (${extra.name}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
                results.errors.push(errorMsg);
                debugLog(`❌ ${errorMsg}`);
            }
        }
        debugLog(`🎉 Import de extras concluído: ${results.success} sucessos, ${results.errors.length} erros`);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: `Import concluído: ${results.success} extras importados`,
                results: results
            })
        };
    }
    catch (error) {
        debugLog(`❌ Erro na validação/import de extras:`, error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Dados inválidos',
                details: error instanceof Error ? error.message : 'Erro desconhecido'
            })
        };
    }
}
// Admin - Bulk import dough types (NEW ENDPOINT)
if (path === '/admin/bulk-import-dough-types' && method === 'POST') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        const requestData = JSON.parse(event.body || '{}');
        const validatedData = bulkImportDoughTypesSchema.parse(requestData);
        debugLog(`🥖 Iniciando import em massa de ${validatedData.doughTypes.length} tipos de massa`);
        const results = {
            success: 0,
            errors: [],
            imported: []
        };
        for (const [index, doughType] of validatedData.doughTypes.entries()) {
            try {
                const createdDoughType = await storage.createDoughType(doughType);
                results.success++;
                results.imported.push({
                    name: createdDoughType.name,
                    id: createdDoughType.id
                });
                debugLog(`✅ Tipo de massa importado: ${createdDoughType.name}`);
            }
            catch (error) {
                const errorMsg = `Erro no tipo de massa ${index + 1} (${doughType.name}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
                results.errors.push(errorMsg);
                debugLog(`❌ ${errorMsg}`);
            }
        }
        debugLog(`🎉 Import de tipos de massa concluído: ${results.success} sucessos, ${results.errors.length} erros`);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: `Import concluído: ${results.success} tipos de massa importados`,
                results: results
            })
        };
    }
    catch (error) {
        debugLog(`❌ Erro na validação/import de tipos de massa:`, error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Dados inválidos',
                details: error instanceof Error ? error.message : 'Erro desconhecido'
            })
        };
    }
}
// Public - Get pizzeria contact (for WhatsApp integration)
if (path === '/public/contact' && method === 'GET') {
    try {
        const settings = await storage.getAllSettings();
        const contactSetting = settings.find(s => s.section === 'contact');
        if (contactSetting) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(contactSetting.data)
            };
        }
        else {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Dados de contato não configurados no banco de dados' })
            };
        }
    }
    catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro ao buscar dados de contato' })
        };
    }
}
// Public - Get basic pizzeria settings (sem autenticação)
if (path === '/public/settings' && method === 'GET') {
    try {
        const settings = await storage.getAllSettings();
        if (settings.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Configurações não encontradas no banco de dados' })
            };
        }
        // Reconstruir objeto de configurações a partir do banco
        const settingsObject = {};
        settings.forEach(setting => {
            settingsObject[setting.section] = setting.data;
        });
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(settingsObject)
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro ao buscar configurações do banco de dados' })
        };
    }
}
// Admin - Get pizzeria settings
if (path === '/admin/settings' && method === 'GET') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        const settings = await storage.getAllSettings();
        if (settings.length === 0) {
            // Migrar dados da variável global para o banco na primeira vez
            await migrateSettingsToDatabase();
            const newSettings = await storage.getAllSettings();
            // Reconstruir objeto de configurações a partir do banco
            const settingsObject = {};
            newSettings.forEach(setting => {
                settingsObject[setting.section] = setting.data;
            });
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(settingsObject)
            };
        }
        // Reconstruir objeto de configurações a partir do banco
        const settingsObject = {};
        settings.forEach(setting => {
            settingsObject[setting.section] = setting.data;
        });
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(settingsObject)
        };
    }
    catch (error) {
        console.error('Erro ao buscar configurações:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro ao buscar configurações do banco de dados' })
        };
    }
}
// Admin - Update pizzeria settings
if (path === '/admin/settings' && method === 'PUT') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        const { section, data } = JSON.parse(event.body || '{}');
        if (!section || !data) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Seção e dados são obrigatórios' })
            };
        }
        console.log(`Recebendo dados para ${section}:`, data);
        // Mapear seções do frontend para seções do banco
        let dbSection = section;
        let dbData = data;
        if (section === 'hours' && data.businessHours) {
            dbSection = 'businessHours';
            dbData = data.businessHours;
        }
        else if (section === 'contact' && data.contact) {
            dbSection = 'contact';
            dbData = data.contact;
        }
        else if (section === 'address' && data.address) {
            dbSection = 'address';
            dbData = data.address;
        }
        else if (section === 'delivery' && data.delivery) {
            dbSection = 'delivery';
            dbData = data.delivery;
        }
        else if (section === 'branding' && data.branding) {
            dbSection = 'branding';
            dbData = data.branding;
        }
        else if (section === 'social' && data.social) {
            dbSection = 'social';
            dbData = data.social;
        }
        else if (section === 'categories' && data.categories) {
            dbSection = 'categories';
            dbData = data.categories;
        }
        // Verificar se configuração já existe no banco
        const existingSetting = await storage.getSettingBySection(dbSection);
        if (existingSetting) {
            // Atualizar configuração existente
            const updatedSetting = await storage.updateSetting(dbSection, dbData);
            console.log(`Configuração ${dbSection} atualizada no banco:`, updatedSetting);
        }
        else {
            // Criar nova configuração
            const newSetting = await storage.createSetting({
                section: dbSection,
                data: dbData
            });
            console.log(`Configuração ${dbSection} criada no banco:`, newSetting);
        }
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Configurações atualizadas com sucesso no banco de dados',
                section: dbSection,
                data: dbData
            })
        };
    }
    catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Erro interno do servidor',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            })
        };
    }
}
// ========== ADMIN DOUGH TYPES ENDPOINTS ==========
// Admin - Get all dough types
if (path === '/admin/dough-types' && method === 'GET') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        const doughTypes = await storage.getAllDoughTypes();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(doughTypes)
        };
    }
    catch (error) {
        debugLog(`❌ Erro ao buscar tipos de massa do banco:`, error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro ao buscar tipos de massa' })
        };
    }
}
// Admin - Create dough type
if (path === '/admin/dough-types' && method === 'POST') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    const doughData = JSON.parse(event.body || '{}');
    const newDough = {
        id: `dough_${Date.now()}`,
        ...doughData,
        available: true,
        createdAt: new Date().toISOString()
    };
    return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newDough)
    };
}
// Admin - Update dough type
if (path.startsWith('/admin/dough-types/') && method === 'PUT') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    const doughId = path.split('/admin/dough-types/')[1];
    const updateData = JSON.parse(event.body || '{}');
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id: doughId, ...updateData })
    };
}
// Admin - Delete dough type
if (path.startsWith('/admin/dough-types/') && method === 'DELETE') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    const doughId = path.split('/admin/dough-types/')[1];
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Tipo de massa removido' })
    };
}
// ========== ADMIN EXTRA ITEMS ENDPOINTS ==========
// Admin - Get all extra items
if (path === '/admin/extras' && method === 'GET') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        const extraItems = await storage.getAllExtras();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(extraItems)
        };
    }
    catch (error) {
        debugLog(`❌ Erro ao buscar extras do banco:`, error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro ao buscar extras' })
        };
    }
}
// Admin - Create extra item
if (path === '/admin/extras' && method === 'POST') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    const extraData = JSON.parse(event.body || '{}');
    const newExtra = {
        id: `extra_${Date.now()}`,
        ...extraData,
        available: true,
        createdAt: new Date().toISOString()
    };
    return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newExtra)
    };
}
// Admin - Update extra item
if (path.startsWith('/admin/extras/') && method === 'PUT') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    const extraId = path.split('/admin/extras/')[1];
    const updateData = JSON.parse(event.body || '{}');
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ id: extraId, ...updateData })
    };
}
// Admin - Delete extra item
if (path.startsWith('/admin/extras/') && method === 'DELETE') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    const extraId = path.split('/admin/extras/')[1];
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Extra removido' })
    };
}
// Admin - Dashboard data
if (path === '/admin/dashboard' && method === 'GET') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    let dashboardData;
    try {
        const flavors = await storage.getAllFlavors();
        dashboardData = {
            todayOrders: 15,
            monthlyRevenue: 4250.00,
            totalProducts: flavors.length,
            popularFlavors: [
                { name: 'Margherita', orders: 45 },
                { name: 'Pepperoni', orders: 38 },
                { name: 'Calabresa', orders: 32 }
            ],
            recentOrders: [
                { id: '1', customer: 'João Silva', total: 'R$ 35,00', status: 'preparing' },
                { id: '2', customer: 'Maria Santos', total: 'R$ 42,00', status: 'delivered' },
                { id: '3', customer: 'Pedro Lima', total: 'R$ 28,00', status: 'confirmed' }
            ]
        };
    }
    catch (error) {
        // READ-ONLY MODE: Return minimal dashboard data when database fails
        debugLog(`❌ Erro ao buscar dados dashboard:`, error);
        dashboardData = {
            todayOrders: 0,
            monthlyRevenue: 0,
            totalProducts: 0,
            popularFlavors: [],
            recentOrders: []
        };
    }
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(dashboardData)
    };
}
// Admin - Update flavor/product
if (path.startsWith('/admin/flavors/') && method === 'PUT') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    try {
        const flavorId = path.split('/admin/flavors/')[1];
        const updateData = JSON.parse(event.body || '{}');
        const updatedFlavor = await storage.updateFlavor(flavorId, updateData);
        if (!updatedFlavor) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Sabor não encontrado' })
            };
        }
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Produto atualizado com sucesso',
                flavor: updatedFlavor
            })
        };
    }
    catch (error) {
        console.error('Erro ao atualizar sabor:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno do servidor' })
        };
    }
}
// Order image upload endpoint
if (path === '/orders/image' && method === 'POST') {
    try {
        const { dataUrl } = JSON.parse(event.body || '{}');
        if (!dataUrl?.startsWith("data:image/")) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "dataUrl inválido" })
            };
        }
        // Import cloudinary dinamicamente
        const { v2: cloudinary } = await import('cloudinary');
        // Configure cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        const ttlMs = 24 * 60 * 60 * 1000; // 24 horas em ms
        const deleteAt = new Date(Date.now() + ttlMs);
        const uploadResult = await cloudinary.uploader.upload(dataUrl, {
            folder: "pedidos",
            resource_type: "image",
            format: "jpg",
            overwrite: false,
            invalidate: false,
            context: { app: "frontend-pizzaria" },
        });
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url,
                delete_at: deleteAt.toISOString(),
            })
        };
    }
    catch (error) {
        console.error("upload image error:", error?.message || error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Falha no upload" })
        };
    }
}
// Admin - Upload image
if (path === '/admin/upload-image' && method === 'POST') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    // Simular upload de imagem (na prática, seria integrado com serviço de storage)
    const timestamp = Date.now();
    const imageUrl = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&timestamp=${timestamp}`;
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            message: 'Imagem carregada com sucesso',
            imageUrl
        })
    };
}
// Admin - Update dough type
if (path.startsWith('/admin/dough-types/') && method === 'PUT') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    const doughId = path.split('/admin/dough-types/')[1];
    const updateData = JSON.parse(event.body || '{}');
    // Atualizar tipo de massa (implementação real)
    // Em produção seria persistido no banco de dados
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            message: 'Tipo de massa atualizado com sucesso',
            id: doughId,
            ...updateData
        })
    };
}
// Admin - Update extra item
if (path.startsWith('/admin/extras/') && method === 'PUT' && !path.includes('/admin/extras')) {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    const extraId = path.split('/admin/extras/')[1];
    const updateData = JSON.parse(event.body || '{}');
    // Atualizar extra (implementação real)
    // Em produção seria persistido no banco de dados
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            message: 'Extra atualizado com sucesso',
            id: extraId,
            ...updateData
        })
    };
}
// Admin - Update credentials
if (path === '/admin/update-credentials' && method === 'PUT') {
    const authResult = await authenticateAdminViaBearerToken(event.headers.authorization);
    if (!authResult) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido ou ausente' })
        };
    }
    const { currentPassword, newUsername, newPassword } = JSON.parse(event.body || '{}');
    // Validar senha atual (simulação - aqui seria comparação com hash no banco)
    if (currentPassword !== 'pizzaria123') {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Senha atual incorreta'
            })
        };
    }
    // Validar nova senha
    if (!newPassword || newPassword.length < 6) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Nova senha deve ter pelo menos 6 caracteres'
            })
        };
    }
    // Atualizar credenciais admin (implementação real)
    // Em produção seria persistido no banco de dados
    // Por enquanto, aplicamos as mudanças na sessão ativa
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            message: 'Credenciais atualizadas com sucesso',
            user: {
                username: newUsername,
                role: 'admin'
            }
        })
    };
}
// Not found
debugLog(`❌ Endpoint não encontrado: ${method} ${path}`);
return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Endpoint not found' })
};
try { }
catch (error) {
    const duration = Date.now() - startTime;
    debugLog(`🔥 Erro interno do servidor (${duration}ms)`, error);
    return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
            error: 'Internal server error',
            message: error.message || 'Unknown error'
        })
    };
}
finally {
    const duration = Date.now() - startTime;
    debugLog(`⏱️ Request finalizada em ${duration}ms`);
}
;
