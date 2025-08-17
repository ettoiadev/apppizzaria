"use client"

// Hook personalizado para gerenciar produtos
import { useState, useEffect, useCallback } from "react"
import type { Product } from "@/types"
import { debugLog } from "@/lib/debug-utils"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    try {
      debugLog("Carregando produtos")
      setLoading(true)
      setError(null)

      const response = await fetch("/api/products", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      debugLog(`${data.length} produtos carregados`)
      setProducts(data)
    } catch (err: any) {
      debugLog("Erro ao carregar produtos", err)
      setError(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshProducts = useCallback(async () => {
    debugLog("Refresh manual solicitado")
    await loadProducts()
  }, [loadProducts])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return {
    products,
    loading,
    error,
    loadProducts,
    refreshProducts,
  }
}
