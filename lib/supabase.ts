import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função helper para executar queries SQL diretamente
export async function executeQuery(query: string, params?: any[]) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query,
      params: params || []
    });
    
    if (error) {
      logger.error('MODULE', 'Supabase query error:', error);
      throw error;
    }
    
    return { rows: data, rowCount: data?.length || 0 };
  } catch (error) {
    logger.error('MODULE', 'Error executing query:', error);
    throw error;
  }
}

// Função para buscar configurações usando o cliente Supabase
export async function getSettings() {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value, setting_type');
    
    if (error) {
      logger.error('MODULE', 'Error fetching settings:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    logger.error('MODULE', 'Error in getSettings:', error);
    throw error;
  }
}