import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"
import { isTokenValid } from "@/lib/auth-security"
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Extrair token do cookie
    const cookies = request.cookies
    const accessToken = cookies.get('access-token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acesso não encontrado" },
        { status: 401 }
      )
    }

    // Verificar se o token é válido
    if (!isTokenValid(accessToken)) {
      return NextResponse.json(
        { error: "Token expirado ou inválido" },
        { status: 401 }
      )
    }

    // Decodificar token
    let decoded: any
    try {
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    // Buscar dados atualizados do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", decoded.userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o usuário ainda está ativo
    if (!profile.active) {
      return NextResponse.json(
        { error: "Conta desativada" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        phone: profile.phone,
        created_at: profile.created_at,
      },
    })
  } catch (error) {
    logger.error('MODULE', "Erro ao verificar autenticação:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}