export class RateLimiter {
    static store = new Map();
    // Configurações predefinidas
    static CONFIGS = {
        LOGIN: {
            windowMs: 15 * 60 * 1000, // 15 minutos
            maxRequests: 5, // 5 tentativas por IP
            message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
        },
        UPLOAD: {
            windowMs: 60 * 1000, // 1 minuto
            maxRequests: 10, // 10 uploads por minuto
            message: 'Limite de upload excedido. Tente novamente em 1 minuto.'
        },
        API_GENERAL: {
            windowMs: 60 * 1000, // 1 minuto
            maxRequests: 100, // 100 requests por minuto
            message: 'Muitas requisições. Tente novamente em 1 minuto.'
        }
    };
    /**
     * Verificar rate limit para um IP
     */
    static checkRateLimit(ip, config) {
        const key = `${ip}`;
        const now = Date.now();
        // Buscar entrada existente
        const entry = this.store.get(key);
        if (!entry) {
            // Primeira requisição
            this.store.set(key, {
                count: 1,
                resetTime: now + config.windowMs
            });
            return true; // Permitido
        }
        // Verificar se janela expirou
        if (now > entry.resetTime) {
            // Reset da janela
            this.store.set(key, {
                count: 1,
                resetTime: now + config.windowMs
            });
            return true; // Permitido
        }
        // Incrementar contador
        entry.count++;
        if (entry.count > config.maxRequests) {
            console.warn(`🚫 [RATE-LIMIT] IP ${ip} excedeu limite: ${entry.count}/${config.maxRequests}`);
            return false; // Bloqueado
        }
        return true; // Permitido
    }
    /**
     * Middleware para Express/Netlify
     */
    static middleware(config) {
        return (req) => {
            // Extrair IP real
            const ip = this.extractClientIP(req);
            if (!this.checkRateLimit(ip, config)) {
                return {
                    allowed: false,
                    error: {
                        statusCode: 429,
                        message: config.message,
                        retryAfter: Math.ceil(config.windowMs / 1000)
                    }
                };
            }
            return { allowed: true };
        };
    }
    /**
     * Extrair IP real do cliente
     */
    static extractClientIP(req) {
        // Headers comuns de proxy/CDN
        const forwardedFor = req.headers['x-forwarded-for'];
        const realIP = req.headers['x-real-ip'];
        const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
        let clientIP = '';
        if (forwardedFor) {
            // X-Forwarded-For pode ter múltiplos IPs separados por vírgula
            clientIP = Array.isArray(forwardedFor)
                ? forwardedFor[0]
                : forwardedFor.split(',')[0].trim();
        }
        else if (realIP) {
            clientIP = Array.isArray(realIP) ? realIP[0] : realIP;
        }
        else if (cfConnectingIP) {
            clientIP = Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP;
        }
        else {
            // Fallback para connection remoteAddress
            clientIP = req.connection?.remoteAddress ||
                req.socket?.remoteAddress ||
                req.ip ||
                'unknown';
        }
        // Limpar IPv6 prefix se necessário
        if (clientIP.startsWith('::ffff:')) {
            clientIP = clientIP.slice(7);
        }
        return clientIP || 'unknown';
    }
    /**
     * Limpar entradas expiradas (limpeza manual)
     */
    static cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`🧹 [RATE-LIMIT] Limpeza: ${cleaned} entradas removidas`);
        }
    }
    /**
     * Obter estatísticas atuais
     */
    static getStats() {
        const now = Date.now();
        let activeEntries = 0;
        for (const entry of this.store.values()) {
            if (now <= entry.resetTime) {
                activeEntries++;
            }
        }
        return {
            totalEntries: this.store.size,
            activeEntries
        };
    }
}
// Auto-limpeza a cada 5 minutos (em produção, usar cron job)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        RateLimiter.cleanup();
    }, 5 * 60 * 1000);
}
