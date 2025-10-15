import { SignJWT, jwtVerify } from 'jose'

export type Env = {
  DATABASE_URL: string
  JWT_SECRET: string
  FRONTEND_URL: string
  JWT_ISS?: string
  JWT_AUD?: string
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  GOOGLE_MAPS_API_KEY?: string
}

const ACCESS_TTL = 60 * 15
export const REFRESH_TTL_SEC = 60 * 60 * 24 * 7

export function nowSec() { return Math.floor(Date.now()/1000) }

export async function signAccessToken(payload: Record<string, any>, env: Env) {
  const secret = new TextEncoder().encode(env.JWT_SECRET)
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISS ?? 'backend-pizzaria')
    .setAudience(env.JWT_AUD ?? 'pizzaria-spa')
    .setExpirationTime(`${ACCESS_TTL}s`)
    .sign(secret)
}

export async function verifyAccessToken(token: string, env: Env) {
  const secret = new TextEncoder().encode(env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret, {
    issuer: env.JWT_ISS ?? 'backend-pizzaria',
    audience: env.JWT_AUD ?? 'pizzaria-spa',
  })
  return payload
}

export async function genRefreshPair() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = btoa(String.fromCharCode(...bytes)).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
  const hash = await sha256Hex(token)
  return { token, hash }
}

export async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export function setRefreshCookie(headers: Headers, refreshToken: string, secure = true) {
  // Same-site (subdomínios curiooso.com.br) - sempre SameSite=Lax
  const sameSite = 'Lax'
  const domain = secure ? 'Domain=.curiooso.com.br; ' : '' // compartilha entre m.curiooso e api.curiooso
  const attrs = [`HttpOnly`,`${domain}SameSite=${sameSite}`,`Path=/api/admin`,`Max-Age=${REFRESH_TTL_SEC}`]
  if (secure) attrs.unshift('Secure')
  headers.append('Set-Cookie', `refresh_token=${refreshToken}; ${attrs.join('; ')}`)
}

export function clearRefreshCookie(headers: Headers, secure = true) {
  const sameSite = 'Lax'
  const domain = secure ? 'Domain=.curiooso.com.br; ' : ''
  const attrs = [`HttpOnly`,`${domain}SameSite=${sameSite}`,`Path=/api/admin`,`Max-Age=0`]
  if (secure) attrs.unshift('Secure')
  headers.append('Set-Cookie', `refresh_token=; ${attrs.join('; ')}`)
}

export function setCsrfCookie(headers: Headers, nonce: string, secure = true) {
  const sameSite = 'Lax'
  const domain = secure ? 'Domain=.curiooso.com.br; ' : ''
  const attrs = [`${domain}SameSite=${sameSite}`,`Path=/api/admin`,`Max-Age=1800`]
  if (secure) attrs.unshift('Secure')
  headers.append('Set-Cookie', `csrf_token=${nonce}; ${attrs.join('; ')}`)
}
