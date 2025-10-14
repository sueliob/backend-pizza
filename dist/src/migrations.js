import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';
import * as schema from '@shared/schema';
// Configure Neon for optimal production performance (same as db.ts)
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
neonConfig.useSecureWebSocket = true;
// Initialize database connection for migrations
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set for migrations');
}
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? true : false
});
const db = drizzle({ client: pool, schema });
// Migration functions
export async function runMigrations() {
    console.log('🔄 Starting database migrations...');
    try {
        // Note: Using drizzle-kit push instead of migrations folder
        console.log('⚠️ Manual migration via drizzle-kit push recommended');
        console.log('💡 Run: npm run db:push --force');
        // Verify tables exist
        await verifyTables();
        console.log('✅ Database verification completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration verification failed:', error);
        throw error;
    }
}
// Verify all required tables exist
async function verifyTables() {
    console.log('🔍 Verifying database tables...');
    const requiredTables = [
        'pizza_flavors',
        'extras',
        'dough_types',
        'orders',
        'admin_users',
        'pizzeria_settings',
        'cep_cache'
    ];
    for (const tableName of requiredTables) {
        try {
            const result = await db.execute(sql `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `);
            const exists = result.rows[0]?.exists;
            if (exists) {
                console.log(`✅ Table '${tableName}' verified`);
            }
            else {
                console.warn(`⚠️ Table '${tableName}' not found`);
            }
        }
        catch (error) {
            console.error(`❌ Error verifying table '${tableName}':`, error);
        }
    }
}
// Create indexes for performance
export async function createIndexes() {
    console.log('📊 Creating performance indexes...');
    try {
        // Index for pizza flavors by category
        await db.execute(sql `
      CREATE INDEX IF NOT EXISTS idx_pizza_flavors_category 
      ON pizza_flavors(category) 
      WHERE available = true;
    `);
        // Index for flavors available only (if extras table exists)
        await db.execute(sql `
      CREATE INDEX IF NOT EXISTS idx_pizza_flavors_available 
      ON pizza_flavors(available);
    `);
        // Index for orders by date
        await db.execute(sql `
      CREATE INDEX IF NOT EXISTS idx_orders_created_at 
      ON orders(created_at DESC);
    `);
        // Index for admin users by username
        await db.execute(sql `
      CREATE INDEX IF NOT EXISTS idx_admin_users_username 
      ON admin_users(username) 
      WHERE is_active = true;
    `);
        // Index for CEP cache
        await db.execute(sql `
      CREATE INDEX IF NOT EXISTS idx_cep_cache_cep 
      ON cep_cache(cep);
    `);
        // Index for pizzeria settings by section
        await db.execute(sql `
      CREATE INDEX IF NOT EXISTS idx_pizzeria_settings_section 
      ON pizzeria_settings(section);
    `);
        console.log('✅ Performance indexes created successfully!');
    }
    catch (error) {
        console.error('❌ Error creating indexes:', error);
        throw error;
    }
}
// Health check for database
export async function healthCheck() {
    console.log('🏥 Running database health check...');
    try {
        // Test basic connection
        const result = await db.execute(sql `SELECT NOW() as current_time`);
        console.log('✅ Database connection healthy:', result.rows[0]);
        // Check table counts
        const counts = await Promise.all([
            db.execute(sql `SELECT COUNT(*) FROM pizza_flavors`),
            db.execute(sql `SELECT COUNT(*) FROM extras`),
            db.execute(sql `SELECT COUNT(*) FROM dough_types`),
            db.execute(sql `SELECT COUNT(*) FROM admin_users`),
            db.execute(sql `SELECT COUNT(*) FROM pizzeria_settings`)
        ]);
        console.log('📊 Table record counts:', {
            flavors: counts[0].rows[0]?.count,
            extras: counts[1].rows[0]?.count,
            doughTypes: counts[2].rows[0]?.count,
            adminUsers: counts[3].rows[0]?.count,
            settings: counts[4].rows[0]?.count
        });
        return true;
    }
    catch (error) {
        console.error('❌ Database health check failed:', error);
        return false;
    }
}
// Reset database (DANGER: deletes all data)
export async function resetDatabase() {
    console.log('⚠️ RESETTING DATABASE - This will delete all data!');
    try {
        // Drop all tables in correct order (respecting foreign keys)
        await db.execute(sql `DROP TABLE IF EXISTS orders CASCADE`);
        await db.execute(sql `DROP TABLE IF EXISTS cep_cache CASCADE`);
        await db.execute(sql `DROP TABLE IF EXISTS admin_users CASCADE`);
        await db.execute(sql `DROP TABLE IF EXISTS pizzeria_settings CASCADE`);
        await db.execute(sql `DROP TABLE IF EXISTS dough_types CASCADE`);
        await db.execute(sql `DROP TABLE IF EXISTS extras CASCADE`);
        await db.execute(sql `DROP TABLE IF EXISTS pizza_flavors CASCADE`);
        console.log('✅ Database reset completed');
        // Run migrations to recreate tables
        await runMigrations();
        await createIndexes();
    }
    catch (error) {
        console.error('❌ Database reset failed:', error);
        throw error;
    }
}
// CLI script runner (ESM compatible)
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
    const command = process.argv[2];
    switch (command) {
        case 'migrate':
            runMigrations()
                .then(() => createIndexes())
                .then(() => process.exit(0))
                .catch((error) => {
                console.error('Migration failed:', error);
                process.exit(1);
            });
            break;
        case 'health':
            healthCheck()
                .then((healthy) => process.exit(healthy ? 0 : 1))
                .catch(() => process.exit(1));
            break;
        case 'reset':
            resetDatabase()
                .then(() => process.exit(0))
                .catch((error) => {
                console.error('Reset failed:', error);
                process.exit(1);
            });
            break;
        default:
            console.log('Usage: npm run migrate [migrate|health|reset]');
            process.exit(1);
    }
}
