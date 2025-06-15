import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { status, notes } = await request.json()

    // Validar status
    const validStatuses = ["RECEIVED", "PREPARING", "ON_THE_WAY", "DELIVERED", "CANCELLED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    // Buscar pedido atual
    const { data: currentOrder, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // Validar transições de status
    const validTransitions: Record<string, string[]> = {
      RECEIVED: ["PREPARING", "CANCELLED"],
      PREPARING: ["ON_THE_WAY", "CANCELLED"],
      ON_THE_WAY: ["DELIVERED", "CANCELLED"],
      DELIVERED: [], // Status final
      CANCELLED: [], // Status final
    }

    if (!validTransitions[currentOrder.status].includes(status)) {
      return NextResponse.json(
        {
          error: `Não é possível alterar status de ${currentOrder.status} para ${status}`,
        },
        { status: 400 },
      )
    }

    // Atualizar o pedido
    const updateData: any = { status }

    // Definir tempo estimado baseado no novo status
    if (status === "PREPARING") {
      updateData.estimated_delivery_time = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    } else if (status === "ON_THE_WAY") {
      updateData.estimated_delivery_time = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    } else if (status === "CANCELLED") {
      updateData.cancellation_reason = notes
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
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

    if (updateError) {
      console.error("Error updating order:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
    }

    // Registrar mudança no histórico (será feito automaticamente pelo trigger)

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
