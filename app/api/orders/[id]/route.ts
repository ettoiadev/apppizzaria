import { NextResponse, type NextRequest } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.debug('MODULE', "GET /api/orders/[id] - Buscando pedido:", params.id)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar o pedido com dados do cliente
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey(
          full_name,
          phone
        )
      `)
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      logger.debug('MODULE', "Pedido não encontrado:", params.id)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // Buscar itens do pedido com dados dos produtos
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products(
          name
        )
      `)
      .eq('order_id', params.id)
      .order('created_at')

    if (itemsError) {
      logger.error('MODULE', "Erro ao buscar itens do pedido:", itemsError)
      return NextResponse.json({ error: "Erro ao buscar itens do pedido" }, { status: 500 })
    }

    // Formatar itens para compatibilidade
    const formattedItems = (orderItems || []).map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      price: item.unit_price,
      size: item.size,
      toppings: item.toppings,
      special_instructions: item.special_instructions,
      name: item.products?.name || 'Produto'
    }))

    logger.debug('MODULE', "Pedido encontrado:", order.id, "com", formattedItems.length, "itens")

    // Adicionar itens ao pedido
    const orderWithItems = {
      ...order,
      order_items: formattedItems,
      full_name: order.profiles?.full_name,
      phone: order.profiles?.phone
    }

    // Normalizar dados para compatibilidade
    const normalizedOrder = {
      ...orderWithItems,
      items: orderWithItems.order_items || [], // Adicionar alias 'items'
      customer: {
        name: orderWithItems.full_name || "Cliente",
        phone: orderWithItems.phone || orderWithItems.delivery_phone,
        address: orderWithItems.delivery_address
      },
      createdAt: orderWithItems.created_at,
      estimatedDelivery: orderWithItems.estimated_delivery_time,
      paymentMethod: orderWithItems.payment_method
    }

    logger.debug('MODULE', "Dados normalizados:", {
      id: normalizedOrder.id,
      items_count: normalizedOrder.items.length,
      customer_name: normalizedOrder.customer.name
    })

    return NextResponse.json(normalizedOrder)
  } catch (error) {
    logger.error('MODULE', "Error fetching order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { status, delivery_instructions, estimated_delivery_time } = body

    // Build dynamic update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
    }

    if (delivery_instructions !== undefined) {
      updateData.delivery_instructions = delivery_instructions
    }

    if (estimated_delivery_time) {
      updateData.estimated_delivery_time = estimated_delivery_time
    }

    // Check if there are fields to update (besides updated_at)
    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !updatedOrder) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Pedido atualizado com sucesso",
      order: updatedOrder 
    })
  } catch (error) {
    logger.error('MODULE', "Error updating order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First check if order exists
    const { data: order, error: checkError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', params.id)
      .single()

    if (checkError || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // Only allow deletion of certain statuses
    if (!['RECEIVED', 'CANCELLED'].includes(order.status)) {
      return NextResponse.json({ 
        error: "Não é possível excluir pedidos em andamento" 
      }, { status: 400 })
    }

    // Delete order (this will cascade delete order_items due to foreign key constraint)
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: "Falha ao excluir pedido" }, { status: 500 })
    }

    return NextResponse.json({ message: "Pedido excluído com sucesso" })
  } catch (error) {
    logger.error('MODULE', "Error deleting order:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
