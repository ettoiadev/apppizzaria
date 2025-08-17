import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger'

// Cliente Supabase para operações diretas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cliente Supabase Admin (com service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Controle de logs baseado em ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogs = process.env.ENABLE_QUERY_LOGS === 'true' || isDevelopment;

// Função para executar queries SQL diretas via Supabase (quando necessário)
export async function supabaseQuery(text: string, params?: any[]) {
  const start = Date.now();
  try {
    // Para queries SQL diretas, usar rpc ou sql
    const { data, error } = await supabase.rpc('execute_sql', {
      query: text,
      params: params || []
    });
    
    const duration = Date.now() - start;
    
    if (enableQueryLogs) {
      logger.debug('MODULE', '🔍 Supabase Query:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      logger.debug('MODULE', '⏱️  Duration:', duration + 'ms');
    }
    
    if (error) {
      logger.error('MODULE', '❌ Supabase Query Error:', error);
      throw error;
    }
    
    return { rows: data, rowCount: data?.length || 0 };
  } catch (err) {
    const duration = Date.now() - start;
    logger.error('MODULE', '❌ Supabase Query Error:', err);
    logger.error('MODULE', '📝 Query:', text);
    logger.error('MODULE', '📊 Params:', params);
    logger.error('MODULE', '⏱️  Duration:', duration + 'ms');
    throw err;
  }
}

// Função para debug de queries
export function debugQuery(text: string, params?: any[]) {
  logger.debug('MODULE', '🔍 Debug Query:', text);
  logger.debug('MODULE', '📊 Params:', params);
}

// Exportar clientes Supabase
export { supabase, supabaseAdmin };
export default supabase;