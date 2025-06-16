"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { ProductGrid } from "@/components/menu/product-grid"
import { CategoryFilter } from "@/components/menu/category-filter"
import { CartSidebar } from "@/components/cart/cart-sidebar"
import { ProductModal } from "@/components/menu/product-modal"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ShoppingBag, User } from "lucide-react"
import type { Product } from "@/types"

export default function MenuPage() {
  const { user } = useAuth()
  const { itemCount } = useCart()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // Query para produtos
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products")
      if (!response.ok) throw new Error("Erro ao carregar produtos")
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
  })

  // Query para categorias
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Erro ao carregar categorias")
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
  })

  // Filtrar produtos por categoria
  const filteredProducts = products.filter(
    (product: Product) => selectedCategory === "all" || product.categoryId === selectedCategory,
  )

  // Mostrar mensagem de boas-vindas para usuários recém-logados
  useEffect(() => {
    if (user) {
      const hasSeenWelcome = localStorage.getItem(`welcome-${user.id}`)
      if (!hasSeenWelcome) {
        setShowWelcome(true)
        localStorage.setItem(`welcome-${user.id}`, "true")
      }
    }
  }, [user])

  const handleDismissWelcome = () => {
    setShowWelcome(false)
  }

  // Loading state
  if (productsLoading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AuthenticatedLayout>
    )
  }

  // Error state
  if (productsError) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              Erro ao carregar o cardápio. Tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout onCartClick={() => setIsCartOpen(true)}>
      <div className="container mx-auto px-4 py-8">
        {/* Mensagem de boas-vindas */}
        {showWelcome && user && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <User className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <span>
                  Bem-vindo(a), <strong>{user.name.split(" ")[0]}</strong>! Explore nosso cardápio e faça seu pedido.
                </span>
                <Button variant="ghost" size="sm" onClick={handleDismissWelcome} className="text-green-600">
                  ✕
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header da página */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Nosso Cardápio</h1>
              <p className="text-gray-600">Escolha entre nossas deliciosas opções</p>
            </div>
            {itemCount > 0 && (
              <Button onClick={() => setIsCartOpen(true)} className="md:hidden flex items-center gap-2" size="sm">
                <ShoppingBag className="w-4 h-4" />
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </Button>
            )}
          </div>
        </div>

        {/* Filtros de categoria */}
        <div className="mb-8">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Grid de produtos */}
        <ProductGrid products={filteredProducts} onProductClick={setSelectedProduct} />

        {/* Modal do produto */}
        {selectedProduct && (
          <ProductModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}

        {/* Sidebar do carrinho */}
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </AuthenticatedLayout>
  )
}
