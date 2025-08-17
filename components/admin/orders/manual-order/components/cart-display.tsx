import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem } from '../types';

interface CartDisplayProps {
  cartItems: CartItem[];
  cartTotal: number;
  cartItemsCount: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateItemNotes: (productId: string, notes: string) => void;
  onClearCart: () => void;
}

export function CartDisplay({
  cartItems,
  cartTotal,
  cartItemsCount,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateItemNotes,
  onClearCart
}: CartDisplayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      onRemoveItem(productId);
    } else {
      onUpdateQuantity(productId, newQuantity);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho
            {cartItemsCount > 0 && (
              <Badge variant="secondary">{cartItemsCount} itens</Badge>
            )}
          </CardTitle>
          {cartItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Carrinho vazio</p>
            <p className="text-sm text-muted-foreground">Adicione produtos para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.product.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.product.price)} cada
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 1;
                          handleQuantityChange(item.product.id, qty);
                        }}
                        className="w-16 h-6 text-center text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                  
                  {/* Item Notes */}
                  <Textarea
                    placeholder="Observações do item (opcional)"
                    value={item.notes || ''}
                    onChange={(e) => onUpdateItemNotes(item.product.id, e.target.value)}
                    className="text-xs min-h-[60px] resize-none"
                  />
                </div>
              ))}
            </div>
            
            <Separator />
            
            {/* Cart Summary */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Subtotal:</span>
                <span className="font-semibold">{formatPrice(cartTotal)}</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'} no carrinho
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}