import { NextRequest, NextResponse } from "next/server"
import { serialize } from "cookie"

export async function POST(request: NextRequest) {
  try {
    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso"
    })

    // Limpar cookies de autenticação
    // Definir cookies com valor vazio e expiração no passado
    const clearCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 0, // Expira imediatamente
      path: '/'
    }

    response.headers.set(
      'Set-Cookie',
      serialize('access-token', '', clearCookieOptions)
    )
    
    response.headers.append(
      'Set-Cookie',
      serialize('refresh-token', '', clearCookieOptions)
    )

    return response
  } catch (error) {
    console.error("Erro no logout:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}