"use client"

import { useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, DollarSign, Package } from "lucide-react"

interface CustomerOrderHistoryProps {
  customerId: string
  isOpen: boolean
  onClose: () => void
}

interface Order {
  id: string
  date: string
  status: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  paymentMethod: string
}

export function CustomerOrderHistory({ customerId, isOpen, onClose }: CustomerOrderHistoryProps) {
  // Mock order history data
  const mockOrders: Order[] = [
    {
      id: "1001",
      date: "2024-01-20T18:45:00Z",
      status: "DELIVERED",
      total: 45.9,
      items: [
        { name: "Pizza Margherita", quantity: 1, price: 32.9 },
        { name: "Coca-Cola 350ml", quantity: 2, price: 5.9 },
      ],
      paymentMethod: "PIX",
    },
    {
      id: "1002",
      date: "2024-01-18T20:15:00Z",
      status: "DELIVERED",
      total: 38.9,
      items: [{ name: "Pizza Pepperoni", quantity: 1, price: 38.9 }],
      paymentMethod: "Cartão",
    },
    {
      id: "1003",
      date: "2024-01-15T19:30:00Z",
      status: "DELIVERED",
      total: 67.8,
      items: [
        { name: "Pizza Quatro Queijos", quantity: 1, price: 45.9 },
        { name: "Brownie de Chocolate", quantity: 1, price: 12.9 },
        { name: "Água Mineral 500ml", quantity: 2, price: 3.5 },
      ],
      paymentMethod: "Dinheiro",
    },
  ]

  const { data: orders = mockOrders, isLoading } = useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      // In production, fetch from API
      return mockOrders
    },
    enabled: isOpen,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "ON_THE_WAY":
        return "bg-blue-100 text-blue-800"
      case "PREPARING":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "Entregue"
      case "ON_THE_WAY":
        return "Saiu para Entrega"
      case "PREPARING":
        return "Preparando"
      case "CANCELLED":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Pedidos</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum pedido encontrado para este cliente.</p>
              </div>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Pedido #{order.id}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(order.date).toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                        <div className="text-lg font-bold text-primary mt-1">R$ {order.total.toFixed(2)}</div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <h4 className="font-medium">Itens do Pedido:</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Pagamento: {order.paymentMethod}</span>
                      </div>
                      <div className="font-medium">Total: R$ {order.total.toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
