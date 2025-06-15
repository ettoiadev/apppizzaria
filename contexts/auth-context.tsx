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
  login: (email: string, password: string, requiredRole?: string) => Promise<void>
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

    console.log("AuthProvider: Checking stored auth data", { hasToken: !!token, hasUserData: !!userData })

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        console.log("AuthProvider: Restored user from localStorage", parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("AuthProvider: Error parsing user data:", error)
        localStorage.removeItem("auth-token")
        localStorage.removeItem("user-data")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, requiredRole?: string) => {
    try {
      console.log("AuthProvider: Attempting login via API for:", email)
      setIsLoading(true)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("AuthProvider: Login API error:", data.error)
        throw new Error(data.error || "Failed to login")
      }

      console.log("AuthProvider: Login successful:", data.user)

      // Get user profile to check role
      const profileResponse = await fetch("/api/admin/profile", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      })

      let userRole = "CUSTOMER"
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        userRole = profileData.role === "admin" ? "ADMIN" : "CUSTOMER"
      }

      // Check if required role matches
      if (requiredRole === "admin" && userRole !== "ADMIN") {
        throw new Error("Acesso negado. Apenas administradores podem acessar esta área.")
      }

      // Create user object matching our interface
      const authenticatedUser = {
        id: data.user.id,
        name: data.user.full_name || data.user.email.split("@")[0],
        email: data.user.email,
        role: userRole as "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY",
      }

      console.log("AuthProvider: Setting authenticated user:", authenticatedUser)
      setUser(authenticatedUser)
      localStorage.setItem("auth-token", data.session.access_token)
      localStorage.setItem("user-data", JSON.stringify(authenticatedUser))

      console.log("AuthProvider: User authenticated and stored successfully")
    } catch (error) {
      console.error("AuthProvider: Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    console.log("AuthProvider: Logging out user")
    setUser(null)
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user-data")
  }

  const register = async (userData: any) => {
    try {
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
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
