import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  console.log("Upload API called")

  // Usando a chave de serviço para ter privilégios de admin no backend
  // e resolver qualquer problema de permissão do Storage
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      console.log("No file provided")
      return NextResponse.json({ message: "Nenhum arquivo fornecido." }, { status: 400 })
    }

    console.log("File received:", file.name, "Size:", file.size, "Type:", file.type)

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    console.log("Generated filename:", fileName)

    // Faz o upload para o bucket correto
    const { data, error } = await supabase.storage.from("product-images").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Supabase storage error:", error)
      throw error
    }

    console.log("Upload successful:", data)

    // Retorna a URL pública e permanente do arquivo
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(fileName)

    console.log("Generated public URL:", publicUrl)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error("Erro no upload:", error)
    return NextResponse.json(
      {
        message: `Erro no servidor de upload: ${error.message}`,
        details: error.details || "No additional details",
      },
      { status: 500 },
    )
  }
}
