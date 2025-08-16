"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AppSettings } from '@/hooks/use-app-settings'

interface SettingsContextType {
  settings: AppSettings
  loading: boolean
  error: string | null
  refreshSettings: () => void
}

const defaultSettings: AppSettings = {
  restaurant_name: 'William Disk Pizza',
  description: 'A melhor pizza da cidade, feita com ingredientes frescos e muito amor!',
  restaurant_phone: '(11) 99999-9999',
  restaurant_address: 'Rua das Pizzas, 123 - Centro - São Paulo/SP',
  email: 'contato@williamdiskpizza.com',
  website: 'www.williamdiskpizza.com',
  delivery_fee: '5.00',
  min_order_value: '20.00',
  delivery_time: '30',
  openingHours: '18:00',
  closingHours: '23:00',
  isOpen: 'true',
  acceptOrders: 'true',
  fastDeliveryEnabled: 'true',
  fastDeliveryTitle: 'Entrega Rápida',
  fastDeliverySubtext: 'Em até 30 minutos',
  freeDeliveryEnabled: 'true',
  freeDeliveryTitle: 'Frete Grátis',
  freeDeliverySubtext: 'Pedidos acima de R$ 50'
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Cache global para as configurações
let cachedSettings: AppSettings | null = null
let cacheTimestamp = 0
let isLoading = false
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // Verificar cache
      const now = Date.now()
      if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
        setSettings(cachedSettings)
        setLoading(false)
        return
      }

      // Evitar múltiplas requisições simultâneas
      if (isLoading) {
        return
      }

      isLoading = true
      setLoading(true)

      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          const newSettings = { ...defaultSettings, ...data.settings }
          setSettings(newSettings)
          
          // Atualizar cache
          cachedSettings = newSettings
          cacheTimestamp = now
        }
      } else {
        throw new Error('Falha ao carregar configurações')
      }
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      // Manter configurações padrão em caso de erro
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
      isLoading = false
    }
  }

  const refreshSettings = () => {
    // Limpar cache e recarregar
    cachedSettings = null
    cacheTimestamp = 0
    isLoading = false
    fetchSettings()
  }

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      error,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}