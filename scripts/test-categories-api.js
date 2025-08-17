const { query } = require('../lib/db');

async function testCategoriesAPI() {
  try {
    logger.debug('MODULE', '🔍 Verificando estrutura da tabela categories...\n');
    
    // 1. Verificar estrutura da tabela
    const tableStructure = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    logger.debug('MODULE', '📋 Estrutura da tabela categories:');
    console.table(tableStructure.rows);
    
    // 2. Verificar categorias existentes
    const categories = await query('SELECT id, name, description, active FROM categories LIMIT 5');
    logger.debug('MODULE', '\n📋 Categorias existentes:');
    console.table(categories.rows);
    
    // 3. Testar operação UPDATE simples
    if (categories.rows.length > 0) {
      const testCategory = categories.rows[0];
      logger.debug('MODULE', `\n🧪 Testando UPDATE na categoria: ${testCategory.name}`);
      
      const updateResult = await query(`
        UPDATE categories 
        SET description = $1
        WHERE id = $2 
        RETURNING *
      `, ['Descrição de teste - ' + new Date().toISOString(), testCategory.id]);
      
      if (updateResult.rows.length > 0) {
        logger.debug('MODULE', '✅ UPDATE funcionou corretamente!');
        logger.debug('MODULE', 'Resultado:', updateResult.rows[0]);
      } else {
        logger.debug('MODULE', '❌ UPDATE não retornou resultados');
      }
    }
    
    logger.debug('MODULE', '\n✅ Todos os testes concluídos!');
    
  } catch (error) {
    logger.error('MODULE', '❌ Erro nos testes:', error);
  } finally {
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testCategoriesAPI();
}

module.exports = { testCategoriesAPI }; 