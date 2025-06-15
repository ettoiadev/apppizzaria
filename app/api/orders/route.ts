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
      return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
    }

    // Calcular estatísticas dos pedidos
    const { data: stats } = await supabase.from("orders").select("status, total")

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
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const {
      user_id,
      items,
      delivery_address,
      delivery_phone,
      payment_method,
      delivery_instructions,
      subtotal,
      delivery_fee = 0,
      discount = 0,
    } = body

    const total = subtotal + delivery_fee - discount

    // Criar o pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        status: "RECEIVED",
        total,
        subtotal,
        delivery_fee,
        discount,
        payment_method,
        delivery_address,
        delivery_phone,
        delivery_instructions,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
    }

    // Criar os itens do pedido
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      size: item.size,
      toppings: item.toppings,
      special_instructions: item.special_instructions,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      // Reverter a criação do pedido
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: "Erro ao criar itens do pedido" }, { status: 500 })
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
