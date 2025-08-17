import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from "@/lib/auth"
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId") || searchParams.get("user_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    logger.debug('MODULE', "GET /api/orders - Fetching orders with params:", { status, userId, limit, offset })

    // Construir query do Supabase
    let ordersQuery = supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          size,
          toppings,
          special_instructions,
          products:product_id(
            name,
            description,
            image
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (status && status !== "all") {
      ordersQuery = ordersQuery.eq('status', status)
    }

    if (userId) {
      ordersQuery = ordersQuery.eq('user_id', userId)
    }

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) {
      logger.error('MODULE', 'Erro ao buscar pedidos:', ordersError)
      throw ordersError
    }

    // Buscar estatísticas
    let statsQuery = supabase
      .from('orders')
      .select('status, total')

    if (userId) {
      statsQuery = statsQuery.eq('user_id', userId)
    }

    const { data: stats, error: statsError } = await statsQuery

    if (statsError) {
      logger.error('MODULE', 'Erro ao buscar estatísticas:', statsError)
      throw statsError
    }

    const statistics = {
      total: stats?.length || 0,
      received: stats?.filter((o) => o.status === "RECEIVED").length || 0,
      preparing: stats?.filter((o) => o.status === "PREPARING").length || 0,
      onTheWay: stats?.filter((o) => o.status === "ON_THE_WAY").length || 0,
      delivered: stats?.filter((o) => o.status === "DELIVERED").length || 0,
      cancelled: stats?.filter((o) => o.status === "CANCELLED").length || 0,
      totalRevenue: stats
        ?.filter((o) => o.status === "DELIVERED")
        .reduce((sum, o) => sum + Number.parseFloat(o.total), 0) || 0,
    }

    // Buscar dados dos profiles para os pedidos que têm user_id
    const userIds = orders?.filter(order => order?.user_id).map(order => order.user_id) || []
    let profilesData: any[] = []
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds)
      profilesData = profiles || []
    }

    // Processar orders para adicionar campos calculados
    const processedOrders = orders?.map(order => {
      const profile = profilesData.find(p => p.id === order.user_id)
      return {
        ...order,
        customer_display_name: profile?.full_name || order.customer_name,
        customer_display_phone: order.delivery_phone || profile?.phone,
        full_name: profile?.full_name,
        phone: profile?.phone
      }
    }) || []

    return NextResponse.json({
      orders: processedOrders,
      statistics,
      pagination: {
        limit,
        offset,
        hasMore: (orders?.length || 0) === limit,
      },
    })
  } catch (error) {
    logger.error('MODULE', "Unexpected error in GET /api/orders:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.debug('MODULE', "=== POST /api/orders - INÍCIO ===")
    
    const body = await request.json()
    logger.debug('MODULE', "POST /api/orders - Request body completo:", JSON.stringify(body, null, 2))

    // Extrair e validar dados com logs detalhados
    const user_id = body.customerId || body.user_id
    const items = body.items || []
    const total = Number(body.total || 0)
    const subtotal = Number(body.subtotal || total)
    const delivery_fee = Number(body.delivery_fee || 0)
    const delivery_address = body.address || body.delivery_address || ""
    const delivery_phone = body.phone || body.delivery_phone || ""
    const customer_name = body.name || ""
    const payment_method = body.paymentMethod || body.payment_method || "PIX"
    const delivery_instructions = body.notes || body.delivery_instructions || null

    logger.debug('MODULE', "Dados extraídos:", {
      user_id,
      items_count: items.length,
      total,
      subtotal,
      delivery_fee,
      delivery_address,
      delivery_phone,
      payment_method,
      delivery_instructions
    })

    // Validações com mensagens específicas
    if (!user_id) {
      logger.error('MODULE', "ERRO: ID do usuário não fornecido")
      return NextResponse.json({ 
        error: "ID do usuário é obrigatório",
        details: "user_id não foi fornecido no body da requisição" 
      }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      logger.error('MODULE', "ERRO: Itens inválidos ou vazios")
      return NextResponse.json({ 
        error: "Itens do pedido são obrigatórios",
        details: "Array de itens está vazio ou inválido" 
      }, { status: 400 })
    }

    if (!delivery_address) {
      logger.error('MODULE', "ERRO: Endereço de entrega obrigatório", { delivery_address })
      return NextResponse.json({ 
        error: "Endereço de entrega é obrigatório",
        details: `Endereço: ${delivery_address || 'vazio'}` 
      }, { status: 400 })
    }

    if (total <= 0) {
      logger.error('MODULE', "ERRO: Total inválido", { total })
      return NextResponse.json({ 
        error: "Total do pedido deve ser maior que zero",
        details: `Total recebido: ${total}` 
      }, { status: 400 })
    }

    try {
      // Atualizar perfil do usuário com nome e telefone se fornecidos e não existirem
      if (customer_name || delivery_phone) {
        logger.debug('MODULE', "Atualizando perfil do usuário com dados do pedido...")
        
        const updateData: any = {}
        
        if (customer_name) {
          updateData.full_name = customer_name
        }
        
        if (delivery_phone) {
          updateData.phone = delivery_phone
        }
        
        if (Object.keys(updateData).length > 0) {
          // Buscar perfil atual para verificar campos vazios
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', user_id)
            .single()
            
          const finalUpdateData: any = { updated_at: new Date().toISOString() }
          
          if (customer_name && (!currentProfile?.full_name || currentProfile.full_name.trim() === '')) {
            finalUpdateData.full_name = customer_name
          }
          
          if (delivery_phone && (!currentProfile?.phone || currentProfile.phone.trim() === '')) {
            finalUpdateData.phone = delivery_phone
          }
          
          if (Object.keys(finalUpdateData).length > 1) { // Mais que apenas updated_at
            const { error: profileError } = await supabase
              .from('profiles')
              .update(finalUpdateData)
              .eq('id', user_id)
              
            if (profileError) {
              logger.error('MODULE', 'Erro ao atualizar perfil:', profileError)
              // Não falhar o pedido por erro no perfil
            } else {
              logger.debug('MODULE', "Perfil do usuário atualizado com sucesso")
            }
          }
        }
      }
      // Criar pedido
      logger.debug('MODULE', "Inserindo pedido no banco com dados:", {
        user_id,
        status: "RECEIVED",
        total,
        subtotal,
        delivery_fee,
        payment_method,
        delivery_address: delivery_address.substring(0, 50) + "...", // Log parcial do endereço
        delivery_phone: delivery_phone || null,
        customer_name: customer_name || null
      })

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id,
          status: "RECEIVED",
          total,
          subtotal,
          delivery_fee,
          discount: 0,
          payment_method,
          payment_status: "PENDING",
          delivery_address,
          delivery_phone,
          delivery_instructions,
          estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          customer_name,
        })
        .select()
        .single()

      if (orderError || !order) {
        logger.error('MODULE', 'Erro ao criar pedido:', orderError)
        throw new Error("Falha ao criar pedido - " + (orderError?.message || "nenhum registro retornado"))
      }

      logger.debug('MODULE', "Pedido criado com sucesso! ID:", order.id)

      // Criar itens do pedido
      logger.debug('MODULE', `Inserindo ${items.length} itens do pedido...`)
      
      const orderItems = []
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const unit_price = Number(item.price || item.unit_price || 0)
        const quantity = Number(item.quantity || 1)
        
        // Limpar product_id removendo caracteres inválidos como "--"
        let product_id = item.product_id || item.id
        if (product_id) {
          product_id = product_id.toString().replace(/--+$/, '') // Remove -- do final
          product_id = product_id.trim() // Remove espaços
        }

        logger.debug('MODULE', `Item ${i + 1}:`, {
          product_id_original: item.product_id || item.id,
          product_id_limpo: product_id,
          name: item.name,
          quantity,
          unit_price,
          size: item.size,
          toppings: item.toppings,
          notes: item.notes,
          isHalfAndHalf: item.isHalfAndHalf,
          halfAndHalf: item.halfAndHalf,
          total: quantity * unit_price
        })

        if (!product_id) {
          logger.error('MODULE', `ERRO: Item ${i + 1} sem product_id`)
          throw new Error(`Item ${i + 1} não possui ID do produto`)
        }

        // Validar se é um UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(product_id)) {
          logger.error('MODULE', `ERRO: Item ${i + 1} com product_id inválido:`, product_id)
          throw new Error(`Item ${i + 1} possui ID de produto inválido: ${product_id}`)
        }

        orderItems.push({
          order_id: order.id,
          product_id,
          name: item.name || '',
          quantity,
          unit_price,
          total_price: quantity * unit_price,
          size: item.size || null,
          toppings: JSON.stringify(item.toppings || []),
          special_instructions: item.notes || null,
          half_and_half: item.halfAndHalf ? JSON.stringify(item.halfAndHalf) : null
        })
      }
      
      // Inserir todos os itens de uma vez
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        
      if (itemsError) {
        logger.error('MODULE', 'Erro ao inserir itens do pedido:', itemsError)
        throw new Error(`Falha ao inserir itens do pedido: ${itemsError.message}`)
      }
      
      logger.debug('MODULE', `${items.length} itens inseridos com sucesso`)

      logger.debug('MODULE', "Pedido e itens criados com sucesso!")

      // Sistema de atualização manual via interface administrativa

      // Retornar o pedido criado
      logger.debug('MODULE', "Pedido criado com sucesso! Retornando resposta...")
      
      return NextResponse.json({
        id: order.id,
        status: order.status,
        total: order.total,
        created_at: order.created_at,
        message: "Pedido criado com sucesso!"
      })
      
    } catch (innerError: any) {
      logger.error('MODULE', "ERRO durante criação do pedido:", innerError)
      throw innerError
    }
  } catch (error: any) {
    logger.error('MODULE', "=== ERRO COMPLETO NO POST /api/orders ===")
    logger.error('MODULE', "Tipo:", error.constructor.name)
    logger.error('MODULE', "Mensagem:", error.message)
    logger.error('MODULE', "Stack:", error.stack)
    
    if (error.code) {
      logger.error('MODULE', "Código Supabase:", error.code)
      logger.error('MODULE', "Detalhe:", error.detail)
      logger.error('MODULE', "Hint:", error.hint)
    }
    
    // Retornar erro detalhado
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor",
      details: {
        type: error.constructor.name,
        code: error.code,
        message: error.message,
        hint: error.hint,
        detail: error.detail
      }
    }, { status: 500 })
  }
}
