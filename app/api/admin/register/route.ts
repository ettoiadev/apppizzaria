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

    const supabase = createRouteHandlerClient({ cookies })

    // Check if admin registration is enabled
    const { data: settingsData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "allowAdminRegistration")
      .single()

    const allowRegistration = settingsData?.value === "true" || settingsData?.value === true

    if (!allowRegistration) {
      return NextResponse.json({ error: "Admin registration is currently disabled" }, { status: 403 })
    }

    // Check if this is the first admin (allow if no admins exist)
    const { data: existingAdmins, error: adminCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)

    if (adminCheckError) {
      console.error("Error checking existing admins:", adminCheckError)
    }

    const isFirstAdmin = !existingAdmins || existingAdmins.length === 0

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/login`,
      },
    })

    // Handle auth errors
    if (authError) {
      console.error("Auth signup error:", authError)

      if (authError.message.includes("User already registered")) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
      }

      if (authError.message.includes("Password should be at least")) {
        return NextResponse.json({ error: "Password is too weak. Please choose a stronger password." }, { status: 400 })
      }

      return NextResponse.json({ error: authError.message || "Failed to create admin account" }, { status: 400 })
    }

    // Check if user was created successfully
    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create admin account" }, { status: 400 })
    }

    // Create admin profile in public profiles table
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: full_name.trim(),
      role: "admin",
      created_at: new Date().toISOString(),
    })

    // Handle profile creation errors
    if (profileError) {
      console.error("Admin profile creation error:", profileError)
      return NextResponse.json(
        { error: "Account created but admin profile setup failed. Please contact support." },
        { status: 500 },
      )
    }

    // If this is the first admin, disable further registrations by default
    if (isFirstAdmin) {
      await supabase.from("app_settings").upsert({
        key: "allowAdminRegistration",
        value: "false",
        updated_by: authData.user.id,
        updated_at: new Date().toISOString(),
      })
    }

    console.log("Admin registered successfully:", {
      userId: authData.user.id,
      email: authData.user.email,
      fullName: full_name,
      isFirstAdmin,
    })

    return NextResponse.json(
      {
        message: "Admin registered successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: full_name,
          role: "admin",
          email_confirmed: !!authData.user.email_confirmed_at,
        },
        isFirstAdmin,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Admin registration endpoint error:", error)
    return NextResponse.json({ error: "Internal server error during admin registration" }, { status: 500 })
  }
}
