import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// GET - Buscar dados de um usuário específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    logger.debug('MODULE', "GET /api/users - Buscando usuário:", params.id)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar dados do usuário e perfil usando Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        role,
        email_verified,
        profile_completed
      `)
      .eq('id', params.id)
      .single()

    if (error || !profile) {
      logger.error('MODULE', 'Erro ao buscar perfil:', error)
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Buscar email do auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(params.id)
    
    if (authError || !authUser.user) {
      logger.error('MODULE', 'Erro ao buscar dados de autenticação:', authError)
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const userData = {
      id: profile.id,
      email: authUser.user.email,
      name: profile.full_name,
      phone: profile.phone,
      role: profile.role,
      email_verified: profile.email_verified,
      profile_completed: profile.profile_completed
    }
    
    logger.debug('MODULE', "Dados do usuário encontrados:", userData)

    return NextResponse.json({ 
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        full_name: userData.name,
        phone: userData.phone,
        role: userData.role,
        email_verified: userData.email_verified,
        profile_completed: userData.profile_completed
      }
    })
  } catch (error) {
    logger.error('MODULE', "Erro ao buscar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar dados de um usuário
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    logger.debug('MODULE', "PUT /api/users - Atualizando usuário:", params.id)

    const body = await request.json()
    const { name, email, phone } = body

    // Validações obrigatórias
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    if (name.trim().length < 2) {
      return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres" }, { status: 400 })
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 })
    }
    const phoneNumbers = phone.replace(/\D/g, "")
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      return NextResponse.json({ error: "Telefone deve ter 10 ou 11 dígitos" }, { status: 400 })
    }

    // Limpar telefone para salvar apenas números no banco
    const cleanPhone = phone.replace(/\D/g, "")
    
    logger.debug('MODULE', "Dados a serem atualizados:", { name, email, phone: phone, cleanPhone })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar se o usuário existe
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.getUserById(params.id)
    
    if (userCheckError || !existingUser.user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    try {
      // Atualizar email na tabela auth.users se necessário
      if (existingUser.user.email !== email) {
        const { error: emailUpdateError } = await supabase.auth.admin.updateUserById(
          params.id,
          { email }
        )
        
        if (emailUpdateError) {
          logger.error('MODULE', 'Erro ao atualizar email:', emailUpdateError)
          throw emailUpdateError
        }
      }

      // Atualizar dados na tabela profiles (salvar telefone limpo - apenas números)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          phone: cleanPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (profileUpdateError) {
        logger.error('MODULE', 'Erro ao atualizar perfil:', profileUpdateError)
        throw profileUpdateError
      }

      logger.debug('MODULE', "Usuário atualizado com sucesso:", params.id)

      return NextResponse.json({ 
        message: "Dados atualizados com sucesso",
        user: {
          id: params.id,
          name: name.trim(),
          email: email,
          phone: cleanPhone
        }
      })
    } catch (transactionError) {
      logger.error('MODULE', 'Erro na atualização:', transactionError)
      throw transactionError
    }
  } catch (error) {
    logger.error('MODULE', "Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}