import { neon } from '@neondatabase/serverless'

async function testConnection() {
  // Cole sua DATABASE_URL aqui para testar
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://...'
  
  console.log('🔍 Testando conexão com Neon...')
  console.log('📍 Host:', new URL(DATABASE_URL).hostname)
  console.log('👤 User:', new URL(DATABASE_URL).username)
  console.log('🗄️  Database:', new URL(DATABASE_URL).pathname.slice(1))
  
  try {
    const sql = neon(DATABASE_URL)
    
    // Teste simples
    const result = await sql`SELECT NOW() as timestamp, current_database() as db`
    
    console.log('\n✅ CONEXÃO BEM-SUCEDIDA!')
    console.log('⏰ Timestamp:', result[0].timestamp)
    console.log('🗄️  Database:', result[0].db)
    
    // Teste tabelas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    console.log('\n📋 Tabelas encontradas:', tables.length)
    tables.forEach((t: any) => console.log('  -', t.table_name))
    
  } catch (error: any) {
    console.error('\n❌ ERRO NA CONEXÃO:')
    console.error('Tipo:', error.constructor.name)
    console.error('Mensagem:', error.message)
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n🔧 SOLUÇÃO:')
      console.error('1. Acesse: https://console.neon.tech')
      console.error('2. Vá em Settings → Reset password')
      console.error('3. Copie a nova connection string completa')
      console.error('4. Atualize DATABASE_URL no Worker')
    }
    
    process.exit(1)
  }
}

testConnection()
