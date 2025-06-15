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

    // Get settings from database
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("*")
      .order("created_at", { ascending: false })

    if (settingsError) {
      console.error("Settings fetch error:", settingsError)
      // Return default settings if table doesn't exist or is empty
      return NextResponse.json(getDefaultSettings())
    }

    // Convert array of settings to object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    // Merge with defaults for any missing settings
    const completeSettings = { ...getDefaultSettings(), ...settingsObject }

    return NextResponse.json(completeSettings)
  } catch (error) {
    console.error("Settings API error:", error)
    return NextResponse.json(getDefaultSettings())
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settingsData = await request.json()

    const supabase = createRouteHandlerClient({ cookies })

    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Prepare settings for upsert
    const settingsArray = Object.entries(settingsData).map(([key, value]) => ({
      key,
      value: typeof value === "object" ? JSON.stringify(value) : String(value),
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    }))

    // Upsert settings (insert or update)
    const { error: upsertError } = await supabase.from("app_settings").upsert(settingsArray, {
      onConflict: "key",
      ignoreDuplicates: false,
    })

    if (upsertError) {
      console.error("Settings upsert error:", upsertError)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    console.log("Settings updated successfully")

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: settingsData,
    })
  } catch (error) {
    console.error("Settings update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getDefaultSettings() {
  return {
    // Admin Registration Control (enabled by default for new environments)
    allowAdminRegistration: true,

    // General Settings
    companyName: "Pizza Express",
    description: "A melhor pizza da cidade, entregue na sua porta",
    address: "Rua das Pizzas, 123 - Centro, São Paulo/SP",
    phone: "(11) 99999-9999",
    email: "contato@pizzaexpress.com",
    website: "www.pizzaexpress.com",
    openingHours: "18:00",
    closingHours: "23:00",
    isOpen: true,
    acceptOrders: true,
    minimumOrderValue: 25.0,

    // Appearance Settings
    primaryColor: "#ef4444",
    secondaryColor: "#f97316",
    theme: "light",
    fontFamily: "Inter",
    fontSize: "medium",
    borderRadius: "medium",
    showBranding: true,

    // Delivery Settings
    deliveryEnabled: true,
    freeDeliveryMinimum: 50.0,
    defaultDeliveryFee: 5.9,
    maxDeliveryDistance: 10,
    estimatedDeliveryTime: 30,

    // Payment Settings
    pixEnabled: true,
    pixKey: "contato@pizzaexpress.com",
    cashEnabled: true,
    cardOnDeliveryEnabled: true,

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newOrderNotification: true,
    orderStatusNotification: true,

    // Security Settings
    requireStrongPasswords: true,
    sessionTimeout: 60,
    twoFactorEnabled: false,
    loginAttemptLimit: 5,

    // Feature Boxes
    fastDeliveryEnabled: true,
    fastDeliveryTitle: "Super Rápido",
    fastDeliverySubtext: "Entrega expressa em até 30 minutos ou sua pizza é grátis",
    freeDeliveryEnabled: true,
    freeDeliveryTitle: "Frete Grátis",
    freeDeliverySubtext: "Entrega gratuita para pedidos acima de R$ 50,00",
  }
}
