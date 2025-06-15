"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Clock, Phone, MapPin, CreditCard, Package, Truck, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const statusColors = {
  RECEIVED: "bg-blue-100 text-blue-800 border-blue-200",
  PREPARING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  ON_THE_WAY: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
}

const statusLabels = {
  RECEIVED: "Recebido",
  PREPARING: "Preparando",
  ON_THE_WAY: "Saiu para Entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
}

const statusIcons = {
  RECEIVED: Package,
  PREPARING: Clock,
  ON_THE_WAY: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
}

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  size?: string
  toppings?: string[]
  products: {
    name: string
    description: string
    image: string
  }
}

interface Order {
  id: string
  status: keyof typeof statusLabels
  total: number
  subtotal: number
  delivery_fee: number
  discount: number
  payment_method: string
  delivery_address: string
  delivery_phone: string
  delivery_instructions?: string
  estimated_delivery_time?: string
  created_at: string
  updated_at: string
  profiles: {
    full_name: string
    phone?: string
  }
  order_items: OrderItem[]
}

interface OrderStatistics {
  total: number
  received: number
  preparing: number
  onTheWay: number
  delivered: number
  cancelled: number
  totalRevenue: number
}

export function OrdersManagement() {
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [orders, setOrders] = useState<Order[]>([])
  const [statistics, setStatistics] = useState<OrderStatistics>({
    total: 0,
    received: 0,
    preparing: 0,
    onTheWay: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [cancellationNotes, setCancellationNotes] = useState("")
  const { toast } = useToast()

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus)
      }

      const response = await fetch(`/api/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setStatistics(data.statistics || {})
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Falha ao carregar pedidos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar pedidos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [selectedStatus])

  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string) => {
    try {
      setUpdatingStatus(orderId)

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, notes }),
      })

      if (response.ok) {
        const updatedOrder = await response.json()

        // Atualizar a lista de pedidos
        setOrders((prevOrders) => prevOrders.map((order) => (order.id === orderId ? updatedOrder : order)))

        toast({
          title: "Sucesso",
          description: `Status do pedido atualizado para ${statusLabels[newStatus as keyof typeof statusLabels]}`,
        })

        // Recarregar estatísticas
        fetchOrders()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Falha ao atualizar status do pedido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao atualizar pedido",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
      setCancellationNotes("")
    }
  }

  const getNextStatusAction = (currentStatus: string) => {
    switch (currentStatus) {
      case "RECEIVED":
        return { status: "PREPARING", label: "Iniciar Preparo", icon: Clock }
      case "PREPARING":
        return { status: "ON_THE_WAY", label: "Enviar para Entrega", icon: Truck }
      case "ON_THE_WAY":
        return { status: "DELIVERED", label: "Marcar como Entregue", icon: CheckCircle }
      default:
        return null
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  const filteredOrders = orders

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Preparo</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.received + statistics.preparing}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entregues</p>
                <p className="text-2xl font-bold text-green-600">{statistics.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(statistics.totalRevenue)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
          <p className="text-gray-600">Acompanhe e gerencie todos os pedidos em tempo real</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchOrders} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="RECEIVED">Recebidos ({statistics.received})</SelectItem>
              <SelectItem value="PREPARING">Preparando ({statistics.preparing})</SelectItem>
              <SelectItem value="ON_THE_WAY">Saiu para Entrega ({statistics.onTheWay})</SelectItem>
              <SelectItem value="DELIVERED">Entregues ({statistics.delivered})</SelectItem>
              <SelectItem value="CANCELLED">Cancelados ({statistics.cancelled})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = statusIcons[order.status]
            const nextAction = getNextStatusAction(order.status)

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Pedido #{order.id.slice(-8)}
                        <StatusIcon className="h-5 w-5" />
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {order.profiles?.full_name || "Cliente não identificado"}
                        </span>
                        <span>{order.delivery_phone}</span>
                        <span>{formatDateTime(order.created_at)}</span>
                      </div>
                    </div>
                    <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Endereço de entrega */}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">Endereço de Entrega:</p>
                      <p className="text-gray-600">{order.delivery_address}</p>
                      {order.delivery_instructions && (
                        <p className="text-gray-500 italic">Obs: {order.delivery_instructions}</p>
                      )}
                    </div>
                  </div>

                  {/* Itens do pedido */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Itens do Pedido:
                    </h4>
                    <div className="space-y-1">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>
                            {item.quantity}x {item.products.name}
                            {item.size && ` (${item.size})`}
                            {item.toppings && item.toppings.length > 0 && (
                              <span className="text-gray-500"> + {item.toppings.join(", ")}</span>
                            )}
                          </span>
                          <span className="font-medium">{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>
                      {order.delivery_fee > 0 && (
                        <div className="flex justify-between">
                          <span>Taxa de Entrega:</span>
                          <span>{formatCurrency(order.delivery_fee)}</span>
                        </div>
                      )}
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto:</span>
                          <span>-{formatCurrency(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base pt-1 border-t">
                        <span>Total:</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações de pagamento e tempo */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        {order.payment_method}
                      </span>
                      {order.estimated_delivery_time && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          Previsão: {formatDateTime(order.estimated_delivery_time)}
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Pedido #{order.id.slice(-8)}</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label>Cliente:</Label>
                                  <p>{selectedOrder.profiles?.full_name}</p>
                                </div>
                                <div>
                                  <Label>Telefone:</Label>
                                  <p>{selectedOrder.delivery_phone}</p>
                                </div>
                                <div>
                                  <Label>Status:</Label>
                                  <Badge className={statusColors[selectedOrder.status]}>
                                    {statusLabels[selectedOrder.status]}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Método de Pagamento:</Label>
                                  <p>{selectedOrder.payment_method}</p>
                                </div>
                              </div>

                              <div>
                                <Label>Endereço de Entrega:</Label>
                                <p className="text-sm">{selectedOrder.delivery_address}</p>
                                {selectedOrder.delivery_instructions && (
                                  <p className="text-sm text-gray-500 italic">
                                    Instruções: {selectedOrder.delivery_instructions}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label>Itens do Pedido:</Label>
                                <div className="space-y-2 mt-2">
                                  {selectedOrder.order_items?.map((item, index) => (
                                    <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                                      <div>
                                        <p className="font-medium">{item.products.name}</p>
                                        <p className="text-sm text-gray-600">
                                          Quantidade: {item.quantity}
                                          {item.size && ` • Tamanho: ${item.size}`}
                                        </p>
                                        {item.toppings && item.toppings.length > 0 && (
                                          <p className="text-sm text-gray-500">
                                            Adicionais: {item.toppings.join(", ")}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">{formatCurrency(item.total_price)}</p>
                                        <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} cada</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {nextAction && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, nextAction.status)}
                          disabled={updatingStatus === order.id}
                          className="flex items-center gap-1"
                        >
                          {updatingStatus === order.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <nextAction.icon className="h-4 w-4" />
                          )}
                          {nextAction.label}
                        </Button>
                      )}

                      {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancelar Pedido</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p>Tem certeza que deseja cancelar este pedido?</p>
                              <div>
                                <Label htmlFor="cancellation-notes">Motivo do cancelamento (opcional):</Label>
                                <Textarea
                                  id="cancellation-notes"
                                  value={cancellationNotes}
                                  onChange={(e) => setCancellationNotes(e.target.value)}
                                  placeholder="Descreva o motivo do cancelamento..."
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setCancellationNotes("")}>
                                  Cancelar
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => updateOrderStatus(order.id, "CANCELLED", cancellationNotes)}
                                  disabled={updatingStatus === order.id}
                                >
                                  {updatingStatus === order.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Confirmar Cancelamento
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
