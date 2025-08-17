import { useState } from 'react';
import { CartItem, Customer, CustomerAddress, OrderType, PaymentMethod } from '../types';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger'

interface OrderSubmissionData {
  cartItems: CartItem[];
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: CustomerAddress;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  notes: string;
  deliveryFee: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  subtotal: number;
  total: number;
}

export function useOrderSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCustomer = async (customerData: {
    name: string;
    phone: string;
    email: string;
    address: CustomerAddress;
  }): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || null,
          address: customerData.address
        })
        .select('id')
        .single();

      if (error) {
        logger.error('MODULE', 'Erro ao criar cliente:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      logger.error('MODULE', 'Erro ao criar cliente:', error);
      return null;
    }
  };

  const createOrder = async (orderData: {
    customerId: string;
    orderType: OrderType;
    paymentMethod: PaymentMethod;
    notes: string;
    deliveryFee: number;
    discount: number;
    discountType: 'percentage' | 'fixed';
    subtotal: number;
    total: number;
  }): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: orderData.customerId,
          type: orderData.orderType,
          payment_method: orderData.paymentMethod,
          notes: orderData.notes || null,
          delivery_fee: orderData.deliveryFee,
          discount_amount: orderData.discount,
          discount_type: orderData.discountType,
          subtotal: orderData.subtotal,
          total: orderData.total,
          status: 'pending',
          created_by: 'admin' // TODO: Get from auth context
        })
        .select('id')
        .single();

      if (error) {
        logger.error('MODULE', 'Erro ao criar pedido:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      logger.error('MODULE', 'Erro ao criar pedido:', error);
      return null;
    }
  };

  const createOrderItems = async (orderId: string, items: CartItem[]): Promise<boolean> => {
    try {
      const orderItems = items.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        notes: item.notes || null
      }));

      const { error } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (error) {
        logger.error('MODULE', 'Erro ao criar itens do pedido:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('MODULE', 'Erro ao criar itens do pedido:', error);
      return false;
    }
  };

  const submitOrder = async (data: OrderSubmissionData): Promise<{ success: boolean; orderId?: string }> => {
    setIsSubmitting(true);

    try {
      // 1. Create or get customer
      let customerId: string | null = null;
      
      // First, try to find existing customer by phone
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', data.customerPhone)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        customerId = await createCustomer({
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail,
          address: data.customerAddress
        });
      }

      if (!customerId) {
        toast({
          title: 'Erro',
          description: 'Erro ao criar/encontrar cliente',
          variant: 'destructive'
        });
        return { success: false };
      }

      // 2. Create order
      const orderId = await createOrder({
        customerId,
        orderType: data.orderType,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        deliveryFee: data.deliveryFee,
        discount: data.discount,
        discountType: data.discountType,
        subtotal: data.subtotal,
        total: data.total
      });

      if (!orderId) {
        toast({
          title: 'Erro',
          description: 'Erro ao criar pedido',
          variant: 'destructive'
        });
        return { success: false };
      }

      // 3. Create order items
      const itemsCreated = await createOrderItems(orderId, data.cartItems);

      if (!itemsCreated) {
        // Rollback: delete the order if items creation failed
        await supabase.from('orders').delete().eq('id', orderId);
        
        toast({
          title: 'Erro',
          description: 'Erro ao criar itens do pedido',
          variant: 'destructive'
        });
        return { success: false };
      }

      toast({
        title: 'Sucesso',
        description: `Pedido #${orderId} criado com sucesso!`,
        variant: 'default'
      });

      return { success: true, orderId };
    } catch (error) {
      logger.error('MODULE', 'Erro ao enviar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar pedido',
        variant: 'destructive'
      });
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitOrder
  };
}