import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { 
  withMiddleware, 
  rateLimit, 
  validateInput, 
  securityLogger,
  type ValidationRule 
} from "@/lib/api-middleware"
import { 
import { logger } from '@/lib/logger'
  validatePasswordStrength, 
  isCommonPassword, 
  sanitizeInput 
} from "@/lib/auth-security"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validação para registro
const registerValidationRules: ValidationRule[] = [
  { field: 'email', required: true, type: 'email', sanitize: true },
  { field: 'password', required: true, type: 'string', minLength: 8, maxLength: 128 },
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100, sanitize: true },
  { field: 'phone', required: true, type: 'phone', sanitize: true },
  { field: 'role', required: false, type: 'string', maxLength: 20 }
]

export async function POST(request: NextRequest) {
  // Aplicar middlewares com rate limiting mais restritivo para registro
  const middlewareResult = await withMiddleware(
    securityLogger(),
    rateLimit('/api/auth/register', { windowMs: 15 * 60 * 1000, max: 3 }), // 3 tentativas por 15 min
    validateInput(registerValidationRules)
  )(request)
  
  if (middlewareResult) {
    return middlewareResult
  }

  try {
    const sanitizedBody = (request as any).sanitizedBody
    const { email, password, name, phone, role = 'customer' } = sanitizedBody

    // Validações adicionais de segurança
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: "Senha não atende aos critérios de segurança",
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Verificar se é uma senha comum
    if (isCommonPassword(password)) {
      return NextResponse.json(
        { error: "Esta senha é muito comum. Escolha uma senha mais segura." },
        { status: 400 }
      )
    }

    // Validar role permitida
    const allowedRoles = ['customer', 'admin', 'driver', 'kitchen']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Tipo de usuário inválido" },
        { status: 400 }
      )
    }

    logger.debug('MODULE', "POST /api/auth/secure-register - Registering user:", {
      email: email.substring(0, 3) + "***", // Log parcial por segurança
      name: name.substring(0, 3) + "***",
      role
    })

    // Verificar se o email já existe
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email)
    
    if (existingUser.user) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 409 }
      )
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar em desenvolvimento
      user_metadata: {
        name,
        phone,
        role
      }
    })

    if (authError) {
      logger.error('MODULE', "Erro ao criar usuário no Auth:", authError)
      
      // Tratar erros específicos
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: "Este email já está cadastrado" },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: "Erro ao criar conta" },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Erro ao criar usuário" },
        { status: 500 }
      )
    }

    // Criar perfil na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: sanitizeInput(name),
        email: email.toLowerCase(),
        phone: sanitizeInput(phone),
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      logger.error('MODULE', "Erro ao criar perfil:", profileError)
      
      // Tentar reverter a criação do usuário
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        logger.error('MODULE', "Erro ao reverter criação de usuário:", deleteError)
      }
      
      return NextResponse.json(
        { error: "Erro ao criar perfil do usuário" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Conta criada com sucesso",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role
      }
    }, { status: 201 })

  } catch (error) {
    logger.error('MODULE', "Erro no POST /api/auth/secure-register:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}