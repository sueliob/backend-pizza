import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// HTTP driver ideal para Cloudflare Workers (serverless)
// Zero conexões persistentes, cada query é um HTTP request
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

console.log('🌐 [DB] Using Neon HTTP driver (serverless-optimized)');