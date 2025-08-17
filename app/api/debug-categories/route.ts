import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  logger.api('GET', '/api/debug-categories')
  
  try {
    const supabase = createClient()
    
    // Verificar se a tabela categories existe
    logger.database('SELECT', 'categories', { operation: 'table_check' })
    const { data: tableInfo, error: tableError } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    
    if (tableError) {
      logger.databaseError('SELECT', 'categories', tableError)
      return NextResponse.json({ 
        error: 'Erro ao acessar tabela categories', 
        details: tableError 
      }, { status: 500 })
    }
    
    logger.info('DEBUG_CATEGORIES', 'Tabela categories acessível')
    
    // Buscar todas as categorias
    logger.database('SELECT', 'categories', { operation: 'fetch_all' })
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (categoriesError) {
      logger.databaseError('SELECT', 'categories', categoriesError)
      return NextResponse.json({ 
        error: 'Erro ao buscar categorias', 
        details: categoriesError 
      }, { status: 500 })
    }
    
    logger.info('DEBUG_CATEGORIES', `Total de categorias encontradas: ${categories?.length || 0}`)
    
    // Verificar produtos por categoria
    logger.database('SELECT', 'products', { operation: 'fetch_by_category' })
    const categoriesWithProducts = await Promise.all(
      (categories || []).map(async (category) => {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .eq('category_id', category.id)
        
        if (productsError) {
          logger.databaseError('SELECT', 'products', {
            ...productsError,
            category: category.name
          })
        }
        
        return {
          ...category,
          products_count: products?.length || 0,
          products: products || []
        }
      })
    )
    
    const duration = Date.now() - startTime
    logger.performance('debug-categories', duration)
    logger.info('DEBUG_CATEGORIES', 'Verificação concluída com sucesso')
    
    return NextResponse.json({
      success: true,
      total_categories: categories?.length || 0,
      categories: categoriesWithProducts,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    logger.performance('debug-categories', duration)
    logger.apiError('GET', '/api/debug-categories', error)
    return NextResponse.json({ 
      error: 'Erro inesperado', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}