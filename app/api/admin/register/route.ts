import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { full_name, email, password } = await request.json()

    // Validate input
    if (!full_name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Check if admin registration is allowed
    const { data: settingData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "allowAdminRegistration")
      .single()

    const allowRegistration = settingData?.value === "true" || settingData?.value === true

    if (!allowRegistration) {
      return NextResponse.json(
        {
          error: "O cadastro de administradores está desabilitado. Entre em contato com um administrador existente.",
        },
        { status: 403 },
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Auth creation error:", authError)
      if (authError.message.includes("already registered")) {
        return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 400 })
      }
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    // Create profile with admin role
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: full_name.trim(),
      role: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Try to clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Erro ao criar perfil do administrador" }, { status: 500 })
    }

    console.log("Admin user created successfully:", authData.user.id)

    return NextResponse.json({
      message: "Administrador criado com sucesso",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: full_name.trim(),
        role: "admin",
      },
    })
  } catch (error) {
    console.error("Admin registration API error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
