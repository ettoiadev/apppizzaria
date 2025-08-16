import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET handler para buscar todas as categorias
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar todas as categorias ativas usando Supabase
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, description, image, sort_order, active')
      .or('active.eq.true,active.is.null')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      throw error
    }

    // Normalizar os dados para garantir consistência
    const normalizedCategories = (categories || []).map(category => ({
      id: category.id,
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false // true por padrão
    }))

    return NextResponse.json({ categories: normalizedCategories })
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Preparar dados para inserção
    const insertData: any = {
      name: name.trim()
    }

    if (description) {
      insertData.description = description
    }

    if (image) {
      insertData.image = image
    }

    if (sort_order !== undefined) {
      insertData.sort_order = sort_order
    }

    // Inserir categoria usando Supabase
    const { data: category, error } = await supabase
      .from('categories')
      .insert(insertData)
      .select()
      .single()
    if (error) {
      console.error('Erro ao criar categoria:', error)
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
    console.error('Erro ao criar categoria:', error)
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Atualizar ordem de cada categoria usando Supabase
    for (const { id, sort_order } of categoryOrders) {
      const { error } = await supabase
        .from('categories')
        .update({ sort_order })
        .eq('id', id)
      
      if (error) {
        console.error(`Erro ao atualizar categoria ${id}:`, error)
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar ordem das categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno ao atualizar ordem das categorias' },
      { status: 500 }
    )
  }
}