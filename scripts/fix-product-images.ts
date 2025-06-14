// Script to fix existing products with invalid blob URLs
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function fixProductImages() {
  console.log("Starting to fix product images...")

  try {
    // Fetch all products
    const { data: products, error } = await supabase.from("products").select("*")

    if (error) {
      console.error("Error fetching products:", error)
      return
    }

    console.log(`Found ${products?.length || 0} products`)

    if (!products) return

    let fixedCount = 0

    for (const product of products) {
      // Check if product has a blob URL or invalid image URL
      if (
        product.image &&
        (product.image.startsWith("blob:") ||
          product.image.includes("blob.v0.dev") ||
          !product.image.startsWith("http"))
      ) {
        console.log(`Fixing product: ${product.name} - Invalid URL: ${product.image}`)

        // Clear the invalid image URL
        const { error: updateError } = await supabase.from("products").update({ image: "" }).eq("id", product.id)

        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError)
        } else {
          console.log(`✅ Fixed product: ${product.name}`)
          fixedCount++
        }
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} products with invalid image URLs`)

    if (fixedCount > 0) {
      console.log("\n📝 Note: You will need to re-upload images for these products through the admin panel.")
    }
  } catch (error) {
    console.error("Script error:", error)
  }
}

// Run the fix
fixProductImages()
