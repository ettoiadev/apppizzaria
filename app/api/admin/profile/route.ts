import { NextResponse, type NextRequest } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from "@/lib/auth"
import { logger } from '@/lib/logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    // Verify admin access
    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get admin profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, created_at, updated_at')
      .eq('id', admin.id)
      .single()

    if (profileError || !profile) {
      logger.error('MODULE', 'Error fetching admin profile:', profileError)
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    logger.error('MODULE', "Error fetching admin profile:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    // Verify admin access
    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { full_name, phone } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', admin.id)
      .select('id, email, full_name, phone, created_at, updated_at')
      .single()

    if (updateError || !updatedProfile) {
      logger.error('MODULE', 'Error updating admin profile:', updateError)
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Perfil atualizado com sucesso",
      profile: updatedProfile 
    })
  } catch (error) {
    logger.error('MODULE', "Error updating admin profile:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
