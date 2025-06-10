import { type NextRequest, NextResponse } from "next/server"

// Mock data - In production, this would come from a database
let mockCategories = [
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const category = mockCategories.find((c) => c.id === params.id)

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar categoria" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const categoryIndex = mockCategories.findIndex((c) => c.id === params.id)

    if (categoryIndex === -1) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    mockCategories[categoryIndex] = { ...mockCategories[categoryIndex], ...body }

    return NextResponse.json(mockCategories[categoryIndex])
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const categoryIndex = mockCategories.findIndex((c) => c.id === params.id)

    if (categoryIndex === -1) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    mockCategories = mockCategories.filter((c) => c.id !== params.id)

    return NextResponse.json({ message: "Categoria excluída com sucesso" })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 })
  }
}
