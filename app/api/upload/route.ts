import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Initialize Supabase client with server-side environment variables
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export async function POST(request: Request) {
  try {
    // Get file blob from request body
    const fileBlob = await request.blob()

    if (!fileBlob || fileBlob.size === 0) {
      return NextResponse.json({ error: "No file provided or file is empty" }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024
    if (fileBlob.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // File type validation temporarily disabled for debugging
    /* 
    // Validate file type
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/jpg"]
    if (!ALLOWED_TYPES.includes(fileBlob.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 },
      )
    }
    */

    // Log the file type for debugging
    console.log("Uploading file of type:", fileBlob.type)

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now()
    const fileExtension = fileBlob.type.split("/")[1] || "unknown"
    const fileName = `${timestamp}-product-image.${fileExtension}`
    const filePath = `public/${fileName}`

    // Convert blob to array buffer for upload
    const arrayBuffer = await fileBlob.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from("product-images").upload(filePath, buffer, {
      contentType: fileBlob.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Supabase storage upload error:", error)
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 })
    }

    // Get public URL of the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath)

    // Return success response with the public URL
    return NextResponse.json({ url: publicUrl }, { status: 200 })
  } catch (error) {
    console.error("Upload handler error:", error)
    return NextResponse.json({ error: "Internal server error during file upload" }, { status: 500 })
  }
}
