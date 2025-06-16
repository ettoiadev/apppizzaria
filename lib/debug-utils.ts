import winston from 'winston';

// Configuração do logger Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Utilitário para debug centralizado
export const debugLog = {
  product: {
    saving: (action: string, data?: any) => {
      logger.info(`🛍️ [PRODUTO] ${action}`, data ? data : "")
    },
    success: (action: string, data?: any) => {
      logger.info(`✅ [PRODUTO] ${action}`, data ? data : "")
    },
    error: (action: string, error: any) => {
      logger.error(`❌ [PRODUTO] ${action}:`, error)
    },
  },
  api: {
    request: (method: string, url: string, data?: any) => {
      logger.info(`🌐 [API] ${method} ${url}`, data ? data : "")
    },
    response: (status: number, data?: any) => {
      logger.info(`📡 [API] Response ${status}`, data ? data : "")
    },
    error: (error: any) => {
      logger.error(`❌ [API] Error:`, error)
    },
  },
}
