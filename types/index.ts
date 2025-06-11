export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  available: boolean
  showImage?: boolean
  sizes?: ProductSize[]
  toppings?: ProductTopping[]
}

export interface ProductSize {
  name: string
  price: number
}

export interface ProductTopping {
  name: string
  price: number
}

export interface Category {
  id: string
  name: string
  description: string
  image: string
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  size?: string
  toppings?: string[]
}

export interface Order {
  id: string
  status: "RECEIVED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED"
  total: number
  items: CartItem[]
  customer: {
    name: string
    phone: string
    address: string
  }
  paymentMethod: string
  createdAt: string
  estimatedDelivery?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "CUSTOMER" | "ADMIN" | "KITCHEN" | "DELIVERY"
}
