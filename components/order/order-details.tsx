import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MapPin, Phone, CreditCard } from "lucide-react"

interface OrderDetailsProps {
  order: any
}

export function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  {item.size && <div className="text-sm text-gray-600">Tamanho: {item.size}</div>}
                  {item.toppings && item.toppings.length > 0 && (
                    <div className="text-sm text-gray-600">Adicionais: {item.toppings.join(", ")}</div>
                  )}
                  <div className="text-sm text-gray-600">Qtd: {item.quantity}</div>
                </div>
                <div className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">R$ {order.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium">{order.customer.name}</div>
              <div className="text-gray-600">{order.customer.address}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">{order.customer.phone}</span>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">
              Pagamento:{" "}
              {order.paymentMethod === "pix"
                ? "PIX"
                : order.paymentMethod === "card"
                  ? "Cartão na Entrega"
                  : "Dinheiro na Entrega"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Número do Pedido:</span>
            <span className="font-medium">#{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data do Pedido:</span>
            <span className="font-medium">{new Date(order.createdAt).toLocaleString("pt-BR")}</span>
          </div>
          {order.estimatedDelivery && (
            <div className="flex justify-between">
              <span className="text-gray-600">Previsão de Entrega:</span>
              <span className="font-medium">
                {new Date(order.estimatedDelivery).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
