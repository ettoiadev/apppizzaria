import { NextRequest, NextResponse } from "next/server"
import { sanitizeInput } from "@/lib/auth-security"
import jwt from "jsonwebtoken"

// Rate limiting simples (em produção, usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Configurações de rate limiting por endpoint
 */
export const RATE_LIMITS = {
  '/api/auth/login': { windowMs: 15 * 60 * 1000, max: 5 }, // 5 tentativas em 15min
  '/api/auth/register': { windowMs: 60 * 60 * 1000, max: 3 }, // 3 tentativas em 1h
  '/api/orders': { windowMs: 60 * 1000, max: 10 }, // 10 pedidos por minuto
  '/api/products': { windowMs: 60 * 1000, max: 100 }, // 100 consultas por minuto
  '/api/customers': { windowMs: 60 * 1000, max: 50 }, // 50 consultas por minuto
  default: { windowMs: 60 * 1000, max: 60 } // 60 requests por minuto (padrão)
}

/**
 * Middleware de rate limiting
 */
export function rateLimit(endpoint: string) {
  return (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const key = `${ip}:${endpoint}`
    const now = Date.now()
    
    const limit = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.default
    const current = rateLimitMap.get(key)
    
    if (!current || now > current.resetTime) {
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + limit.windowMs
      })
      return null // Permitir
    }
    
    if (current.count >= limit.max) {
      return NextResponse.json(
        { 
          error: "Muitas requisições. Tente novamente mais tarde.",
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { status: 429 }
      )
    }
    
    current.count++
    return null // Permitir
  }
}

/**
 * Middleware de validação de entrada
 */
export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'email' | 'phone' | 'uuid'
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  sanitize?: boolean
}

export function validateInput(rules: ValidationRule[]) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json()
      const errors: string[] = []
      const sanitizedBody: any = {}
      
      for (const rule of rules) {
        const value = body[rule.field]
        
        // Verificar campo obrigatório
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(`Campo '${rule.field}' é obrigatório`)
          continue
        }
        
        // Se campo não é obrigatório e está vazio, pular validação
        if (!rule.required && (value === undefined || value === null || value === '')) {
          sanitizedBody[rule.field] = value
          continue
        }
        
        let processedValue = value
        
        // Sanitizar se necessário
        if (rule.sanitize && typeof value === 'string') {
          processedValue = sanitizeInput(value)
        }
        
        // Validar tipo
        switch (rule.type) {
          case 'string':
            if (typeof processedValue !== 'string') {
              errors.push(`Campo '${rule.field}' deve ser uma string`)
              continue
            }
            break
            
          case 'number':
            if (typeof processedValue !== 'number' && isNaN(Number(processedValue))) {
              errors.push(`Campo '${rule.field}' deve ser um número`)
              continue
            }
            processedValue = Number(processedValue)
            break
            
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(processedValue)) {
              errors.push(`Campo '${rule.field}' deve ser um email válido`)
              continue
            }
            break
            
          case 'phone':
            const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/
            if (!phoneRegex.test(processedValue.replace(/\D/g, ''))) {
              errors.push(`Campo '${rule.field}' deve ser um telefone válido`)
              continue
            }
            break
            
          case 'uuid':
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(processedValue)) {
              errors.push(`Campo '${rule.field}' deve ser um UUID válido`)
              continue
            }
            break
        }
        
        // Validar comprimento
        if (rule.minLength && processedValue.length < rule.minLength) {
          errors.push(`Campo '${rule.field}' deve ter pelo menos ${rule.minLength} caracteres`)
          continue
        }
        
        if (rule.maxLength && processedValue.length > rule.maxLength) {
          errors.push(`Campo '${rule.field}' deve ter no máximo ${rule.maxLength} caracteres`)
          continue
        }
        
        // Validar padrão
        if (rule.pattern && !rule.pattern.test(processedValue)) {
          errors.push(`Campo '${rule.field}' não atende ao formato esperado`)
          continue
        }
        
        sanitizedBody[rule.field] = processedValue
      }
      
      if (errors.length > 0) {
        return NextResponse.json(
          { error: "Dados inválidos", details: errors },
          { status: 400 }
        )
      }
      
      // Adicionar corpo sanitizado ao request
      ;(request as any).sanitizedBody = sanitizedBody
      return null // Permitir
    } catch (error) {
      return NextResponse.json(
        { error: "Formato de dados inválido" },
        { status: 400 }
      )
    }
  }
}

/**
 * Middleware de autenticação
 */
export function requireAuth(requiredRole?: string) {
  return (request: NextRequest) => {
    try {
      const token = request.cookies.get('access-token')?.value
      
      if (!token) {
        return NextResponse.json(
          { error: "Token de acesso requerido" },
          { status: 401 }
        )
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      if (requiredRole && decoded.role !== requiredRole) {
        return NextResponse.json(
          { error: "Permissão insuficiente" },
          { status: 403 }
        )
      }
      
      // Adicionar dados do usuário ao request
      ;(request as any).user = decoded
      return null // Permitir
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }
  }
}

/**
 * Combinar múltiplos middlewares
 */
export function withMiddleware(...middlewares: Array<(req: NextRequest) => NextResponse | null>) {
  return async (request: NextRequest) => {
    for (const middleware of middlewares) {
      const result = await middleware(request)
      if (result) {
        return result // Middleware retornou erro, parar execução
      }
    }
    return null // Todos os middlewares passaram
  }
}

/**
 * Middleware de logging de segurança
 */
export function securityLogger() {
  return (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const method = request.method
    const url = request.url
    
    // Log apenas em endpoints sensíveis
    const sensitiveEndpoints = ['/api/auth/', '/api/admin/', '/api/orders/']
    const isSensitive = sensitiveEndpoints.some(endpoint => url.includes(endpoint))
    
    if (isSensitive) {
      console.log(`[SECURITY] ${new Date().toISOString()} - ${method} ${url} - IP: ${ip} - UA: ${userAgent}`)
    }
    
    return null // Sempre permitir (apenas log)
  }
}