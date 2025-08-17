import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const { driverId } = await request.json()

    console.log("PATCH /api/orders/[id]/assign-driver - Atribuindo entregador:", { orderId, driverId })

    // Validação básica
    if (!driverId) {
      return NextResponse.json(
        { error: "Driver ID é obrigatório" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se o entregador existe e está disponível
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name, status, vehicle_type')
      .eq('id', driverId)
      .single()

    if (driverError || !driver) {
      return NextResponse.json(
        { error: "Entregador não encontrado" },
        { status: 404 }
      )
    }

    if (driver.status !== 'available') {
      return NextResponse.json(
        { error: "Entregador não está disponível" },
        { status: 400 }
      )
    }

    // Verificar se o pedido existe e está em preparo
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, user_id, driver_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }

    if (order.status !== 'PREPARING') {
      return NextResponse.json(
        { error: "Pedido deve estar em preparo para atribuir entregador" },
        { status: 400 }
      )
    }

    // Atualizar o pedido e o motorista usando Supabase
    try {
      // 1. Atualizar o pedido com o entregador e mudar status para ON_THE_WAY
      const { data: updatedOrder, error: updateOrderError } = await supabase
        .from('orders')
        .update({
          driver_id: driverId,
          status: 'ON_THE_WAY',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('id, status, total, delivery_address, driver_id, created_at, updated_at')
        .single()

      if (updateOrderError) {
        throw new Error(`Erro ao atualizar pedido: ${updateOrderError.message}`)
      }

      // 2. Atualizar status do entregador para busy
      const { data: updatedDriver, error: updateDriverError } = await supabase
        .from('drivers')
        .update({
          status: 'busy',
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)
        .select('id, name, status')
        .single()

      if (updateDriverError) {
        // Reverter a atualização do pedido
        await supabase
          .from('orders')
          .update({
            driver_id: null,
            status: 'PREPARING',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
        
        throw new Error(`Erro ao atualizar motorista: ${updateDriverError.message}`)
      }

      console.log("Entregador atribuído com sucesso:", {
        order: updatedOrder,
        driver: updatedDriver
      })

      return NextResponse.json({
        message: "Entregador atribuído com sucesso",
        order: updatedOrder,
        driver: updatedDriver
      })

    } catch (error) {
      console.error("Erro na operação:", error)
      throw error
    }

  } catch (error: any) {
    console.error("Erro ao atribuir entregador:", error)
    
    // Tratamento específico de erros Supabase
    if (error.code) {
      switch (error.code) {
        case '23505': // unique_violation
          return NextResponse.json(
            { error: "Entregador já atribuído a outro pedido" },
            { status: 400 }
          )
        case '23503': // foreign_key_violation
          return NextResponse.json(
            { error: "Referência inválida entre pedido e entregador" },
            { status: 400 }
          )
        case '22P02': // invalid_text_representation (UUID inválido)
          return NextResponse.json(
            { error: "ID inválido fornecido" },
            { status: 400 }
          )
        case '42883': // undefined_function 
          return NextResponse.json(
            { error: "Erro de estrutura do banco de dados" },
            { status: 500 }
          )
        default:
          console.error("Erro Supabase não tratado:", error.code, error.message)
      }
    }

    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    console.log("DELETE /api/orders/[id]/assign-driver - Removendo entregador:", orderId)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar informações do pedido e entregador atual
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, driver_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      )
    }
    if (!order.driver_id) {
      return NextResponse.json(
        { error: "Pedido não tem entregador atribuído" },
        { status: 400 }
      )
    }

    if (order.status === 'DELIVERED') {
      return NextResponse.json(
        { error: "Não é possível remover entregador de pedido já entregue" },
        { status: 400 }
      )
    }

    // Remover entregador do pedido usando Supabase
    try {
      // 1. Remover entregador do pedido e voltar status para PREPARING
      const { data: updatedOrder, error: updateOrderError } = await supabase
        .from('orders')
        .update({
          driver_id: null,
          status: 'PREPARING',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('id, status, driver_id')
        .single()

      if (updateOrderError) {
        throw new Error(`Erro ao atualizar pedido: ${updateOrderError.message}`)
      }

      // 2. Verificar se o entregador tem outros pedidos ativos
      const { count: activeOrdersCount, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', order.driver_id)
        .in('status', ['ON_THE_WAY'])

      if (countError) {
        console.error('Erro ao contar pedidos ativos:', countError)
      }

      // 3. Se não tem outros pedidos, voltar entregador para available
      if ((activeOrdersCount || 0) === 0) {
        const { error: updateDriverError } = await supabase
          .from('drivers')
          .update({
            status: 'available',
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', order.driver_id)

        if (updateDriverError) {
          console.error('Erro ao atualizar status do motorista:', updateDriverError)
        }
      }

      console.log("Entregador removido com sucesso:", updatedOrder)

      return NextResponse.json({
        message: "Entregador removido com sucesso",
        order: updatedOrder
      })

    } catch (error) {
      console.error("Erro na operação:", error)
      throw error
    }

  } catch (error: any) {
    console.error("Erro ao remover entregador:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}