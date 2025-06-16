-- Verificar estrutura atual da tabela orders
DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura da tabela orders...';
    
    -- Verificar se a tabela orders existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RAISE NOTICE 'Tabela orders não existe. Criando...';
        
        -- Criar tabela orders completa
        CREATE TABLE orders (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED')),
            total DECIMAL(10,2) NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            delivery_fee DECIMAL(10,2) DEFAULT 0,
            discount DECIMAL(10,2) DEFAULT 0,
            payment_method VARCHAR(50) NOT NULL,
            payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
            delivery_address TEXT NOT NULL,
            delivery_phone VARCHAR(20) NOT NULL,
            delivery_instructions TEXT,
            estimated_delivery_time TIMESTAMP WITH TIME ZONE,
            delivered_at TIMESTAMP WITH TIME ZONE,
            cancelled_at TIMESTAMP WITH TIME ZONE,
            cancellation_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela orders criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela orders já existe. Verificando colunas...';
        
        -- Verificar e adicionar colunas que podem estar faltando
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_fee') THEN
            ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0;
            RAISE NOTICE 'Coluna delivery_fee adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
            ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0;
            RAISE NOTICE 'Coluna subtotal adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount') THEN
            ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2) DEFAULT 0;
            RAISE NOTICE 'Coluna discount adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
            ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'));
            RAISE NOTICE 'Coluna payment_status adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_phone') THEN
            ALTER TABLE orders ADD COLUMN delivery_phone VARCHAR(20) NOT NULL DEFAULT '';
            RAISE NOTICE 'Coluna delivery_phone adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_address') THEN
            ALTER TABLE orders ADD COLUMN delivery_address TEXT NOT NULL DEFAULT '';
            RAISE NOTICE 'Coluna delivery_address adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_instructions') THEN
            ALTER TABLE orders ADD COLUMN delivery_instructions TEXT;
            RAISE NOTICE 'Coluna delivery_instructions adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_delivery_time') THEN
            ALTER TABLE orders ADD COLUMN estimated_delivery_time TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Coluna estimated_delivery_time adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivered_at') THEN
            ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Coluna delivered_at adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cancelled_at') THEN
            ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Coluna cancelled_at adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cancellation_reason') THEN
            ALTER TABLE orders ADD COLUMN cancellation_reason TEXT;
            RAISE NOTICE 'Coluna cancellation_reason adicionada!';
        END IF;
    END IF;
    
    -- Criar tabela order_items se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        RAISE NOTICE 'Criando tabela order_items...';
        
        CREATE TABLE order_items (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            size VARCHAR(50),
            toppings TEXT[],
            special_instructions TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela order_items criada!';
    END IF;
    
    -- Criar tabela order_status_history se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_status_history') THEN
        RAISE NOTICE 'Criando tabela order_status_history...';
        
        CREATE TABLE order_status_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
            old_status VARCHAR(20),
            new_status VARCHAR(20) NOT NULL,
            changed_by UUID REFERENCES auth.users(id),
            changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            notes TEXT
        );
        
        RAISE NOTICE 'Tabela order_status_history criada!';
    END IF;
    
    -- Criar índices se não existirem
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
    
    RAISE NOTICE 'Índices criados/verificados!';
    
    -- Criar triggers se não existirem
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
    CREATE TRIGGER update_orders_updated_at 
        BEFORE UPDATE ON orders 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    
    -- Trigger para registrar mudanças de status
    CREATE OR REPLACE FUNCTION log_order_status_change()
    RETURNS TRIGGER AS $$
    BEGIN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO order_status_history (order_id, old_status, new_status, changed_at)
            VALUES (NEW.id, OLD.status, NEW.status, NOW());
            
            -- Atualizar timestamps específicos baseados no status
            IF NEW.status = 'DELIVERED' THEN
                NEW.delivered_at = NOW();
            ELSIF NEW.status = 'CANCELLED' THEN
                NEW.cancelled_at = NOW();
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    DROP TRIGGER IF EXISTS log_order_status_change_trigger ON orders;
    CREATE TRIGGER log_order_status_change_trigger
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION log_order_status_change();
    
    RAISE NOTICE 'Triggers criados/atualizados!';
    
    -- Mostrar estrutura final
    RAISE NOTICE 'Estrutura final da tabela orders:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            rec.column_name, rec.data_type, rec.is_nullable, COALESCE(rec.column_default, 'none');
    END LOOP;
    
    RAISE NOTICE 'Correção da estrutura da tabela orders concluída!';
END $$;
