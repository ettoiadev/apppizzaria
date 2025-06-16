"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { OrderSummary } from "@/components/checkout/order-summary"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleOrderSubmit = async (orderData: any) => {
    console.log("CheckoutPage: Starting order submission")
    console.log("CheckoutPage: Order data received:", orderData)
    console.log("CheckoutPage: Cart items:", items)
    console.log("CheckoutPage: Cart total:", total)
    console.log("CheckoutPage: User:", user)

    setIsLoading(true)

    try {
      // Preparar dados completos do pedido
      const completeOrderData = {
        ...orderData,
        items,
        total,
        customerId: user?.id,
        user_id: user?.id,
      }

      console.log("CheckoutPage: Complete order data:", completeOrderData)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeOrderData),
      })

      console.log("CheckoutPage: API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("CheckoutPage: API error response:", errorData)

        toast({
          title: "Erro ao criar pedido",
          description: errorData.details || errorData.error || "Erro desconhecido",
          variant: "destructive",
        })

        throw new Error(errorData.error || "Erro ao criar pedido")
      }

      const order = await response.json()
      console.log("CheckoutPage: Order created successfully:", order)

      toast({
        title: "Pedido criado com sucesso!",
        description: `Pedido #${order.id.slice(-8)} foi criado. Você será redirecionado.`,
      })

      clearCart()
      router.push(`/pedido/${order.id}`)
    } catch (error) {
      console.error("CheckoutPage: Error in order submission:", error)

      toast({
        title: "Erro ao finalizar pedido",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar se o usuário está autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Faça login para continuar</h1>
          <p className="text-gray-600 mb-8">Você precisa estar logado para finalizar o pedido</p>
          <Button onClick={() => router.push("/login")}>Fazer Login</Button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Seu carrinho está vazio</h1>
          <p className="text-gray-600 mb-8">Adicione alguns itens ao seu carrinho para continuar</p>
          <Button onClick={() => router.push("/cardapio")}>Ver Cardápio</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Pedido</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <CheckoutForm onSubmit={handleOrderSubmit} isLoading={isLoading} userId={user?.id} />
          <OrderSummary items={items} total={total} />
        </div>
      </main>
    </div>
  )
}
