// Sistema de logs estruturado para produção
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = string

interface LogEntry {
  timestamp: string
  level: LogLevel
  context: LogContext
  message: string
  data?: any
  userId?: string
  requestId?: string
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production'
  private isDevelopment = process.env.NODE_ENV === 'development'
  private enabledLevels: LogLevel[] = this.isProduction 
    ? ['error', 'warn'] 
    : ['debug', 'info', 'warn', 'error']

  private shouldLog(level: LogLevel): boolean {
    return this.enabledLevels.includes(level)
  }

  private formatMessage(level: LogLevel, context: LogContext, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data: this.isProduction ? this.sanitizeData(data) : data
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data
    
    // Remove informações sensíveis em produção
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential']
    
    if (typeof data === 'object') {
      const sanitized = { ...data }
      
      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]'
        }
      }
      
      return sanitized
    }
    
    return data
  }

  private output(entry: LogEntry): void {
    const { level, context, message, data } = entry
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${context}]`
    
    if (this.isProduction) {
      // Em produção, usar formato estruturado para ferramentas de monitoramento
      console.log(JSON.stringify(entry))
    } else {
      // Em desenvolvimento, usar formato legível
      switch (entry.level) {
        case 'debug':
          console.log(`${prefix} ${message}`, data || '')
          break
        case 'info':
          console.info(`${prefix} ${message}`, data || '')
          break
        case 'warn':
          console.warn(`${prefix} ${message}`, data || '')
          break
        case 'error':
          console.error(`${prefix} ${message}`, data || '')
          break
      }
    }
  }

  debug(context: LogContext, message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatMessage('debug', context, message, data))
    }
  }

  info(context: LogContext, message: string, data?: any): void {
    if (this.shouldLog('info')) {
      this.output(this.formatMessage('info', context, message, data))
    }
  }

  warn(context: LogContext, message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatMessage('warn', context, message, data))
    }
  }

  error(context: LogContext, message: string, data?: any): void {
    if (this.shouldLog('error')) {
      this.output(this.formatMessage('error', context, message, data))
    }
  }

  // Métodos específicos para contextos comuns
  api(method: string, endpoint: string, data?: any): void {
    this.info('API', `${method} ${endpoint}`, data)
  }

  apiError(method: string, endpoint: string, error: any): void {
    this.error('API', `${method} ${endpoint} failed`, {
      error: error.message || error,
      stack: this.isDevelopment ? error.stack : undefined
    })
  }

  database(operation: string, table: string, data?: any): void {
    this.debug('DATABASE', `${operation} on ${table}`, data)
  }

  databaseError(operation: string, table: string, error: any): void {
    this.error('DATABASE', `${operation} on ${table} failed`, {
      error: error.message || error,
      code: error.code,
      detail: error.detail
    })
  }

  auth(action: string, userId?: string, data?: any): void {
    this.info('AUTH', action, { userId, ...data })
  }

  authError(action: string, error: any, userId?: string): void {
    this.error('AUTH', `${action} failed`, {
      userId,
      error: error.message || error
    })
  }

  security(event: string, ip?: string, userAgent?: string): void {
    this.warn('SECURITY', event, { ip, userAgent })
  }

  performance(operation: string, duration: number, data?: any): void {
    if (duration > 1000) { // Log apenas operações lentas
      this.warn('PERFORMANCE', `Slow operation: ${operation} (${duration}ms)`, data)
    } else {
      this.debug('PERFORMANCE', `${operation} completed in ${duration}ms`, data)
    }
  }
}

// Instância singleton
export const logger = new Logger()

// Funções de conveniência para compatibilidade
export const debugLog = (context: string, message: string, data?: any) => 
  logger.debug(context, message, data)

export const apiLog = (method: string, endpoint: string, data?: any) => 
  logger.api(method, endpoint, data)

export const apiError = (method: string, endpoint: string, error: any) => 
  logger.apiError(method, endpoint, error)

export const dbLog = (operation: string, table: string, data?: any) => 
  logger.database(operation, table, data)

export const dbError = (operation: string, table: string, error: any) => 
  logger.databaseError(operation, table, error)

// Middleware para capturar erros não tratados
// Usar uma variável global para evitar registrar múltiplos listeners
if (typeof window === 'undefined' && !(global as any).__errorHandlersRegistered) {
  // Apenas no servidor e apenas uma vez
  (global as any).__errorHandlersRegistered = true
  
  process.on('uncaughtException', (error) => {
    logger.error('SYSTEM', 'Uncaught exception', error)
    process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    logger.error('SYSTEM', 'Unhandled promise rejection', reason)
  })
}

export default logger