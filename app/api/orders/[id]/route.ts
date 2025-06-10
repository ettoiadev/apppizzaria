import { type NextRequest, NextResponse } from "next/server"

// Mock orders - In production, use a database
const mockOrders = [
  {
    id: "1",
    status: "PREPARING",
    total: 45.9,
    items: [
      {
        id: "1",
        name: "Pizza Margherita",
        quantity: 1,
        price: 32.9,
        size: "Média",
        toppings: ["Queijo Extra"],
      },
    ],
    customer: {
      name: "João Silva",
      phone: "(11) 99999-9999",
      address: "Rua das Flores, 123 - Centro",
    },
    paymentMethod: "PIX",
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
  },
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = mockOrders.find((o) => o.id === params.id)

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar pedido" }, { status: 500 })
  }
}
