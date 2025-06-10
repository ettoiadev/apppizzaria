"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Minus, Plus } from "lucide-react"
import type { Product } from "@/types"
import { useCart } from "@/contexts/cart-context"

interface ProductModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]?.name || "")
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  const selectedSizePrice = product.sizes?.find((size) => size.name === selectedSize)?.price || product.price
  const toppingsPrice = selectedToppings.reduce((total, topping) => {
    const toppingData = product.toppings?.find((t) => t.name === topping)
    return total + (toppingData?.price || 0)
  }, 0)
  const totalPrice = (selectedSizePrice + toppingsPrice) * quantity

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${selectedSize}-${selectedToppings.join(",")}`,
      name: product.name,
      price: selectedSizePrice + toppingsPrice,
      quantity,
      image: product.image,
      size: selectedSize,
      toppings: selectedToppings,
    })
    onClose()
  }

  const handleToppingChange = (topping: string, checked: boolean) => {
    if (checked) {
      setSelectedToppings([...selectedToppings, topping])
    } else {
      setSelectedToppings(selectedToppings.filter((t) => t !== topping))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="aspect-video overflow-hidden rounded-lg">
            <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <p className="text-gray-600">{product.description}</p>

          {product.sizes && product.sizes.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Escolha o tamanho</Label>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                {product.sizes.map((size) => (
                  <div key={size.name} className="flex items-center space-x-2">
                    <RadioGroupItem value={size.name} id={size.name} />
                    <Label htmlFor={size.name} className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <span>{size.name}</span>
                        <span className="font-semibold">R$ {size.price.toFixed(2)}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {product.toppings && product.toppings.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Adicionais (opcionais)</Label>
              <div className="space-y-3">
                {product.toppings.map((topping) => (
                  <div key={topping.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={topping.name}
                      checked={selectedToppings.includes(topping.name)}
                      onCheckedChange={(checked) => handleToppingChange(topping.name, checked as boolean)}
                    />
                    <Label htmlFor={topping.name} className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <span>{topping.name}</span>
                        <span className="font-semibold">+ R$ {topping.price.toFixed(2)}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Label className="font-semibold">Quantidade:</Label>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-primary">R$ {totalPrice.toFixed(2)}</div>
            </div>
          </div>

          <Button onClick={handleAddToCart} className="w-full" size="lg">
            Adicionar ao Carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
