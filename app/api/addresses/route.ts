import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data: addresses, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching addresses:", error)
      return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
    }

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("Error in addresses GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, name, zipCode, street, number, complement, neighborhood, city, state, isDefault } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Se este endereço será o padrão, remover o padrão dos outros
    if (isDefault) {
      await supabase.from("customer_addresses").update({ is_default: false }).eq("customer_id", customerId)
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

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error in addresses POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
