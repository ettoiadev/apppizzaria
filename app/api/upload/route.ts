// Arquivo: /app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
  }

  // Gera um nome de arquivo único para evitar conflitos
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file);

  if (error) {
    console.error('Supabase storage upload error:', error);
    return NextResponse.json({ message: `Storage error: ${error.message}` }, { status: 500 });
  }

  // Constrói a URL pública do arquivo
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}