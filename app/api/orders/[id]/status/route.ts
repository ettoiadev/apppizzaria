import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  logger.api('PATCH', `/api/orders/${params.id}/status`)
  
  try {
    // Parse request body
    let body
    try {
      body = await request.json()
      logger.debug('Request body parsed', body)
    } catch (parseError) {
      logger.error('Erro ao fazer parse do body', parseError)
      return NextResponse.json({ 
        error: "Corpo da requisição inválido" 
      }, { status: 400 })
    }

    const { status, notes } = body

    // Validate required parameters
    if (!params.id) {
      logger.error('ID do pedido não fornecido')
      return NextResponse.json({ 
        error: "ID do pedido é obrigatório" 
      }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      logger.error('ID do pedido inválido (não é UUID)', { orderId: params.id })
      return NextResponse.json({ 
        error: "ID do pedido deve ser um UUID válido" 
      }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED']
    if (!status || !validStatuses.includes(status)) {
      logger.error('Status inválido', { status, validStatuses })
      return NextResponse.json({ 
        error: "Status inválido. Deve ser: " + validStatuses.join(', ') 
      }, { status: 400 })
    }

    logger.info('Validação inicial concluída', { orderId: params.id, newStatus: status })

    const supabase = createClient()

    // Check if order exists and get current status
    logger.database('SELECT', 'orders', { orderId: params.id })
    const { data: currentOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (orderError || !currentOrder) {
      logger.databaseError('SELECT', 'orders', { orderId: params.id, ...orderError })
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    logger.info('Pedido encontrado', currentOrder)

    // Prevent status regression (optional business logic)
    const statusOrder = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED']
    const currentIndex = statusOrder.indexOf(currentOrder.status)
    const newIndex = statusOrder.indexOf(status)

    if (status !== 'CANCELLED' && currentIndex > newIndex && currentIndex !== -1) {
      logger.warn('Tentativa de retroceder status', { currentStatus: currentOrder.status, newStatus: status })
      return NextResponse.json({ 
        error: "Não é possível retroceder o status do pedido" 
      }, { status: 400 })
    }

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

    logger.database('UPDATE', 'orders', { orderId: params.id, updateData })

    // Atualizar pedido usando Supabase
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError || !updatedOrder) {
      logger.databaseError('UPDATE', 'orders', { orderId: params.id, ...updateError })
      throw new Error("Falha ao atualizar pedido - nenhum registro retornado")
    }

    // Try to insert status history (optional - se a tabela não existir, ignorar)
    try {
      logger.database('INSERT', 'order_status_history', { orderId: params.id })
      
      await supabase
        .from('order_status_history')
        .insert({
          order_id: params.id,
          old_status: currentOrder.status,
          new_status: status,
          notes: notes || null,
          changed_at: new Date().toISOString()
        })
      logger.info('Histórico de status inserido com sucesso')
    } catch (historyError: any) {
      logger.warn('Erro ao inserir histórico (ignorando)', historyError)
      // Não falhar se a tabela de histórico não existir
    }

    const duration = Date.now() - startTime
    logger.performance('update-order-status', duration)
    logger.info('ORDER_STATUS', 'Status atualizado com sucesso', {
      orderId: params.id,
      oldStatus: currentOrder.status,
      newStatus: status
    })

    return NextResponse.json({
      message: "Status do pedido atualizado com sucesso",
      order: updatedOrder
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.performance('update-order-status', duration)
    logger.apiError('PATCH', `/api/orders/${params.id}/status`, error)

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
  logger.api('DELETE', `/api/orders/${params.id}/status`)
  
  try {
    // Parse request body for cancellation notes
    const body = await request.json().catch(() => ({}))
    const { notes } = body

    logger.info('Cancelamento de pedido solicitado', { orderId: params.id, notes })

    // Redirect to PATCH with CANCELLED status
    const patchRequest = new NextRequest(request.url, {
      method: 'PATCH',
      headers: request.headers,
      body: JSON.stringify({
        status: 'CANCELLED',
        notes: notes
      })
    })

    logger.debug('Redirecionando para PATCH com status CANCELLED')
    return await PATCH(patchRequest, { params })

  } catch (error: any) {
    logger.apiError('DELETE', `/api/orders/${params.id}/status`, error)

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
