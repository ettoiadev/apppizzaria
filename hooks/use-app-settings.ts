import { useSettings } from '@/contexts/settings-context'

export interface AppSettings {
  restaurant_name?: string
  description?: string
  restaurant_phone?: string
  restaurant_address?: string
  email?: string
  website?: string
  logo_url?: string
  delivery_fee?: string
  min_order_value?: string
  delivery_time?: string
  openingHours?: string
  closingHours?: string
  isOpen?: string
  acceptOrders?: string
  fastDeliveryEnabled?: string
  fastDeliveryTitle?: string
  fastDeliverySubtext?: string
  freeDeliveryEnabled?: string
  freeDeliveryTitle?: string
  freeDeliverySubtext?: string
}

export function useAppSettings() {
  return useSettings()
}

// Função utilitária para formatar valores monetários
export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue || 0)
}

// Função utilitária para verificar se o estabelecimento está aberto
export const isRestaurantOpen = (settings: AppSettings): boolean => {
  if (settings.isOpen !== 'true' || settings.acceptOrders !== 'true') {
    return false
  }

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  if (settings.openingHours && settings.closingHours) {
    const [openHour, openMin] = settings.openingHours.split(':').map(Number)
    const [closeHour, closeMin] = settings.closingHours.split(':').map(Number)
    
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin
    
    if (closeTime > openTime) {
      // Mesmo dia
      return currentTime >= openTime && currentTime <= closeTime
    } else {
      // Cruza meia-noite
      return currentTime >= openTime || currentTime <= closeTime
    }
  }
  
  return true
}