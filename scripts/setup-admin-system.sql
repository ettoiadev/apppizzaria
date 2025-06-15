-- Ensure profiles table has role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update existing profiles to have customer role if null
UPDATE profiles SET role = 'customer' WHERE role IS NULL;

-- Insert default admin registration setting (enabled for first setup)
INSERT INTO app_settings (key, value, created_at, updated_at)
VALUES ('allowAdminRegistration', 'true', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Insert other security settings with defaults
INSERT INTO app_settings (key, value, created_at, updated_at) VALUES
('requireStrongPasswords', 'true', NOW(), NOW()),
('sessionTimeout', '60', NOW(), NOW()),
('twoFactorEnabled', 'false', NOW(), NOW()),
('loginAttemptLimit', '5', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Create a function to automatically disable admin registration after first admin is created
CREATE OR REPLACE FUNCTION disable_admin_registration_after_first()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an admin being inserted
  IF NEW.role = 'admin' THEN
    -- Check if this is the first admin
    IF (SELECT COUNT(*) FROM profiles WHERE role = 'admin') = 1 THEN
      -- Disable admin registration
      UPDATE app_settings 
      SET value = 'false', updated_at = NOW() 
      WHERE key = 'allowAdminRegistration';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run the function after admin insertion
DROP TRIGGER IF EXISTS trigger_disable_admin_registration ON profiles;
CREATE TRIGGER trigger_disable_admin_registration
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION disable_admin_registration_after_first();
