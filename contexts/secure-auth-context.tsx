"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { isTokenValid, sanitizeInput, validatePasswordStrength, isCommonPassword } from "@/lib/auth-security"
import { logger } from '@/lib/logger'

interface User {
  id: string
  name: string
  email: string
  role: "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY"
  phone?: string
  address?: string
  addressData?: {
    zipCode: string
    street: string
    neighborhood: string
    city: string
    state: string
    number: string
    complement: string
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, requiredRole?: string) => Promise<void>
  logout: () => void
  register: (userData: any) => Promise<void>
  refreshToken: () => Promise<boolean>
}

const SecureAuthContext = createContext<AuthContextType | undefined>(undefined)

export function SecureAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar se há uma sessão válida no servidor
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Inclui cookies httpOnly
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      logger.error('MODULE', "Erro ao verificar status de autenticação:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string, requiredRole?: string) => {
    try {
      setIsLoading(true)

      // Sanitizar entrada
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim())
      const sanitizedPassword = password.trim()

      // Validar entrada
      if (!sanitizedEmail || !sanitizedPassword) {
        throw new Error("Email e senha são obrigatórios")
      }

      const response = await fetch("/api/auth/secure-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Inclui cookies httpOnly
        body: JSON.stringify({ 
          email: sanitizedEmail, 
          password: sanitizedPassword,
          requiredRole 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha no login")
      }

      // Verificar role se necessário
      if (requiredRole === "admin" && data.user.role !== "admin") {
        throw new Error("Acesso negado. Apenas administradores podem acessar esta área.")
      }

      // Criar objeto de usuário
      const authenticatedUser = {
        id: data.user.id,
        name: data.user.full_name || data.user.email.split("@")[0],
        email: data.user.email,
        role: data.user.role.toUpperCase() as "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY",
      }

      setUser(authenticatedUser)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      logger.error('MODULE', "Erro ao fazer logout:", error)
    } finally {
      setUser(null)
      router.push("/")
    }
  }

  const register = async (userData: any) => {
    try {
      setIsLoading(true)

      // Sanitizar dados de entrada
      const sanitizedData = {
        ...userData,
        email: sanitizeInput(userData.email.toLowerCase().trim()),
        name: sanitizeInput(userData.name.trim()),
        phone: userData.phone ? sanitizeInput(userData.phone.trim()) : undefined,
      }

      // Validar força da senha
      const passwordValidation = validatePasswordStrength(userData.password)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(", "))
      }

      // Verificar se não é uma senha comum
      if (isCommonPassword(userData.password)) {
        throw new Error("Esta senha é muito comum. Escolha uma senha mais segura.")
      }

      const response = await fetch("/api/auth/secure-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(sanitizedData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta")
      }

      // Login automático após registro
      await login(sanitizedData.email, userData.password)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      logger.error('MODULE', "Erro ao renovar token:", error)
      return false
    }
  }

  return (
    <SecureAuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
        refreshToken,
      }}
    >
      {children}
    </SecureAuthContext.Provider>
  )
}

export function useSecureAuth() {
  const context = useContext(SecureAuthContext)
  if (context === undefined) {
    throw new Error("useSecureAuth must be used within a SecureAuthProvider")
  }
  return context
}