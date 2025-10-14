import express from "express";
import { setupVite, serveStatic, log } from "./vite";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            log(logLine);
        }
    });
    next();
});
(async () => {
    // Direct Express API routes without Hono
    // Mount API routes directly to Express
    const { storage: memStorage } = await import("./storage");
    const { insertOrderSchema } = await import("@shared/schema");
    const { calculateDeliveryFee } = await import("./lib/distance-calculator");
    // Get all pizza flavors
    app.get('/api/flavors', async (req, res) => {
        try {
            const flavors = await memStorage.getAllFlavors();
            res.json(flavors);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch flavors' });
        }
    });
    // Get flavors by category
    app.get('/api/flavors/:category', async (req, res) => {
        try {
            const { category } = req.params;
            const flavors = await memStorage.getFlavorsByCategory(category);
            res.json(flavors);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch flavors' });
        }
    });
    // Get all extras (public route)
    app.get('/api/extras', async (req, res) => {
        try {
            const extras = await memStorage.getAllExtras();
            res.json(extras);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch extras' });
        }
    });
    // Get all dough types (public route)
    app.get('/api/dough-types', async (req, res) => {
        try {
            const doughTypes = await memStorage.getAllDoughTypes();
            res.json(doughTypes);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch dough types' });
        }
    });
    // Create order
    app.post('/api/orders', async (req, res) => {
        try {
            const orderData = insertOrderSchema.parse(req.body);
            const order = await memStorage.createOrder(orderData);
            res.status(201).json(order);
        }
        catch (error) {
            res.status(400).json({
                message: 'Invalid order data',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Get order by ID  
    app.get('/api/orders/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const order = await memStorage.getOrder(id);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json(order);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch order' });
        }
    });
    // Admin login endpoint
    app.post('/admin/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            // Simple authentication (same as production)
            const validCredentials = [
                { username: 'admin', password: 'pizzaria123' },
                { username: 'manager', password: 'manager123' }
            ];
            const user = validCredentials.find(u => u.username === username && u.password === password);
            if (user) {
                // Generate simple token (same as production)
                const token = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                res.json({
                    success: true,
                    token,
                    user: { username: user.username, role: 'admin' }
                });
            }
            else {
                res.status(401).json({ success: false, message: 'Credenciais inválidas' });
            }
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    });
    // Admin routes for flavor management
    app.get('/admin/flavors', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const flavors = await memStorage.getAllFlavors();
            res.json(flavors);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch flavors' });
        }
    });
    app.put('/admin/flavors/:id', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { id } = req.params;
            const updates = req.body;
            const updatedFlavor = await memStorage.updateFlavor(id, updates);
            if (!updatedFlavor) {
                return res.status(404).json({ success: false, message: 'Produto não encontrado' });
            }
            res.json({
                success: true,
                message: 'Produto atualizado com sucesso',
                ...updatedFlavor
            });
        }
        catch (error) {
            console.error('Error updating flavor:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    });
    app.post('/admin/flavors', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const flavorData = req.body;
            const newFlavor = await memStorage.createFlavor(flavorData);
            res.status(201).json({
                success: true,
                message: 'Produto criado com sucesso',
                ...newFlavor
            });
        }
        catch (error) {
            console.error('Error creating flavor:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    });
    app.delete('/admin/flavors/:id', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { id } = req.params;
            const deleted = await memStorage.deleteFlavor(id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Produto não encontrado' });
            }
            res.json({
                success: true,
                message: 'Produto removido com sucesso'
            });
        }
        catch (error) {
            console.error('Error deleting flavor:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    });
    // CEP lookup endpoint
    app.get('/api/cep/:cep', async (req, res) => {
        try {
            const { cep } = req.params;
            const cleanCep = cep.replace(/\D/g, '');
            if (cleanCep.length !== 8) {
                return res.status(400).json({ message: 'CEP inválido' });
            }
            // Fetch real address data from ViaCEP API
            let addressData;
            try {
                const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const viaCepData = await viaCepResponse.json();
                if (viaCepData.erro) {
                    return res.status(404).json({ message: 'CEP não encontrado' });
                }
                addressData = {
                    street: viaCepData.logradouro || '',
                    neighborhood: viaCepData.bairro || '',
                    city: viaCepData.localidade || '',
                    state: viaCepData.uf || ''
                };
            }
            catch (viaCepError) {
                // Fallback to mock data if ViaCEP is unavailable
                addressData = {
                    street: 'Rua das Flores',
                    neighborhood: 'Centro',
                    city: 'São Paulo',
                    state: 'SP'
                };
            }
            // Try to calculate delivery using Google Maps API first
            let deliveryData;
            try {
                const { getCoordinatesFromAddress, calculateRoute } = await import("./lib/google-maps-service");
                const { PIZZERIA_ADDRESS, DELIVERY_CONFIG } = await import("@shared/constants");
                const fullAddress = `${addressData.street}, ${addressData.neighborhood}, ${addressData.city} - ${addressData.state}, ${cleanCep}`;
                console.log('🗺️ Usando Google Maps API para:', fullAddress);
                const destinationCoords = await getCoordinatesFromAddress(fullAddress, process.env.GOOGLE_MAPS_API_KEY);
                console.log('📍 Coordenadas obtidas:', destinationCoords);
                if (destinationCoords) {
                    const pizzeriaCoords = {
                        lat: PIZZERIA_ADDRESS.coordinates.lat,
                        lng: PIZZERIA_ADDRESS.coordinates.lng
                    };
                    const routeInfo = await calculateRoute(pizzeriaCoords, destinationCoords, process.env.GOOGLE_MAPS_API_KEY);
                    console.log('🛣️ Rota calculada:', routeInfo);
                    if (routeInfo) {
                        // Calculate delivery fee based on actual distance
                        const distanceKm = routeInfo.distance / 1000;
                        const deliveryTimeMinutes = Math.ceil(routeInfo.duration / 60);
                        // Calculate fee using range-based pricing: ceil(distance / 3km) * R$ 9,00
                        const ranges = Math.ceil(distanceKm / DELIVERY_CONFIG.kmRange);
                        const fee = Math.max(ranges * DELIVERY_CONFIG.feePerRange, DELIVERY_CONFIG.baseFee);
                        deliveryData = {
                            deliveryFee: fee,
                            estimatedTime: `${Math.max(deliveryTimeMinutes, DELIVERY_CONFIG.baseTime)} min`,
                            distance: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
                            usedGoogleMaps: true
                        };
                        console.log('✅ Usando dados reais do Google Maps:', deliveryData);
                    }
                }
            }
            catch (error) {
                console.error('❌ Erro ao usar Google Maps API:', error);
            }
            // Fallback to CEP-based calculation if Google API fails
            if (!deliveryData) {
                console.log('🔄 Usando fallback CEP para:', cleanCep);
                const fallbackResult = calculateDeliveryFee(cleanCep);
                deliveryData = {
                    deliveryFee: parseFloat(fallbackResult.deliveryFee),
                    estimatedTime: fallbackResult.estimatedTime,
                    distance: fallbackResult.distance,
                    usedGoogleMaps: false
                };
            }
            const responseData = {
                cep: cleanCep,
                street: addressData.street,
                neighborhood: addressData.neighborhood,
                city: addressData.city,
                state: addressData.state,
                deliveryFee: deliveryData.deliveryFee,
                estimatedTime: deliveryData.estimatedTime,
                distance: deliveryData.distance,
                usedGoogleMaps: deliveryData.usedGoogleMaps || false
            };
            res.json(responseData);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao consultar CEP' });
        }
    });
    // Admin extras routes
    app.get('/admin/extras', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { storage } = await import('./storage.js');
            const extras = await storage.getAllExtras();
            res.json(extras);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch extras' });
        }
    });
    app.post('/admin/extras', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { storage } = await import('./storage.js');
            const extraData = req.body;
            const newExtra = await storage.createExtra(extraData);
            res.status(201).json(newExtra);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to create extra' });
        }
    });
    app.put('/admin/extras/:id', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { storage } = await import('./storage.js');
            const { id } = req.params;
            const updates = req.body;
            const updatedExtra = await storage.updateExtra(id, updates);
            res.json(updatedExtra);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to update extra' });
        }
    });
    app.delete('/admin/extras/:id', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { storage } = await import('./storage.js');
            const { id } = req.params;
            const deleted = await storage.deleteExtra(id);
            res.json({ success: deleted, message: deleted ? 'Extra removido' : 'Extra não encontrado' });
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to delete extra' });
        }
    });
    // Admin dough-types routes
    app.get('/admin/dough-types', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { storage } = await import('./storage.js');
            const doughTypes = await storage.getAllDoughTypes();
            res.json(doughTypes);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch dough types' });
        }
    });
    app.post('/admin/dough-types', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { storage } = await import('./storage.js');
            const doughData = req.body;
            const newDough = await storage.createDoughType(doughData);
            res.status(201).json(newDough);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to create dough type' });
        }
    });
    app.put('/admin/dough-types/:id', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { storage } = await import('./storage.js');
            const { id } = req.params;
            const updates = req.body;
            const updatedDough = await storage.updateDoughType(id, updates);
            res.json(updatedDough);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to update dough type' });
        }
    });
    app.delete('/admin/dough-types/:id', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const { storage } = await import('./storage.js');
            const { id } = req.params;
            const deleted = await storage.deleteDoughType(id);
            res.json({ success: deleted, message: deleted ? 'Massa removida' : 'Massa não encontrada' });
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to delete dough type' });
        }
    });
    // Admin settings route  
    app.get('/admin/settings', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            res.status(500).json({
                error: 'Este endpoint não é mais usado no projeto cloud. Use as APIs do Netlify Functions.'
            });
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch settings' });
        }
    });
    app.put('/admin/settings', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token || !token.startsWith('admin_')) {
                return res.status(401).json({ error: 'Token inválido' });
            }
            const updates = req.body;
            res.json({ success: true, message: 'Configurações atualizadas', ...updates });
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to update settings' });
        }
    });
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
        const { createServer } = await import("http");
        const server = createServer(app);
        await setupVite(app, server);
    }
    else {
        serveStatic(app);
    }
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    app.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port}`);
    });
})();
