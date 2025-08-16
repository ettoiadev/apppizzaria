import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para operações diretas
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Cliente Supabase Admin (com service role key)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
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
      console.log('🔍 Supabase Query:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      console.log('⏱️  Duration:', duration + 'ms');
    }
    
    if (error) {
      console.error('❌ Supabase Query Error:', error);
      throw error;
    }
    
    return { rows: data, rowCount: data?.length || 0 };
  } catch (err) {
    const duration = Date.now() - start;
    console.error('❌ Supabase Query Error:', err);
    console.error('📝 Query:', text);
    console.error('📊 Params:', params);
    console.error('⏱️  Duration:', duration + 'ms');
    throw err;
  }
}

// Função para debug de queries
export function debugQuery(text: string, params?: any[]) {
  console.log('🔍 Debug Query:', text);
  console.log('📊 Params:', params);
}

// Exportar clientes Supabase
export { supabase, supabaseAdmin };
export default supabase;