// Utilitários para melhorar a segurança da autenticação

/**
 * Configurações de cookies seguros para tokens de autenticação
 */
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 dias
  path: '/'
}

/**
 * Configurações de cookies para refresh tokens
 */
export const REFRESH_TOKEN_OPTIONS = {
  ...SECURE_COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 30, // 30 dias
}

/**
 * Valida se um token JWT não está expirado
 */
export function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    return payload.exp > now
  } catch {
    return false
  }
}

/**
 * Extrai informações do payload do token JWT
 */
export function getTokenPayload(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

/**
 * Gera um hash seguro para validação de sessão
 */
export function generateSessionHash(userId: string, timestamp: number): string {
  const data = `${userId}-${timestamp}-${process.env.JWT_SECRET}`
  return btoa(data).replace(/[+/=]/g, '')
}

/**
 * Valida se uma sessão é válida
 */
export function validateSession(userId: string, timestamp: number, hash: string): boolean {
  const expectedHash = generateSessionHash(userId, timestamp)
  return hash === expectedHash
}

/**
 * Configurações de rate limiting para autenticação
 */
export const AUTH_RATE_LIMITS = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas por IP
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 registros por IP
    message: 'Muitas tentativas de registro. Tente novamente em 1 hora.'
  }
}

/**
 * Sanitiza dados de entrada para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>"'&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[char] || char
    })
    .trim()
}

/**
 * Valida força da senha
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Lista de senhas comuns que devem ser rejeitadas
 */
export const COMMON_PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345',
  '1234567', '1234567890', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234'
]

/**
 * Verifica se a senha está na lista de senhas comuns
 */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase())
}