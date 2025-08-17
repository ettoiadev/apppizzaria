import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')?.trim()
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({ customers: [] })
    }

    logger.debug('MODULE', `[CUSTOMER_SEARCH] Buscando clientes com termo: "${searchTerm}"`)

    // Normalizar termo de busca (remover acentos e converter para minúsculas)
    const normalizeString = (str: string) => {
      return str.normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '')
               .toLowerCase()
               .trim()
    }

    const normalizedSearchTerm = normalizeString(searchTerm)
    const phoneOnlyNumbers = searchTerm.replace(/\D/g, '')

    logger.debug('MODULE', `[CUSTOMER_SEARCH] Termo normalizado: "${normalizedSearchTerm}", Telefone: "${phoneOnlyNumbers}"`)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar clientes por nome ou telefone
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        email,
        created_at,
        customer_addresses!inner(
          id,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          zip_code,
          label,
          is_default
        ),
        orders(count)
      `)
      .eq('role', 'customer')
      .limit(limit)

    // Aplicar filtros de busca
    if (normalizedSearchTerm.length > 0) {
      query = query.or(`full_name.ilike.%${normalizedSearchTerm}%,phone.like.%${phoneOnlyNumbers}%`)
    }

    const { data: customers, error } = await query

    if (error) {
      throw error
    }

    const rawCustomers = (customers || []).map((customer: any) => {
      // Buscar endereço principal (is_default = true) ou o primeiro
      const primaryAddress = customer.customer_addresses?.find((addr: any) => addr.is_default) || 
                             customer.customer_addresses?.[0] || null
      
      return {
        id: customer.id,
        name: customer.full_name || 'Nome não informado',
        phone: customer.phone || '',
        email: customer.email || '',
        primaryAddress: primaryAddress ? {
          id: primaryAddress.id,
          street: primaryAddress.street,
          number: primaryAddress.number,
          complement: primaryAddress.complement,
          neighborhood: primaryAddress.neighborhood,
          city: primaryAddress.city,
          state: primaryAddress.state,
          zip_code: primaryAddress.zip_code,
          label: primaryAddress.label,
          is_default: primaryAddress.is_default
        } : null,
        totalOrders: customer.orders?.[0]?.count || 0,
        createdAt: customer.created_at
      }
    })

    logger.debug('MODULE', `[CUSTOMER_SEARCH] Clientes brutos encontrados: ${rawCustomers.length}`)

         // Filtragem adicional no JavaScript para garantir correspondência precisa
     const filteredCustomers = rawCustomers.filter(customer => {
       const customerNameNormalized = normalizeString(customer.name)
       const customerPhoneClean = customer.phone.replace(/\D/g, '')
       
       // Verificar se o termo de busca realmente existe no nome ou telefone
       const nameMatches = normalizedSearchTerm.length > 0 && customerNameNormalized.includes(normalizedSearchTerm)
       const phoneMatches = phoneOnlyNumbers.length > 0 && customerPhoneClean.includes(phoneOnlyNumbers)
       
       const matches = nameMatches || phoneMatches
       
       logger.debug('MODULE', `[CUSTOMER_SEARCH] Cliente "${customer.name}":`, {
         customerNameNormalized,
         customerPhoneClean,
         searchTerm: normalizedSearchTerm,
         phoneSearchTerm: phoneOnlyNumbers,
         nameMatches,
         phoneMatches,
         finalMatch: matches
       })
       
       return matches
     })

    logger.debug('MODULE', `[CUSTOMER_SEARCH] Clientes filtrados: ${filteredCustomers.length}`)

    return NextResponse.json({ customers: filteredCustomers })

  } catch (error: any) {
    logger.error('MODULE', "[CUSTOMER_SEARCH] Erro na busca:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      customers: [] 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, address } = body

    logger.debug('MODULE', "[CUSTOMER_SEARCH] Criando novo cliente:", { name, phone, email })

    // Validações
    if (!name?.trim()) {
      return NextResponse.json({ 
        error: "Nome é obrigatório" 
      }, { status: 400 })
    }

    if (!phone?.trim()) {
      return NextResponse.json({ 
        error: "Telefone é obrigatório" 
      }, { status: 400 })
    }

    // Limpar telefone (apenas números)
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json({ 
        error: "Telefone deve ter pelo menos 10 dígitos" 
      }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se já existe cliente com este telefone
    const { data: existingCustomer, error: checkPhoneError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .eq('role', 'customer')
      .single()

    if (existingCustomer && !checkPhoneError) {
      return NextResponse.json({ 
        error: "Já existe um cliente cadastrado com este telefone" 
      }, { status: 400 })
    }

    // Gerar email se não fornecido
    const customerEmail = email?.trim() || `cliente_${cleanPhone}@temp.williamdiskpizza.com`

    // Verificar se email já existe
    const { data: existingEmail, error: checkEmailError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .single()

    if (existingEmail && !checkEmailError) {
      return NextResponse.json({ 
        error: "Este e-mail já está cadastrado" 
      }, { status: 400 })
    }

    try {
      // Criar perfil do cliente
      const { data: newCustomer, error: profileError } = await supabase
        .from('profiles')
        .insert({
          full_name: name.trim(),
          phone: phone,
          email: customerEmail,
          role: 'customer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, full_name, phone, email, created_at')
        .single()

      if (profileError || !newCustomer) {
        throw new Error('Erro ao criar perfil do cliente')
      }

      // Criar endereço se fornecido
      let primaryAddress = null
      if (address && address.street?.trim()) {
        // Validar campos obrigatórios do endereço
        const requiredFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zip_code']
        for (const field of requiredFields) {
          if (!address[field]?.trim()) {
            throw new Error(`Campo ${field} do endereço é obrigatório`)
          }
        }

        // Validar CEP
        const cleanZipCode = address.zip_code.replace(/\D/g, '')
        if (cleanZipCode.length !== 8) {
          throw new Error("CEP deve ter 8 dígitos")
        }

        // Validar estado
        if (address.state.length !== 2) {
          throw new Error("Estado deve ter 2 caracteres (UF)")
        }

        const { data: addressData, error: addressError } = await supabase
          .from('customer_addresses')
          .insert({
            user_id: newCustomer.id,
            label: 'Endereço Principal',
            street: address.street.trim(),
            number: address.number.trim(),
            complement: address.complement?.trim() || '',
            neighborhood: address.neighborhood.trim(),
            city: address.city.trim(),
            state: address.state.trim().toUpperCase(),
            zip_code: cleanZipCode,
            is_default: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single()

        if (addressError) {
          throw new Error('Erro ao criar endereço do cliente')
        }

        primaryAddress = addressData
      }

      // Cliente criado com sucesso

      logger.debug('MODULE', "[CUSTOMER_SEARCH] Cliente criado com sucesso:", newCustomer.id)

      return NextResponse.json({
        customer: {
          id: newCustomer.id,
          name: newCustomer.full_name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          primaryAddress: primaryAddress ? {
            id: primaryAddress.id,
            street: primaryAddress.street,
            number: primaryAddress.number,
            complement: primaryAddress.complement,
            neighborhood: primaryAddress.neighborhood,
            city: primaryAddress.city,
            state: primaryAddress.state,
            zip_code: primaryAddress.zip_code,
            label: primaryAddress.label,
            is_default: primaryAddress.is_default
          } : null,
          totalOrders: 0,
          createdAt: newCustomer.created_at
        }
      })

    } catch (innerError: any) {
      throw innerError
    }

  } catch (error: any) {
    logger.error('MODULE', "[CUSTOMER_SEARCH] Erro ao criar cliente:", error)
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor" 
    }, { status: 500 })
  }
}