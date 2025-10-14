import { AuthService } from './auth-service';
import { storage } from '../storage';
export class AdminSeeder {
    /**
     * Criar usuário admin inicial
     */
    static async createInitialAdmin() {
        try {
            // Verificar se já existe algum admin
            const existingAdmins = await storage.getAllAdminUsers();
            if (existingAdmins.length > 0) {
                console.log('✅ [SEEDER] Admin users já existem, não criando novos');
                return;
            }
            console.log('🌱 [SEEDER] Criando admin inicial no banco de dados...');
            // Admin inicial fixo - será gerenciado via banco depois
            const adminUser = {
                username: 'admin',
                email: 'admin@pizzaria.com',
                passwordHash: await AuthService.hashPassword('pizzaria123'),
                role: 'admin',
                isActive: true,
            };
            const createdAdmin = await storage.createAdminUser(adminUser);
            console.log('✅ [SEEDER] Admin criado no banco:', {
                id: createdAdmin.id,
                username: createdAdmin.username,
                email: createdAdmin.email,
                role: createdAdmin.role
            });
            console.log('🎉 [SEEDER] Admin inicial salvo no banco de dados!');
            console.log('📝 [SEEDER] Login: admin / pizzaria123');
            console.log('💡 [SEEDER] Altere a senha no painel administrativo após o primeiro login');
        }
        catch (error) {
            console.error('❌ [SEEDER] Erro ao criar admin users:', error);
            throw error;
        }
    }
    /**
     * Atualizar senha de admin existente
     */
    static async updateAdminPassword(username, newPassword) {
        try {
            const admin = await storage.getAdminByUsername(username);
            if (!admin) {
                console.error(`❌ [SEEDER] Admin '${username}' não encontrado`);
                return false;
            }
            const hashedPassword = await AuthService.hashPassword(newPassword);
            const updated = await storage.updateAdminUser(admin.id, {
                passwordHash: hashedPassword,
                updatedAt: new Date()
            });
            if (updated) {
                console.log(`✅ [SEEDER] Senha do admin '${username}' atualizada`);
                return true;
            }
            else {
                console.error(`❌ [SEEDER] Falha ao atualizar senha do admin '${username}'`);
                return false;
            }
        }
        catch (error) {
            console.error('❌ [SEEDER] Erro ao atualizar senha:', error);
            return false;
        }
    }
    /**
     * Listar todos os admins (sem senhas)
     */
    static async listAdmins() {
        try {
            const admins = await storage.getAllAdminUsers();
            console.log(`📋 [SEEDER] ${admins.length} admin(s) encontrado(s):`);
            admins.forEach((admin, index) => {
                console.log(`  ${index + 1}. ${admin.username} (${admin.email}) - ${admin.role} - ${admin.isActive ? 'Ativo' : 'Inativo'}`);
            });
        }
        catch (error) {
            console.error('❌ [SEEDER] Erro ao listar admins:', error);
        }
    }
}
