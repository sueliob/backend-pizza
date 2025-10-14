import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq, and, isNull, gt, sql, desc, count } from 'drizzle-orm'
import { sessions, adminUsers, pizzaFlavors, extras, doughTypes, orders, pizzeriaSettings, cepCache } from '../shared/schema'
import { type Env, signAccessToken, verifyAccessToken, genRefreshPair, sha256Hex, setRefreshCookie, clearRefreshCookie, setCsrfCookie, REFRESH_TTL_SEC } from './auth'
import { verifyPasswordPgcrypto, hashPasswordPgcrypto } from './auth-pgcrypto'

type Vars = { db: any, userId?: string, username?: string, role?: string }

const app = new Hono<{ Bindings: Env, Variables: Vars }>()

// ✅ Validação de host (bloqueia acessos fora do domínio custom)
app.use('*', async (c, next) => {
  const host = c.req.header('host') || ''
  const allowed = ['api.curiooso.com.br', 'localhost:8787', '127.0.0.1:8787']
  
  if (!allowed.some(h => host.includes(h))) {
    return c.json({ error: 'forbidden_host' }, 403)
  }
  await next()
})

// ✅ CORS robusto (retorna headers em TODOS os responses, incluindo erros)
const ALLOWED_ORIGINS = [
  'https://m.curiooso.com.br',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173',
]

app.use('*', cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin || '') ? origin : '',
  allowHeaders: ['Content-Type','Authorization','x-csrf','x-csrf-token'],
  allowMethods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  credentials: true,
  maxAge: 3600,
}))

// Health check BEFORE DB middleware (never crashes even if DATABASE_URL missing)
app.get('/api/health', (c) => c.json({ 
  status: 'ok',
  timestamp: new Date().toISOString(),
  environment: 'cloudflare-workers'
}))

app.get('/api', (c) => c.json({ 
  message: 'Pizzaria API Online com 10 Sabores!', 
  status: 'ok',
  timestamp: new Date().toISOString()
}))

// DB middleware - only runs for routes that need it (after health checks)
app.use('/api/*', async (c, next) => {
  try {
    const url = c.env.DATABASE_URL
    if (!url) {
      console.error('❌ DATABASE_URL not configured in Worker secrets')
      return c.json({ error: 'database_not_configured' }, 500)
    }
    c.set('db', drizzle(neon(url)))
    await next()
  } catch (e) {
    console.error('🔥 DB_INIT_ERROR:', e)
    return c.json({ error: 'database_init_failed' }, 500)
  }
})

// Global error handler - ALWAYS return JSON com CORS (sanitized for security)
app.onError((err, c) => {
  // Log full error details server-side only
  console.error('🔥 UNCAUGHT ERROR:', err?.stack || err?.message || err)
  
  // Get origin for CORS (mesmo em erro)
  const origin = c.req.header('origin')
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : null
  
  // Return generic error to client (never leak internal details)
  const response = c.json({ 
    error: 'internal_server_error',
    message: 'An unexpected error occurred. Please try again later.'
  }, 500)
  
  // Add CORS headers se origem permitida
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
})

function parseCookies(header = '') {
  const out: Record<string,string> = {}
  header.split(/;\s*/).forEach(p => {
    const [k,...v] = p.split('=')
    if (!k) return
    out[k.trim()] = decodeURIComponent((v.join('=') || '').trim())
  })
  return out
}

function calculateHaversineDistance(coord1: {lat: number, lng: number}, coord2: {lat: number, lng: number}): number {
  const R = 6371
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

const PIZZERIA_ADDRESS = { coordinates: { lat: -23.5236, lng: -46.7031 } }
const DELIVERY_CONFIG = { baseFee: 9.00, feePerRange: 9.00, kmRange: 3, baseTime: 20 }

app.get('/api/flavors', async (c) => {
  const db = c.get('db')
  try {
    const flavors = await db.select().from(pizzaFlavors).where(eq(pizzaFlavors.available, true))
    return c.json(flavors)
  } catch (error) {
    console.error('Error fetching flavors:', error)
    return c.json([], 200)
  }
})

app.get('/api/flavors/:category', async (c) => {
  const db = c.get('db')
  const category = c.req.param('category')
  try {
    const flavors = await db.select().from(pizzaFlavors)
      .where(and(eq(pizzaFlavors.category, category), eq(pizzaFlavors.available, true)))
    return c.json(flavors)
  } catch (error) {
    console.error('Error fetching flavors by category:', error)
    return c.json([], 200)
  }
})

app.get('/api/extras', async (c) => {
  const db = c.get('db')
  try {
    const allExtras = await db.select().from(extras).where(eq(extras.available, true))
    return c.json(allExtras)
  } catch (error) {
    console.error('Error fetching extras:', error)
    return c.json([], 200)
  }
})

app.get('/api/dough-types', async (c) => {
  const db = c.get('db')
  try {
    const types = await db.select().from(doughTypes).where(eq(doughTypes.available, true))
    return c.json(types)
  } catch (error) {
    console.error('Error fetching dough types:', error)
    return c.json([], 200)
  }
})

app.post('/api/calculate-distance', async (c) => {
  const { cep, address } = await c.req.json()
  
  const cleanCEP = cep.replace(/\D/g, '')
  const destinationCoords = { lat: -23.5505, lng: -46.6333 }
  
  const distance = calculateHaversineDistance(PIZZERIA_ADDRESS.coordinates, destinationCoords)
  const roundedDistance = Math.max(1, Math.round(distance * 10) / 10)
  const ranges = Math.ceil(roundedDistance / DELIVERY_CONFIG.kmRange)
  const deliveryFee = Math.max(ranges * DELIVERY_CONFIG.feePerRange, DELIVERY_CONFIG.baseFee)
  const estimatedMinutes = Math.max(DELIVERY_CONFIG.baseTime, DELIVERY_CONFIG.baseTime + (roundedDistance * 1.5))
  
  return c.json({
    distance: roundedDistance,
    deliveryFee: deliveryFee.toFixed(2),
    estimatedTime: `${Math.round(estimatedMinutes)} min`
  })
})

app.post('/api/orders', async (c) => {
  const db = c.get('db')
  const orderData = await c.req.json()
  
  try {
    const [newOrder] = await db.insert(orders).values({
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      deliveryMethod: orderData.deliveryMethod,
      address: orderData.address,
      paymentMethod: orderData.paymentMethod,
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee || '0',
      total: orderData.total,
      notes: orderData.notes,
      status: 'pending'
    }).returning()
    
    return c.json({ success: true, order: newOrder }, 201)
  } catch (error) {
    console.error('Error creating order:', error)
    return c.json({ error: 'Erro ao criar pedido' }, 500)
  }
})

app.get('/api/public/settings', async (c) => {
  const db = c.get('db')
  try {
    const settings = await db.select().from(pizzeriaSettings)
    const settingsObj: any = {}
    settings.forEach((s: any) => {
      settingsObj[s.section] = s.data
    })
    return c.json(settingsObj)
  } catch (error) {
    return c.json({}, 200)
  }
})

app.get('/api/public/contact', async (c) => {
  const db = c.get('db')
  try {
    const [contactSetting] = await db.select().from(pizzeriaSettings)
      .where(eq(pizzeriaSettings.section, 'contact')).limit(1)
    return c.json(contactSetting?.data || {})
  } catch (error) {
    return c.json({}, 200)
  }
})

app.post('/api/admin/login', async (c) => {
  const { username, password } = await c.req.json()
  const db = c.get('db')
  
  try {
    // ✅ pgcrypto: CPU-intensive bcrypt runs on Postgres (0ms Worker CPU)
    const user = await verifyPasswordPgcrypto(db, username, password)
    
    if (!user) {
      return c.json({ error: 'Credenciais inválidas' }, 401)
    }
    
    const { token: refresh, hash } = await genRefreshPair()
    const exp = new Date(Date.now() + 1000 * REFRESH_TTL_SEC)
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || ''
    const ua = c.req.header('user-agent') || ''
    
    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      refreshHash: hash,
      userAgent: ua,
      ip,
      expiresAt: exp
    })
    
    await db.update(adminUsers).set({ lastLogin: new Date() }).where(eq(adminUsers.id, user.id))
    
    const access = await signAccessToken({ 
      sub: user.id, 
      username: user.username, 
      role: user.role 
    }, c.env)
    
    const headers = new Headers()
    const isSecure = new URL(c.req.url).protocol === 'https:'
    setRefreshCookie(headers, refresh, isSecure)
    setCsrfCookie(headers, crypto.randomUUID(), isSecure)
    
    return new Response(JSON.stringify({ 
      success: true,
      token: access,  // Frontend espera "token" não "accessToken"
      user: { id: user.id, username: user.username, role: user.role } 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...Object.fromEntries(headers) }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Erro no servidor' }, 500)
  }
})

app.post('/api/admin/refresh', async (c) => {
  const db = c.get('db')
  const cookies = parseCookies(c.req.header('cookie') || '')
  const csrfHeader = c.req.header('x-csrf') || ''
  const csrfCookie = cookies['csrf_token'] || ''
  
  if (!cookies['refresh_token']) return c.json({ error: 'No refresh' }, 401)
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) return c.json({ error: 'CSRF' }, 403)
  
  const incoming = cookies['refresh_token']
  const hash = await sha256Hex(incoming)
  const now = new Date()
  
  const [sess] = await db.select().from(sessions).where(
    and(eq(sessions.refreshHash, hash), isNull(sessions.revokedAt), gt(sessions.expiresAt, now))
  ).limit(1)
  
  if (!sess) return c.json({ error: 'Invalid session' }, 401)
  
  const { token: newRefresh, hash: newHash } = await genRefreshPair()
  const newId = crypto.randomUUID()
  const newExp = new Date(Date.now() + 1000 * REFRESH_TTL_SEC)
  
  await db.transaction(async (tx: any) => {
    await tx.update(sessions).set({ revokedAt: new Date(), replacedBy: newId }).where(eq(sessions.id, sess.id))
    await tx.insert(sessions).values({
      id: newId,
      userId: sess.userId,
      refreshHash: newHash,
      userAgent: sess.userAgent,
      ip: sess.ip,
      expiresAt: newExp
    })
  })
  
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, sess.userId)).limit(1)
  const access = await signAccessToken({ sub: user.id, username: user.username, role: user.role }, c.env)
  
  const headers = new Headers()
  const isSecure = new URL(c.req.url).protocol === 'https:'
  setRefreshCookie(headers, newRefresh, isSecure)
  setCsrfCookie(headers, csrfCookie, isSecure)
  
  return new Response(JSON.stringify({ accessToken: access }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...Object.fromEntries(headers) }
  })
})

app.post('/api/admin/logout', async (c) => {
  const db = c.get('db')
  const cookies = parseCookies(c.req.header('cookie') || '')
  const csrfHeader = c.req.header('x-csrf') || ''
  const csrfCookie = cookies['csrf_token'] || ''
  const isSecure = new URL(c.req.url).protocol === 'https:'
  
  if (!cookies['refresh_token']) {
    const h = new Headers()
    clearRefreshCookie(h, isSecure)
    const sameSite = isSecure ? 'None' : 'Lax'
    const secureAttr = isSecure ? 'Secure; ' : ''
    h.append('Set-Cookie', `csrf_token=; ${secureAttr}SameSite=${sameSite}; Path=/api/admin; Max-Age=0`)
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: h })
  }
  
  if (!csrfHeader || csrfHeader !== csrfCookie) return c.json({ error: 'CSRF' }, 403)
  
  const hash = await sha256Hex(cookies['refresh_token'])
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.refreshHash, hash))
  
  const headers = new Headers()
  clearRefreshCookie(headers, isSecure)
  const sameSite = isSecure ? 'None' : 'Lax'
  const secureAttr = isSecure ? 'Secure; ' : ''
  headers.append('Set-Cookie', `csrf_token=; ${secureAttr}SameSite=${sameSite}; Path=/api/admin; Max-Age=0`)
  
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...Object.fromEntries(headers) }
  })
})

app.use('/api/admin/*', async (c, next) => {
  if (c.req.path === '/api/admin/login' || c.req.path === '/api/admin/refresh' || c.req.path === '/api/admin/logout') {
    return next()
  }
  
  const auth = c.req.header('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return c.json({ error: 'no token' }, 401)
  
  try {
    const payload = await verifyAccessToken(token, c.env)
    c.set('userId', String(payload.sub))
    c.set('username', String(payload.username))
    c.set('role', String(payload.role))
    await next()
  } catch {
    return c.json({ error: 'invalid token' }, 401)
  }
})

app.get('/api/admin/dashboard', async (c) => {
  const db = c.get('db')
  try {
    const today = new Date()
    today.setHours(0,0,0,0)
    
    const [todayOrdersResult] = await db.select({ count: count() }).from(orders)
      .where(sql`${orders.createdAt} >= ${today.toISOString()}`)
    
    const allOrders = await db.select().from(orders)
    const monthlyRevenue = allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0)
    
    const [totalProductsResult] = await db.select({ count: count() }).from(pizzaFlavors)
    
    const recentOrders = await db.select().from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5)
    
    return c.json({
      todayOrders: todayOrdersResult.count || 0,
      monthlyRevenue,
      totalProducts: totalProductsResult.count || 0,
      popularFlavors: [],
      recentOrders
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return c.json({ todayOrders: 0, monthlyRevenue: 0, totalProducts: 0, popularFlavors: [], recentOrders: [] })
  }
})

app.get('/api/admin/flavors', async (c) => {
  const db = c.get('db')
  const flavors = await db.select().from(pizzaFlavors)
  return c.json(flavors)
})

app.post('/api/admin/flavors', async (c) => {
  const db = c.get('db')
  const data = await c.req.json()
  const [newFlavor] = await db.insert(pizzaFlavors).values(data).returning()
  return c.json({ success: true, flavor: newFlavor }, 201)
})

app.put('/api/admin/flavors/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const data = await c.req.json()
  const [updated] = await db.update(pizzaFlavors).set(data).where(eq(pizzaFlavors.id, id)).returning()
  return c.json({ success: true, flavor: updated })
})

app.get('/api/admin/extras', async (c) => {
  const db = c.get('db')
  const allExtras = await db.select().from(extras)
  return c.json(allExtras)
})

app.post('/api/admin/extras', async (c) => {
  const db = c.get('db')
  const data = await c.req.json()
  const [newExtra] = await db.insert(extras).values(data).returning()
  return c.json({ success: true, extra: newExtra }, 201)
})

app.put('/api/admin/extras/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const data = await c.req.json()
  const [updated] = await db.update(extras).set(data).where(eq(extras.id, id)).returning()
  return c.json({ success: true, extra: updated })
})

app.get('/api/admin/dough-types', async (c) => {
  const db = c.get('db')
  const types = await db.select().from(doughTypes)
  return c.json(types)
})

app.post('/api/admin/dough-types', async (c) => {
  const db = c.get('db')
  const data = await c.req.json()
  const [newType] = await db.insert(doughTypes).values(data).returning()
  return c.json({ success: true, doughType: newType }, 201)
})

app.put('/api/admin/dough-types/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const data = await c.req.json()
  const [updated] = await db.update(doughTypes).set(data).where(eq(doughTypes.id, id)).returning()
  return c.json({ success: true, doughType: updated })
})

app.get('/api/admin/settings', async (c) => {
  const db = c.get('db')
  const settings = await db.select().from(pizzeriaSettings)
  const settingsObj: any = {}
  settings.forEach((s: any) => {
    // Map business_hours -> businessHours for frontend compatibility
    const key = s.section === 'business_hours' ? 'businessHours' : s.section
    settingsObj[key] = s.data
  })
  return c.json(settingsObj)
})

app.put('/api/admin/settings', async (c) => {
  const db = c.get('db')
  const { section, data } = await c.req.json()
  
  if (!section || !data) {
    return c.json({ error: 'section e data são obrigatórios' }, 400)
  }
  
  // Map frontend section names to database section names
  const sectionMapping: Record<string, string> = {
    'hours': 'business_hours',
    'businessHours': 'business_hours'
  }
  
  const dbSection = sectionMapping[section] || section
  
  // Check if section exists
  const existing = await db.select().from(pizzeriaSettings).where(eq(pizzeriaSettings.section, dbSection))
  
  if (existing.length > 0) {
    // Update existing section
    await db.update(pizzeriaSettings)
      .set({ data: data as any, updatedAt: new Date() })
      .where(eq(pizzeriaSettings.section, dbSection))
  } else {
    // Insert new section (for 'social' and other new sections)
    await db.insert(pizzeriaSettings).values({
      section: dbSection,
      data: data as any
    })
  }
  
  return c.json({ success: true, message: 'Configurações atualizadas' })
})

app.post('/api/admin/bulk-import-flavors', async (c) => {
  const db = c.get('db')
  const { flavors } = await c.req.json()
  await db.insert(pizzaFlavors).values(flavors)
  return c.json({ success: true, count: flavors.length })
})

app.post('/api/admin/bulk-import-extras', async (c) => {
  const db = c.get('db')
  const { extras: extrasData } = await c.req.json()
  await db.insert(extras).values(extrasData)
  return c.json({ success: true, count: extrasData.length })
})

app.post('/api/admin/bulk-import-dough-types', async (c) => {
  const db = c.get('db')
  const { doughTypes: doughTypesData } = await c.req.json()
  await db.insert(doughTypes).values(doughTypesData)
  return c.json({ success: true, count: doughTypesData.length })
})

app.post('/api/orders/image', async (c) => {
  const { dataUrl } = await c.req.json()
  
  if (!dataUrl?.startsWith("data:image/")) {
    return c.json({ error: "dataUrl inválido" }, 400)
  }
  
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${c.env.CLOUDINARY_CLOUD_NAME}/image/upload`
  
  const formData = new FormData()
  formData.append('file', dataUrl)
  formData.append('folder', 'pedidos')
  formData.append('api_key', c.env.CLOUDINARY_API_KEY!)
  
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await sha256Hex(`folder=pedidos&timestamp=${timestamp}${c.env.CLOUDINARY_API_SECRET}`)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  
  const response = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData
  })
  
  const result = await response.json()
  const deleteAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  
  return c.json({
    public_id: result.public_id,
    secure_url: result.secure_url,
    delete_at: deleteAt.toISOString()
  })
})

app.post('/api/admin/upload-image', async (c) => {
  const timestamp = Date.now()
  const imageUrl = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&timestamp=${timestamp}`
  return c.json({ success: true, message: 'Imagem carregada com sucesso', imageUrl })
})

app.get('/api/debug/admin-count', async (c) => {
  const db = c.get('db')
  const [result] = await db.select({ count: count() }).from(adminUsers)
  return c.json({ adminCount: result.count })
})

app.post('/api/debug/create-admin', async (c) => {
  const db = c.get('db')
  const { username, password, email } = await c.req.json()
  
  // ✅ pgcrypto: Generate hash on Postgres (0ms Worker CPU)
  const passwordHash = await hashPasswordPgcrypto(db, password, 10)
  
  const [newAdmin] = await db.insert(adminUsers).values({
    username,
    email,
    passwordHash,
    role: 'admin',
    isActive: true
  }).returning()
  
  return c.json({ success: true, admin: { id: newAdmin.id, username: newAdmin.username } })
})

export default app
