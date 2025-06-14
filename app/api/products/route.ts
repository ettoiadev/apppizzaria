import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // ajuste para seu path real se for diferente

// GET /api/products - Listar produtos do Supabase
export async function GET() {
  const supabase = createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(products);
}

// POST /api/products - Criar novo produto no Supabase
export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const { name, description, price, image, categoryId } = body;

    // 🧠 Validação mínima dos campos obrigatórios
    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (name, price, categoryId)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from("products").insert([
      {
        name,
        description,
        price,
        image,
        available: true,
        categoryId,
      },
    ]).select("*").single(); // retorna o produto criado

    if (error) {
      console.error("Erro ao criar produto:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro inesperado:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}