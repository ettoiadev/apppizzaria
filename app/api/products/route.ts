import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("📥 [API] Recebendo novo produto...")
    const body = await request.json()
    console.log("📋 [API] Dados do produto:", body)

    // Simulate product creation (replace with actual database logic)
    const result = {
      id: Math.random().toString(36).substring(7), // Generate a random ID
      ...body,
      createdAt: new Date().toISOString(),
    }

    console.log("✅ [API] Produto criado com sucesso:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ [API] Erro ao criar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("📥 [API] Buscando produtos...")

    // Simulate fetching products (replace with actual database logic)
    const products = [
      { id: "1", name: "Product 1", price: 20 },
      { id: "2", name: "Product 2", price: 30 },
    ]

    console.log(`✅ [API] Retornando ${products.length} produtos`)
    return NextResponse.json(products)
  } catch (error) {
    console.error("❌ [API] Erro ao buscar produtos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
