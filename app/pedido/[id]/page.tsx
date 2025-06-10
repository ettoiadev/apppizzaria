"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { OrderStatus } from "@/components/order/order-status"
import { OrderDetails } from "@/components/order/order-details"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function OrderPage() {
  const params = useParams()
  const orderId = params.id as string

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) throw new Error("Erro ao carregar pedido")
      return response.json()
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Pedido #{order.id}</h1>

          <OrderStatus status={order.status} />
          <OrderDetails order={order} />
        </div>
      </main>
    </div>
  )
}
