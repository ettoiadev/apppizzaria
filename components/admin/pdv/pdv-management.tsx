"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Monitor, Plus, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { PDVForm } from './pdv-form'

export function PDVManagement() {
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)

  const handleOrderCreated = (orderId: string) => {
    setLastOrderId(orderId)
    toast({
      title: 'Pedido criado com sucesso!',
      description: `Pedido #${orderId} foi registrado no sistema.`,
      variant: 'default'
    })
  }

  const handleNewOrder = () => {
    setLastOrderId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Monitor className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PDV - Novo Pedido</h1>
            <p className="text-gray-600">Sistema rápido para registro de pedidos</p>
          </div>
        </div>
        {lastOrderId && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              Último: #{lastOrderId}
            </Badge>
            <Button
              variant="outline"
              onClick={handleNewOrder}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Pedido
            </Button>
          </div>
        )}
      </div>
      
      <PDVForm onOrderCreated={handleOrderCreated} />
    </div>
  )


}