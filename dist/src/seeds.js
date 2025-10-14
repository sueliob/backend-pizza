import { db } from './db';
import { pizzaFlavors } from '@shared/schema';
// Deterministic seed data for consistent database initialization
export const SEED_DATA = {
    // Pizza Flavors - Complete standardized set
    flavors: [
        // Salgadas - Pizzas grandes
        {
            name: 'Margherita Clássica',
            description: 'Molho de tomate, mozzarella, manjericão fresco e azeite',
            prices: {
                grande: '45.90',
                media: '35.90',
                individual: '25.90'
            },
            category: 'salgadas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400'
        },
        {
            name: 'Pepperoni Premium',
            description: 'Molho de tomate, mozzarella, pepperoni artesanal',
            prices: {
                grande: '52.90',
                media: '42.90',
                individual: '32.90'
            },
            category: 'salgadas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400'
        },
        {
            name: 'Quattro Formaggi',
            description: 'Mozzarella, gorgonzola, parmesão, provolone',
            prices: {
                grande: '58.90',
                media: '48.90',
                individual: '38.90'
            },
            category: 'salgadas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400'
        },
        {
            name: 'Portuguesa Tradicional',
            description: 'Presunto, ovos, cebola, ervilha, mozzarella',
            prices: {
                grande: '49.90',
                media: '39.90',
                individual: '29.90'
            },
            category: 'salgadas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
        },
        {
            name: 'Frango com Catupiry',
            description: 'Frango desfiado, catupiry, mozzarella',
            prices: {
                grande: '47.90',
                media: '37.90',
                individual: '27.90'
            },
            category: 'salgadas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400'
        },
        {
            name: 'Calabresa Especial',
            description: 'Calabresa, cebola, mozzarella, orégano',
            prices: {
                grande: '44.90',
                media: '34.90',
                individual: '24.90'
            },
            category: 'salgadas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400'
        },
        // Pizzas Doces
        {
            name: 'Chocolate com Morango',
            description: 'Chocolate cremoso com morangos frescos',
            prices: {
                grande: '42.90',
                media: '32.90',
                individual: '22.90'
            },
            category: 'doces',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400'
        },
        {
            name: 'Banana com Canela',
            description: 'Banana, açúcar, canela e leite condensado',
            prices: {
                grande: '38.90',
                media: '28.90',
                individual: '18.90'
            },
            category: 'doces',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400'
        },
        // Entradas
        {
            name: 'Bruschetta Tradicional',
            description: 'Pão artesanal, tomate, manjericão, alho e azeite',
            prices: {
                individual: '18.90'
            },
            category: 'entradas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1572441713132-51c75654db73?w=400'
        },
        {
            name: 'Antipasto da Casa',
            description: 'Seleção de queijos, embutidos, azeitonas e torradas',
            prices: {
                individual: '24.90'
            },
            category: 'entradas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400'
        },
        // Bebidas
        {
            name: 'Coca-Cola Lata',
            description: 'Refrigerante Coca-Cola 350ml gelado',
            prices: {
                individual: '6.50'
            },
            category: 'bebidas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1581636625402-29d2c30b7bfe?w=400'
        },
        {
            name: 'Suco de Laranja Natural',
            description: 'Suco natural de laranja 300ml',
            prices: {
                individual: '8.90'
            },
            category: 'bebidas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400'
        },
        {
            name: 'Água Mineral',
            description: 'Água mineral sem gás 500ml',
            prices: {
                individual: '4.50'
            },
            category: 'bebidas',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=400'
        }
    ]
};
// Function to run all seeds
export async function runSeeds() {
    console.log('🌱 Starting database seeding...');
    try {
        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await db.delete(pizzaFlavors);
        // Insert flavors
        console.log('🍕 Seeding pizza flavors...');
        for (const flavor of SEED_DATA.flavors) {
            await db.insert(pizzaFlavors).values(flavor);
        }
        console.log('✅ Database seeding completed successfully!');
        // Log summary
        console.log('📊 Seeded data summary:', {
            flavors: SEED_DATA.flavors.length
        });
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}
// CLI script runner - check if this is the main module in ES modules
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
    runSeeds()
        .then(() => {
        console.log('🎉 Seeding process completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Seeding process failed:', error);
        process.exit(1);
    });
}
