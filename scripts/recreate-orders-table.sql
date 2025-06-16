-- Recriar tabela orders com estrutura completa
-- ATENÇÃO: Este script vai APAGAR dados existentes na tabela orders

-- 1. Remover tabelas dependentes primeiro
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- 2. Criar tabela orders com estrutura completa
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'RECEIVED' NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) DEFAULT 0 NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0 NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_phone VARCHAR(20) NOT NULL,
    delivery_instructions TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT orders_status_check CHECK (status IN ('RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED')),
    CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    CONSTRAINT orders_total_positive CHECK (total >= 0),
    CONSTRAINT orders_subtotal_positive CHECK (subtotal >= 0),
    CONSTRAINT orders_delivery_fee_positive CHECK (delivery_fee >= 0),
    CONSTRAINT orders_discount_positive CHECK (discount >= 0)
);

-- 3. Criar tabela order_items
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    size VARCHAR(50),
    toppings TEXT[],
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Criar tabela order_status_history
CREATE TABLE order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    notes TEXT
);

-- 5. Criar índices para performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- 6. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger para updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Função para log de mudança de status
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
        
        -- Atualizar timestamps específicos
        IF NEW.status = 'DELIVERED' THEN
            NEW.delivered_at = NOW();
        ELSIF NEW.status = 'CANCELLED' THEN
            NEW.cancelled_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Trigger para log de status
CREATE TRIGGER log_order_status_change_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- 10. Inserir dados de teste
INSERT INTO orders (
    user_id, 
    status, 
    total, 
    subtotal,
    delivery_fee,
    payment_method, 
    delivery_address, 
    delivery_phone,
    estimated_delivery_time
) VALUES 
(
    '9c5569d8-6193-4382-a2f2-f5cd6e750385', -- Usar o ID do usuário do log
    'RECEIVED',
    45.90,
    42.90,
    3.00,
    'PIX',
    'Rua das Flores, 123 - Centro, São Paulo - SP',
    '(11) 99999-9999',
    NOW() + INTERVAL '45 minutes'
);

-- Verificar se foi criado corretamente
SELECT * FROM orders;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;
