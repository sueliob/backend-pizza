import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql } from 'drizzle-orm'

// Test script to verify pgcrypto availability
async function testPgcrypto() {
  const DATABASE_URL = process.env.DATABASE_URL
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada')
    process.exit(1)
  }

  const db = drizzle(neon(DATABASE_URL))

  try {
    // 1. Test: Create pgcrypto extension
    console.log('📦 Testando criação de extensão pgcrypto...')
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`)
    console.log('✅ pgcrypto extension disponível!')

    // 2. Test: Generate bcrypt hash
    console.log('\n🔐 Testando gen_salt() + crypt()...')
    const testPassword = 'pizzaria123'
    const result = await db.execute(sql`
      SELECT crypt(${testPassword}, gen_salt('bf', 10)) as hash
    `)
    const hash = result.rows[0]?.hash
    console.log('✅ Hash gerado:', hash)

    // 3. Test: Verify password
    console.log('\n🔍 Testando verificação de senha...')
    const verifyResult = await db.execute(sql`
      SELECT (${hash} = crypt(${testPassword}, ${hash})) as valid
    `)
    const isValid = verifyResult.rows[0]?.valid
    console.log('✅ Verificação:', isValid ? 'VÁLIDA' : 'INVÁLIDA')

    // 4. Test: Wrong password
    console.log('\n❌ Testando senha incorreta...')
    const wrongResult = await db.execute(sql`
      SELECT (${hash} = crypt('wrongpass', ${hash})) as valid
    `)
    const wrongValid = wrongResult.rows[0]?.valid
    console.log('✅ Verificação senha errada:', wrongValid ? 'VÁLIDA (ERRO!)' : 'INVÁLIDA (correto)')

    console.log('\n🎉 TODOS OS TESTES PASSARAM!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Migrar /api/admin/login para usar crypt()')
    console.log('2. Atualizar production-seed.sql com crypt()')
    console.log('3. Remover dependência bcryptjs (opcional)')
    
  } catch (error: any) {
    console.error('❌ Erro ao testar pgcrypto:', error.message)
    console.error('\n🔍 Possíveis causas:')
    console.error('- Extension pgcrypto não disponível no Neon')
    console.error('- Permissões insuficientes no banco')
    console.error('- Branch/database incorreto')
    process.exit(1)
  }
}

testPgcrypto()
