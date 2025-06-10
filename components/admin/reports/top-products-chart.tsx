"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

interface TopProductsChartProps {
  dateRange: string
}

export function TopProductsChart({ dateRange }: TopProductsChartProps) {
  // Mock top products data
  const topProducts = [
    { name: "Pizza Margherita", sales: 45, revenue: 1462.5 },
    { name: "Pizza Pepperoni", sales: 38, revenue: 1478.2 },
    { name: "Pizza Quatro Queijos", sales: 32, revenue: 1468.8 },
    { name: "Coca-Cola 350ml", sales: 67, revenue: 395.3 },
    { name: "Brownie de Chocolate", sales: 28, revenue: 361.2 },
  ]

  const maxSales = Math.max(...topProducts.map((p) => p.sales))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Produtos Mais Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{product.name}</span>
                <div className="text-right">
                  <div className="text-sm font-semibold">{product.sales} vendas</div>
                  <div className="text-xs text-gray-600">R$ {product.revenue.toFixed(2)}</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(product.sales / maxSales) * 100}%` }}
                />
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Receita total dos top 5:</span>
              <span className="font-semibold">
                R$ {topProducts.reduce((sum, product) => sum + product.revenue, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
