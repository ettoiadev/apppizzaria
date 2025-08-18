'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Plus, Minus, Trash2, Edit3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  notes?: string
  subtotal: number
}

interface PDVCartDisplayProps {
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onUpdateNotes: (itemId: string, notes: string) => void
  onClearCart: () => void
}

export function PDVCartDisplay({
  items,
  subtotal,
  deliveryFee,
  discount,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onClearCart
}: PDVCartDisplayProps) {
  const [editingNotes, setEditingNotes] = React.useState<string | null>(null)
  const [notesValue, setNotesValue] = React.useState('')

  const handleEditNotes = (itemId: string, currentNotes: string = '') => {
    setEditingNotes(itemId)
    setNotesValue(currentNotes)
  }

  const handleSaveNotes = (itemId: string) => {
    onUpdateNotes(itemId, notesValue)
    setEditingNotes(null)
    setNotesValue('')
  }

  const handleCancelNotes = () => {
    setEditingNotes(null)
    setNotesValue('')
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrinho
            <Badge variant="secondary">{items.length}</Badge>
          </CardTitle>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCart}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Carrinho vazio</p>
            <p className="text-xs text-gray-400 mt-1">
              Adicione produtos para começar
            </p>
          </div>
        ) : (
          <>
            {/* Itens do Carrinho */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Notas do Item */}
                  {editingNotes === item.id ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Observações do item..."
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        className="text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveNotes(item.id)}
                          className="h-7 text-xs"
                        >
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelNotes}
                          className="h-7 text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {item.notes ? (
                          <p className="text-xs text-gray-600 italic">
                            "{item.notes}"
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">
                            Sem observações
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNotes(item.id, item.notes)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* Subtotal do Item */}
                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo do Pedido */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de entrega:</span>
                  <span className="font-medium">{formatCurrency(deliveryFee)}</span>
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
              
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}