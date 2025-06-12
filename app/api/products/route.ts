import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET handler para buscar todos os produtos
export async function GET(request: Request) {
  // Usando o cliente básico e direto do Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Supabase error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }

  return NextResponse.json(products)
}

// POST handler para criar um novo produto
export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const productData = await request.json()

  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single()

  if (error) {
    console.error('Supabase error creating product:', error)
    return NextResponse.json({ message: error.message, details: error.details }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}