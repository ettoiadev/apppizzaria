'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Settings, CreditCard, Banknote, Smartphone, Truck, Store, FileText, Calculator } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer'
type OrderType = 'delivery' | 'pickup' | 'dine_in'

interface PDVOrderSettingsProps {
  orderType: OrderType
  paymentMethod: PaymentMethod
  isPaid: boolean
  notes: string
  deliveryFee: number
  discount: number
  onOrderTypeChange: (type: OrderType) => void
  onPaymentMethodChange: (method: PaymentMethod) => void
  onPaidStatusChange: (isPaid: boolean) => void
  onNotesChange: (notes: string) => void
  onDeliveryFeeChange: (fee: number) => void
  onDiscountChange: (discount: number) => void
}

const orderTypeOptions = [
  { value: 'delivery' as OrderType, label: 'Entrega', icon: Truck },
  { value: 'pickup' as OrderType, label: 'Retirada', icon: Store },
  { value: 'dine_in' as OrderType, label: 'Balcão', icon: Store }
]

const paymentMethodOptions = [
  { value: 'cash' as PaymentMethod, label: 'Dinheiro', icon: Banknote },
  { value: 'credit_card' as PaymentMethod, label: 'Cartão Crédito', icon: CreditCard },
  { value: 'debit_card' as PaymentMethod, label: 'Cartão Débito', icon: CreditCard },
  { value: 'pix' as PaymentMethod, label: 'PIX', icon: Smartphone },
  { value: 'bank_transfer' as PaymentMethod, label: 'Transferência', icon: Smartphone }
]

export function PDVOrderSettings({
  orderType,
  paymentMethod,
  isPaid,
  notes,
  deliveryFee,
  discount,
  onOrderTypeChange,
  onPaymentMethodChange,
  onPaidStatusChange,
  onNotesChange,
  onDeliveryFeeChange,
  onDiscountChange
}: PDVOrderSettingsProps) {
  const [deliveryFeeInput, setDeliveryFeeInput] = React.useState(deliveryFee.toString())
  const [discountInput, setDiscountInput] = React.useState(discount.toString())

  const handleDeliveryFeeChange = (value: string) => {
    setDeliveryFeeInput(value)
    const numValue = parseFloat(value) || 0
    onDeliveryFeeChange(numValue)
  }

  const handleDiscountChange = (value: string) => {
    setDiscountInput(value)
    const numValue = parseFloat(value) || 0
    onDiscountChange(numValue)
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo do Pedido */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Tipo do Pedido</Label>
          <div className="grid grid-cols-1 gap-2">
            {orderTypeOptions.map((option) => {
              const Icon = option.icon
              return (
                <Button
                  key={option.value}
                  variant={orderType === option.value ? 'default' : 'outline'}
                  onClick={() => onOrderTypeChange(option.value)}
                  className="h-12 justify-start"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Método de Pagamento */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Método de Pagamento</Label>
          <div className="grid grid-cols-1 gap-2">
            {paymentMethodOptions.map((option) => {
              const Icon = option.icon
              return (
                <Button
                  key={option.value}
                  variant={paymentMethod === option.value ? 'default' : 'outline'}
                  onClick={() => onPaymentMethodChange(option.value)}
                  className="h-10 justify-start text-sm"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Status do Pagamento */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Status do Pagamento</Label>
          <div className="flex gap-2">
            <Button
              variant={isPaid ? 'default' : 'outline'}
              onClick={() => onPaidStatusChange(true)}
              className="flex-1 h-10"
            >
              Pago
              {isPaid && (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                  ✓
                </Badge>
              )}
            </Button>
            <Button
              variant={!isPaid ? 'default' : 'outline'}
              onClick={() => onPaidStatusChange(false)}
              className="flex-1 h-10"
            >
              Pendente
              {!isPaid && (
                <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                  ⏳
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Taxas e Descontos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gray-600" />
            <Label className="text-sm font-medium text-gray-700">Taxas e Descontos</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="delivery-fee" className="text-xs text-gray-600">
                Taxa de Entrega
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  R$
                </span>
                <Input
                  id="delivery-fee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={deliveryFeeInput}
                  onChange={(e) => handleDeliveryFeeChange(e.target.value)}
                  className="pl-8 h-10"
                  disabled={orderType !== 'delivery'}
                />
              </div>
              {orderType !== 'delivery' && (
                <p className="text-xs text-gray-400 mt-1">
                  Disponível apenas para entrega
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="discount" className="text-xs text-gray-600">
                Desconto
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  R$
                </span>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={discountInput}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="pl-8 h-10"
                />
              </div>
            </div>
          </div>

          {/* Resumo das Taxas */}
          {(deliveryFee > 0 || discount > 0) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de entrega:</span>
                  <span className="font-medium text-blue-600">
                    +{formatCurrency(deliveryFee)}
                  </span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Desconto:</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Observações do Pedido
            </Label>
          </div>
          <Textarea
            id="notes"
            placeholder="Observações especiais, instruções de entrega, etc..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Máximo 500 caracteres</span>
            <span>{notes.length}/500</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}