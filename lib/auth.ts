import bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para operações diretas
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Idealmente, use uma variável de ambiente

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser({ email, password, full_name, role = 'customer' }: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}) {
  const hashedPassword = await hashPassword(password);
  
  // Criar usuário via Supabase
  const { data: authUser, error: authError } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password: password
  });
  
  if (authError) {
    throw new Error(`Erro ao criar usuário: ${authError.message}`);
  }
  
  const userId = authUser.user?.id;
  if (!userId) {
    throw new Error('Erro ao obter ID do usuário criado');
  }
  
  // Criar perfil do usuário
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email.toLowerCase(),
      full_name,
      role,
      password_hash: hashedPassword
    });
  
  if (profileError) {
    throw new Error(`Erro ao criar perfil: ${profileError.message}`);
  }
  
  return {
    id: userId,
    email: email.toLowerCase(),
    full_name,
    role
  };
}

export function generateToken(user: any) {
  return sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string) {
  try {
    const decoded = verify(token, JWT_SECRET) as any;
    return {
      ...decoded,
      isAdmin: decoded.role === 'admin'
    };
  } catch (error) {
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    console.log('🔍 Buscando usuário via Supabase:', email);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, password_hash')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error) {
      console.log('⚠️ Usuário não encontrado:', error.message);
      return null;
    }
    
    console.log('✅ Usuário encontrado via Supabase');
    return data;
  } catch (error) {
    console.error('❌ Error in getUserByEmail:', error);
    return null;
  }
}

export async function verifyAdmin(token: string) {
  const payload = await verifyToken(token);
  if (!payload || typeof payload === 'string' || payload.role !== 'admin') {
    return null;
  }
  return payload;
}