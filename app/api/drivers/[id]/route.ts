import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.debug('MODULE', `[DRIVERS] Buscando entregador ID: ${params.id}`)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar entregador por ID usando Supabase
    const { data: driver, error } = await supabase
      .from('drivers')
      .select(`
        id, name, email, phone, vehicle_type, vehicle_plate,
        status, current_location, total_deliveries, average_rating,
        average_delivery_time, created_at, updated_at, last_active_at
      `)
      .eq('id', params.id)
      .single()

    if (error || !driver) {
      logger.error('MODULE', 'Erro ao buscar entregador:', error)
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Buscar pedidos ativos do entregador
    let currentOrders = []
    if (driver.status === 'busy') {
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .eq('driver_id', driver.id)
          .eq('status', 'ON_THE_WAY')
        
        if (!ordersError && orders) {
          currentOrders = orders.map((order: any) => order.id)
        }
      } catch (orderError) {
        logger.warn('MODULE', `[DRIVERS] Erro ao buscar pedidos do entregador ${driver.id}:`, orderError)
      }
    }

    return NextResponse.json({
      driver: {
        ...driver,
        currentOrders
      }
    })

  } catch (error: any) {
    logger.error('MODULE', `[DRIVERS] Erro ao buscar entregador ${params.id}:`, error)
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        error: "Não foi possível conectar ao Supabase",
        message: "Verifique se o Supabase está configurado"
      }, { status: 503 })
    }

    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao buscar entregador no banco de dados"
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.debug('MODULE', `[DRIVERS] Atualizando entregador ID: ${params.id}`)

    const data = await request.json()
    const { name, email, phone, vehicleType, vehiclePlate, currentLocation, status } = data

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se entregador existe
    const { data: existingDriver, error: existsError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', params.id)
      .single()

    if (existsError || !existingDriver) {
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    // Construir objeto de atualização dinamicamente
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      updateData.name = name
    }

    if (email !== undefined) {
      updateData.email = email
    }

    if (phone !== undefined) {
      updateData.phone = phone
    }

    if (vehicleType !== undefined) {
      updateData.vehicle_type = vehicleType
    }

    if (vehiclePlate !== undefined) {
      updateData.vehicle_plate = vehiclePlate
    }

    if (currentLocation !== undefined) {
      updateData.current_location = currentLocation
    }

    if (status !== undefined) {
      updateData.status = status
      updateData.last_active_at = new Date().toISOString()
    }

    // Verificar se há campos para atualizar (além do updated_at)
    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json({
        error: "Nenhum campo para atualizar",
        message: "Forneça pelo menos um campo para atualizar"
      }, { status: 400 })
    }

    // Atualizar entregador usando Supabase
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        id, name, email, phone, vehicle_type, vehicle_plate,
        status, current_location, total_deliveries, average_rating,
        average_delivery_time, created_at, updated_at, last_active_at
      `)
      .single()

    if (updateError) {
      logger.error('MODULE', 'Erro ao atualizar entregador:', updateError)
      throw updateError
    }

    // Buscar pedidos atuais se necessário
    let currentOrders = []
    if (updatedDriver.status === 'busy') {
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .eq('driver_id', updatedDriver.id)
          .eq('status', 'ON_THE_WAY')
        
        if (!ordersError && orders) {
          currentOrders = orders.map((order: any) => order.id)
        }
      } catch (orderError) {
        logger.warn('MODULE', `[DRIVERS] Erro ao buscar pedidos:`, orderError)
      }
    }

    logger.debug('MODULE', `[DRIVERS] Entregador ${params.id} atualizado com sucesso`)

    return NextResponse.json({
      driver: {
        ...updatedDriver,
        currentOrders
      },
      message: "Entregador atualizado com sucesso"
    })

  } catch (error: any) {
    logger.error('MODULE', `[DRIVERS] Erro ao atualizar entregador ${params.id}:`, error)
    
    // Verificar se é erro de email duplicado
    if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
      return NextResponse.json({
        error: "Email já cadastrado",
        message: "Já existe outro entregador com este email"
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao atualizar entregador no banco de dados"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.debug('MODULE', `[DRIVERS] Iniciando exclusão do entregador ID: ${params.id}`)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se entregador existe
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name, status, total_deliveries')
      .eq('id', params.id)
      .single()

    if (driverError || !driver) {
      logger.error('MODULE', `[DRIVERS] Entregador ${params.id} não encontrado`)
      return NextResponse.json({
        error: "Entregador não encontrado",
        message: `Não existe entregador com ID ${params.id}`
      }, { status: 404 })
    }

    logger.debug('MODULE', `[DRIVERS] Verificando dependências para ${driver.name}`)

    // Verificar pedidos associados
    let activeOrdersCount = 0
    let totalOrdersCount = 0
    let hasOrderHistory = false

    try {
      // Verificar pedidos ativos (em andamento)
      const { count: activeCount, error: activeError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', params.id)
        .in('status', ['ON_THE_WAY', 'PREPARING'])
      
      if (!activeError) {
        activeOrdersCount = activeCount || 0
      }

      // Verificar histórico total de pedidos
      const { count: totalCount, error: totalError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', params.id)
      
      if (!totalError) {
        totalOrdersCount = totalCount || 0
        hasOrderHistory = totalOrdersCount > 0
      }

      logger.debug('MODULE', `[DRIVERS] Entregador ${driver.name}: ${activeOrdersCount} pedidos ativos, ${totalOrdersCount} pedidos no histórico`)
    } catch (ordersError) {
      logger.warn('MODULE', '[DRIVERS] Erro ao verificar pedidos:', ordersError)
      // Continuar mesmo com erro na verificação de pedidos
    }

    // REGRA 1: Impedir exclusão se há pedidos ativos
    if (activeOrdersCount > 0) {
      logger.debug('MODULE', `[DRIVERS] Bloqueando exclusão - ${activeOrdersCount} pedidos ativos`)
      return NextResponse.json({
        error: "Não é possível remover entregador",
        message: `O entregador ${driver.name} possui ${activeOrdersCount} pedido(s) em andamento. Aguarde a conclusão das entregas.`,
        details: {
          activeOrders: activeOrdersCount,
          driverStatus: driver.status
        }
      }, { status: 400 })
    }

    // REGRA 2: Usar soft-delete se há histórico de entregas
    if (hasOrderHistory || (driver.total_deliveries && driver.total_deliveries > 0)) {
      logger.debug('MODULE', `[DRIVERS] Aplicando soft-delete - entregador tem histórico de entregas`)
      
      // Tentar aplicar soft-delete usando coluna 'deleted_at'
      let hasSoftDeleteColumns = false;
      try {
        const { error: deletedAtUpdateError } = await supabase
          .from('drivers')
          .update({ 
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          })
          .eq('id', params.id);
          
        if (!deletedAtUpdateError) {
          hasSoftDeleteColumns = true;
          logger.debug('MODULE', `[DRIVERS] Soft-delete aplicado usando coluna 'deleted_at'`);
        }
      } catch (softDeleteError) {
        logger.warn('MODULE', '[DRIVERS] Erro na verificação de soft-delete:', softDeleteError);
      }

      // Se não tem colunas de soft-delete, adicionar uma estratégia alternativa
      if (!hasSoftDeleteColumns) {
        logger.debug('MODULE', `[DRIVERS] Sem colunas de soft-delete disponíveis, mas preservando por segurança`);
        return NextResponse.json({
          error: "Não é possível remover entregador",
          message: `O entregador ${driver.name} possui histórico de ${totalOrdersCount} entrega(s) e não pode ser removido para preservar os dados históricos.`,
          suggestion: "Considere desativar o entregador em vez de removê-lo.",
          details: {
            totalDeliveries: driver.total_deliveries || 0,
            totalOrders: totalOrdersCount,
            hasHistory: true
          }
        }, { status: 400 });
      }

      return NextResponse.json({
        message: `Entregador ${driver.name} desativado com sucesso`,
        details: {
          action: "soft_delete",
          reason: "preservar_historico",
          totalDeliveries: driver.total_deliveries || 0,
          totalOrders: totalOrdersCount
        }
      });
    }

    // REGRA 3: Delete físico apenas se não há histórico
    logger.debug('MODULE', `[DRIVERS] Aplicando delete físico - sem histórico de entregas`);
    
    try {
      // Remove referências em outras tabelas se necessário
      // Primeiro, remove referências de pedidos finalizados
      await supabase
        .from('orders')
        .update({ driver_id: null })
        .eq('driver_id', params.id)
        .in('status', ['CANCELLED', 'DELIVERED'])

      // Remove o entregador
      const { error: deleteError } = await supabase
        .from('drivers')
        .delete()
        .eq('id', params.id)

      if (deleteError) {
        logger.error('MODULE', `[DRIVERS] Erro durante delete físico:`, deleteError)
        throw deleteError
      }

      logger.debug('MODULE', `[DRIVERS] Delete físico concluído para ${driver.name}`)

      return NextResponse.json({
        message: `Entregador ${driver.name} removido com sucesso`,
        details: {
          action: "physical_delete",
          reason: "sem_historico"
        }
      })

    } catch (deleteError) {
      logger.error('MODULE', `[DRIVERS] Erro durante delete físico:`, deleteError);
      throw deleteError;
    }

  } catch (error: any) {
    logger.error('MODULE', `[DRIVERS] Erro ao processar exclusão do entregador ${params.id}:`, error);
    
    // Tratamento específico de erros do Supabase
    if (error.code === '23503' || (error.message && error.message.includes('foreign key'))) {
      return NextResponse.json({
        error: "Violação de integridade referencial",
        message: "Este entregador possui pedidos associados e não pode ser removido. Os dados históricos devem ser preservados.",
        suggestion: "Desative o entregador em vez de removê-lo."
      }, { status: 400 });
    }

    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Falha inesperada ao processar a exclusão do entregador.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
