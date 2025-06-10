"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Clock, Star } from "lucide-react"

interface DeliveryPerformanceChartProps {
  dateRange: string
}

export function DeliveryPerformanceChart({ dateRange }: DeliveryPerformanceChartProps) {
  // Mock delivery performance data
  const deliveryData = [
    { name: "Carlos Silva", deliveries: 28, avgTime: 25, rating: 4.8 },
    { name: "João Santos", deliveries: 24, avgTime: 28, rating: 4.6 },
    { name: "Maria Oliveira", deliveries: 22, avgTime: 22, rating: 4.9 },
    { name: "Pedro Costa", deliveries: 18, avgTime: 30, rating: 4.5 },
    { name: "Ana Costa", deliveries: 16, avgTime: 26, rating: 4.7 },
  ]

  const maxDeliveries = Math.max(...deliveryData.map((d) => d.deliveries))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bike className="w-5 h-5" />
          Performance dos Entregadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deliveryData.map((person, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{person.name}</span>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Bike className="w-3 h-3" />
                    <span>{person.deliveries}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{person.avgTime}min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{person.rating}</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${(person.deliveries / maxDeliveries) * 100}%` }}
                />
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-gray-600">Total Entregas</div>
                <div className="font-semibold">{deliveryData.reduce((sum, person) => sum + person.deliveries, 0)}</div>
              </div>
              <div>
                <div className="text-gray-600">Tempo Médio</div>
                <div className="font-semibold">
                  {Math.round(deliveryData.reduce((sum, person) => sum + person.avgTime, 0) / deliveryData.length)}min
                </div>
              </div>
              <div>
                <div className="text-gray-600">Avaliação Média</div>
                <div className="font-semibold">
                  {(deliveryData.reduce((sum, person) => sum + person.rating, 0) / deliveryData.length).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
