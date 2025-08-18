"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Monitor, Plus, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { PDVForm } from './pdv-form'

export function PDVManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)

  const handleOrderCreated = (orderId: string) => {
    setLastOrderId(orderId)
    setIsFormOpen(false)
    toast({
      title: 'Pedido criado com sucesso!',
      description: `Pedido #${orderId} foi registrado no sistema.`,
      variant: 'default'
    })
  }

  const handleNewOrder = () => {
    setIsFormOpen(true)
    setLastOrderId(null)
  }

  if (isFormOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ponto de Venda (PDV)</h1>
              <p className="text-gray-600">Sistema rápido para registro de pedidos</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFormOpen(false)}
            className="flex items-center gap-2"
          >
            ← Voltar
          </Button>
        </div>
        
        <PDVForm onOrderCreated={handleOrderCreated} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Monitor className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ponto de Venda (PDV)</h1>
            <p className="text-gray-600">Sistema rápido para registro de pedidos de balcão e telefone</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Sistema Online
          </Badge>
          <Badge variant="outline">
            <Clock className="w-4 h-4 mr-1" />
            {new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Order Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/60" onClick={handleNewOrder}>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Novo Pedido</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Registrar pedido de balcão ou telefone</p>
            <Button className="w-full" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Iniciar Pedido
            </Button>
          </CardContent>
        </Card>

        {/* Last Order Card */}
        {lastOrderId && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Último Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 mb-4">Pedido #{lastOrderId} criado com sucesso!</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Detalhes
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Imprimir
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Produtos Ativos</span>
                <Badge variant="secondary">9</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Categorias</span>
                <Badge variant="secondary">3</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sistema</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex flex-col gap-2" onClick={handleNewOrder}>
              <Plus className="w-6 h-6" />
              <span className="text-sm">Novo Pedido</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <RefreshCw className="w-6 h-6" />
              <span className="text-sm">Atualizar</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <Monitor className="w-6 h-6" />
              <span className="text-sm">Relatórios</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <CheckCircle className="w-6 h-6" />
              <span className="text-sm">Pedidos</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">i</span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Como usar o PDV</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Clique em "Novo Pedido" para registrar pedidos de balcão ou telefone</li>
                <li>• Selecione produtos, adicione cliente e configure pagamento</li>
                <li>• O sistema salva automaticamente no banco de dados</li>
                <li>• Use os botões de acesso rápido para navegação eficiente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}