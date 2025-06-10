import { type NextRequest, NextResponse } from "next/server"

// Mock orders storage - In production, use a database
const mockOrders: any[] = []

export async function GET() {
  try {
    return NextResponse.json(mockOrders)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newOrder = {
      id: Date.now().toString(),
      ...body,
      status: "RECEIVED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockOrders.push(newOrder)

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
  }
}
