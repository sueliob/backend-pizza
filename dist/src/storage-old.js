import { extras, doughTypes } from "@shared/schema";
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
            },
            {
                name: "Pepperoni",
                description: "Molho de tomate, mussarela, pepperoni",
                prices: { grande: "42.00", media: "32.00", individual: "22.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Quatro Queijos",
                description: "Mussarela, gorgonzola, parmesão, catupiry",
                prices: { grande: "48.00", media: "38.00", individual: "25.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Frango com Catupiry",
                description: "Frango desfiado, catupiry, milho, azeitona",
                prices: { grande: "45.00", media: "35.00", individual: "23.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1598023696416-0193a0bcd302?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Calabresa",
                description: "Molho de tomate, mussarela, calabresa, cebola",
                prices: { grande: "38.00", media: "30.00", individual: "20.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Portuguesa",
                description: "Molho de tomate, mussarela, presunto, ovos, cebola, azeitona",
                prices: { grande: "46.00", media: "36.00", individual: "24.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Vegetariana",
                description: "Molho de tomate, mussarela, tomate, pimentão, cebola, azeitona",
                prices: { grande: "40.00", media: "32.00", individual: "21.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Bacon",
                description: "Molho de tomate, mussarela, bacon, cebola",
                prices: { grande: "44.00", media: "34.00", individual: "22.50" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            // Pizzas Doces
            {
                name: "Chocolate com Morango",
                description: "Chocolate ao leite, morangos frescos, leite condensado",
                prices: { grande: "35.00", media: "28.00", individual: "15.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Banana com Canela",
                description: "Banana fatiada, canela, açúcar mascavo, leite condensado",
                prices: { grande: "32.00", media: "25.00", individual: "12.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Romeu e Julieta",
                description: "Queijo minas, goiabada, canela",
                prices: { grande: "33.00", media: "26.00", individual: "14.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Brigadeiro",
                description: "Chocolate, granulado, leite condensado",
                prices: { grande: "30.00", media: "24.00", individual: "13.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Prestígio",
                description: "Chocolate branco, coco ralado",
                prices: { grande: "34.00", media: "27.00", individual: "16.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            // Bebidas - Para bebidas usamos apenas um preço fixo 
            {
                name: "Coca-Cola 350ml",
                description: "Refrigerante Coca-Cola lata 350ml",
                prices: { individual: "4.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Coca-Cola 2L",
                description: "Refrigerante Coca-Cola garrafa 2 litros",
                prices: { individual: "9.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Guaraná 350ml",
                description: "Refrigerante Guaraná lata 350ml",
                prices: { individual: "4.00" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Guaraná 2L",
                description: "Refrigerante Guaraná garrafa 2 litros",
                prices: { individual: "8.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Suco de Laranja 300ml",
                description: "Suco natural de laranja 300ml",
                prices: { individual: "5.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Água Mineral 500ml",
                description: "Água mineral sem gás 500ml",
                prices: { individual: "3.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Suco de Uva 300ml",
                description: "Suco natural de uva 300ml",
                prices: { individual: "5.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1576087637575-e1a1e0b12cac?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Água de Coco 330ml",
                description: "Água de coco natural 330ml",
                prices: { individual: "6.00" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1593560704563-f176a2eb61db?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            // Entradas - Para entradas usamos apenas um preço fixo
            {
                name: "Pão de Calabresa",
                description: "Deliciosos pães de calabresa assados no forno",
                prices: { individual: "15.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Lascas de Massa",
                description: "Crocantes lascas de massa temperadas",
                prices: { individual: "12.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Bruschetta",
                description: "Pão italiano com tomate, manjericão e azeite",
                prices: { individual: "18.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1572441713132-51c75654db73?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Batata Frita",
                description: "Porção de batata frita crocante",
                prices: { individual: "14.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1518013431109-e6a4ddc45f85?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Polenta Frita",
                description: "Porção de polenta frita dourada",
                prices: { individual: "16.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1592238950896-ae6877736fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Bolinhos de Queijo",
                description: "Bolinhos de queijo empanados e fritos",
                prices: { individual: "17.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1621510456681-2330135e5871?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
        ];
        defaultFlavors.forEach(flavor => {
            const id = randomUUID();
            this.flavors.set(id, { ...flavor, id });
        });
    }
    async getAllFlavors() {
        this.ensureInitialized();
        return Array.from(this.flavors.values()).filter(flavor => flavor.available);
    }
    async getFlavorsByCategory(category) {
        this.ensureInitialized();
        return Array.from(this.flavors.values()).filter(flavor => flavor.category === category && flavor.available);
    }
    async getFlavor(id) {
        this.ensureInitialized();
        return this.flavors.get(id);
    }
    async updateFlavor(id, updates) {
        this.ensureInitialized();
        const existingFlavor = this.flavors.get(id);
        if (!existingFlavor) {
            return undefined;
        }
        const updatedFlavor = { ...existingFlavor, ...updates, id };
        this.flavors.set(id, updatedFlavor);
        return updatedFlavor;
    }
    async createFlavor(flavor) {
        this.ensureInitialized();
        const id = randomUUID();
        const newFlavor = {
            id,
            ...flavor,
            available: flavor.available ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.flavors.set(id, newFlavor);
        return newFlavor;
    }
    async deleteFlavor(id) {
        this.ensureInitialized();
        return this.flavors.delete(id);
    }
    async createOrder(insertOrder) {
        this.ensureInitialized();
        const id = randomUUID();
        const order = {
            ...insertOrder,
            id,
            status: insertOrder.status || "pending",
            notes: insertOrder.notes || null,
            address: insertOrder.address || null,
            deliveryFee: insertOrder.deliveryFee || null,
            createdAt: new Date().toISOString(),
        };
        this.orders.set(id, order);
        return order;
    }
    async getOrder(id) {
        this.ensureInitialized();
        return this.orders.get(id);
    }
    async getAllOrders() {
        this.ensureInitialized();
        return Array.from(this.orders.values());
    }
    // Extras - Mock implementations for compatibility
    async getAllExtras() {
        return [];
    }
    async getExtrasByCategory(category) {
        return [];
    }
    async getExtra(id) {
        return undefined;
    }
    async createExtra(extra) {
        const newExtra = {
            id: randomUUID(),
            ...extra,
            available: true,
            createdAt: new Date()
        };
        return newExtra;
    }
    async updateExtra(id, updates) {
        return undefined;
    }
    async deleteExtra(id) {
        return true;
    }
    // Dough types - Mock implementations for compatibility
    async getAllDoughTypes() {
        return [];
    }
    async getDoughTypesByCategory(category) {
        return [];
    }
    async getDoughType(id) {
        return undefined;
    }
    async createDoughType(doughType) {
        const newDoughType = {
            id: randomUUID(),
            ...doughType,
            available: true,
            createdAt: new Date()
        };
        return newDoughType;
    }
    async updateDoughType(id, updates) {
        return undefined;
    }
    async deleteDoughType(id) {
        return true;
    }
}
// DatabaseStorage class with real database operations
export class DatabaseStorage {
    // Pizza flavors
    async getAllFlavors() {
        // Use MemStorage for now for flavors
        const memStorage = new MemStorage();
        return memStorage.getAllFlavors();
    }
    async getFlavorsByCategory(category) {
        const memStorage = new MemStorage();
        return memStorage.getFlavorsByCategory(category);
    }
    async getFlavor(id) {
        const memStorage = new MemStorage();
        return memStorage.getFlavor(id);
    }
    async updateFlavor(id, updates) {
        const memStorage = new MemStorage();
        return memStorage.updateFlavor(id, updates);
    }
    async createFlavor(flavor) {
        const memStorage = new MemStorage();
        return memStorage.createFlavor(flavor);
    }
    async deleteFlavor(id) {
        const memStorage = new MemStorage();
        return memStorage.deleteFlavor(id);
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
        return result.rowCount > 0;
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
        return result.rowCount > 0;
    }
    // Orders
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
}
import { pizzaFlavors, orders } from "@shared/schema";
export class DatabaseStorage {
    constructor() {
        // Initialize default flavors if the database is empty
        this.initializeDatabase();
    }
    async initializeDatabase() {
        try {
            // Check if flavors exist in database
            const existingFlavors = await db.select().from(pizzaFlavors).limit(1);
            if (existingFlavors.length === 0) {
                // Initialize with default flavors
                await this.seedDefaultFlavors();
            }
        }
        catch (error) {
            console.error("Error initializing database:", error);
        }
    }
    async seedDefaultFlavors() {
        const defaultFlavors = [
            {
                name: "Margherita",
                description: "Molho de tomate, mussarela, manjericão fresco",
                prices: { grande: "35.00", media: "28.00", individual: "18.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Pepperoni",
                description: "Molho de tomate, mussarela, pepperoni",
                prices: { grande: "42.00", media: "32.00", individual: "22.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Quatro Queijos",
                description: "Mussarela, gorgonzola, parmesão, catupiry",
                prices: { grande: "48.00", media: "38.00", individual: "25.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Frango com Catupiry",
                description: "Frango desfiado, catupiry, milho, azeitona",
                prices: { grande: "45.00", media: "35.00", individual: "23.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1598023696416-0193a0bcd302?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Calabresa",
                description: "Molho de tomate, mussarela, calabresa, cebola",
                prices: { grande: "38.00", media: "30.00", individual: "20.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Portuguesa",
                description: "Molho de tomate, mussarela, presunto, ovos, cebola, azeitona",
                prices: { grande: "46.00", media: "36.00", individual: "24.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Vegetariana",
                description: "Molho de tomate, mussarela, tomate, pimentão, cebola, azeitona",
                prices: { grande: "40.00", media: "32.00", individual: "21.00" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Bacon",
                description: "Molho de tomate, mussarela, bacon, cebola",
                prices: { grande: "44.00", media: "34.00", individual: "22.50" },
                category: "salgadas",
                imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            // Pizzas Doces
            {
                name: "Chocolate com Morango",
                description: "Chocolate ao leite, morangos frescos, leite condensado",
                prices: { grande: "35.00", media: "28.00", individual: "15.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Banana com Canela",
                description: "Banana fatiada, canela, açúcar mascavo, leite condensado",
                prices: { grande: "32.00", media: "25.00", individual: "12.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Romeu e Julieta",
                description: "Queijo minas, goiabada, canela",
                prices: { grande: "33.00", media: "26.00", individual: "14.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Brigadeiro",
                description: "Chocolate, granulado, leite condensado",
                prices: { grande: "30.00", media: "24.00", individual: "13.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Prestígio",
                description: "Chocolate branco, coco ralado",
                prices: { grande: "34.00", media: "27.00", individual: "16.00" },
                category: "doces",
                imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            // Bebidas
            {
                name: "Coca-Cola 350ml",
                description: "Refrigerante Coca-Cola lata 350ml",
                prices: { individual: "4.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Coca-Cola 2L",
                description: "Refrigerante Coca-Cola garrafa 2 litros",
                prices: { individual: "9.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Guaraná 350ml",
                description: "Refrigerante Guaraná lata 350ml",
                prices: { individual: "4.00" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Guaraná 2L",
                description: "Refrigerante Guaraná garrafa 2 litros",
                prices: { individual: "8.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Suco de Laranja 300ml",
                description: "Suco natural de laranja 300ml",
                prices: { individual: "5.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Água Mineral 500ml",
                description: "Água mineral sem gás 500ml",
                prices: { individual: "3.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Suco de Uva 300ml",
                description: "Suco natural de uva 300ml",
                prices: { individual: "5.50" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1576087637575-e1a1e0b12cac?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Água de Coco 330ml",
                description: "Água de coco natural 330ml",
                prices: { individual: "6.00" },
                category: "bebidas",
                imageUrl: "https://images.unsplash.com/photo-1593560704563-f176a2eb61db?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            // Entradas
            {
                name: "Pão de Calabresa",
                description: "Deliciosos pães de calabresa assados no forno",
                prices: { individual: "15.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Lascas de Massa",
                description: "Crocantes lascas de massa temperadas",
                prices: { individual: "12.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Bruschetta",
                description: "Pão italiano com tomate, manjericão e azeite",
                prices: { individual: "18.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1572441713132-51c75654db73?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Batata Frita",
                description: "Porção de batata frita crocante",
                prices: { individual: "14.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1518013431109-e6a4ddc45f85?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Polenta Frita",
                description: "Porção de polenta frita dourada",
                prices: { individual: "16.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1592238950896-ae6877736fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
            {
                name: "Bolinhos de Queijo",
                description: "Bolinhos de queijo empanados e fritos",
                prices: { individual: "17.00" },
                category: "entradas",
                imageUrl: "https://images.unsplash.com/photo-1621510456681-2330135e5871?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
                available: true,
            },
        ];
        try {
            await db.insert(pizzaFlavors).values(defaultFlavors);
            console.log("Database seeded with default flavors");
        }
        catch (error) {
            console.error("Error seeding database:", error);
        }
    }
    async getAllFlavors() {
        const flavors = await db.select().from(pizzaFlavors).where(eq(pizzaFlavors.available, true));
        return flavors;
    }
    async getFlavorsByCategory(category) {
        const flavors = await db.select()
            .from(pizzaFlavors)
            .where(eq(pizzaFlavors.category, category))
            .where(eq(pizzaFlavors.available, true));
        return flavors;
    }
    async getFlavor(id) {
        const [flavor] = await db.select().from(pizzaFlavors).where(eq(pizzaFlavors.id, id));
        return flavor;
    }
    async createOrder(insertOrder) {
        const [order] = await db.insert(orders).values(insertOrder).returning();
        return order;
    }
    async getOrder(id) {
        const [order] = await db.select().from(orders).where(eq(orders.id, id));
        return order;
    }
    async getAllOrders() {
        const allOrders = await db.select().from(orders);
        return allOrders;
    }
}
export const storage = new DatabaseStorage();
