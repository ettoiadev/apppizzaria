import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    // Validate required fields
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    // Handle auth errors
    if (authError) {
      console.error("Auth signup error:", authError)

      // Handle specific auth errors
      if (authError.message.includes("User already registered")) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
      }

      if (authError.message.includes("Password should be at least")) {
        return NextResponse.json({ error: "Password is too weak. Please choose a stronger password." }, { status: 400 })
      }

      return NextResponse.json({ error: authError.message || "Failed to create user account" }, { status: 400 })
    }

    // Check if user was created successfully
    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user account" }, { status: 400 })
    }

    // Create profile in public profiles table
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: full_name.trim(),
    })

    // Handle profile creation errors
    if (profileError) {
      console.error("Profile creation error:", profileError)

      // If profile creation fails, we should ideally clean up the auth user
      // but Supabase doesn't provide a way to delete users from the server side
      // This would need to be handled by database triggers or manual cleanup

      return NextResponse.json(
        { error: "Account created but profile setup failed. Please contact support." },
        { status: 500 },
      )
    }

    console.log("User registered successfully:", {
      userId: authData.user.id,
      email: authData.user.email,
      fullName: full_name,
    })

    // Return success response
    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: full_name,
          email_confirmed: !!authData.user.email_confirmed_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration endpoint error:", error)
    return NextResponse.json({ error: "Internal server error during registration" }, { status: 500 })
  }
}
