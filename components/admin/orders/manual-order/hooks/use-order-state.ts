import { useState } from 'react';
import { OrderType, PaymentMethod } from '../types';

export function useOrderState() {
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('money');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    
    // Reset delivery fee if switching to pickup
    if (type === 'pickup') {
      setDeliveryFee(0);
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
  };

  const handleDeliveryFeeChange = (fee: number) => {
    setDeliveryFee(Math.max(0, fee));
  };

  const handleDiscountChange = (value: number) => {
    setDiscount(Math.max(0, value));
  };

  const handleDiscountTypeChange = (type: 'percentage' | 'fixed') => {
    setDiscountType(type);
    // Reset discount when changing type
    setDiscount(0);
  };

  const calculateDiscountAmount = (subtotal: number): number => {
    if (discount <= 0) return 0;
    
    if (discountType === 'percentage') {
      const percentage = Math.min(discount, 100); // Max 100%
      return (subtotal * percentage) / 100;
    } else {
      return Math.min(discount, subtotal); // Discount can't be more than subtotal
    }
  };

  const calculateTotal = (subtotal: number): number => {
    const discountAmount = calculateDiscountAmount(subtotal);
    const total = subtotal - discountAmount + (orderType === 'delivery' ? deliveryFee : 0);
    return Math.max(0, total);
  };

  const resetOrderState = () => {
    setOrderType('delivery');
    setPaymentMethod('money');
    setNotes('');
    setDeliveryFee(0);
    setDiscount(0);
    setDiscountType('percentage');
    setIsSubmitting(false);
  };

  const getOrderSummary = (subtotal: number) => {
    const discountAmount = calculateDiscountAmount(subtotal);
    const total = calculateTotal(subtotal);
    
    return {
      subtotal,
      discountAmount,
      deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
      total
    };
  };

  const isOrderValid = (hasItems: boolean, isCustomerValid: boolean): boolean => {
    return hasItems && 
           isCustomerValid && 
           !isSubmitting &&
           (orderType === 'pickup' || deliveryFee >= 0);
  };

  return {
    // State
    orderType,
    paymentMethod,
    notes,
    isSubmitting,
    deliveryFee,
    discount,
    discountType,
    
    // Actions
    handleOrderTypeChange,
    handlePaymentMethodChange,
    handleNotesChange,
    handleDeliveryFeeChange,
    handleDiscountChange,
    handleDiscountTypeChange,
    setIsSubmitting,
    resetOrderState,
    
    // Computed
    calculateDiscountAmount,
    calculateTotal,
    getOrderSummary,
    isOrderValid
  };
}