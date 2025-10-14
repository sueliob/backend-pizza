import { extras, doughTypes, pizzaFlavors, pizzeriaSettings, adminUsers, cepCache } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
// Using Web Crypto API for Cloudflare compatibility
const randomUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
export class MemStorage {
    flavors = new Map();
    orders = new Map();
    initialized = false;
    constructor() {
        // Don't initialize data in constructor for Cloudflare Workers compatibility
    }
    ensureInitialized() {
        if (!this.initialized) {
            this.initializePizzaFlavors();
            this.initialized = true;
        }
    }
    initializePizzaFlavors() {
        const defaultFlavors = [
            {
                name: "Margherita",
                description: "Molho de tomate, mussarela, manjericão fresco",
                prices: { grande: "35.00", media: "28.00", individual: "18.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: "Pepperoni",
                description: "Molho de tomate, mussarela, pepperoni",
                prices: { grande: "42.00", media: "32.00", individual: "22.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: "Chocolate com Morango",
                description: "Chocolate ao leite, morangos frescos, leite condensado",
                prices: { grande: "35.00", media: "28.00", individual: "15.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
        defaultFlavors.forEach(flavor => {
            const id = randomUUID();
            this.flavors.set(id, { id, ...flavor });
        });
    }
    async getAllFlavors() {
        this.ensureInitialized();
        return Array.from(this.flavors.values());
    }
    async getFlavorsByCategory(category) {
        this.ensureInitialized();
        return Array.from(this.flavors.values()).filter(f => f.category === category);
    }
    async getFlavor(id) {
        this.ensureInitialized();
        return this.flavors.get(id);
    }
    async updateFlavor(id, updates) {
        this.ensureInitialized();
        const existing = this.flavors.get(id);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...updates };
        this.flavors.set(id, updated);
        return updated;
    }
    async createFlavor(flavor) {
        this.ensureInitialized();
        const id = randomUUID();
        const newFlavor = {
            id,
            ...flavor,
            createdAt: new Date(),
            updatedAt: new Date(),
            available: flavor.available ?? true,
            imageUrl: flavor.imageUrl ?? null
        };
        this.flavors.set(id, newFlavor);
        return newFlavor;
    }
    async deleteFlavor(id) {
        this.ensureInitialized();
        return this.flavors.delete(id);
    }
    async createOrder(order) {
        this.ensureInitialized();
        const id = randomUUID();
        const newOrder = {
            id,
            ...order,
            createdAt: new Date().toISOString(),
            status: order.status ?? 'pending',
            address: order.address ?? null,
            deliveryFee: order.deliveryFee ?? '0',
            notes: order.notes ?? null
        };
        this.orders.set(id, newOrder);
        return newOrder;
    }
    async getOrder(id) {
        this.ensureInitialized();
        return this.orders.get(id);
    }
    async getAllOrders() {
        this.ensureInitialized();
        return Array.from(this.orders.values());
    }
    // Pizzeria Settings - Memory storage (fallback)
    async getAllSettings() {
        return [];
    }
    async getSettingBySection(section) {
        return undefined;
    }
    async createSetting(setting) {
        const newSetting = {
            id: randomUUID(),
            ...setting,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return newSetting;
    }
    async updateSetting(section, data) {
        return undefined;
    }
    async deleteSetting(section) {
        return false;
    }
    // Mock implementations for extras and dough types
    async getAllExtras() { return []; }
    async getExtrasByCategory() { return []; }
    async getExtra() { return undefined; }
    async createExtra(extra) {
        return {
            id: randomUUID(),
            ...extra,
            available: true,
            createdAt: new Date(),
            updatedAt: null,
            description: extra.description ?? null,
            price: extra.price.toString()
        };
    }
    async updateExtra() { return undefined; }
    async deleteExtra() { return true; }
    async getAllDoughTypes() { return []; }
    async getDoughTypesByCategory() { return []; }
    async getDoughType() { return undefined; }
    async createDoughType(doughType) {
        return {
            id: randomUUID(),
            ...doughType,
            available: true,
            createdAt: new Date(),
            updatedAt: null,
            description: doughType.description ?? null,
            price: doughType.price.toString()
        };
    }
    async updateDoughType() { return undefined; }
    async deleteDoughType() { return true; }
    // Admin Users - Mock implementations
    async getAllAdminUsers() { return []; }
    async getAdminUser(id) { return undefined; }
    async getAdminUserByUsername(username) { return undefined; }
    async getAdminUserByEmail(email) { return undefined; }
    async createAdminUser(user) {
        return {
            id: randomUUID(),
            ...user,
            role: user.role ?? 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: user.isActive ?? true,
            lastLogin: null
        };
    }
    async updateAdminUser(id, updates) { return undefined; }
    async deleteAdminUser(id) { return false; }
    // CEP Cache - Mock implementations
    async getCepFromCache(cep) { return undefined; }
    async setCepCache(cepData) {
        return {
            id: randomUUID(),
            ...cepData,
            address: cepData.address ?? null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    async updateCepCache(cep, updates) { return undefined; }
}
// DatabaseStorage class with real database operations
export class DatabaseStorage {
    // Pizza flavors - AGORA usando PostgreSQL real
    async getAllFlavors() {
        try {
            console.log('🔍 [DatabaseStorage] Getting all flavors...');
            // FIX: Select específico para evitar problema de schema
            const result = await db.select({
                id: pizzaFlavors.id,
                name: pizzaFlavors.name,
                description: pizzaFlavors.description,
                prices: pizzaFlavors.prices,
                category: pizzaFlavors.category,
                imageUrl: pizzaFlavors.imageUrl,
                available: pizzaFlavors.available
            }).from(pizzaFlavors);
            console.log(`📊 [DatabaseStorage] Found ${result.length} total flavors (specific select)`);
            // Retornar apenas available !== false
            const filtered = result.filter(f => f.available !== false);
            console.log(`📊 [DatabaseStorage] After filter: ${filtered.length} flavors`);
            return filtered;
        }
        catch (error) {
            console.error('❌ [DatabaseStorage] Database error:', error);
            throw error;
        }
    }
    async getFlavorsByCategory(category) {
        try {
            console.log(`🔍 [DatabaseStorage] Searching category: ${category}`);
            // FIX: Select específico para evitar problema de schema
            const result = await db.select({
                id: pizzaFlavors.id,
                name: pizzaFlavors.name,
                description: pizzaFlavors.description,
                prices: pizzaFlavors.prices,
                category: pizzaFlavors.category,
                imageUrl: pizzaFlavors.imageUrl,
                available: pizzaFlavors.available
            }).from(pizzaFlavors)
                .where(eq(pizzaFlavors.category, category));
            console.log(`📊 [DatabaseStorage] Found ${result.length} flavors for category: ${category} (specific select)`);
            // Retornar apenas available !== false
            const filtered = result.filter(f => f.available !== false);
            console.log(`📊 [DatabaseStorage] After filter: ${filtered.length} flavors for ${category}`);
            return filtered;
        }
        catch (error) {
            console.error('❌ [DatabaseStorage] Database error:', error);
            throw error;
        }
    }
    async getFlavor(id) {
        try {
            const [flavor] = await db.select({
                id: pizzaFlavors.id,
                name: pizzaFlavors.name,
                description: pizzaFlavors.description,
                prices: pizzaFlavors.prices,
                category: pizzaFlavors.category,
                imageUrl: pizzaFlavors.imageUrl,
                available: pizzaFlavors.available
            }).from(pizzaFlavors).where(eq(pizzaFlavors.id, id));
            return flavor;
        }
        catch (error) {
            console.error('Database error:', error);
            return undefined;
        }
    }
    async updateFlavor(id, updates) {
        try {
            const [updatedFlavor] = await db.update(pizzaFlavors)
                .set({ ...updates })
                .where(eq(pizzaFlavors.id, id))
                .returning();
            return updatedFlavor;
        }
        catch (error) {
            console.error('Database error, using fallback:', error);
            const memStorage = new MemStorage();
            return memStorage.updateFlavor(id, updates);
        }
    }
    async createFlavor(flavor) {
        try {
            const [newFlavor] = await db.insert(pizzaFlavors)
                .values({ ...flavor, id: randomUUID(), available: true })
                .returning();
            return newFlavor;
        }
        catch (error) {
            console.error('Database error, using fallback:', error);
            const memStorage = new MemStorage();
            return memStorage.createFlavor(flavor);
        }
    }
    async deleteFlavor(id) {
        try {
            const result = await db.update(pizzaFlavors)
                .set({ available: false })
                .where(eq(pizzaFlavors.id, id));
            return true;
        }
        catch (error) {
            console.error('Database error, using fallback:', error);
            const memStorage = new MemStorage();
            return memStorage.deleteFlavor(id);
        }
    }
    // Extras - Real database operations
    async getAllExtras() {
        return await db.select().from(extras);
    }
    async getExtrasByCategory(category) {
        return await db.select().from(extras).where(eq(extras.category, category));
    }
    async getExtra(id) {
        const result = await db.select().from(extras).where(eq(extras.id, id));
        return result[0];
    }
    async createExtra(extra) {
        const result = await db.insert(extras).values(extra).returning();
        return result[0];
    }
    async updateExtra(id, updates) {
        const result = await db.update(extras).set(updates).where(eq(extras.id, id)).returning();
        return result[0];
    }
    async deleteExtra(id) {
        const result = await db.delete(extras).where(eq(extras.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // Dough types - Real database operations
    async getAllDoughTypes() {
        return await db.select().from(doughTypes);
    }
    async getDoughTypesByCategory(category) {
        return await db.select().from(doughTypes).where(eq(doughTypes.category, category));
    }
    async getDoughType(id) {
        const result = await db.select().from(doughTypes).where(eq(doughTypes.id, id));
        return result[0];
    }
    async createDoughType(doughType) {
        const result = await db.insert(doughTypes).values(doughType).returning();
        return result[0];
    }
    async updateDoughType(id, updates) {
        const result = await db.update(doughTypes).set(updates).where(eq(doughTypes.id, id)).returning();
        return result[0];
    }
    async deleteDoughType(id) {
        const result = await db.delete(doughTypes).where(eq(doughTypes.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // Orders - keep using MemStorage for compatibility
    async createOrder(order) {
        const memStorage = new MemStorage();
        return memStorage.createOrder(order);
    }
    async getOrder(id) {
        const memStorage = new MemStorage();
        return memStorage.getOrder(id);
    }
    async getAllOrders() {
        const memStorage = new MemStorage();
        return memStorage.getAllOrders();
    }
    // Pizzeria Settings - Database operations
    async getAllSettings() {
        try {
            const settings = await db.select().from(pizzeriaSettings);
            return settings;
        }
        catch (error) {
            console.error('Database error getting settings:', error);
            return [];
        }
    }
    async getSettingBySection(section) {
        try {
            const [setting] = await db.select().from(pizzeriaSettings).where(eq(pizzeriaSettings.section, section));
            return setting || undefined;
        }
        catch (error) {
            console.error('Database error getting setting by section:', error);
            return undefined;
        }
    }
    async createSetting(setting) {
        try {
            const [newSetting] = await db.insert(pizzeriaSettings)
                .values({ ...setting, id: randomUUID() })
                .returning();
            return newSetting;
        }
        catch (error) {
            console.error('Database error creating setting:', error);
            throw error;
        }
    }
    async updateSetting(section, data) {
        try {
            const [updatedSetting] = await db.update(pizzeriaSettings)
                .set({ data })
                .where(eq(pizzeriaSettings.section, section))
                .returning();
            return updatedSetting;
        }
        catch (error) {
            console.error('Database error updating setting:', error);
            return undefined;
        }
    }
    async deleteSetting(section) {
        try {
            await db.delete(pizzeriaSettings).where(eq(pizzeriaSettings.section, section));
            return true;
        }
        catch (error) {
            console.error('Database error deleting setting:', error);
            return false;
        }
    }
    // 🔐 Admin Users - Database operations for authentication
    async getAllAdminUsers() {
        try {
            return await db.select().from(adminUsers);
        }
        catch (error) {
            console.error('Database error getting admin users:', error);
            return [];
        }
    }
    async getAdminUser(id) {
        try {
            const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
            return user || undefined;
        }
        catch (error) {
            console.error('Database error getting admin user by id:', error);
            return undefined;
        }
    }
    async getAdminUserByUsername(username) {
        try {
            const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
            return user || undefined;
        }
        catch (error) {
            console.error('Database error getting admin user by username:', error);
            return undefined;
        }
    }
    // Alias para compatibilidade com AuthService
    async getAdminByUsername(username) {
        return this.getAdminUserByUsername(username);
    }
    async getAdminUserByEmail(email) {
        try {
            const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
            return user || undefined;
        }
        catch (error) {
            console.error('Database error getting admin user by email:', error);
            return undefined;
        }
    }
    async createAdminUser(user) {
        try {
            const [newUser] = await db.insert(adminUsers)
                .values({ ...user, id: randomUUID() })
                .returning();
            return newUser;
        }
        catch (error) {
            console.error('Database error creating admin user:', error);
            throw error;
        }
    }
    async updateAdminUser(id, updates) {
        try {
            const [updatedUser] = await db.update(adminUsers)
                .set({ ...updates, updatedAt: new Date() })
                .where(eq(adminUsers.id, id))
                .returning();
            return updatedUser;
        }
        catch (error) {
            console.error('Database error updating admin user:', error);
            return undefined;
        }
    }
    // Método específico para atualizar último login
    async updateAdminLastLogin(id) {
        try {
            const [updatedUser] = await db.update(adminUsers)
                .set({ lastLogin: new Date(), updatedAt: new Date() })
                .where(eq(adminUsers.id, id))
                .returning();
            return updatedUser;
        }
        catch (error) {
            console.error('Database error updating admin last login:', error);
            return undefined;
        }
    }
    async deleteAdminUser(id) {
        try {
            const result = await db.delete(adminUsers).where(eq(adminUsers.id, id));
            return (result.rowCount ?? 0) > 0;
        }
        catch (error) {
            console.error('Database error deleting admin user:', error);
            return false;
        }
    }
    // 🗺️ CEP Cache - Database operations for delivery optimization
    async getCepFromCache(cep) {
        try {
            const [cached] = await db.select().from(cepCache).where(eq(cepCache.cep, cep));
            return cached || undefined;
        }
        catch (error) {
            console.error('Database error getting CEP from cache:', error);
            return undefined;
        }
    }
    async setCepCache(cepData) {
        try {
            const [newCache] = await db.insert(cepCache)
                .values({ ...cepData, id: randomUUID() })
                .returning();
            return newCache;
        }
        catch (error) {
            console.error('Database error setting CEP cache:', error);
            throw error;
        }
    }
    async updateCepCache(cep, updates) {
        try {
            const [updated] = await db.update(cepCache)
                .set({ ...updates, updatedAt: new Date() })
                .where(eq(cepCache.cep, cep))
                .returning();
            return updated;
        }
        catch (error) {
            console.error('Database error updating CEP cache:', error);
            return undefined;
        }
    }
}
export const storage = new DatabaseStorage();
