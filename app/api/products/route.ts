import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Mock data - In production, this would come from a database
const mockProducts = [
  {
    id: "1",
    name: "Pizza Margherita",
    description: "Molho de tomate, mussarela, manjericão fresco",
    price: 32.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "pizzas",
    available: true,
    sizes: [
      { name: "Pequena", price: 32.9 },
      { name: "Média", price: 42.9 },
      { name: "Grande", price: 52.9 },
    ],
    toppings: [
      { name: "Queijo Extra", price: 5.0 },
      { name: "Azeitona", price: 3.0 },
      { name: "Orégano", price: 1.0 },
    ],
  },
  {
    id: "2",
    name: "Pizza Pepperoni",
    description: "Molho de tomate, mussarela, pepperoni",
    price: 38.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "pizzas",
    available: true,
    sizes: [
      { name: "Pequena", price: 38.9 },
      { name: "Média", price: 48.9 },
      { name: "Grande", price: 58.9 },
    ],
    toppings: [
      { name: "Queijo Extra", price: 5.0 },
      { name: "Azeitona", price: 3.0 },
      { name: "Orégano", price: 1.0 },
    ],
  },
  {
    id: "3",
    name: "Pizza Quatro Queijos",
    description: "Mussarela, gorgonzola, parmesão, provolone",
    price: 45.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "pizzas",
    available: true,
    sizes: [
      { name: "Pequena", price: 45.9 },
      { name: "Média", price: 55.9 },
      { name: "Grande", price: 65.9 },
    ],
    toppings: [
      { name: "Queijo Extra", price: 5.0 },
      { name: "Azeitona", price: 3.0 },
      { name: "Orégano", price: 1.0 },
    ],
  },
  {
    id: "4",
    name: "Coca-Cola 350ml",
    description: "Refrigerante gelado",
    price: 5.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "bebidas",
    available: true,
  },
  {
    id: "5",
    name: "Água Mineral 500ml",
    description: "Água mineral natural",
    price: 3.5,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "bebidas",
    available: true,
  },
  {
    id: "6",
    name: "Brownie de Chocolate",
    description: "Brownie artesanal com chocolate belga",
    price: 12.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "sobremesas",
    available: true,
  },
]

export async function GET() {
  try {
    return NextResponse.json(mockProducts)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newProduct = {
      id: Date.now().toString(),
      ...body,
    }

    mockProducts.push(newProduct)

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 })
  }
}
