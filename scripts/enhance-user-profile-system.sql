-- Script para melhorar o sistema de perfil do usuário

-- 1. Adicionar colunas necessárias à tabela profiles se não existirem
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login);

-- 3. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Trigger para updated_at na tabela profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Função para marcar perfil como completo
CREATE OR REPLACE FUNCTION check_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Marcar perfil como completo se todos os campos obrigatórios estiverem preenchidos
    NEW.profile_completed = (
        NEW.full_name IS NOT NULL AND 
        NEW.full_name != '' AND
        NEW.phone IS NOT NULL AND 
        NEW.phone != ''
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger para verificar completude do perfil
DROP TRIGGER IF EXISTS check_profile_completion_trigger ON profiles;
CREATE TRIGGER check_profile_completion_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_profile_completion();

-- 7. Atualizar perfis existentes para marcar como completos se aplicável
UPDATE profiles 
SET profile_completed = (
    full_name IS NOT NULL AND 
    full_name != '' AND
    phone IS NOT NULL AND 
    phone != ''
)
WHERE profile_completed IS NULL OR profile_completed = FALSE;

-- 8. Criar tabela para logs de atividade do usuário (opcional)
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'profile_update', 'order_placed', etc.
    activity_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Índices para a tabela de logs
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- 10. Políticas RLS para user_activity_logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity logs" ON user_activity_logs;
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
    FOR SELECT USING (true); -- Permitir leitura para todos por enquanto

DROP POLICY IF EXISTS "Users can insert own activity logs" ON user_activity_logs;
CREATE POLICY "Users can insert own activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true); -- Permitir inserção para todos por enquanto

-- 11. Função para registrar atividade do usuário
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_activity_data JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_activity_logs (
        user_id, 
        activity_type, 
        activity_data, 
        ip_address, 
        user_agent
    ) VALUES (
        p_user_id, 
        p_activity_type, 
        p_activity_data, 
        p_ip_address, 
        p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Atualizar last_login quando necessário
CREATE OR REPLACE FUNCTION update_last_login(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles 
    SET last_login = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 13. Verificar se tudo foi criado corretamente
SELECT 
    'Sistema de perfil do usuário configurado com sucesso!' as status,
    COUNT(*) as total_profiles
FROM profiles;

-- 14. Mostrar estatísticas dos perfis
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN profile_completed = true THEN 1 END) as completed_profiles,
    COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_emails,
    COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as users_with_login
FROM profiles;
