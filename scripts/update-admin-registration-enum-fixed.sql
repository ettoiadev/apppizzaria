-- Configuração do sistema de administração com suporte a ENUM
-- Execute APÓS o script fix-profiles-enum-constraint.sql

-- 1. Garantir que o enum user_role existe com todos os valores
DO $$
BEGIN
    -- Verificar se o enum existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'admin', 'delivery');
        RAISE NOTICE 'Enum user_role criado';
    END IF;
END $$;

-- 2. Verificar estrutura da tabela profiles
DO $$
BEGIN
    -- Adicionar coluna role se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'customer'::user_role;
        RAISE NOTICE 'Coluna role adicionada à tabela profiles';
    END IF;
    
    -- Garantir que todos os registros tenham role
    UPDATE profiles SET role = 'customer'::user_role WHERE role IS NULL;
    
    -- Definir valor padrão
    ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'customer'::user_role;
END $$;

-- 3. Criar tabela de configurações do sistema se não existir
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserir configuração padrão para permitir registro de admin
INSERT INTO system_settings (key, value, description) 
VALUES (
    'allow_admin_registration', 
    'true', 
    'Permite registro de novos administradores'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para system_settings
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Criar trigger para profiles se não existir
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- 9. Verificação final
DO $$
DECLARE
    total_profiles INTEGER;
    admin_count INTEGER;
    customer_count INTEGER;
    delivery_count INTEGER;
    settings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_profiles FROM profiles;
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
    SELECT COUNT(*) INTO customer_count FROM profiles WHERE role = 'customer';
    SELECT COUNT(*) INTO delivery_count FROM profiles WHERE role = 'delivery';
    SELECT COUNT(*) INTO settings_count FROM system_settings;
    
    RAISE NOTICE '=== CONFIGURAÇÃO FINALIZADA ===';
    RAISE NOTICE 'Total de perfis: %', total_profiles;
    RAISE NOTICE 'Administradores: %', admin_count;
    RAISE NOTICE 'Clientes: %', customer_count;
    RAISE NOTICE 'Entregadores: %', delivery_count;
    RAISE NOTICE 'Configurações do sistema: %', settings_count;
    RAISE NOTICE 'Sistema de administração configurado com sucesso!';
END $$;
