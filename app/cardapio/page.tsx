"use client"

import { useState, useEffect } from "react"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { ProductGrid } from "@/components/menu/product-grid"
import { CategoryFilter } from "@/components/menu/category-filter"
import { CartSidebar } from "@/components/cart/cart-sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShoppingBag, User } from "lucide-react"

export default function MenuPage() {
  const { user } = useAuth()
  const { itemCount } = useCart()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

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
          <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>

        {/* Grid de produtos */}
        <ProductGrid selectedCategory={selectedCategory} />

        {/* Sidebar do carrinho */}
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </AuthenticatedLayout>
  )
}
