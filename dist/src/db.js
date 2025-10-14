// 🚀 FIXED: Neon HTTP Driver para Netlify Functions (solução recomendada)
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
// ✅ SOLUÇÃO: HTTP driver (sem Pool) - ideal para serverless
// Zero conexões persistentes, cada query é um HTTP request
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
// ✅ HTTP driver não precisa de monitoramento - sem conexões persistentes
console.log('🌐 [DB] Using Neon HTTP driver (serverless-optimized)');
