import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN_SETTINGS] Iniciando verificação de autenticação')
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[ADMIN_SETTINGS] Token não fornecido')
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.isAdmin) {
      console.log('[ADMIN_SETTINGS] Token inválido ou usuário não é admin')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    console.log('[ADMIN_SETTINGS] Usuário autenticado como admin:', decoded.email)

    // Buscar configurações via Supabase
    console.log('[ADMIN_SETTINGS] Buscando configurações via Supabase')
    const { data: settingsData, error: settingsError } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
    
    if (settingsError) {
      console.error('[ADMIN_SETTINGS] Erro ao buscar configurações:', settingsError)
      return NextResponse.json({ settings: {} })
    }

    console.log('[ADMIN_SETTINGS] Configurações encontradas:', settingsData?.length || 0)
    
    const settings: Record<string, any> = {}
    if (settingsData && settingsData.length > 0) {
      settingsData.forEach(row => {
        try {
          settings[row.setting_key] = JSON.parse(row.setting_value)
        } catch {
          settings[row.setting_key] = row.setting_value
        }
      })
    }

    console.log(`[ADMIN_SETTINGS] Retornando ${Object.keys(settings).length} configurações`)
    return NextResponse.json({ settings })

  } catch (error) {
    console.error('[ADMIN_SETTINGS] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[ADMIN_SETTINGS] Iniciando atualização de configurações')
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[ADMIN_SETTINGS] Token não fornecido para atualização')
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || !decoded.isAdmin) {
      console.log('[ADMIN_SETTINGS] Token inválido ou usuário não é admin para atualização')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    console.log('[ADMIN_SETTINGS] Atualização autorizada para admin:', decoded.email)

    const settings = await request.json()
    console.log(`[ADMIN_SETTINGS] Atualizando ${Object.keys(settings).length} configurações`)

    // Atualizar configurações via Supabase
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: key,
          setting_value: stringValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        })
      
      if (error) {
        console.error(`[ADMIN_SETTINGS] Erro ao salvar configuração ${key}:`, error)
        return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
      }
    }

    console.log('[ADMIN_SETTINGS] Configurações salvas com sucesso')
    return NextResponse.json({ message: 'Configurações salvas com sucesso' })
  } catch (error) {
    console.error('[ADMIN_SETTINGS] Erro ao salvar configurações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
