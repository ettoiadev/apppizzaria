import { useState, useCallback } from "react"
import { CartItem, Product } from "../types"

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addToCart = useCallback((product: Product, options: {
    size?: string
    toppings?: string[]
    notes?: string
    isHalfAndHalf?: boolean
    halfAndHalf?: CartItem['halfAndHalf']
  } = {}) => {
    const cartItem: CartItem = {
      id: `${product.id}-${Date.now()}-${Math.random()}`,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      size: options.size,
      toppings: options.toppings,
      notes: options.notes,
      isHalfAndHalf: options.isHalfAndHalf,
      halfAndHalf: options.halfAndHalf
    }

    setCartItems(prev => [...prev, cartItem])
  }, [])

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  }, [cartItems])

  const getCartItemsCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }, [cartItems])

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  }
}