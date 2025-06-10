import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const mockCategories = [
  {
    id: "pizzas",
    name: "Pizzas",
    description: "Nossas deliciosas pizzas artesanais",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "bebidas",
    name: "Bebidas",
    description: "Refrigerantes, sucos e águas",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "sobremesas",
    name: "Sobremesas",
    description: "Doces irresistíveis para finalizar",
    image: "/placeholder.svg?height=200&width=200",
  },
]

export async function GET() {
  try {
    return NextResponse.json(mockCategories)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newCategory = {
      id: Date.now().toString(),
      ...body,
    }

    mockCategories.push(newCategory)

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 })
  }
}
