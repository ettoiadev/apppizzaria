import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para operações diretas
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Configuração do pool PostgreSQL (lazy initialization)
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    // Verificar se a DATABASE_URL está configurada
    if (!process.env.DATABASE_URL) {
      throw new Error('❌ DATABASE_URL não está configurada no arquivo .env');
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    console.log('🔗 Pool PostgreSQL inicializado');
  }
  
  return pool;
}

// Controle de logs baseado em ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogs = process.env.ENABLE_QUERY_LOGS === 'true' || isDevelopment;
const enableSlowQueryLogs = process.env.ENABLE_SLOW_QUERY_LOGS !== 'false'; // habilitado por padrão
const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'); // 1 segundo

// Função para executar queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const currentPool = getPool();
    const res = await currentPool.query(text, params);
    const duration = Date.now() - start;
    
    // Log baseado em configuração e performance
    if (enableQueryLogs) {
      // Log normal em desenvolvimento
      if (duration > 200) { // Apenas queries > 200ms
        console.log('🐌 Query (slow)', { 
          text: text.substring(0, 60) + '...', 
          duration: `${duration}ms`, 
          rows: res.rowCount 
        });
      }
    }
    
    // Log de queries muito lentas (sempre, mesmo em produção)
    if (enableSlowQueryLogs && duration > slowQueryThreshold) {
      console.warn('🚨 Slow query detected', { 
        text: text.substring(0, 100),
        duration: `${duration}ms`, 
        rows: res.rowCount,
        params: params ? JSON.stringify(params).substring(0, 100) : undefined
      });
    }
    
    return res;
  } catch (error) {
    // Sempre logar erros
    console.error('❌ Database query error', { 
      text: text.substring(0, 100), 
      error: error.message,
      params: params ? JSON.stringify(params).substring(0, 100) : undefined
    });
    throw error;
  }
}

// Função para obter uma conexão do pool
export async function getClient() {
  const currentPool = getPool();
  const client = await currentPool.connect();
  const queryFn = client.query.bind(client);
  const release = client.release.bind(client);

  // Sobrescreve o método de release apenas se logs estiverem habilitados
  client.release = () => {
    if (enableQueryLogs) {
      console.log('🔌 Cliente retornado ao pool');
    }
    release();
  };

  return { client, query: queryFn, release };
}

// Função para logs de debug específicos (apenas quando necessário)
export function debugQuery(text: string, params?: any[]) {
  if (enableQueryLogs) {
    console.log('🔍 Debug query', { 
      text: text.substring(0, 100),
      params: params ? JSON.stringify(params) : undefined
    });
  }
}

// Função alternativa usando Supabase diretamente
export async function supabaseQuery(text: string, params?: any[]) {
  try {
    // Converte query PostgreSQL para RPC do Supabase se necessário
    if (text.includes('SELECT') && text.includes('auth.users')) {
      // Para queries de autenticação, usar o cliente Supabase
      const { data, error } = await supabase.rpc('execute_sql', {
        query: text,
        params: params || []
      });
      
      if (error) throw error;
      return { rows: data || [] };
    }
    
    // Para outras queries, usar o pool normal
    return await query(text, params);
  } catch (error) {
    console.error('❌ Supabase query error', { text, error });
    throw error;
  }
}

// Exporta o pool e cliente Supabase para uso direto se necessário
export { getPool as pool, supabase };