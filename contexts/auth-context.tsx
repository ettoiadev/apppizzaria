"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem("auth-token")
    const userData = localStorage.getItem("user-data")

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("auth-token")
        localStorage.removeItem("user-data")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login via API for:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Login API error:", data.error)
        throw new Error(data.error || "Failed to login")
      }

      console.log("Login successful:", data.user)

      // Create user object matching our interface
      const authenticatedUser = {
        id: data.user.id,
        name: data.user.full_name || data.user.email.split("@")[0], // Use full_name or fallback to email prefix
        email: data.user.email,
        role: "CUSTOMER" as const, // Default role for regular users
      }

      setUser(authenticatedUser)
      localStorage.setItem("auth-token", data.session.access_token)
      localStorage.setItem("user-data", JSON.stringify(authenticatedUser))

      console.log("User authenticated and stored:", authenticatedUser)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user-data")
  }

  const register = async (userData: any) => {
    // Mock registration - In production, call your auth API
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        role: "CUSTOMER" as const,
        phone: userData.phone,
        address: userData.address,
        addressData: userData.addressData,
      }

      setUser(mockUser)
      localStorage.setItem("auth-token", "mock-token")
      localStorage.setItem("user-data", JSON.stringify(mockUser))
    } catch (error) {
      throw new Error("Erro ao criar conta")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
