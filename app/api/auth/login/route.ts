import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Sign in the user
    console.log("Attempting login for email:", email)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Handle auth errors
    if (authError) {
      console.error("Auth signin error:", authError)
      console.error("Error message:", authError.message)
      console.error("Error status:", authError.status)

      // Handle specific auth errors
      if (authError.message.includes("Invalid login credentials")) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
      }

      if (authError.message.includes("Email not confirmed")) {
        return NextResponse.json({ 
          error: "Please check your email and click the confirmation link before signing in" 
        }, { status: 401 })
      }

      if (authError.message.includes("Too many requests")) {
        return NextResponse.json({ 
          error: "Too many login attempts. Please try again later" 
        }, { status: 429 })
      }

      return NextResponse.json({ error: authError.message || "Failed to sign in" }, { status: 401 })
    }

    // Check if user was signed in successfully
    if (!authData.user) {
      return NextResponse.json({ error: "Failed to sign in" }, { status: 401 })
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      // Continue without profile data - not critical for login
    }

    console.log("User signed in successfully:", {
      userId: authData.user.id,
      email: authData.user.email,
    })

    // Return success response
    return NextResponse.json(
      {
        message: "User signed in successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: profile?.full_name || null,
          email_confirmed: !!authData.user.email_confirmed_at,
        },
        session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Login endpoint error:", error)
    return NextResponse.json({ error: "Internal server error during login" }, { status: 500 })
  }
}
