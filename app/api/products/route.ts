import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Mock data as fallback if database connection fails
const fallbackProducts = [
  {
    id: "1",
    name: "Pizza Margherita",
    description: "Molho de tomate, mussarela, manjericão fresco",
    price: 32.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "pizzas",
    available: true,
    sizes: [
      { name: "Pequena", price: 32.9 },
      { name: "Média", price: 42.9 },
      { name: "Grande", price: 52.9 },
    ],
    toppings: [
      { name: "Queijo Extra", price: 5.0 },
      { name: "Azeitona", price: 3.0 },
      { name: "Orégano", price: 1.0 },
    ],
  },
  {
    id: "2",
    name: "Pizza Pepperoni",
    description: "Molho de tomate, mussarela, pepperoni",
    price: 38.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "pizzas",
    available: true,
    sizes: [
      { name: "Pequena", price: 38.9 },
      { name: "Média", price: 48.9 },
      { name: "Grande", price: 58.9 },
    ],
    toppings: [
      { name: "Queijo Extra", price: 5.0 },
      { name: "Azeitona", price: 3.0 },
      { name: "Orégano", price: 1.0 },
    ],
  },
  {
    id: "3",
    name: "Pizza Quatro Queijos",
    description: "Mussarela, gorgonzola, parmesão, provolone",
    price: 45.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "pizzas",
    available: true,
    sizes: [
      { name: "Pequena", price: 45.9 },
      { name: "Média", price: 55.9 },
      { name: "Grande", price: 65.9 },
    ],
    toppings: [
      { name: "Queijo Extra", price: 5.0 },
      { name: "Azeitona", price: 3.0 },
      { name: "Orégano", price: 1.0 },
    ],
  },
  {
    id: "4",
    name: "Coca-Cola 350ml",
    description: "Refrigerante gelado",
    price: 5.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "bebidas",
    available: true,
  },
  {
    id: "5",
    name: "Água Mineral 500ml",
    description: "Água mineral natural",
    price: 3.5,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "bebidas",
    available: true,
  },
  {
    id: "6",
    name: "Brownie de Chocolate",
    description: "Brownie artesanal com chocolate belga",
    price: 12.9,
    image: "/placeholder.svg?height=300&width=300",
    categoryId: "sobremesas",
    available: true,
  },
]

// Create Supabase client with error handling
function getSupabaseClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      })
      return null
    }

    return createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return null
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    // If Supabase client couldn't be created, return fallback data
    if (!supabase) {
      console.warn("Using fallback products data due to Supabase client initialization failure")
      return NextResponse.json(fallbackProducts)
    }

    // Try to fetch products from Supabase
    const { data: products, error } = await supabase.from("products").select("*")

    // Log detailed information about the query
    console.log("Supabase query result:", {
      success: !error,
      productsCount: products?.length || 0,
      error: error ? JSON.stringify(error) : null,
    })

    if (error) {
      console.error("Database error fetching products:", error)

      // Check if the error is related to the table not existing
      if (error.message?.includes("does not exist")) {
        console.warn("Products table does not exist, returning fallback data")
        return NextResponse.json(fallbackProducts)
      }

      return NextResponse.json(fallbackProducts)
    }

    // If no products were found, return fallback data
    if (!products || products.length === 0) {
      console.warn("No products found in database, returning fallback data")
      return NextResponse.json(fallbackProducts)
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error("Unexpected error fetching products:", error)
    // Return fallback data instead of an error
    return NextResponse.json(fallbackProducts)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body and log it immediately
    const body = await request.json()
    console.log("API received this body:", body)

    // Get Supabase client
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Failed to initialize Supabase client for POST request")
      return NextResponse.json({ message: "Failed to initialize database connection" }, { status: 500 })
    }

    // Use the parsed body as newProduct
    const newProduct = body

    // Log the received data for debugging (without sensitive info)
    console.log("Received product data:", {
      hasName: !!newProduct.name,
      hasDescription: !!newProduct.description,
      hasPrice: !!newProduct.price,
      hasCategoryId: !!newProduct.categoryId,
      categoryId: newProduct.categoryId,
      priceType: typeof newProduct.price,
    })

    // Validate required fields
    if (!newProduct.name || typeof newProduct.name !== "string" || newProduct.name.trim() === "") {
      return NextResponse.json(
        { message: "Missing or invalid required field: name must be a non-empty string" },
        { status: 400 },
      )
    }

    if (!newProduct.description || typeof newProduct.description !== "string" || newProduct.description.trim() === "") {
      return NextResponse.json(
        { message: "Missing or invalid required field: description must be a non-empty string" },
        { status: 400 },
      )
    }

    if (!newProduct.price || typeof newProduct.price !== "number" || newProduct.price <= 0) {
      return NextResponse.json(
        { message: "Missing or invalid required field: price must be a positive number" },
        { status: 400 },
      )
    }

    if (!newProduct.categoryId || typeof newProduct.categoryId !== "string" || newProduct.categoryId.trim() === "") {
      return NextResponse.json(
        { message: "Missing or invalid required field: categoryId must be a non-empty string" },
        { status: 400 },
      )
    }

    // Prepare the data object for insertion, ensuring categoryId is properly included
    const productData = {
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: newProduct.price,
      categoryId: newProduct.categoryId.trim(),
      available: newProduct.available !== undefined ? Boolean(newProduct.available) : true,
      sizes: Array.isArray(newProduct.sizes) ? newProduct.sizes : [],
      toppings: Array.isArray(newProduct.toppings) ? newProduct.toppings : [],
    }

    // Log the data being inserted
    console.log("Inserting product data:", productData)

    // Insert the new product into the database
    const { data, error } = await supabase.from("products").insert([productData]).select().single()

    // Handle database errors
    if (error) {
      console.error("Database error creating product:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      return NextResponse.json(
        {
          message: "Failed to create product",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    // Log successful creation
    console.log("Product created successfully:", { id: data?.id, name: data?.name })

    // Return the newly created product
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      console.error("Failed to parse request JSON:", error)
      return NextResponse.json(
        { message: "Invalid JSON in request body", details: "Request body must be valid JSON" },
        { status: 400 },
      )
    }

    console.error("Unexpected error creating product:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })

    return NextResponse.json(
      {
        message: "Internal server error",
        details: error?.message || "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
