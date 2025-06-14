import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// DELETE handler para APAGAR um produto específico
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const supabase = createRouteHandlerClient({ cookies })

  const { error } = await supabase.from('products').delete().match({ id })

  if (error) {
    console.error('Supabase error deleting product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Product deleted successfully' })
}

// PUT handler para EDITAR um produto específico
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const productData = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .match({ id })
    .select()
    .single()

  if (error) {
    console.error('Supabase error updating product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH handler para atualizações parciais (como o switch de disponibilidade)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const productData = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .match({ id })
    .select()
    .single()

  if (error) {
    console.error('Supabase error patching product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}