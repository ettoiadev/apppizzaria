import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles!orders_user_id_fkey(full_name, phone),
        order_items(
          *,
          products(name, description, image)
        ),
        order_status_history(
          *,
          profiles!order_status_history_changed_by_fkey(full_name)
        )
      `)
      .eq("id", params.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const updates = await request.json()

    // Campos permitidos para atualização
    const allowedFields = [
      "delivery_address",
      "delivery_phone",
      "delivery_instructions",
      "payment_method",
      "estimated_delivery_time",
    ]

    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualização" }, { status: 400 })
    }

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(filteredUpdates)
      .eq("id", params.id)
      .select(`
        *,
        profiles!orders_user_id_fkey(full_name, phone),
        order_items(
          *,
          products(name, description, image)
        )
      `)
      .single()

    if (error) {
      console.error("Error updating order:", error)
      return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar se o pedido pode ser deletado (apenas se estiver cancelado ou for muito antigo)
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("status, created_at")
      .eq("id", params.id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const canDelete =
      order.status === "CANCELLED" || new Date(order.created_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 dias

    if (!canDelete) {
      return NextResponse.json(
        {
          error: "Apenas pedidos cancelados ou com mais de 30 dias podem ser deletados",
        },
        { status: 400 },
      )
    }

    const { error: deleteError } = await supabase.from("orders").delete().eq("id", params.id)

    if (deleteError) {
      console.error("Error deleting order:", deleteError)
      return NextResponse.json({ error: "Erro ao deletar pedido" }, { status: 500 })
    }

    return NextResponse.json({ message: "Pedido deletado com sucesso" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
