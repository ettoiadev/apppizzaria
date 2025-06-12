import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET handler para buscar todas as categorias
export async function GET(request: Request) {
  // Usando o cliente básico e direto do Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name');

  if (error) {
    console.error('Supabase error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }

  return NextResponse.json(categories);
}