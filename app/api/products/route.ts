import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET handler para buscar TODOS os produtos do banco de dados
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }

  return NextResponse.json(products)
}

// POST handler para CRIAR um novo produto no banco de dados
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
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