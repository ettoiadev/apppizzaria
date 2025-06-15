import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      console.log("[GET /api/addresses] Erro: userId não fornecido")
      return NextResponse.json({ addresses: [] }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    console.log(`[GET /api/addresses] Buscando endereços para userId: ${userId}`)

    // Verificar se a tabela existe antes de fazer a consulta
    const { error: tableCheckError, data: tableExists } = await supabase
      .from("customer_addresses")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (tableCheckError) {
      console.log(`[GET /api/addresses] Erro ao verificar tabela: ${tableCheckError.message}`)
      return NextResponse.json({ addresses: [] }, { status: 200 })
    }

    // Se a tabela não existir ou estiver vazia, retornar array vazio
    if (tableCheckError) {
      console.log("[GET /api/addresses] Tabela customer_addresses não existe ou está inacessível")
      return NextResponse.json({ addresses: [] }, { status: 200 })
    }

    const { data: addresses, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.log(`[GET /api/addresses] Erro ao buscar endereços: ${error.message}`)
      return NextResponse.json({ addresses: [] }, { status: 200 })
    }

    console.log(`[GET /api/addresses] Encontrados ${addresses.length} endereços`)
    return NextResponse.json({ addresses }, { status: 200 })
  } catch (error) {
    console.error("[GET /api/addresses] Erro não tratado:", error)
    return NextResponse.json({ addresses: [] }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const data = await request.json()

    if (!data.customer_id) {
      return NextResponse.json({ error: "ID do cliente é obrigatório" }, { status: 400 })
    }

    // Verificar se é o primeiro endereço do cliente
    const { data: existingAddresses, error: countError } = await supabase
      .from("customer_addresses")
      .select("id")
      .eq("customer_id", data.customer_id)

    if (countError) {
      console.error("Erro ao verificar endereços existentes:", countError)
    }

    // Se for o primeiro endereço ou se is_default for true, definir como padrão
    const isDefault = data.is_default === true || !existingAddresses || existingAddresses.length === 0

    const { data: address, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: data.customer_id,
        name: data.name || "Endereço Principal",
        zip_code: data.zip_code,
        street: data.street,
        number: data.number,
        complement: data.complement || "",
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        is_default: isDefault,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar endereço:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ address }, { status: 201 })
  } catch (error) {
    console.error("Erro não tratado:", error)
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 })
  }
}
