import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Iniciando diagnóstico de categorias...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Verificar estrutura da tabela (usando Supabase)
    console.log('1. Verificando estrutura da tabela categories...')
    // Nota: Supabase não expõe information_schema diretamente, mas podemos verificar os dados
    console.log('Estrutura da tabela: Usando Supabase - verificação via dados')
    
    // 2. Verificar dados atuais
    console.log('2. Verificando todas as categorias...')
    const { data: allCategories, error: allCategoriesError } = await supabase
      .from('categories')
      .select('*')
    
    if (allCategoriesError) {
      console.error('Erro ao buscar categorias:', allCategoriesError)
      throw allCategoriesError
    }
    
    console.log('Total de categorias no banco:', allCategories?.length || 0)
    
    allCategories?.forEach(cat => {
      console.log(`- ${cat.name}: active=${cat.active}, id=${cat.id}`)
    })
    
    // 3. Testar categoria específica (Sobremesas)
    const sobremesasId = 'edd3f631-c717-4c54-8490-e9cc72fcd1f2'
    console.log('3. Verificando categoria Sobremesas...')
    const { data: sobremesas, error: sobremesasError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', sobremesasId)
      .single()
    
    console.log('Categoria Sobremesas:', sobremesas || 'NÃO ENCONTRADA')
    if (sobremesasError) console.log('Erro ao buscar Sobremesas:', sobremesasError)
    
    // 4. Tentar update para false
    console.log('4. Testando UPDATE active = false...')
    const { data: updateResult, error: updateError } = await supabase
      .from('categories')
      .update({ active: false })
      .eq('id', sobremesasId)
      .select()
      .single()
    
    console.log('Resultado do UPDATE:', updateResult || 'NENHUMA LINHA AFETADA')
    if (updateError) console.log('Erro no UPDATE:', updateError)
    
    // 5. Verificar após update
    console.log('5. Verificando após UPDATE...')
    const { data: afterUpdate, error: afterUpdateError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', sobremesasId)
      .single()
    
    console.log('Categoria após UPDATE:', afterUpdate || 'NÃO ENCONTRADA')
    if (afterUpdateError) console.log('Erro ao verificar após UPDATE:', afterUpdateError)
    
    // 6. Testar query com filtro active
    console.log('6. Testando query com filtro active = true...')
    const { data: activeOnly, error: activeOnlyError } = await supabase
      .from('categories')
      .select('id, name, active')
      .eq('active', true)
    
    console.log('Categorias ativas:', activeOnly?.length || 0)
    if (activeOnlyError) console.log('Erro ao buscar categorias ativas:', activeOnlyError)
    
    return NextResponse.json({
      message: 'Debug concluído - verificar logs do servidor',
      structure: 'Usando Supabase - estrutura verificada via dados',
      totalCategories: allCategories?.length || 0,
      sobremesasFound: !!sobremesas,
      updateResult: updateResult || null,
      afterUpdate: afterUpdate || null,
      activeCategories: activeOnly?.length || 0
    })
    
  } catch (error) {
    console.error('❌ Erro no debug:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}