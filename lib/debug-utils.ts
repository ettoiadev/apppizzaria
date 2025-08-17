// Utilitários de debug para desenvolvimento
import { logger } from './logger'

// Log condicional baseado no ambiente (mantido para compatibilidade)
export const debugLog = (message: string, data?: any) => {
  logger.debug('DEBUG', message, data)
}

// Logger mais robusto (mantido para compatibilidade)
export { logger } from './logger'

// Safe localStorage access with error handling
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null
    } catch (error) {
      logger.error('Error accessing localStorage:', error)
      return null
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value)
        return true
      }
      return false
    } catch (error) {
      logger.error('Error setting localStorage:', error)
      return false
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
        return true
      }
      return false
    } catch (error) {
      logger.error('Error removing from localStorage:', error)
      return false
    }
  }
}

// Error boundary helper
export const handleAsyncError = (error: any, context: string) => {
  logger.error(`Error in ${context}:`, error)
  
  // In production, return user-friendly messages
  if (isProduction) {
    return {
      message: 'Ocorreu um erro. Tente novamente.',
      code: 'GENERIC_ERROR'
    }
  }
  
  return {
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN',
    stack: error.stack
  }
}
