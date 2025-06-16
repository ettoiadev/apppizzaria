"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Package, Truck, CheckCircle, XCircle } from "lucide-react"

const statusConfig = {
  RECEIVED: {
    label: "Pedido Recebido",
    description: "Seu pedido foi recebido e está sendo processado",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Package,
    progress: 25,
  },
  PREPARING: {
    label: "Preparando",
    description: "Sua pizza está sendo preparada com carinho",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    progress: 50,
  },
  ON_THE_WAY: {
    label: "Saiu para Entrega",
    description: "Seu pedido está a caminho!",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Truck,
    progress: 75,
  },
  DELIVERED: {
    label: "Entregue",
    description: "Seu pedido foi entregue com sucesso",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    progress: 100,
  },
  CANCELLED: {
    label: "Cancelado",
    description: "Este pedido foi cancelado",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    progress: 0,
  },
}

interface OrderStatusProps {
  status: keyof typeof statusConfig
  estimatedDelivery?: string
}

export function OrderStatus({ status, estimatedDelivery }: OrderStatusProps) {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  const formatEstimatedTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60))

    if (diffInMinutes <= 0) {
      return "A qualquer momento"
    }

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutos`
    }

    const hours = Math.floor(diffInMinutes / 60)
    const minutes = diffInMinutes % 60
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-gray-100">
            <StatusIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold">{config.label}</h2>
              <Badge className={config.color}>{config.label}</Badge>
            </div>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>

        {/* Barra de progresso */}
        {status !== "CANCELLED" && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progresso do pedido</span>
              <span>{config.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${config.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tempo estimado */}
        {estimatedDelivery && status !== "DELIVERED" && status !== "CANCELLED" && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>
              <strong>Tempo estimado:</strong> {formatEstimatedTime(estimatedDelivery)}
            </span>
          </div>
        )}

        {/* Timeline de status */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Histórico do pedido</h3>
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([key, config]) => {
              const isActive = key === status
              const isPast = config.progress < statusConfig[status].progress
              const StatusIcon = config.icon

              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 ${
                    isActive ? "text-red-600" : isPast ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm">{config.label}</span>
                  {isActive && (
                    <Badge variant="outline" className="ml-auto">
                      Atual
                    </Badge>
                  )}
                  {isPast && <CheckCircle className="h-4 w-4 ml-auto" />}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
