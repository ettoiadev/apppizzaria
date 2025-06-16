-- Script mínimo para criar estrutura de pedidos
-- Execute linha por linha se necessário

-- Criar tabela orders básica
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'RECEIVED',
    total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    delivery_address TEXT DEFAULT '',
    delivery_phone VARCHAR(20) DEFAULT '',
    delivery_instructions TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas uma por vez (execute apenas se a coluna não existir)
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PENDING';
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_phone VARCHAR(20) DEFAULT '';
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT DEFAULT '';

-- Criar tabela order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    size VARCHAR(50),
    toppings TEXT[],
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
