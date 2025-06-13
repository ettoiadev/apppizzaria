// Utilitário para debug centralizado
export const debugLog = {
  product: {
    saving: (action: string, data?: any) => {
      console.log(`🛍️ [PRODUTO] ${action}`, data ? data : "")
    },
    success: (action: string, data?: any) => {
      console.log(`✅ [PRODUTO] ${action}`, data ? data : "")
    },
    error: (action: string, error: any) => {
      console.error(`❌ [PRODUTO] ${action}:`, error)
    },
  },
  api: {
    request: (method: string, url: string, data?: any) => {
      console.log(`🌐 [API] ${method} ${url}`, data ? data : "")
    },
    response: (status: number, data?: any) => {
      console.log(`📡 [API] Response ${status}`, data ? data : "")
    },
    error: (error: any) => {
      console.error(`❌ [API] Error:`, error)
    },
  },
}
