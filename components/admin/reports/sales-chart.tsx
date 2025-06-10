"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface SalesChartProps {
  dateRange: string
}

export function SalesChart({ dateRange }: SalesChartProps) {
  // Mock sales data
  const salesData = [
    { date: "01/01", sales: 1250 },
    { date: "02/01", sales: 1380 },
    { date: "03/01", sales: 1150 },
    { date: "04/01", sales: 1420 },
    { date: "05/01", sales: 1680 },
    { date: "06/01", sales: 1890 },
    { date: "07/01", sales: 2100 },
  ]

  const maxSales = Math.max(...salesData.map((d) => d.sales))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Vendas por Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simple bar chart representation */}
          <div className="space-y-3">
            {salesData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-xs text-gray-600">{item.date}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-primary h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(item.sales / maxSales) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">R$ {item.sales.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total do período:</span>
              <span className="font-semibold">
                R$ {salesData.reduce((sum, item) => sum + item.sales, 0).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
