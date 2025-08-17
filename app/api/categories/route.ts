import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET handler para buscar todas as categorias
export async function GET() {
  try {
    // Buscar categorias usando Supabase
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .or('active.is.null,active.eq.true')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
    
    if (error) {
      logger.error('MODULE', 'Erro ao buscar categorias:', error)
      throw error
    }
    
    logger.debug('MODULE', '🔍 Resultado da query - total de linhas:', categories?.length || 0)
    categories?.forEach(row => {
      logger.debug('MODULE', `🔍 Categoria: ${row.name}, active: ${row.active}`)
    })

    // Normalizar os dados para garantir consistência
    const normalizedCategories = (categories || []).map(category => ({
      id: category.id,
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }))

    logger.debug('MODULE', '🔍 Categorias normalizadas - total:', normalizedCategories.length)
    normalizedCategories.forEach(cat => {
      logger.debug('MODULE', `🔍 Normalizada: ${cat.name}, active: ${cat.active}`)
    })

    return NextResponse.json({ categories: normalizedCategories })
  } catch (error) {
    logger.error('MODULE', 'Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar categorias' },
      { status: 500 }
    )
  }
}

// POST handler para criar uma nova categoria
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, image, sort_order } = body

    // Validar dados
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Criar categoria usando Supabase
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        description: description || '',
        image: image || '',
        sort_order: sort_order || 0
      })
      .select()
      .single()

    if (error) {
      logger.error('MODULE', 'Erro ao criar categoria:', error)
      throw error
    }
    
    // Normalizar resposta para manter consistência
    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    return NextResponse.json(normalizedCategory)
  } catch (error) {
    logger.error('MODULE', 'Erro ao criar categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar categoria' },
      { status: 500 }
    )
  }
}

// PUT handler para atualizar ordem das categorias
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { categoryOrders } = body

    if (!Array.isArray(categoryOrders)) {
      return NextResponse.json(
        { error: 'categoryOrders deve ser um array' },
        { status: 400 }
      )
    }

    // Atualizar ordem de cada categoria usando Supabase
    for (const { id, sort_order } of categoryOrders) {
      const { error } = await supabase
        .from('categories')
        .update({ sort_order })
        .eq('id', id)
      
      if (error) {
        logger.error('MODULE', `Erro ao atualizar categoria ${id}:`, error)
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('MODULE', 'Erro ao atualizar ordem das categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno ao atualizar ordem das categorias' },
      { status: 500 }
    )
  }
}
