import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// Initialize Supabase client with server-side environment variables
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    // Validate file exists
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Please upload JPEG, PNG, WebP, or GIF" },
        { status: 400 },
      )
    }

    // Generate a unique filename to prevent collisions
    const timestamp = new Date().getTime()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`
    const filePath = `public/${fileName}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from("product-images").upload(filePath, buffer, {
      contentType: file.type,
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
    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Upload handler error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
