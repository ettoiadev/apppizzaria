import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET handler para buscar TODOS os produtos do banco de dados
export async function GET() {
  try {
    // Buscar produtos com join de categorias usando Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(name)
      `)
      .eq('active', true)
      .order('product_number', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Erro ao buscar produtos:', error)
      throw error
    }
    
    console.log('Query executada, produtos encontrados:', products?.length || 0)
    
    // Se não houver produtos, verificar todos os produtos ativos
    if (!products || products.length === 0) {
      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
      
      console.log('Produtos sem filtro available:', allProducts?.length || 0)
      
      // Verificar quantos estão como available = false
      const unavailable = allProducts?.filter(p => !p.available) || []
      console.log('Produtos indisponíveis:', unavailable.length)
    }

    // Garantir que todos os produtos tenham propriedades essenciais
    const normalizedProducts = (products || []).map((product, index) => ({
      ...product,
      name: product.name || "",
      description: product.description || "",
      categoryId: product.category_id || product.categoryId,
      category_name: product.categories?.name || '',
      available: Boolean(product.available),
      showImage: Boolean(product.show_image ?? true),
      // Se product_number não existir, usar índice + 1 como fallback
      productNumber: product.product_number || (index + 1),
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
      toppings: product.toppings ? (typeof product.toppings === 'string' ? JSON.parse(product.toppings) : product.toppings) : []
    }))

    return NextResponse.json(normalizedProducts)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar produtos' },
      { status: 500 }
    )
  }
}

// POST handler para CRIAR um novo produto no banco de dados
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, categoryId, category_id, image, available = true, showImage = true, sizes, toppings } = body

    // Garantir compatibilidade entre categoryId e category_id
    const finalCategoryId = categoryId || category_id

    // Validar dados obrigatórios
    if (!name?.trim() || price === undefined || price < 0) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios e o preço deve ser positivo' },
        { status: 400 }
      )
    }

    if (!finalCategoryId) {
      return NextResponse.json(
        { error: 'Categoria é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar se existem produtos ativos para resetar numeração se necessário
    const { count: activeCount, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
    
    if (countError) {
      console.error('Erro ao contar produtos ativos:', countError)
    }
    
    console.log(`Produtos ativos encontrados: ${activeCount || 0}`)
    
    // Se não há produtos ativos, resetar a sequência de numeração
    if (!activeCount || activeCount === 0) {
      console.log('Nenhum produto ativo encontrado. Resetando sequência de numeração para 1.')
      try {
        // Usar função RPC do Supabase para resetar sequência
        const { error: resetError } = await supabase.rpc('reset_products_sequence')
        if (resetError) {
          console.log('Erro ao resetar sequência:', resetError)
        } else {
          console.log('Sequência resetada com sucesso')
        }
      } catch (seqError) {
        console.log('Erro ao resetar sequência:', seqError)
      }
    }

    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        description: description?.trim() || '',
        price,
        category_id: finalCategoryId,
        image: image || null,
        available,
        show_image: showImage,
        sizes: sizes ? JSON.stringify(sizes) : null,
        toppings: toppings ? JSON.stringify(toppings) : null,
        active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir produto:', insertError)
      throw insertError
    }

    // Normalizar resposta
    const normalizedProduct = {
      ...product,
      categoryId: product.category_id,
      available: Boolean(product.available),
      showImage: Boolean(product.show_image ?? true),
      productNumber: product.product_number,
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
      toppings: product.toppings ? (typeof product.toppings === 'string' ? JSON.parse(product.toppings) : product.toppings) : []
    }

    console.log(`Produto criado com sucesso: ${normalizedProduct.name} - Número: ${normalizedProduct.productNumber}`)
    
    return NextResponse.json({ product: normalizedProduct })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar produto' },
      { status: 500 }
    )
  }
}
