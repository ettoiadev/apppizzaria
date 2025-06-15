-- Script para corrigir constraint de role ENUM na tabela profiles
-- Execute este script ANTES do update-admin-registration-default.sql

-- 1. Primeiro, vamos descobrir a estrutura atual do enum
DO $$
DECLARE
    enum_values TEXT[];
    enum_value TEXT;
BEGIN
    -- Buscar valores do enum user_role
    SELECT array_agg(enumlabel ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role';
    
    IF enum_values IS NOT NULL THEN
        RAISE NOTICE 'Enum user_role existe com valores: %', array_to_string(enum_values, ', ');
    ELSE
        RAISE NOTICE 'Enum user_role não encontrado';
    END IF;
END $$;

-- 2. Verificar estrutura atual da tabela profiles
DO $$
DECLARE
    column_info RECORD;
BEGIN
    RAISE NOTICE '=== ESTRUTURA DA TABELA PROFILES ===';
    FOR column_info IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Coluna: %, Tipo: %, Nullable: %, Default: %', 
            column_info.column_name, 
            column_info.data_type, 
            column_info.is_nullable,
            COALESCE(column_info.column_default, 'NULL');
    END LOOP;
END $$;

-- 3. Verificar valores atuais de role (tratando NULL corretamente)
DO $$
DECLARE
    role_record RECORD;
    null_count INTEGER;
BEGIN
    RAISE NOTICE '=== VALORES DE ROLE EXISTENTES ===';
    
    -- Contar NULLs separadamente
    SELECT COUNT(*) INTO null_count FROM profiles WHERE role IS NULL;
    IF null_count > 0 THEN
        RAISE NOTICE 'Role NULL: % registros', null_count;
    END IF;
    
    -- Contar valores não-NULL
    FOR role_record IN 
        SELECT role::TEXT as role_text, COUNT(*) as count 
        FROM profiles 
        WHERE role IS NOT NULL
        GROUP BY role 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Role: %, Count: %', role_record.role_text, role_record.count;
    END LOOP;
END $$;

-- 4. Criar enum se não existir ou adicionar valores necessários
DO $$
BEGIN
    -- Verificar se o enum existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE NOTICE 'Criando enum user_role...';
        CREATE TYPE user_role AS ENUM ('customer', 'admin', 'delivery');
    ELSE
        RAISE NOTICE 'Enum user_role já existe';
        
        -- Adicionar valores se não existirem
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ignorar se já existe
        END;
        
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ignorar se já existe
        END;
        
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'delivery';
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ignorar se já existe
        END;
    END IF;
END $$;

-- 5. Corrigir coluna role se necessário
DO $$
BEGIN
    -- Verificar se a coluna role existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        RAISE NOTICE 'Adicionando coluna role...';
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'customer';
    ELSE
        RAISE NOTICE 'Coluna role já existe';
    END IF;
END $$;

-- 6. Corrigir valores NULL
UPDATE profiles 
SET role = 'customer'::user_role 
WHERE role IS NULL;

-- 7. Verificar se existem valores inválidos (isso não deveria acontecer com ENUM)
DO $$
DECLARE
    total_count INTEGER;
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM profiles;
    SELECT COUNT(*) INTO null_count FROM profiles WHERE role IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Ainda existem % registros com role NULL', null_count;
    ELSE
        RAISE NOTICE 'Todos os % registros têm role válido!', total_count;
    END IF;
END $$;

-- 8. Definir valor padrão se não estiver definido
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'customer'::user_role;

-- 9. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 10. Verificação final detalhada
DO $$
DECLARE
    total_count INTEGER;
    customer_count INTEGER;
    admin_count INTEGER;
    delivery_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM profiles;
    SELECT COUNT(*) INTO customer_count FROM profiles WHERE role = 'customer';
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
    SELECT COUNT(*) INTO delivery_count FROM profiles WHERE role = 'delivery';
    
    RAISE NOTICE '=== RESUMO FINAL ===';
    RAISE NOTICE 'Total de perfis: %', total_count;
    RAISE NOTICE 'Clientes: %', customer_count;
    RAISE NOTICE 'Administradores: %', admin_count;
    RAISE NOTICE 'Entregadores: %', delivery_count;
    RAISE NOTICE 'Estrutura corrigida com sucesso!';
END $$;
