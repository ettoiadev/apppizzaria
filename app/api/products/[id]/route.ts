import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from "@/lib/auth"
import { logger } from '@/lib/logger'

// GET - Buscar um produto específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar produto com categoria
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(name)
      `)
      .eq('id', params.id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const normalizedProduct = {
      ...product,
      category_name: product.categories?.name,
      categoryId: product.category_id,
      available: Boolean(product.active), // Mapear 'active' para 'available' na resposta
      showImage: Boolean(product.show_image ?? true),
      productNumber: product.product_number,
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
      toppings: product.toppings ? (typeof product.toppings === 'string' ? JSON.parse(product.toppings) : product.toppings) : []
    }

    return NextResponse.json({ product: normalizedProduct })
  } catch (error) {
    logger.error('MODULE', "Erro ao buscar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar um produto
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    logger.debug('MODULE', `PUT /api/products/${params.id} - Iniciando atualização`)
    
    const body = await request.json()
    const { name, description, price, category_id, categoryId, image, available, showImage, sizes, toppings } = body

    // Garantir compatibilidade entre categoryId e category_id
    const finalCategoryId = categoryId || category_id

    // Validar dados obrigatórios
    if (!name?.trim() || price === undefined || price < 0) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios e o preço deve ser positivo" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Preparar dados para atualização
    const updateData = {
      name: name.trim(),
      description: description || null,
      price: Number(price),
      category_id: finalCategoryId || null,
      image: image || null,
      active: Boolean(available),
      updated_at: new Date().toISOString()
    }

    // Remover campos undefined/null para evitar erros
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    logger.debug('MODULE', 'Dados para atualização:', updateData)

    // Atualizar produto
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      logger.error('MODULE', 'Erro do Supabase ao atualizar produto:', error)
      return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Normalizar resposta
    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      available: Boolean(product.active),
      showImage: Boolean(product.show_image ?? true),
      productNumber: product.product_number,
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
      toppings: product.toppings ? (typeof product.toppings === 'string' ? JSON.parse(product.toppings) : product.toppings) : []
    }

    logger.debug('MODULE', 'Produto atualizado com sucesso:', normalizedProduct.name)
    return NextResponse.json({ product: normalizedProduct })
    
  } catch (error) {
    logger.error('MODULE', "Erro ao atualizar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PATCH - Atualizar parcialmente um produto (ex: apenas disponibilidade)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    logger.debug('MODULE', 'PATCH body received:', body)
    logger.debug('MODULE', 'Product ID:', params.id)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Suportar tanto categoryId quanto category_id
    const processedBody = { ...body }
    if (body.categoryId && !body.category_id) {
      processedBody.category_id = body.categoryId
      delete processedBody.categoryId
    }
    
    // Suportar tanto showImage quanto show_image
    if (body.showImage !== undefined && !body.show_image) {
      processedBody.show_image = body.showImage
      delete processedBody.showImage
    }

    // Preparar dados de atualização
    const updateData: any = { updated_at: new Date().toISOString() }
    const validFields = ["name", "description", "price", "category_id", "image", "active", "show_image", "sizes", "toppings"]
    
    Object.entries(processedBody).forEach(([key, value]) => {
      if (validFields.includes(key)) {
        // Converter arrays para JSON se necessário
        if ((key === 'sizes' || key === 'toppings') && Array.isArray(value)) {
          updateData[key] = JSON.stringify(value)
        } else {
          // Mapear 'available' para 'active' para compatibilidade
          if (key === 'available') {
            updateData['active'] = value
          } else {
            updateData[key] = value
          }
        }
      }
    })

    if (Object.keys(updateData).length === 1) { // Apenas updated_at
      return NextResponse.json({ error: "Nenhum campo válido para atualização" }, { status: 400 })
    }

    logger.debug('MODULE', 'Update data:', updateData)

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Normalizar resposta
    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      available: Boolean(product.active), // Mapear 'active' para 'available' na resposta
      showImage: Boolean(product.show_image),
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
      toppings: product.toppings ? (typeof product.toppings === 'string' ? JSON.parse(product.toppings) : product.toppings) : []
    }

    logger.debug('MODULE', 'Product updated successfully:', normalizedProduct)
    return NextResponse.json({ product: normalizedProduct })
  } catch (error) {
    logger.error('MODULE', "Erro ao atualizar produto:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Excluir um produto
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Primeiro, verificar se o produto existe
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('id', params.id)
      .single()

    if (checkError || !existingProduct) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Em vez de excluir, marcar como inativo
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ message: "Produto excluído com sucesso" })
  } catch (error) {
    logger.error('MODULE', "Erro ao excluir produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
