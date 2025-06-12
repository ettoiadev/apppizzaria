import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Helper function to get Supabase client
function getSupabaseClient() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables")
      return null
    }

    return createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return null
  }
}

// Fallback mock data for development/testing
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
    const supabase = getSupabaseClient()

    if (!supabase) {
      console.log("Supabase client not available, using fallback data")
      const product = mockProducts.find((p) => p.id === params.id)

      if (!product) {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }

      return NextResponse.json(product)
    }

    console.log("Fetching product with ID:", params.id)
    const { data: product, error } = await supabase.from("products").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Supabase error fetching product:", error)
      // Fallback to mock data
      const fallbackProduct = mockProducts.find((p) => p.id === params.id)

      if (!fallbackProduct) {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }

      return NextResponse.json(fallbackProduct)
    }

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
    const supabase = getSupabaseClient()

    if (!supabase) {
      console.log("Supabase client not available, using fallback data")
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
    }

    console.log("Updating product with ID:", params.id)
    const { data: updatedProduct, error } = await supabase
      .from("products")
      .update({
        ...body,
        price: Number(body.price) || 0,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error updating product:", error)
      return NextResponse.json(
        {
          message: "Failed to update product",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const supabase = getSupabaseClient()

    if (!supabase) {
      console.log("Supabase client not available, using fallback data")
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
    }

    console.log("Patching product with ID:", params.id)
    const { data: updatedProduct, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error patching product:", error)
      return NextResponse.json(
        {
          message: "Failed to update product",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("Attempting to delete product with ID:", params.id)

    const supabase = getSupabaseClient()

    if (!supabase) {
      console.log("Supabase client not available, using fallback data")
      const productIndex = mockProducts.findIndex((p) => p.id === params.id)

      if (productIndex === -1) {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
      }

      // Remove the product from the array
      mockProducts = mockProducts.filter((p) => p.id !== params.id)
      console.log("Product deleted from fallback data successfully")

      return NextResponse.json({ message: "Product deleted successfully" })
    }

    // Delete the product from Supabase
    const { error } = await supabase.from("products").delete().match({ id: params.id })

    if (error) {
      console.error("Supabase error deleting product:", error)
      return NextResponse.json(
        {
          message: "Failed to delete product",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("Product deleted from Supabase successfully")
    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Unexpected error deleting product:", error)
    return NextResponse.json(
      {
        message: "Failed to delete product",
        details: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
