import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from "@/lib/auth"

// GET - Listar endereços do usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "UserId não fornecido" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: addresses, error } = await supabase
      .from('customer_addresses')
      .select('*, label as name')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar endereços:', error)
      throw error
    }

    return NextResponse.json({ addresses: addresses || [] })
  } catch (error) {
    console.error("Erro ao buscar endereços:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Adicionar novo endereço
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer_id, name, street, number, complement, neighborhood, city, state, zip_code, is_default } = body

    console.log("POST /api/addresses - Dados recebidos:", body)

    // Validações detalhadas dos campos obrigatórios
    if (!customer_id) {
      return NextResponse.json({ error: "ID do cliente é obrigatório" }, { status: 400 })
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome do endereço é obrigatório" }, { status: 400 })
    }
    if (!zip_code || !zip_code.trim()) {
      return NextResponse.json({ error: "CEP é obrigatório" }, { status: 400 })
    }
    const zipCodeNumbers = zip_code.replace(/\D/g, "")
    if (zipCodeNumbers.length !== 8) {
      return NextResponse.json({ error: "CEP deve ter 8 dígitos" }, { status: 400 })
    }
    if (!street || !street.trim()) {
      return NextResponse.json({ error: "Rua/Logradouro é obrigatório" }, { status: 400 })
    }
    if (!number || !number.trim()) {
      return NextResponse.json({ error: "Número é obrigatório" }, { status: 400 })
    }
    if (!neighborhood || !neighborhood.trim()) {
      return NextResponse.json({ error: "Bairro é obrigatório" }, { status: 400 })
    }
    if (!city || !city.trim()) {
      return NextResponse.json({ error: "Cidade é obrigatória" }, { status: 400 })
    }
    if (!state || !state.trim()) {
      return NextResponse.json({ error: "Estado é obrigatório" }, { status: 400 })
    }
    if (state.length !== 2) {
      return NextResponse.json({ error: "Estado deve ter 2 caracteres (UF)" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Se o novo endereço for padrão, remover o padrão dos outros
    if (is_default) {
      const { error: updateError } = await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', customer_id)
        
      if (updateError) {
        console.error('Erro ao atualizar endereços padrão:', updateError)
        throw updateError
      }
    }

    // Inserir novo endereço
    const { data: newAddress, error: insertError } = await supabase
      .from('customer_addresses')
      .insert({
        user_id: customer_id,
        label: name || 'Endereço',
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zip_code,
        is_default: is_default || false
      })
      .select('*, label as name')
      .single()

    if (insertError) {
      console.error('Erro ao criar endereço:', insertError)
      throw insertError
    }

    console.log("POST /api/addresses - Endereço criado:", newAddress)

    return NextResponse.json({ address: newAddress })
  } catch (error) {
    console.error("Erro ao criar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
