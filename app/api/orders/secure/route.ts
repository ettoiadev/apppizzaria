import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { 
  withMiddleware, 
  rateLimit, 
  validateInput, 
  requireAuth, 
  securityLogger,
  type ValidationRule 
} from "@/lib/api-middleware"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validação para GET (query parameters)
const getValidationRules: ValidationRule[] = [
  { field: 'status', required: false, type: 'string', maxLength: 20 },
  { field: 'userId', required: false, type: 'uuid' },
  { field: 'limit', required: false, type: 'number' },
  { field: 'offset', required: false, type: 'number' }
]

// Validação para POST (criar pedido)
const postValidationRules: ValidationRule[] = [
  { field: 'customer_name', required: true, type: 'string', minLength: 2, maxLength: 100, sanitize: true },
  { field: 'customer_phone', required: true, type: 'phone', sanitize: true },
  { field: 'customer_email', required: false, type: 'email', sanitize: true },
  { field: 'delivery_address', required: true, type: 'string', minLength: 10, maxLength: 500, sanitize: true },
  { field: 'items', required: true },
  { field: 'total_amount', required: true, type: 'number' },
  { field: 'payment_method', required: true, type: 'string', maxLength: 20 },
  { field: 'special_instructions', required: false, type: 'string', maxLength: 500, sanitize: true }
]

export async function GET(request: NextRequest) {
  // Aplicar middlewares
  const middlewareResult = await withMiddleware(
    securityLogger(),
    rateLimit('/api/orders')
  )(request)
  
  if (middlewareResult) {
    return middlewareResult
  }

  try {
    const { searchParams } = new URL(request.url)
    
    // Validar e sanitizar parâmetros
    const queryParams = {
      status: searchParams.get("status"),
      userId: searchParams.get("userId") || searchParams.get("user_id"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset")
    }

    // Validar parâmetros
    const errors: string[] = []
    
    if (queryParams.limit && (isNaN(Number(queryParams.limit)) || Number(queryParams.limit) > 100)) {
      errors.push("Limite deve ser um número entre 1 e 100")
    }
    
    if (queryParams.offset && isNaN(Number(queryParams.offset))) {
      errors.push("Offset deve ser um número")
    }
    
    if (queryParams.status && !['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'].includes(queryParams.status)) {
      errors.push("Status inválido")
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Parâmetros inválidos", details: errors },
        { status: 400 }
      )
    }

    const limit = Number(queryParams.limit) || 50
    const offset = Number(queryParams.offset) || 0

    console.log("GET /api/orders/secure - Fetching orders with params:", { 
      status: queryParams.status, 
      userId: queryParams.userId, 
      limit, 
      offset 
    })

    // Construir query do Supabase
    let ordersQuery = supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          size,
          toppings,
          special_instructions,
          products:product_id(
            name,
            description,
            image
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (queryParams.status && queryParams.status !== "all") {
      ordersQuery = ordersQuery.eq('status', queryParams.status)
    }

    if (queryParams.userId) {
      ordersQuery = ordersQuery.eq('user_id', queryParams.userId)
    }

    const { data: orders, error } = await ordersQuery

    if (error) {
      console.error("Erro ao buscar pedidos:", error)
      return NextResponse.json(
        { error: "Erro ao buscar pedidos" },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Erro no GET /api/orders/secure:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Aplicar middlewares
  const middlewareResult = await withMiddleware(
    securityLogger(),
    rateLimit('/api/orders'),
    validateInput(postValidationRules)
  )(request)
  
  if (middlewareResult) {
    return middlewareResult
  }

  try {
    const sanitizedBody = (request as any).sanitizedBody
    
    // Validação adicional para itens do pedido
    if (!Array.isArray(sanitizedBody.items) || sanitizedBody.items.length === 0) {
      return NextResponse.json(
        { error: "Pedido deve conter pelo menos um item" },
        { status: 400 }
      )
    }

    // Validar cada item do pedido
    for (const [index, item] of sanitizedBody.items.entries()) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        return NextResponse.json(
          { error: `Item ${index + 1} está incompleto` },
          { status: 400 }
        )
      }
      
      if (item.quantity <= 0 || item.quantity > 50) {
        return NextResponse.json(
          { error: `Quantidade do item ${index + 1} deve estar entre 1 e 50` },
          { status: 400 }
        )
      }
    }

    // Calcular total para verificação
    const calculatedTotal = sanitizedBody.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unit_price)
    }, 0)

    if (Math.abs(calculatedTotal - sanitizedBody.total_amount) > 0.01) {
      return NextResponse.json(
        { error: "Total do pedido não confere com os itens" },
        { status: 400 }
      )
    }

    console.log("POST /api/orders/secure - Creating order:", {
      customer: sanitizedBody.customer_name,
      items: sanitizedBody.items.length,
      total: sanitizedBody.total_amount
    })

    // Criar pedido no banco
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: sanitizedBody.customer_name,
        customer_phone: sanitizedBody.customer_phone,
        customer_email: sanitizedBody.customer_email,
        delivery_address: sanitizedBody.delivery_address,
        total_amount: sanitizedBody.total_amount,
        payment_method: sanitizedBody.payment_method,
        special_instructions: sanitizedBody.special_instructions,
        status: 'RECEIVED'
      })
      .select()
      .single()

    if (orderError) {
      console.error("Erro ao criar pedido:", orderError)
      return NextResponse.json(
        { error: "Erro ao criar pedido" },
        { status: 500 }
      )
    }

    // Criar itens do pedido
    const orderItems = sanitizedBody.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      size: item.size,
      toppings: item.toppings,
      special_instructions: item.special_instructions
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error("Erro ao criar itens do pedido:", itemsError)
      // Tentar reverter o pedido criado
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: "Erro ao criar itens do pedido" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      order: {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        created_at: order.created_at
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Erro no POST /api/orders/secure:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}