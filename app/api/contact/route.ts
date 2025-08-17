import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// POST - Enviar mensagem de contato
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validar dados
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Nome, email e mensagem são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Inserir mensagem
    const { data: result, error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        subject: subject || "Contato via site",
        message
      })
      .select()
      .single()

    if (insertError) {
      logger.error('MODULE', '[CONTACT] Erro ao inserir mensagem:', insertError)
      throw insertError
    }

    // TODO: Enviar email de notificação para o administrador
    // Isso será implementado quando configurarmos o serviço de email

    return NextResponse.json({ 
      message: "Mensagem enviada com sucesso",
      contact: result
    })
  } catch (error) {
    logger.error('MODULE', "Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
