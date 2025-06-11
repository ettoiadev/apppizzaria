import { type NextRequest, NextResponse } from "next/server"

// Import the same mock data reference
let mockProducts = [
  {
    id: "1",
    name: "Pizza Margherita",
    description: "Molho de tomate, mussarela, manjericão fresco",
    price: 32.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "pizzas",
    available: true,
    showImage: true,
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
    showImage: true,
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
    available: false,
    showImage: true,
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
    showImage: true,
  },
  {
    id: "5",
    name: "Água Mineral 500ml",
    description: "Água mineral natural",
    price: 3.5,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "bebidas",
    available: true,
    showImage: true,
  },
  {
    id: "6",
    name: "Brownie de Chocolate",
    description: "Brownie artesanal com chocolate belga",
    price: 12.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "sobremesas",
    available: true,
    showImage: true,
  },
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = mockProducts.find((p) => p.id === params.id)

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const productIndex = mockProducts.findIndex((p) => p.id === params.id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Update the product with new data
    mockProducts[productIndex] = {
      ...mockProducts[productIndex],
      ...body,
      id: params.id, // Ensure ID doesn't change
      price: Number(body.price) || mockProducts[productIndex].price,
    }

    return NextResponse.json(mockProducts[productIndex])
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const productIndex = mockProducts.findIndex((p) => p.id === params.id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Update only the provided fields
    mockProducts[productIndex] = {
      ...mockProducts[productIndex],
      ...body,
      id: params.id, // Ensure ID doesn't change
    }

    return NextResponse.json(mockProducts[productIndex])
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productIndex = mockProducts.findIndex((p) => p.id === params.id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Remove the product from the array
    mockProducts = mockProducts.filter((p) => p.id !== params.id)

    return NextResponse.json({ message: "Produto excluído com sucesso" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Erro ao excluir produto" }, { status: 500 })
  }
}
