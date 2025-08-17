import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    logger.debug('MODULE', "=== POST /api/orders/manual - INÍCIO ===")
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const body = await request.json()
    logger.debug('MODULE', "POST /api/orders/manual - Request body:", JSON.stringify(body, null, 2))

    // Extrair dados específicos para pedidos manuais
    const items = body.items || []
    const total = Number(body.total || 0)
    const subtotal = Number(body.subtotal || total)
    const delivery_fee = Number(body.delivery_fee || 0)
    const customerId = body.customerId // ID real do cliente
    const customerName = body.name || ""
    const customerPhone = body.phone || ""
    const orderType = body.orderType || "balcao" // "balcao" ou "telefone"
    const paymentMethod = body.paymentMethod || "PIX"
    const notes = body.notes || ""
    const deliveryAddress = body.deliveryAddress || ""

    // Definir endereço baseado no tipo se não fornecido
    const finalDeliveryAddress = deliveryAddress || (orderType === "balcao" ? "Manual (Balcão)" : "Manual (Telefone)")

    logger.debug('MODULE', "Dados extraídos para pedido manual:", {
      items_count: items.length,
      total,
      subtotal,
      delivery_fee,
      customerId,
      customerName,
      customerPhone,
      orderType,
      paymentMethod,
      deliveryAddress: finalDeliveryAddress
    })

    // Validações específicas para pedidos manuais
    if (!customerId || customerId.trim() === "") {
      return NextResponse.json({ 
        error: "ID do cliente é obrigatório para pedidos manuais" 
      }, { status: 400 })
    }

    if (!customerName || customerName.trim() === "") {
      return NextResponse.json({ 
        error: "Nome do cliente é obrigatório para pedidos manuais" 
      }, { status: 400 })
    }

    if (!customerPhone || customerPhone.trim() === "") {
      return NextResponse.json({ 
        error: "Telefone do cliente é obrigatório para pedidos manuais" 
      }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: "Itens do pedido são obrigatórios" 
      }, { status: 400 })
    }

    if (total <= 0) {
      return NextResponse.json({ 
        error: "Total do pedido deve ser maior que zero" 
      }, { status: 400 })
    }

    // Usar ID do cliente real
    const userId = customerId

    // Verificar se o cliente existe
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', userId)
      .eq('role', 'customer')
      .single()

    if (customerError || !customer) {
      throw new Error("Cliente não encontrado ou inválido")
    }

    logger.debug('MODULE', "Cliente encontrado:", customer.full_name)

    // Criar pedido manual
    logger.debug('MODULE', "Criando pedido manual...")
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: "RECEIVED",
        total,
        subtotal,
        delivery_fee,
        discount: 0,
        payment_method: paymentMethod,
        payment_status: "PENDING",
        delivery_address: finalDeliveryAddress,
        delivery_phone: customerPhone,
        delivery_instructions: notes || null,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        customer_name: customerName
      })
      .select()
      .single()

    if (orderError || !order) {
      throw new Error("Falha ao criar pedido manual")
    }

    logger.debug('MODULE', "Pedido manual criado com sucesso! ID:", order.id)

    // Inserir itens do pedido
    logger.debug('MODULE', `Inserindo ${items.length} itens no pedido manual...`)
    
    const orderItems = []
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const unit_price = Number(item.price || item.unit_price || 0)
      const quantity = Number(item.quantity || 1)
      
      // Limpar product_id
      let product_id = item.product_id || item.id
      if (product_id) {
        product_id = product_id.toString().replace(/--+$/, '').trim()
      }

      logger.debug('MODULE', `Preparando item ${i + 1}:`, {
        product_id,
        name: item.name,
        quantity,
        unit_price,
        size: item.size,
        toppings: item.toppings,
        notes: item.notes,
        isHalfAndHalf: item.isHalfAndHalf,
        halfAndHalf: item.halfAndHalf
      })

      if (!product_id) {
        throw new Error(`Item ${i + 1} não possui ID do produto`)
      }

      // Validar UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(product_id)) {
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
      throw new Error(`Falha ao inserir itens do pedido: ${itemsError.message}`)
    }

    logger.debug('MODULE', `${items.length} itens inseridos com sucesso`)

    logger.debug('MODULE', "Pedido manual criado com sucesso!")

    // Retornar resposta de sucesso
    return NextResponse.json({
      id: order.id,
      status: order.status,
      total: order.total,
      orderType: orderType,
      customerName: customerName,
      customerPhone: customerPhone,
      customerId: userId,
      deliveryAddress: finalDeliveryAddress,
      created_at: order.created_at,
      message: `Pedido manual ${orderType === 'balcao' ? '(Balcão)' : '(Telefone)'} criado com sucesso!`
    })
  } catch (error: any) {
    logger.error('MODULE', "=== ERRO COMPLETO NO POST /api/orders/manual ===")
    logger.error('MODULE', "Tipo:", error.constructor.name)
    logger.error('MODULE', "Mensagem:", error.message)
    logger.error('MODULE', "Stack:", error.stack)
    
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor ao criar pedido manual",
      details: {
        type: error.constructor.name,
        message: error.message
      }
    }, { status: 500 })
  }
}