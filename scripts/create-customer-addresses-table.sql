-- Create customer_addresses table for storing delivery addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Endereço Principal',
    zip_code VARCHAR(10) NOT NULL,
    street TEXT NOT NULL,
    number VARCHAR(20) NOT NULL,
    complement TEXT,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);

-- Create RLS policies
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own addresses
CREATE POLICY "Users can view own addresses" ON customer_addresses
    FOR SELECT USING (auth.uid() = customer_id);

-- Policy for users to insert their own addresses
CREATE POLICY "Users can insert own addresses" ON customer_addresses
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Policy for users to update their own addresses
CREATE POLICY "Users can update own addresses" ON customer_addresses
    FOR UPDATE USING (auth.uid() = customer_id);

-- Policy for users to delete their own addresses
CREATE POLICY "Users can delete own addresses" ON customer_addresses
    FOR DELETE USING (auth.uid() = customer_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_customer_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_addresses_updated_at
    BEFORE UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_addresses_updated_at();

-- Ensure only one default address per customer
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this address as default, unset others
    IF NEW.is_default = TRUE THEN
        UPDATE customer_addresses 
        SET is_default = FALSE 
        WHERE customer_id = NEW.customer_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_default_address_trigger
    BEFORE INSERT OR UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_address();
