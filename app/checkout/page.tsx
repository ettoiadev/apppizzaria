"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { OrderSummary } from "@/components/checkout/order-summary"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  console.log("CheckoutPage - Current user:", user)
  console.log("CheckoutPage - Cart items:", items)
  console.log("CheckoutPage - Cart total:", total)

  const handleOrderSubmit = async (orderData: any) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer um pedido",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    try {
      setIsSubmitting(true)
      console.log("CheckoutPage - Submitting order:", orderData)

      // Preparar dados do pedido
      const orderPayload = {
        customerId: user.id,
        user_id: user.id,
        items: items.map((item) => ({
          id: item.id,
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit_price: item.price,
          size: item.size,
          toppings: item.toppings || [],
          special_instructions: item.special_instructions,
        })),
        total: total,
        address: orderData.address,
        delivery_address: orderData.address,
        phone: orderData.phone,
        delivery_phone: orderData.phone,
        paymentMethod: orderData.paymentMethod,
        payment_method: orderData.paymentMethod,
        notes: orderData.notes,
        delivery_instructions: orderData.notes,
      }

      console.log("CheckoutPage - Final order payload:", orderPayload)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      })

      const result = await response.json()
      console.log("CheckoutPage - Order response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar pedido")
      }

      // Sucesso - limpar carrinho e redirecionar
      clearCart()

      toast({
        title: "Pedido realizado com sucesso!",
        description: `Seu pedido #${result.id} foi criado. Você será redirecionado para acompanhar o status.`,
      })

      // Redirecionar para página de acompanhamento
      setTimeout(() => {
        router.push(`/pedido/${result.id}`)
      }, 2000)
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error)
      toast({
        title: "Erro ao finalizar pedido",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirecionar se não houver itens no carrinho
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrinho vazio</h1>
          <p className="text-gray-600 mb-8">Adicione alguns itens ao seu carrinho antes de finalizar o pedido.</p>
          <button
            onClick={() => router.push("/cardapio")}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Ver Cardápio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Pedido</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <CheckoutForm onSubmit={handleOrderSubmit} isSubmitting={isSubmitting} />
          </div>

          <div>
            <OrderSummary />
          </div>
        </div>
      </main>
    </div>
  )
}
