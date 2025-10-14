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
    // Same-site (subdomínios curiooso.com.br) - sempre SameSite=Lax
    const sameSite = 'Lax';
    const domain = secure ? 'Domain=.curiooso.com.br; ' : ''; // compartilha entre m.curiooso e api.curiooso
    const attrs = [`HttpOnly`, `${domain}SameSite=${sameSite}`, `Path=/api/admin`, `Max-Age=${REFRESH_TTL_SEC}`];
    if (secure)
        attrs.unshift('Secure');
    headers.append('Set-Cookie', `refresh_token=${refreshToken}; ${attrs.join('; ')}`);
}
export function clearRefreshCookie(headers, secure = true) {
    const sameSite = 'Lax';
    const domain = secure ? 'Domain=.curiooso.com.br; ' : '';
    const attrs = [`HttpOnly`, `${domain}SameSite=${sameSite}`, `Path=/api/admin`, `Max-Age=0`];
    if (secure)
        attrs.unshift('Secure');
    headers.append('Set-Cookie', `refresh_token=; ${attrs.join('; ')}`);
}
export function setCsrfCookie(headers, nonce, secure = true) {
    const sameSite = 'Lax';
    const domain = secure ? 'Domain=.curiooso.com.br; ' : '';
    const attrs = [`${domain}SameSite=${sameSite}`, `Path=/api/admin`, `Max-Age=1800`];
    if (secure)
        attrs.unshift('Secure');
    headers.append('Set-Cookie', `csrf_token=${nonce}; ${attrs.join('; ')}`);
}
