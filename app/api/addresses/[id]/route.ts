import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { customerId, isDefault } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Se este endereço será o padrão, remover o padrão dos outros
    if (isDefault) {
      await supabase.from("customer_addresses").update({ is_default: false }).eq("customer_id", customerId)
    }

    const { data: address, error } = await supabase
      .from("customer_addresses")
      .update({
        is_default: isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("customer_id", customerId)
      .select()
      .single()

    if (error) {
      console.error("Error updating address:", error)
      return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error("Error in address PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
