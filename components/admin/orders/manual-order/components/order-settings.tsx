import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Truck, Store, CreditCard, Percent, DollarSign } from 'lucide-react';
import { OrderType, PaymentMethod } from '../types';

interface OrderSettingsProps {
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  notes: string;
  deliveryFee: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  subtotal: number;
  onOrderTypeChange: (type: OrderType) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onNotesChange: (value: string) => void;
  onDeliveryFeeChange: (fee: number) => void;
  onDiscountChange: (value: number) => void;
  onDiscountTypeChange: (type: 'percentage' | 'fixed') => void;
}

export function OrderSettings({
  orderType,
  paymentMethod,
  notes,
  deliveryFee,
  discount,
  discountType,
  subtotal,
  onOrderTypeChange,
  onPaymentMethodChange,
  onNotesChange,
  onDeliveryFeeChange,
  onDiscountChange,
  onDiscountTypeChange
}: OrderSettingsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const calculateDiscountAmount = (): number => {
    if (discount <= 0) return 0;
    
    if (discountType === 'percentage') {
      const percentage = Math.min(discount, 100);
      return (subtotal * percentage) / 100;
    } else {
      return Math.min(discount, subtotal);
    }
  };

  const calculateTotal = (): number => {
    const discountAmount = calculateDiscountAmount();
    const total = subtotal - discountAmount + (orderType === 'delivery' ? deliveryFee : 0);
    return Math.max(0, total);
  };

  const paymentMethodLabels = {
    money: 'Dinheiro',
    card: 'Cartão',
    pix: 'PIX',
    voucher: 'Vale Refeição'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipo de Pedido</Label>
          <RadioGroup
            value={orderType}
            onValueChange={(value) => onOrderTypeChange(value as OrderType)}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer">
                <Truck className="h-4 w-4" />
                Entrega
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer">
                <Store className="h-4 w-4" />
                Retirada
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Método de Pagamento</Label>
          <Select value={paymentMethod} onValueChange={(value) => onPaymentMethodChange(value as PaymentMethod)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o método de pagamento" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Delivery Fee */}
        {orderType === 'delivery' && (
          <div className="space-y-3">
            <Label htmlFor="deliveryFee" className="text-sm font-medium">
              Taxa de Entrega
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="deliveryFee"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={deliveryFee || ''}
                onChange={(e) => onDeliveryFeeChange(parseFloat(e.target.value) || 0)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa atual: {formatPrice(deliveryFee)}
            </p>
          </div>
        )}

        {/* Discount */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Desconto</Label>
          
          <div className="flex gap-2">
            <Select 
              value={discountType} 
              onValueChange={(value) => onDiscountTypeChange(value as 'percentage' | 'fixed')}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    %
                  </div>
                </SelectItem>
                <SelectItem value="fixed">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    R$
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              min="0"
              max={discountType === 'percentage' ? 100 : subtotal}
              step={discountType === 'percentage' ? 1 : 0.01}
              placeholder={discountType === 'percentage' ? '0' : '0,00'}
              value={discount || ''}
              onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
              className="flex-1"
            />
          </div>
          
          {discount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Desconto: {formatPrice(calculateDiscountAmount())}
              </Badge>
              {discountType === 'percentage' && (
                <span className="text-xs text-muted-foreground">
                  ({discount}% de {formatPrice(subtotal)})
                </span>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Order Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Resumo do Pedido</Label>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto:</span>
                <span>-{formatPrice(calculateDiscountAmount())}</span>
              </div>
            )}
            
            {orderType === 'delivery' && deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Taxa de entrega:</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-lg">{formatPrice(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <Label htmlFor="notes" className="text-sm font-medium">
            Observações do Pedido
          </Label>
          <Textarea
            id="notes"
            placeholder="Observações adicionais sobre o pedido..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}