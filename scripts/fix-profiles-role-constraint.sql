-- Script para corrigir constraint de role na tabela profiles
-- Execute este script ANTES do update-admin-registration-default.sql

-- 1. Primeiro, vamos ver quais valores de role existem atualmente
DO $$
DECLARE
    role_record RECORD;
BEGIN
    RAISE NOTICE 'Valores de role existentes na tabela profiles:';
    FOR role_record IN 
        SELECT role, COUNT(*) as count 
        FROM profiles 
        GROUP BY role 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Role: %, Count: %', COALESCE(role_record.role, 'NULL'), role_record.count;
    END LOOP;
END $$;

-- 2. Adicionar coluna role se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20);

-- 3. Corrigir valores NULL ou inválidos
UPDATE profiles 
SET role = 'customer' 
WHERE role IS NULL OR role NOT IN ('customer', 'admin', 'delivery');

-- 4. Verificar se ainda existem valores inválidos
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM profiles 
    WHERE role NOT IN ('customer', 'admin', 'delivery');
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Ainda existem % registros com role inválido', invalid_count;
    ELSE
        RAISE NOTICE 'Todos os registros de role foram corrigidos com sucesso!';
    END IF;
END $$;

-- 5. Remover constraint existente se houver
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 6. Adicionar o constraint correto
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('customer', 'admin', 'delivery'));

-- 7. Definir valor padrão
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'customer';

-- 8. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 9. Verificação final
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
    RAISE NOTICE 'Constraint aplicado com sucesso!';
END $$;
