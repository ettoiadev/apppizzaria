import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente do Supabase para uso no servidor com service role key
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função helper para executar queries SQL diretamente no servidor
export async function executeServerQuery(query: string, params?: any[]) {
  try {
    const { data, error } = await supabaseServer.rpc('execute_sql', {
      query,
      params: params || []
    });
    
    if (error) {
      logger.error('SUPABASE_SERVER', 'Server query error:', error);
      throw error;
    }
    
    return { rows: data, rowCount: data?.length || 0 };
  } catch (error) {
    logger.error('SUPABASE_SERVER', 'Error executing server query:', error);
    throw error;
  }
}

// Export default para compatibilidade
export default supabaseServer;