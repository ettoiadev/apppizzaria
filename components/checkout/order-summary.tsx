import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { CartItem } from "@/types"

interface OrderSummaryProps {
  items: CartItem[]
  total: number
}

export function OrderSummary({ items, total }: OrderSummaryProps) {
  const deliveryFee = total >= 50 ? 0 : 5.9
  const finalTotal = total + deliveryFee

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Resumo do Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                {item.size && <div className="text-gray-600">Tamanho: {item.size}</div>}
                {item.toppings && item.toppings.length > 0 && (
                  <div className="text-gray-600">Adicionais: {item.toppings.join(", ")}</div>
                )}
                <div className="text-gray-600">Qtd: {item.quantity}</div>
              </div>
              <div className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de entrega</span>
            <span className={deliveryFee === 0 ? "text-green-600" : ""}>
              {deliveryFee === 0 ? "Grátis" : `R$ ${deliveryFee.toFixed(2)}`}
            </span>
          </div>
          {total < 50 && <div className="text-sm text-gray-600">Frete grátis para pedidos acima de R$ 50,00</div>}
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">R$ {finalTotal.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
