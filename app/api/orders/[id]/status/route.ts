import { NextResponse, NextRequest } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== PATCH /api/orders/[id]/status - INÍCIO ===")
    console.log("Order ID:", params.id)
    
    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("Request body:", body)
    } catch (parseError) {
      console.error("Erro ao fazer parse do body:", parseError)
      return NextResponse.json({ 
        error: "Corpo da requisição inválido" 
      }, { status: 400 })
    }

    const { status, notes } = body

    // Validate required parameters
    if (!params.id) {
      console.error("ID do pedido não fornecido")
      return NextResponse.json({ 
        error: "ID do pedido é obrigatório" 
      }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      console.error("ID do pedido inválido (não é UUID):", params.id)
      return NextResponse.json({ 
        error: "ID do pedido deve ser um UUID válido" 
      }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED']
    if (!status || !validStatuses.includes(status)) {
      console.error("Status inválido:", status)
      return NextResponse.json({ 
        error: "Status inválido. Deve ser: " + validStatuses.join(', ') 
      }, { status: 400 })
    }

    console.log("Validação inicial concluída. Buscando pedido no banco...")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if order exists and get current status
    const { data: currentOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (orderError || !currentOrder) {
      console.error("Pedido não encontrado:", params.id)
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    console.log("Pedido encontrado:", currentOrder)

    // Prevent status regression (optional business logic)
    const statusOrder = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(currentOrder.status)
    const newIndex = statusOrder.indexOf(status)

    if (status !== 'CANCELLED' && currentIndex > newIndex && currentIndex !== -1) {
      console.error("Tentativa de retroceder status:", { currentStatus: currentOrder.status, newStatus: status })
      return NextResponse.json({ 
        error: "Não é possível retroceder o status do pedido" 
      }, { status: 400 })
    }

    console.log("Atualizando status do pedido para:", status)

    // Preparar dados de atualização
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    }

    // Adicionar timestamps específicos baseados no status
    if (status === 'DELIVERED') {
      updateData.delivered_at = new Date().toISOString()
    } else if (status === 'CANCELLED') {
      updateData.cancelled_at = new Date().toISOString()
    }

    console.log("Dados de atualização:", updateData)

    // Atualizar pedido usando Supabase
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError || !updatedOrder) {
      console.error("Erro ao atualizar pedido:", updateError)
      throw new Error("Falha ao atualizar pedido - nenhum registro retornado")
    }

    console.log("Pedido atualizado com sucesso")

    // Try to insert status history (optional - se a tabela não existir, ignorar)
    try {
      console.log("Tentando inserir histórico de status...")
      
      await supabase
        .from('order_status_history')
        .insert({
          order_id: params.id,
          old_status: currentOrder.status,
          new_status: status,
          notes: notes || null,
          changed_at: new Date().toISOString()
        })
      console.log("Histórico de status inserido com sucesso")
    } catch (historyError: any) {
      console.warn("Erro ao inserir histórico (ignorando):", historyError.message)
      // Não falhar se a tabela de histórico não existir
    }

    console.log("Operação concluída com sucesso")

    return NextResponse.json({
      message: "Status do pedido atualizado com sucesso",
      order: updatedOrder
    })
  } catch (error: any) {
    console.error("=== ERRO COMPLETO NO PATCH /api/orders/[id]/status ===")
    console.error("Tipo do erro:", typeof error)
    console.error("Erro:", error)
    console.error("Message:", error?.message)
    console.error("=== FIM DO ERRO COMPLETO ===")

    if (error?.message?.includes("invalid input value for enum")) {
      return NextResponse.json(
        { error: "Status inválido fornecido" },
        { status: 400 }
      )
    }

    if (error?.message?.includes("relation") && error?.message?.includes("does not exist")) {
      return NextResponse.json(
        { error: "Tabela de pedidos não encontrada" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== DELETE /api/orders/[id]/status iniciado ===")
    console.log("ID do pedido:", params.id)

    // Parse request body for cancellation notes
    const body = await request.json().catch(() => ({}))
    const { notes } = body

    console.log("Notas de cancelamento:", notes)

    // Redirect to PATCH with CANCELLED status
    const patchRequest = new NextRequest(request.url, {
      method: 'PATCH',
      headers: request.headers,
      body: JSON.stringify({
        status: 'CANCELLED',
        notes: notes
      })
    })

    console.log("Redirecionando para PATCH com status CANCELLED")
    return await PATCH(patchRequest, { params })

  } catch (error: any) {
    console.error("=== ERRO NO DELETE /api/orders/[id]/status ===")
    console.error("Erro:", error)
    console.error("Message:", error?.message)

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
