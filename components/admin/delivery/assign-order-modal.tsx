"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin } from "lucide-react"

interface AssignOrderModalProps {
  deliveryPersonId: string
  isOpen: boolean
  onClose: () => void
}

interface PendingOrder {
  id: string
  customer: {
    name: string
    address: string
    phone: string
  }
  total: number
  items: Array<{
    name: string
    quantity: number
  }>
  createdAt: string
  estimatedDistance: string
  priority: "normal" | "urgent"
}

export function AssignOrderModal({ deliveryPersonId, isOpen, onClose }: AssignOrderModalProps) {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  // Mock pending orders
  const mockPendingOrders: PendingOrder[] = [
    {
      id: "1001",
      customer: {
        name: "João Silva",
        address: "Rua das Flores, 123 - Centro",
        phone: "(11) 99999-9999",
      },
      total: 45.9,
      items: [
        { name: "Pizza Margherita", quantity: 1 },
        { name: "Coca-Cola 350ml", quantity: 2 },
      ],
      createdAt: "2024-01-21T18:30:00Z",
      estimatedDistance: "2.5 km",
      priority: "normal",
    },
    {
      id: "1002",
      customer: {
        name: "Maria Santos",
        address: "Av. Paulista, 1000 - Bela Vista",
        phone: "(11) 88888-8888",
      },
      total: 67.8,
      items: [
        { name: "Pizza Pepperoni", quantity: 1 },
        { name: "Pizza Quatro Queijos", quantity: 1 },
      ],
      createdAt: "2024-01-21T18:45:00Z",
      estimatedDistance: "1.8 km",
      priority: "urgent",
    },
  ]

  const { data: pendingOrders = mockPendingOrders } = useQuery({
    queryKey: ["pending-orders"],
    queryFn: async () => mockPendingOrders,
    enabled: isOpen,
  })

  const handleAssignOrder = () => {
    if (!selectedOrder) return

    // In production, make API call to assign order
    console.log(`Assigning order ${selectedOrder} to delivery person ${deliveryPersonId}`)
    onClose()
  }

  const getPriorityColor = (priority: string) => {
    return priority === "urgent" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
  }

  const getPriorityLabel = (priority: string) => {
    return priority === "urgent" ? "Urgente" : "Normal"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atribuir Pedido</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-600">Selecione um pedido para atribuir ao entregador:</p>

          {pendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pedido pendente de entrega.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`cursor-pointer transition-all ${
                    selectedOrder === order.id ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedOrder(order.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">Pedido #{order.id}</h3>
                        <p className="text-sm text-gray-600">{order.customer.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(order.priority)}>{getPriorityLabel(order.priority)}</Badge>
                        <Badge variant="outline">R$ {order.total.toFixed(2)}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{order.customer.address}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-blue-600">{order.estimatedDistance}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>Pedido feito às {new Date(order.createdAt).toLocaleTimeString("pt-BR")}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-600">
                        <strong>Itens:</strong> {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleAssignOrder} disabled={!selectedOrder}>
              Atribuir Pedido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
