import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    logger.debug('MODULE', "[DRIVERS] Iniciando busca de entregadores no Supabase")
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar entregadores com filtros
    let driversQuery = supabase
      .from('drivers')
      .select('id, name, email, phone, vehicle_type, vehicle_plate, status, current_location, total_deliveries, average_rating, average_delivery_time, created_at, updated_at, last_active_at')
      .order('status', { ascending: false })
      .order('name', { ascending: true })

    // Filtrar por status se especificado
    if (status && status !== "all") {
      driversQuery = driversQuery.eq('status', status)
    }

    const { data: drivers, error: driversError } = await driversQuery

    if (driversError) {
      logger.error('MODULE', '[DRIVERS] Erro ao buscar entregadores:', driversError)
      throw driversError
    }

    logger.debug('MODULE', `[DRIVERS] Encontrados ${drivers?.length || 0} entregadores no Supabase`)

    // Buscar pedidos ativos para entregadores ocupados
    const driversWithOrders = await Promise.all(
      (drivers || []).map(async (driver: any) => {
        if (driver.status === 'busy') {
          try {
            const { data: orders } = await supabase
              .from('orders')
              .select('id')
              .eq('driver_id', driver.id)
              .eq('status', 'ON_THE_WAY')
              
            return {
              ...driver,
              currentOrders: orders?.map((order: any) => order.id) || []
            }
          } catch (orderError) {
            logger.warn('MODULE', `[DRIVERS] Erro ao buscar pedidos do entregador ${driver.id}:`, orderError)
            return { ...driver, currentOrders: [] }
          }
        }
        return { ...driver, currentOrders: [] }
      })
    )

    // Calcular estatísticas
    const statistics = {
      total: drivers?.length || 0,
      available: drivers?.filter((d: any) => d.status === 'available').length || 0,
      busy: drivers?.filter((d: any) => d.status === 'busy').length || 0,
      offline: drivers?.filter((d: any) => d.status === 'offline').length || 0,
      averageDeliveryTime: drivers?.length ? 
        Math.round(drivers.reduce((sum: number, d: any) => sum + (d.average_delivery_time || 0), 0) / drivers.length) :
        0
    }

    logger.debug('MODULE', `[DRIVERS] Retornando dados reais:`, statistics)
    
    return NextResponse.json({
      drivers: driversWithOrders,
      statistics
    })

  } catch (error: any) {
    logger.error('MODULE', "[DRIVERS] Erro ao conectar com Supabase:", error)
    
    // Retornar erro genérico para Supabase
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Não foi possível carregar a lista de entregadores",
      drivers: [],
      statistics: { total: 0, available: 0, busy: 0, offline: 0, averageDeliveryTime: 0 }
    }, { status: 500 })

    if (error.code === '28P01') {
      return NextResponse.json({
        error: "Falha na autenticação Supabase",
        message: "Verifique as credenciais de acesso ao banco",
        drivers: [],
        statistics: { total: 0, available: 0, busy: 0, offline: 0, averageDeliveryTime: 0 }
      }, { status: 503 })
    }

    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao acessar banco de dados",
      drivers: [],
      statistics: { total: 0, available: 0, busy: 0, offline: 0, averageDeliveryTime: 0 }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.debug('MODULE', "[DRIVERS] Iniciando criação de entregador")
    
    const data = await request.json()
    const { name, email, phone, vehicleType, vehiclePlate, currentLocation } = data

    // Validação de dados obrigatórios
    if (!name || !email || !phone || !vehicleType) {
      return NextResponse.json({
        error: "Campos obrigatórios missing",
        message: "name, email, phone e vehicleType são obrigatórios"
      }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Inserir novo entregador
    const { data: newDriver, error: insertError } = await supabase
      .from('drivers')
      .insert({
        name,
        email,
        phone,
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate,
        current_location: currentLocation,
        status: 'offline',
        total_deliveries: 0,
        average_rating: 0,
        average_delivery_time: 0
      })
      .select()
      .single()

    if (insertError) {
      logger.error('MODULE', '[DRIVERS] Erro ao criar entregador:', insertError)
      
      // Verificar se é erro de email duplicado
      if (insertError.code === '23505' && insertError.message.includes('email')) {
        return NextResponse.json({
          error: "Email já cadastrado",
          message: "Este email já está sendo usado por outro entregador"
        }, { status: 409 })
      }
      
      throw insertError
    }

    const driverWithOrders = {
      ...newDriver,
      currentOrders: []
    }

    logger.debug('MODULE', `[DRIVERS] Entregador criado com sucesso: ${newDriver.name}`)

    return NextResponse.json({
      driver: driverWithOrders,
      message: "Entregador criado com sucesso"
    })

  } catch (error: any) {
    logger.error('MODULE', "[DRIVERS] Erro ao criar entregador:", error)
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      message: "Erro ao salvar entregador no banco de dados"
    }, { status: 500 })
  }
}
