import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// GET - Buscar um endereço específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: address, error } = await supabase
      .from('customer_addresses')
      .select('*, label as name')
      .eq('id', params.id)
      .single()

    if (error || !address) {
      return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Erro ao buscar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PATCH - Atualizar um endereço parcialmente (para marcar como padrão)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { is_default } = body

    console.log("PATCH /api/addresses - Atualizando endereço:", params.id, body)

    // Primeiro, buscar o endereço para ter o user_id
    const { data: existingAddress, error: findError } = await supabase
      .from('customer_addresses')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (findError || !existingAddress) {
      return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
    }

    const userId = existingAddress.user_id

    // Se definindo como padrão, remover padrão dos outros
    if (is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', params.id)
    }

    // Atualizar endereço
    const { data: updatedAddress, error: updateError } = await supabase
      .from('customer_addresses')
      .update({ 
        is_default: is_default, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', params.id)
      .select('*, label as name')
      .single()

    if (updateError || !updatedAddress) {
      throw new Error('Erro ao atualizar endereço')
    }

    console.log("PATCH /api/addresses - Endereço atualizado:", updatedAddress)

    return NextResponse.json({ address: updatedAddress })
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar um endereço completo
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, street, number, complement, neighborhood, city, state, zip_code, is_default } = body

    console.log("PUT /api/addresses - Dados recebidos:", body)

    // Validações detalhadas dos campos obrigatórios
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

    // Primeiro, buscar o endereço para ter o user_id
    const { data: existingAddress, error: findError } = await supabase
      .from('customer_addresses')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (findError || !existingAddress) {
      return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
    }

    const userId = existingAddress.user_id

    // Se o endereço for definido como padrão, remover o padrão dos outros
    if (is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', params.id)
    }

    // Atualizar endereço
    const { data: updatedAddress, error: updateError } = await supabase
      .from('customer_addresses')
      .update({
        label: name || 'Endereço',
        street: street,
        number: number,
        complement: complement,
        neighborhood: neighborhood,
        city: city,
        state: state,
        zip_code: zip_code,
        is_default: is_default || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('*, label as name')
      .single()

    if (updateError || !updatedAddress) {
      throw new Error('Erro ao atualizar endereço')
    }

    console.log("PUT /api/addresses - Endereço atualizado:", updatedAddress)

    return NextResponse.json({ address: updatedAddress })
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Excluir um endereço
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log("DELETE /api/addresses - Excluindo endereço:", params.id)

    // Verificar se o endereço existe
    const { data: existingAddress, error: checkError } = await supabase
      .from('customer_addresses')
      .select('is_default, user_id')
      .eq('id', params.id)
      .single()

    if (checkError || !existingAddress) {
      return NextResponse.json({ error: "Endereço não encontrado" }, { status: 404 })
    }

    const { is_default, user_id } = existingAddress

    // Não permitir excluir o endereço padrão se houver outros endereços
    if (is_default) {
      const { count, error: countError } = await supabase
        .from('customer_addresses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
      
      if (!countError && count && count > 1) {
        return NextResponse.json(
          { error: "Não é possível excluir o endereço padrão. Defina outro endereço como padrão primeiro." },
          { status: 400 }
        )
      }
    }

    // Excluir endereço
    const { error: deleteError } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      throw deleteError
    }

    console.log("DELETE /api/addresses - Endereço excluído com sucesso")

    return NextResponse.json({ message: "Endereço excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
