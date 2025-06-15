-- Ensure app_settings table exists with proper structure
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create or update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set allowAdminRegistration to true by default for new environments
INSERT INTO app_settings (key, value, created_at, updated_at)
VALUES ('allowAdminRegistration', 'true', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
  value = CASE 
    -- Only update to true if the current value is not explicitly set to false
    WHEN EXCLUDED.value = 'true' AND app_settings.value != 'false' THEN 'true'
    ELSE app_settings.value
  END,
  updated_at = CASE
    WHEN EXCLUDED.value = 'true' AND app_settings.value != 'false' THEN NOW()
    ELSE app_settings.updated_at
  END;

-- Insert other default security settings if they don't exist
INSERT INTO app_settings (key, value, created_at, updated_at) VALUES
('requireStrongPasswords', 'true', NOW(), NOW()),
('sessionTimeout', '60', NOW(), NOW()),
('twoFactorEnabled', 'false', NOW(), NOW()),
('loginAttemptLimit', '5', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Create RLS policies to ensure only admins can modify settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for reading settings (anyone can read)
DROP POLICY IF EXISTS "Allow read access to app_settings" ON app_settings;
CREATE POLICY "Allow read access to app_settings" ON app_settings
  FOR SELECT USING (true);

-- Policy for admin-only modifications
DROP POLICY IF EXISTS "Allow admin modifications to app_settings" ON app_settings;
CREATE POLICY "Allow admin modifications to app_settings" ON app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Ensure profiles table has role column with proper constraints
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';

-- Create index for role lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update existing profiles to have customer role if null
UPDATE profiles SET role = 'customer' WHERE role IS NULL;

-- Add constraint to ensure role is valid
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('customer', 'admin', 'delivery'));

COMMENT ON TABLE app_settings IS 'Application-wide configuration settings';
COMMENT ON COLUMN app_settings.key IS 'Unique setting identifier';
COMMENT ON COLUMN app_settings.value IS 'Setting value (stored as text, can be JSON)';
COMMENT ON COLUMN app_settings.updated_by IS 'User who last updated this setting';
