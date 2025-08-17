import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from "@/lib/auth"
import { JwtPayload } from "jsonwebtoken"
import { logger } from '@/lib/logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface CustomJwtPayload extends JwtPayload {
  role?: string;
}

// GET - Buscar conteúdo da página Sobre
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar qualquer registro de about_content
    const { data: result, error } = await supabase
      .from('about_content')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('MODULE', '[ABOUT] Erro ao buscar conteúdo:', error)
      return NextResponse.json({ error: "Erro ao buscar conteúdo" }, { status: 500 })
    }

    if (!result) {
      const defaultContent = {
        hero: {
          title: "Sobre a Pizza Delivery",
          subtitle: "Tradição em sabor desde 2020",
          image: "/placeholder.jpg"
        },
        story: {
          title: "Nossa História",
          content: "A Pizza Delivery nasceu do sonho de levar a melhor pizza artesanal até você...",
          image: "/placeholder.jpg"
        },
        values: [
          {
            title: "Qualidade",
            description: "Ingredientes selecionados e processos rigorosos de qualidade",
            icon: "🌟"
          },
          {
            title: "Rapidez",
            description: "Entrega rápida e eficiente para sua pizza chegar quentinha",
            icon: "⚡"
          },
          {
            title: "Atendimento",
            description: "Equipe treinada para oferecer o melhor atendimento",
            icon: "💝"
          }
        ],
        team: [
          {
            name: "João Silva",
            role: "Chef de Cozinha",
            image: "/placeholder-user.jpg"
          },
          {
            name: "Maria Oliveira",
            role: "Gerente",
            image: "/placeholder-user.jpg"
          }
        ]
      }

      const { data: insertResult, error: insertError } = await supabase
        .from('about_content')
        .insert({
          hero: defaultContent.hero,
          story: defaultContent.story,
          values: defaultContent.values,
          team: defaultContent.team
        })
        .select()
        .single()

      if (insertError) {
        // If insert fails, return default content without saving
        return NextResponse.json({ content: { 
          id: 'default',
          hero: defaultContent.hero,
          story: defaultContent.story,
          values: defaultContent.values,
          team: defaultContent.team
        }})
      }

      return NextResponse.json({ content: insertResult })
    }

    return NextResponse.json({ content: result })
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar conteúdo da página Sobre
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = await verifyToken(authHeader) as CustomJwtPayload
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { hero, story, values, team } = body

    if (!hero || !story || !values || !team) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    if (!hero.title || !hero.subtitle || !story.title || !story.content) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando em hero ou story" },
        { status: 400 }
      )
    }

    if (!Array.isArray(values) || values.length === 0) {
      return NextResponse.json(
        { error: "Valores devem ser um array não vazio" },
        { status: 400 }
      )
    }

    if (!Array.isArray(team) || team.length === 0) {
      return NextResponse.json(
        { error: "Equipe deve ser um array não vazio" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if any record exists first
    const { data: existing } = await supabase
      .from('about_content')
      .select('id')
      .limit(1)
      .single()
    
    if (existing) {
      // Update existing record
      const { data: result, error: updateError } = await supabase
        .from('about_content')
        .update({
          hero,
          story,
          values,
          team,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        logger.error('MODULE', '[ABOUT] Erro ao atualizar:', updateError)
        throw updateError
      }

      return NextResponse.json({ content: result })
    } else {
      // Create new record
      const { data: result, error: insertError } = await supabase
        .from('about_content')
        .insert({
          hero,
          story,
          values,
          team
        })
        .select()
        .single()

      if (insertError) {
        logger.error('MODULE', '[ABOUT] Erro ao criar:', insertError)
        throw insertError
      }

      return NextResponse.json({ content: result })
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
