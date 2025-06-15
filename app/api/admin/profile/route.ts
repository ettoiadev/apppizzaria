import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    // Return profile data
    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      full_name: profile?.full_name || null,
      role: profile?.role || "cliente",
      phone: profile?.phone || null,
      created_at: profile?.created_at || session.user.created_at,
      email_confirmed: !!session.user.email_confirmed_at,
    })
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { full_name, phone } = await request.json()

    // Validate required fields
    if (!full_name) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update profile in profiles table
    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    console.log("Profile updated successfully:", profile)

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: {
        id: session.user.id,
        email: session.user.email,
        full_name: profile.full_name,
        role: profile.role,
        phone: profile.phone,
        updated_at: profile.updated_at,
      },
    })
  } catch (error) {
    console.error("Profile update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
