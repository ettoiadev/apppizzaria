import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // Usando a chave de serviço para ter privilégios de admin no backend
  // e resolver qualquer problema de permissão do Storage
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo fornecido.' }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name}`;

    // Faz o upload para o bucket correto
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    // Retorna a URL pública e permanente do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ message: `Erro no servidor de upload: ${error.message}` }, { status: 500 });
  }
}