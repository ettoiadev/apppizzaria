"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const statusColors = {
  RECEIVED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-yellow-100 text-yellow-800",
  ON_THE_WAY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const statusLabels = {
  RECEIVED: "Recebido",
  PREPARING: "Preparando",
  ON_THE_WAY: "Saiu para Entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

export function OrdersManagement() {
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Mock orders data
  const mockOrders = [
    {
      id: "1001",
      customer: { name: "João Silva", phone: "(11) 99999-9999" },
      items: [{ name: "Pizza Margherita", quantity: 1, price: 32.9 }],
      total: 32.9,
      status: "RECEIVED",
      createdAt: new Date().toISOString(),
      paymentMethod: "PIX",
    },
    {
      id: "1002",
      customer: { name: "Maria Santos", phone: "(11) 88888-8888" },
      items: [{ name: "Pizza Pepperoni", quantity: 2, price: 38.9 }],
      total: 77.8,
      status: "PREPARING",
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      paymentMethod: "Cartão",
    },
    {
      id: "1003",
      customer: { name: "Pedro Costa", phone: "(11) 77777-7777" },
      items: [{ name: "Pizza Quatro Queijos", quantity: 1, price: 45.9 }],
      total: 45.9,
      status: "ON_THE_WAY",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      paymentMethod: "Dinheiro",
    },
  ]

  const filteredOrders =
    selectedStatus === "all" ? mockOrders : mockOrders.filter((order) => order.status === selectedStatus)

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    // In production, make API call to update order status
    console.log(`Updating order ${orderId} to status ${newStatus}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
          <p className="text-gray-600">Acompanhe e gerencie todos os pedidos</p>
        </div>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="RECEIVED">Recebidos</SelectItem>
            <SelectItem value="PREPARING">Preparando</SelectItem>
            <SelectItem value="ON_THE_WAY">Saiu para Entrega</SelectItem>
            <SelectItem value="DELIVERED">Entregues</SelectItem>
            <SelectItem value="CANCELLED">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                  <p className="text-gray-600">
                    {order.customer.name} - {order.customer.phone}
                  </p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                  {statusLabels[order.status as keyof typeof statusLabels]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Itens do Pedido:</h4>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total:</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pagamento: {order.paymentMethod}</span>

                  <div className="flex gap-2">
                    {order.status === "RECEIVED" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "PREPARING")}>
                        Iniciar Preparo
                      </Button>
                    )}
                    {order.status === "PREPARING" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "ON_THE_WAY")}>
                        Enviar para Entrega
                      </Button>
                    )}
                    {order.status === "ON_THE_WAY" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "DELIVERED")}>
                        Marcar como Entregue
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => updateOrderStatus(order.id, "CANCELLED")}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
