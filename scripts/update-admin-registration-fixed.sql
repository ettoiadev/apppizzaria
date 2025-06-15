-- Script corrigido para configuração de registro de admin
-- Execute APÓS o fix-profiles-role-constraint.sql

-- Verificar se a tabela profiles está OK
DO $$
DECLARE
    invalid_roles INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_roles
    FROM profiles 
    WHERE role NOT IN ('customer', 'admin', 'delivery');
    
    IF invalid_roles > 0 THEN
        RAISE EXCEPTION 'Tabela profiles ainda tem % registros com role inválido. Execute fix-profiles-role-constraint.sql primeiro.', invalid_roles;
    END IF;
END $$;

-- Criar tabela app_settings se não existir
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Criar função de trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para app_settings
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações padrão
INSERT INTO app_settings (key, value, created_at, updated_at) VALUES
('allowAdminRegistration', 'true', NOW(), NOW()),
('requireStrongPasswords', 'true', NOW(), NOW()),
('sessionTimeout', '60', NOW(), NOW()),
('twoFactorEnabled', 'false', NOW(), NOW()),
('loginAttemptLimit', '5', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = CASE 
    WHEN EXCLUDED.key = 'allowAdminRegistration' AND app_settings.value != 'false' THEN 'true'
    ELSE EXCLUDED.value
  END,
  updated_at = NOW();

-- Configurar RLS para app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Política para leitura (qualquer um pode ler)
DROP POLICY IF EXISTS "Allow read access to app_settings" ON app_settings;
CREATE POLICY "Allow read access to app_settings" ON app_settings
  FOR SELECT USING (true);

-- Política para modificações (apenas admins)
DROP POLICY IF EXISTS "Allow admin modifications to app_settings" ON app_settings;
CREATE POLICY "Allow admin modifications to app_settings" ON app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Adicionar comentários
COMMENT ON TABLE app_settings IS 'Configurações da aplicação';
COMMENT ON COLUMN app_settings.key IS 'Chave única da configuração';
COMMENT ON COLUMN app_settings.value IS 'Valor da configuração (texto, pode ser JSON)';
COMMENT ON COLUMN app_settings.updated_by IS 'Usuário que fez a última atualização';

-- Verificação final
DO $$
DECLARE
    settings_count INTEGER;
    profiles_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO settings_count FROM app_settings;
    SELECT COUNT(*) INTO profiles_count FROM profiles WHERE role = 'admin';
    
    RAISE NOTICE '=== CONFIGURAÇÃO CONCLUÍDA ===';
    RAISE NOTICE 'Configurações criadas: %', settings_count;
    RAISE NOTICE 'Administradores existentes: %', profiles_count;
    RAISE NOTICE 'Registro de admin habilitado: %', (SELECT value FROM app_settings WHERE key = 'allowAdminRegistration');
END $$;
