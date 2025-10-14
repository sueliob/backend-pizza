/**
 * 🔐 AUTH WITH PGCRYPTO (Optimized for Cloudflare Workers)
 *
 * ✅ Vantagens sobre bcryptjs:
 * - CPU-intensivo roda no Postgres (não no Worker)
 * - Evita "Worker exceeded CPU time limit"
 * - Reduz bundle size (sem bcryptjs WASM)
 * - Mesmo padrão bcrypt ($2a$/$2b$)
 *
 * 📋 Requisitos:
 * - Neon Postgres com extension pgcrypto habilitada
 * - Execute: CREATE EXTENSION IF NOT EXISTS pgcrypto;
 */
import { sql } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';
const ACCESS_TTL = 60 * 15;
export const REFRESH_TTL_SEC = 60 * 60 * 24 * 7;
export function nowSec() { return Math.floor(Date.now() / 1000); }
export async function signAccessToken(payload, env) {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(env.JWT_ISS ?? 'backend-pizzaria')
        .setAudience(env.JWT_AUD ?? 'pizzaria-spa')
        .setExpirationTime(`${ACCESS_TTL}s`)
        .sign(secret);
}
export async function verifyAccessToken(token, env) {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
        issuer: env.JWT_ISS ?? 'backend-pizzaria',
        audience: env.JWT_AUD ?? 'pizzaria-spa',
    });
    return payload;
}
/**
 * 🔐 Verifica senha usando pgcrypto no Postgres
 * @returns {id, username, role} se válido, null se inválido
 * @throws Error se pgcrypto não estiver disponível ou houver erro de configuração
 */
export async function verifyPasswordPgcrypto(db, username, password) {
    const result = await db.execute(sql `
    SELECT id, username, role
    FROM admin_users
    WHERE username = ${username}
      AND is_active = true
      AND password_hash = crypt(${password}, password_hash)
    LIMIT 1
  `);
    return result.rows?.[0] || null;
    // ✅ Erros propagados (extension missing, permissões, etc.)
    // ✅ Retorna null apenas se usuário não existe ou senha inválida
}
/**
 * 🔐 Gera hash de senha usando pgcrypto (para seed/admin)
 * @param password - Senha em texto plano
 * @param cost - Custo bcrypt (padrão: 10, range: 4-12)
 */
export async function hashPasswordPgcrypto(db, password, cost = 10) {
    // ✅ Validar cost (evita valores extremos/negativos)
    const validCost = Math.max(4, Math.min(12, Math.floor(cost)));
    const result = await db.execute(sql `
    SELECT crypt(${password}, gen_salt('bf', ${validCost})) as hash
  `);
    return result.rows[0]?.hash;
}
/**
 * 🔄 Atualiza senha de usuário usando pgcrypto
 */
export async function updatePasswordPgcrypto(db, userId, newPassword, cost = 10) {
    // ✅ Validar cost (evita valores extremos/negativos)
    const validCost = Math.max(4, Math.min(12, Math.floor(cost)));
    await db.execute(sql `
    UPDATE admin_users
    SET password_hash = crypt(${newPassword}, gen_salt('bf', ${validCost})),
        updated_at = NOW()
    WHERE id = ${userId}
  `);
}
// ========================================
// Refresh Token & Cookies (sem mudanças)
// ========================================
export async function genRefreshPair() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = btoa(String.fromCharCode(...bytes)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    const hash = await sha256Hex(token);
    return { token, hash };
}
export async function sha256Hex(input) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}
export function setRefreshCookie(headers, refreshToken, secure = true) {
    const sameSite = secure ? 'None' : 'Lax';
    const attrs = [`HttpOnly`, `SameSite=${sameSite}`, `Path=/api/admin`, `Max-Age=${REFRESH_TTL_SEC}`];
    if (secure)
        attrs.unshift('Secure');
    headers.append('Set-Cookie', `refresh_token=${refreshToken}; ${attrs.join('; ')}`);
}
export function clearRefreshCookie(headers, secure = true) {
    const sameSite = secure ? 'None' : 'Lax';
    const attrs = [`HttpOnly`, `SameSite=${sameSite}`, `Path=/api/admin`, `Max-Age=0`];
    if (secure)
        attrs.unshift('Secure');
    headers.append('Set-Cookie', `refresh_token=; ${attrs.join('; ')}`);
}
export function setCsrfCookie(headers, nonce, secure = true) {
    const sameSite = secure ? 'None' : 'Lax';
    const attrs = [`SameSite=${sameSite}`, `Path=/api/admin`, `Max-Age=1800`];
    if (secure)
        attrs.unshift('Secure');
    headers.append('Set-Cookie', `csrf_token=${nonce}; ${attrs.join('; ')}`);
}
