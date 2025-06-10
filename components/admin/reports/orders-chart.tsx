"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"

interface OrdersChartProps {
  dateRange: string
}

export function OrdersChart({ dateRange }: OrdersChartProps) {
  // Mock orders data
  const ordersData = [
    { date: "01/01", orders: 15 },
    { date: "02/01", orders: 18 },
    { date: "03/01", orders: 12 },
    { date: "04/01", orders: 22 },
    { date: "05/01", orders: 28 },
    { date: "06/01", orders: 31 },
    { date: "07/01", orders: 35 },
  ]

  const maxOrders = Math.max(...ordersData.map((d) => d.orders))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Pedidos por Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple bar chart representation */}
          <div className="space-y-3">
            {ordersData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-xs text-gray-600">{item.date}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(item.orders / maxOrders) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.orders} pedidos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total do período:</span>
              <span className="font-semibold">{ordersData.reduce((sum, item) => sum + item.orders, 0)} pedidos</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
