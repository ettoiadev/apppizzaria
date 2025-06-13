import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // Usando a SERVICE_ROLE_KEY para ter privilégios de admin no backend.
  // Isso resolve o erro de "row-level security policy".
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // <- A MUDANÇA CRÍTICA ESTÁ AQUI
  );

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }
    
    // Gera um nome de arquivo único para evitar sobreposição
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from('product-images') // Nome do nosso bucket
      .upload(fileName, file);

    if (error) {
      // Lança o erro para ser pego pelo bloco catch
      throw new Error(error.message);
    }

    // Constrói a URL pública do arquivo que acabamos de enviar
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error('Upload Error:', error.message);
    return NextResponse.json({ message: `Storage upload error: ${error.message}` }, { status: 500 });
  }
}
