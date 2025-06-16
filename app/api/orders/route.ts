import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("GET /api/orders - Fetching orders with params:", { status, limit, offset })

    let query = supabase
      .from("orders")
      .select(`
        *,
        profiles!orders_user_id_fkey(full_name, phone),
        order_items(
          *,
          products(name, description, image)
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtrar por status se especificado
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Erro ao buscar pedidos", details: error.message }, { status: 500 })
    }

    console.log("Orders fetched successfully:", orders?.length || 0)

    // Calcular estatísticas dos pedidos
    const { data: stats, error: statsError } = await supabase.from("orders").select("status, total")

    if (statsError) {
      console.error("Error fetching stats:", statsError)
    }

    const statistics = {
      total: stats?.length || 0,
      received: stats?.filter((o) => o.status === "RECEIVED").length || 0,
      preparing: stats?.filter((o) => o.status === "PREPARING").length || 0,
      onTheWay: stats?.filter((o) => o.status === "ON_THE_WAY").length || 0,
      delivered: stats?.filter((o) => o.status === "DELIVERED").length || 0,
      cancelled: stats?.filter((o) => o.status === "CANCELLED").length || 0,
      totalRevenue:
        stats?.filter((o) => o.status === "DELIVERED").reduce((sum, o) => sum + Number.parseFloat(o.total), 0) || 0,
    }

    return NextResponse.json({
      orders: orders || [],
      statistics,
      pagination: {
        limit,
        offset,
        hasMore: (orders?.length || 0) === limit,
      },
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/orders:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    console.log("POST /api/orders - Received request body:", JSON.stringify(body, null, 2))

    // Extrair e validar dados
    const user_id = body.customerId || body.user_id
    const items = body.items || []
    const total = Number(body.total || 0)

    // Dados de entrega
    const delivery_address = body.address || body.delivery_address || ""
    const delivery_phone = body.phone || body.delivery_phone || ""
    const payment_method = body.paymentMethod || body.payment_method || "pix"
    const delivery_instructions = body.notes || body.delivery_instructions || null

    console.log("POST /api/orders - Processed data:", {
      user_id,
      items_count: items.length,
      total,
      delivery_address,
      delivery_phone,
      payment_method,
      delivery_instructions,
    })

    // Validações obrigatórias
    if (!user_id) {
      console.error("Missing user_id")
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("Missing or invalid items:", items)
      return NextResponse.json({ error: "Itens do pedido são obrigatórios" }, { status: 400 })
    }

    if (!delivery_address || !delivery_phone) {
      console.error("Missing delivery data:", { delivery_address, delivery_phone })
      return NextResponse.json({ error: "Endereço e telefone de entrega são obrigatórios" }, { status: 400 })
    }

    if (total <= 0) {
      console.error("Invalid total:", total)
      return NextResponse.json({ error: "Total do pedido deve ser maior que zero" }, { status: 400 })
    }

    // Calcular valores
    const subtotal = total
    const delivery_fee = 0
    const discount = 0

    // Preparar dados do pedido
    const orderData = {
      user_id,
      status: "RECEIVED",
      total,
      subtotal,
      delivery_fee,
      discount,
      payment_method,
      payment_status: "PENDING",
      delivery_address,
      delivery_phone,
      delivery_instructions,
      estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    }

    console.log("POST /api/orders - Creating order with data:", orderData)

    // Criar o pedido
    const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      return NextResponse.json(
        {
          error: "Erro ao criar pedido",
          details: orderError.message,
          code: orderError.code,
        },
        { status: 500 },
      )
    }

    console.log("POST /api/orders - Order created successfully:", order.id)

    // Criar os itens do pedido
    if (items.length > 0) {
      const orderItems = items.map((item: any) => {
        const unit_price = Number(item.price || item.unit_price || 0)
        const quantity = Number(item.quantity || 1)

        return {
          order_id: order.id,
          product_id: item.product_id || item.id,
          quantity,
          unit_price,
          total_price: quantity * unit_price,
          size: item.size || null,
          toppings: item.toppings || [],
          special_instructions: item.special_instructions || null,
        }
      })

      console.log("POST /api/orders - Creating order items:", orderItems)

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("Error creating order items:", itemsError)
        // Não reverter o pedido, apenas logar o erro
        console.log("Order created but items failed to save - Order ID:", order.id)
      } else {
        console.log("POST /api/orders - Order items created successfully")
      }
    }

    console.log("POST /api/orders - Order process completed successfully")
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in POST /api/orders:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
