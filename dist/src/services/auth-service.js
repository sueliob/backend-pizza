import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
export class AuthService {
    static ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'pizzaria-access-secret-2024';
    static REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'pizzaria-refresh-secret-2024';
    static ACCESS_TOKEN_EXPIRE = '15m';
    static REFRESH_TOKEN_EXPIRE = '7d';
    // Cache de refresh tokens ativos (em produção usar Redis)
    static refreshTokenStore = new Set();
    /**
     * Hash password usando bcrypt
     */
    static async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    /**
     * Verificar senha
     */
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
    /**
     * Gerar tokens JWT (access + refresh)
     */
    static generateTokens(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role
        };
        const accessToken = jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRE,
            issuer: 'pizzaria-api',
            audience: 'pizzaria-admin'
        });
        const refreshToken = jwt.sign({ userId: user.id, tokenType: 'refresh' }, this.REFRESH_TOKEN_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRE,
            issuer: 'pizzaria-api'
        });
        // Armazenar refresh token ativo
        this.refreshTokenStore.add(refreshToken);
        return { accessToken, refreshToken };
    }
    /**
     * Verificar access token
     */
    static verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET);
            return decoded;
        }
        catch (error) {
            console.error('❌ [AUTH] Invalid access token:', error instanceof Error ? error.message : 'Erro desconhecido');
            return null;
        }
    }
    /**
     * Verificar refresh token
     */
    static verifyRefreshToken(token) {
        try {
            // Verificar se token está na whitelist
            if (!this.refreshTokenStore.has(token)) {
                console.error('❌ [AUTH] Refresh token not in whitelist');
                return null;
            }
            const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET);
            return { userId: decoded.userId };
        }
        catch (error) {
            console.error('❌ [AUTH] Invalid refresh token:', error instanceof Error ? error.message : 'Erro desconhecido');
            return null;
        }
    }
    /**
     * Invalidar refresh token (logout)
     */
    static revokeRefreshToken(token) {
        this.refreshTokenStore.delete(token);
        console.log('✅ [AUTH] Refresh token revoked');
    }
    /**
     * Rotacionar refresh token
     */
    static rotateRefreshToken(oldToken, user) {
        const decoded = this.verifyRefreshToken(oldToken);
        if (!decoded || decoded.userId !== user.id) {
            return null;
        }
        // Invalidar token antigo
        this.revokeRefreshToken(oldToken);
        // Gerar novos tokens
        return this.generateTokens(user);
    }
    /**
     * Extrair token do header Authorization
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.slice(7); // Remove 'Bearer '
    }
    /**
     * Gerar cookies HttpOnly seguros
     */
    static generateSecureCookies(tokens) {
        const isProduction = process.env.NODE_ENV === 'production';
        return [
            `access_token=${tokens.accessToken}; HttpOnly; Secure=true; SameSite=None; Max-Age=900; Path=/`, // 15min
            `refresh_token=${tokens.refreshToken}; HttpOnly; Secure=true; SameSite=None; Max-Age=604800; Path=/` // 7 dias
        ];
    }
    /**
     * Gerar cookies de logout
     */
    static generateLogoutCookies() {
        return [
            `access_token=; HttpOnly; Secure=true; SameSite=None; Max-Age=0; Path=/`,
            `refresh_token=; HttpOnly; Secure=true; SameSite=None; Max-Age=0; Path=/`
        ];
    }
    /**
     * Middleware de autenticação para endpoints
     */
    static authenticateRequest(authHeader) {
        const token = this.extractTokenFromHeader(authHeader);
        if (!token) {
            return null;
        }
        return this.verifyAccessToken(token);
    }
}
