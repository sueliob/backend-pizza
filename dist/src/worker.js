import app from './app';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sessions } from '../shared/schema';
import { lt, isNull, or } from 'drizzle-orm';
export default {
    fetch: app.fetch,
    scheduled: async (event, env, ctx) => {
        try {
            const db = drizzle(neon(env.DATABASE_URL));
            const now = new Date();
            const result = await db.delete(sessions).where(or(lt(sessions.expiresAt, now), isNull(sessions.expiresAt)));
            console.log(`[CRON] Limpeza de sessões expiradas concluída`);
        }
        catch (error) {
            console.error('[CRON] Erro na limpeza de sessões:', error);
        }
    }
};
