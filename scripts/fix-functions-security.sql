-- Script para corrigir funções com search_path mutável
-- Este script adiciona SECURITY DEFINER e define search_path seguro

-- 1. Função assign_product_number
CREATE OR REPLACE FUNCTION public.assign_product_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Se product_number não foi fornecido, atribuir o próximo da sequência
    IF NEW.product_number IS NULL THEN
        NEW.product_number := nextval('products_number_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- 2. Função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- 3. Função log_order_status_change
CREATE OR REPLACE FUNCTION public.log_order_status_change()
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- 4. Função update_admin_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- Comentários sobre as correções:
-- SECURITY DEFINER: Executa a função com privilégios do proprietário
-- SET search_path = public, pg_temp: Define um search_path seguro e imutável
-- Isso previne ataques de injeção via search_path manipulation