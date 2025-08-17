import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    logger.debug('MODULE', 'GET /api/categories/[id] - ID:', params.id)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !category) {
      logger.debug('MODULE', 'Categoria não encontrada:', params.id)
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    logger.debug('MODULE', 'Categoria encontrada:', normalizedCategory)
    return NextResponse.json({ category: normalizedCategory })
  } catch (error) {
    logger.error('MODULE', "Erro ao buscar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    logger.debug('MODULE', 'PUT /api/categories/[id] - ID:', params.id)
    
    // Validar se o ID foi fornecido
    if (!params.id || params.id.trim() === '') {
      logger.error('MODULE', 'ID da categoria não fornecido')
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    // Parse do body com tratamento de erro
    let body
    try {
      body = await request.json()
      logger.debug('MODULE', 'Body recebido:', body)
    } catch (parseError) {
      logger.error('MODULE', 'Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json(
        { error: "Dados JSON inválidos" },
        { status: 400 }
      )
    }

    const { name, description, image, active } = body

    // Validação robusta dos dados
    if (!name || typeof name !== 'string' || !name.trim()) {
      logger.error('MODULE', 'Nome da categoria inválido:', name)
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório e deve ser uma string válida" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se a categoria existe antes de tentar atualizar
    const { data: existingCategory, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .single()

    if (checkError || !existingCategory) {
      logger.error('MODULE', 'Categoria não encontrada para update:', params.id)
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    // Preparar valores com valores padrão seguros
    const updateName = name.trim()
    const updateDescription = (description && typeof description === 'string') ? description.trim() : ''
    const updateImage = (image && typeof image === 'string') ? image.trim() : ''
    const updateActive = active !== undefined ? Boolean(active) : true

    logger.debug('MODULE', 'Valores para update:', {
      name: updateName,
      description: updateDescription, 
      image: updateImage,
      active: updateActive,
      id: params.id
    })

    // Atualizar categoria usando Supabase
    const updateData = {
      name: updateName,
      description: updateDescription,
      image: updateImage,
      active: updateActive,
      updated_at: new Date().toISOString()
    }

    const { data: result, error: updateError } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError || !result) {
      logger.error('MODULE', 'Erro ao atualizar categoria:', updateError)
      return NextResponse.json(
        { error: "Categoria não encontrada ou não foi possível atualizar" },
        { status: 404 }
      )
    }

    // Normalizar resposta para manter consistência
    const normalizedCategory = {
      id: result.id,
      name: result.name,
      description: result.description || '',
      image: result.image || '',
      sort_order: result.sort_order || 0,
      active: result.active !== false
    }

    logger.debug('MODULE', 'Categoria atualizada com sucesso:', normalizedCategory)
    return NextResponse.json(normalizedCategory)

  } catch (error: any) {
    logger.error('MODULE', "Erro completo ao atualizar categoria:", {
      message: error.message,
      stack: error.stack,
      id: params?.id
    })
    
    // Retornar erro mais específico se possível
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json({ 
        error: "Erro de estrutura da tabela",
        details: "Uma coluna necessária não existe na tabela categories. Execute o script de migração.",
        technicalDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }
    
    if (error.message.includes('invalid input syntax')) {
      return NextResponse.json({ 
        error: "Formato de dados inválido",
        details: error.message 
      }, { status: 400 })
    }
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return NextResponse.json({ 
        error: "Tabela categories não encontrada",
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    logger.debug('MODULE', 'DELETE /api/categories/[id] - ID:', params.id)
    
    // Validar se o ID foi fornecido
    if (!params.id || params.id.trim() === '') {
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se a categoria existe primeiro
    const { data: existingCategory, error: checkError } = await supabase
      .from('categories')
      .select('id, name, active')
      .eq('id', params.id)
      .single()

    if (checkError || !existingCategory) {
      logger.debug('MODULE', 'Categoria não encontrada para exclusão:', params.id)
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    logger.debug('MODULE', 'Categoria antes da exclusão:', existingCategory)

    // Verificar se existem produtos usando esta categoria
    const { count: activeProductsCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .eq('active', true)

    if (countError) {
      logger.error('MODULE', 'Erro ao verificar produtos:', countError)
      return NextResponse.json({ error: "Erro ao verificar produtos da categoria" }, { status: 500 })
    }

    logger.debug('MODULE', `Categoria ${params.id} possui ${activeProductsCount || 0} produtos ativos`)

    if ((activeProductsCount || 0) > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir categoria que possui ${activeProductsCount} produto(s) ativo(s)` },
        { status: 400 }
      )
    }

    // Marcar como inativa em vez de excluir fisicamente
    const { data: result, error: updateError } = await supabase
      .from('categories')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('id, name, active')
      .single()

    if (updateError || !result) {
      logger.error('MODULE', 'Falha ao atualizar categoria:', updateError)
      return NextResponse.json({ error: "Falha ao excluir categoria" }, { status: 500 })
    }

    logger.debug('MODULE', 'Categoria marcada como inativa com sucesso:', result)
    
    return NextResponse.json({ 
      message: "Categoria excluída com sucesso",
      success: true,
      category: result
    })
    
  } catch (error: any) {
    logger.error('MODULE', "Erro ao excluir categoria:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
}