import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente existem
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables")
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    console.log("GET /api/addresses - userId:", userId)

    if (!userId) {
      console.log("No userId provided")
      return NextResponse.json({ addresses: [] })
    }

    // Verificar se a tabela existe antes de fazer a query
    const { data: addresses, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching addresses:", error)
      // Se a tabela não existir, retornar array vazio
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        console.log("Table customer_addresses does not exist, returning empty array")
        return NextResponse.json({ addresses: [] })
      }
      return NextResponse.json({ addresses: [] })
    }

    console.log("Addresses found:", addresses?.length || 0)
    return NextResponse.json({ addresses: addresses || [] })
  } catch (error) {
    console.error("Error in addresses GET:", error)
    return NextResponse.json({ addresses: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, name, zipCode, street, number, complement, neighborhood, city, state, isDefault } = body

    console.log("POST /api/addresses - customerId:", customerId)

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Se este endereço será o padrão, remover o padrão dos outros
    if (isDefault) {
      try {
        await supabase.from("customer_addresses").update({ is_default: false }).eq("customer_id", customerId)
      } catch (updateError) {
        console.error("Error updating default addresses:", updateError)
      }
    }

    const { data: address, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: customerId,
        name: name || "Endereço Principal",
        zip_code: zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        is_default: isDefault || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating address:", error)
      return NextResponse.json({ error: "Failed to create address" }, { status: 500 })
    }

    console.log("Address created successfully:", address?.id)
    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error in addresses POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
