import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"
import { SECURE_COOKIE_OPTIONS, REFRESH_TOKEN_OPTIONS, sanitizeInput } from "@/lib/auth-security"
import { serialize } from "cookie"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rate limiting simples (em produção, usar Redis ou similar)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Reset contador após 15 minutos
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  if (attempts.count >= 5) {
    return false
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
        { status: 429 }
      )
    }

    const { email, password, requiredRole } = await request.json()

    // Validar entrada
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    // Sanitizar email
    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim())

    // Autenticar com Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: password.trim(),
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil de usuário não encontrado" },
        { status: 404 }
      )
    }

    // Verificar role se necessário
    if (requiredRole && profile.role !== requiredRole) {
      return NextResponse.json(
        { error: "Acesso negado para este tipo de usuário" },
        { status: 403 }
      )
    }

    // Gerar tokens JWT
    const accessTokenPayload = {
      userId: authData.user.id,
      email: authData.user.email,
      role: profile.role,
      type: 'access'
    }

    const refreshTokenPayload = {
      userId: authData.user.id,
      type: 'refresh'
    }

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '30d' }
    )

    // Preparar resposta
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: profile.full_name,
        role: profile.role,
      },
    })

    // Definir cookies seguros
    response.headers.set(
      'Set-Cookie',
      serialize('access-token', accessToken, SECURE_COOKIE_OPTIONS)
    )
    
    response.headers.append(
      'Set-Cookie',
      serialize('refresh-token', refreshToken, REFRESH_TOKEN_OPTIONS)
    )

    // Reset contador de tentativas em caso de sucesso
    loginAttempts.delete(ip)

    return response
  } catch (error) {
    console.error("Erro no login seguro:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}