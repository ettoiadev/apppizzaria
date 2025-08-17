-- Script para habilitar RLS (Row Level Security) em todas as tabelas públicas
-- Este script corrige a vulnerabilidade crítica identificada na auditoria de segurança

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para tabelas públicas (leitura geral)
-- Categories - leitura pública para produtos ativos
CREATE POLICY "Categories são visíveis publicamente" ON public.categories
    FOR SELECT USING (active = true);

-- Products - leitura pública para produtos ativos
CREATE POLICY "Products são visíveis publicamente" ON public.products
    FOR SELECT USING (active = true);

-- About Content - leitura pública
CREATE POLICY "About content é visível publicamente" ON public.about_content
    FOR SELECT USING (true);

-- 3. Políticas para usuários autenticados
-- Profiles - usuários podem ver e editar apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Customer Addresses - usuários podem gerenciar apenas seus endereços
CREATE POLICY "Usuários podem ver seus endereços" ON public.customer_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus endereços" ON public.customer_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus endereços" ON public.customer_addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus endereços" ON public.customer_addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Orders - usuários podem ver apenas seus pedidos
CREATE POLICY "Usuários podem ver seus pedidos" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar pedidos" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items - usuários podem ver itens de seus pedidos
CREATE POLICY "Usuários podem ver itens de seus pedidos" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Order Status History - usuários podem ver histórico de seus pedidos
CREATE POLICY "Usuários podem ver histórico de seus pedidos" ON public.order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_status_history.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Contact Messages - usuários podem inserir mensagens
CREATE POLICY "Usuários podem enviar mensagens de contato" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- 4. Políticas para administradores
-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas administrativas para todas as tabelas
CREATE POLICY "Admins têm acesso total a categories" ON public.categories
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a products" ON public.products
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a orders" ON public.orders
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a order_items" ON public.order_items
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a order_status_history" ON public.order_status_history
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a customer_addresses" ON public.customer_addresses
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a contact_messages" ON public.contact_messages
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a delivery_zones" ON public.delivery_zones
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a promotions" ON public.promotions
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a about_content" ON public.about_content
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a admin_settings" ON public.admin_settings
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a drivers" ON public.drivers
    FOR ALL USING (public.is_admin());

-- 5. Políticas para entregadores
-- Função auxiliar para verificar se o usuário é entregador
CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'delivery'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Entregadores podem ver pedidos quando estão ativos
CREATE POLICY "Entregadores podem ver pedidos" ON public.orders
    FOR SELECT USING (
        public.is_driver() AND 
        status IN ('PREPARING', 'ON_THE_WAY')
    );

-- Entregadores podem atualizar status de pedidos
CREATE POLICY "Entregadores podem atualizar status de pedidos" ON public.orders
    FOR UPDATE USING (
        public.is_driver() AND 
        status IN ('PREPARING', 'ON_THE_WAY')
    );

-- Entregadores podem ver seu próprio perfil de driver
CREATE POLICY "Entregadores podem ver seu perfil" ON public.drivers
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Entregadores podem atualizar seu perfil" ON public.drivers
    FOR UPDATE USING (auth.uid() = profile_id);

-- 6. Políticas para cozinha
-- Função auxiliar para verificar se o usuário é da cozinha
CREATE OR REPLACE FUNCTION public.is_kitchen()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'kitchen'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cozinha pode ver todos os pedidos em preparo
CREATE POLICY "Cozinha pode ver pedidos em preparo" ON public.orders
    FOR SELECT USING (
        public.is_kitchen() AND 
        status IN ('RECEIVED', 'PREPARING')
    );

-- Cozinha pode atualizar status de pedidos
CREATE POLICY "Cozinha pode atualizar status de pedidos" ON public.orders
    FOR UPDATE USING (
        public.is_kitchen() AND 
        status IN ('RECEIVED', 'PREPARING')
    );

-- Cozinha pode ver itens dos pedidos
CREATE POLICY "Cozinha pode ver itens dos pedidos" ON public.order_items
    FOR SELECT USING (
        public.is_kitchen() AND
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.status IN ('RECEIVED', 'PREPARING')
        )
    );