'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Hooks
import { useCart } from './hooks/use-cart';
import { useCustomer } from './hooks/use-customer';
import { useProducts } from './hooks/use-products';
import { useOrderState } from './hooks/use-order-state';
import { useOrderSubmission } from './hooks/use-order-submission';

// Components
import { ProductSelection } from './components/product-selection';
import { CartDisplay } from './components/cart-display';
import { CustomerForm } from './components/customer-form';
import { OrderSettings } from './components/order-settings';

// Types
import { ManualOrderFormProps } from './types';

export function ManualOrderFormRefactored({ onOrderCreated }: ManualOrderFormProps) {
  // Hooks
  const {
    cartItems,
    cartTotal,
    cartItemsCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemNotes,
    clearCart
  } = useCart();

  const {
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    customerSuggestions,
    showCustomerSuggestions,
    isSearchingCustomers,
    selectedCustomer,
    setCustomerName,
    setCustomerPhone,
    setCustomerEmail,
    setShowCustomerSuggestions,
    handleCustomerSelect,
    handleNewCustomer,
    handleZipCodeChange,
    updateCustomerAddress,
    clearCustomer,
    isCustomerValid
  } = useCustomer();

  const {
    products,
    filteredProducts,
    searchTerm,
    selectedCategory,
    isLoadingProducts,
    categories,
    handleSearchChange,
    handleCategoryChange,
    clearFilters,
    refreshProducts
  } = useProducts();

  const {
    orderType,
    paymentMethod,
    notes,
    deliveryFee,
    discount,
    discountType,
    handleOrderTypeChange,
    handlePaymentMethodChange,
    handleNotesChange,
    handleDeliveryFeeChange,
    handleDiscountChange,
    handleDiscountTypeChange,
    calculateTotal,
    getOrderSummary,
    isOrderValid,
    resetOrderState
  } = useOrderState();

  const { isSubmitting, submitOrder } = useOrderSubmission();

  // Auto-scroll to payment method when order type changes
  useEffect(() => {
    if (orderType) {
      const paymentElement = document.getElementById('payment-method-section');
      if (paymentElement) {
        paymentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [orderType]);

  // Computed values
  const hasCartItems = cartItems.length > 0;
  const canSubmitOrder = isOrderValid(hasCartItems, isCustomerValid());
  const orderSummary = getOrderSummary(cartTotal);

  // Handlers
  const handleSubmitOrder = async () => {
    if (!canSubmitOrder) {
      toast({
        title: 'Erro',
        description: 'Verifique se todos os campos obrigatórios estão preenchidos.',
        variant: 'destructive'
      });
      return;
    }

    const orderData = {
      cartItems,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      orderType,
      paymentMethod,
      notes,
      deliveryFee,
      discount,
      discountType,
      subtotal: cartTotal,
      total: orderSummary.total
    };

    const result = await submitOrder(orderData);

    if (result.success) {
      // Reset form
      clearCart();
      clearCustomer();
      resetOrderState();
      
      // Notify parent component
      if (onOrderCreated && result.orderId) {
        onOrderCreated(result.orderId);
      }
    }
  };

  const handleResetForm = () => {
    clearCart();
    clearCustomer();
    resetOrderState();
    clearFilters();
    
    toast({
      title: 'Formulário limpo',
      description: 'Todos os campos foram resetados.',
      variant: 'default'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              Novo Pedido Manual
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasCartItems && (
                <Badge variant="secondary">
                  {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}
                </Badge>
              )}
              {isCustomerValid() && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Cliente válido
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Product Selection */}
          <ProductSelection
            products={products}
            filteredProducts={filteredProducts}
            categories={categories}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            isLoadingProducts={isLoadingProducts}
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onAddToCart={addToCart}
            onClearFilters={clearFilters}
          />

          {/* Customer Form */}
          <CustomerForm
            customerName={customerName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            customerAddress={customerAddress}
            customerSuggestions={customerSuggestions}
            showCustomerSuggestions={showCustomerSuggestions}
            isSearchingCustomers={isSearchingCustomers}
            selectedCustomer={selectedCustomer}
            onCustomerNameChange={setCustomerName}
            onCustomerPhoneChange={setCustomerPhone}
            onCustomerEmailChange={setCustomerEmail}
            onAddressChange={updateCustomerAddress}
            onZipCodeChange={handleZipCodeChange}
            onCustomerSelect={handleCustomerSelect}
            onNewCustomer={handleNewCustomer}
            onHideSuggestions={() => setShowCustomerSuggestions(false)}
            isValid={isCustomerValid()}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Cart Display */}
          <CartDisplay
            cartItems={cartItems}
            cartTotal={cartTotal}
            cartItemsCount={cartItemsCount}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onUpdateItemNotes={updateItemNotes}
            onClearCart={clearCart}
          />

          {/* Order Settings */}
          <div id="payment-method-section">
            <OrderSettings
              orderType={orderType}
              paymentMethod={paymentMethod}
              notes={notes}
              deliveryFee={deliveryFee}
              discount={discount}
              discountType={discountType}
              subtotal={cartTotal}
              onOrderTypeChange={handleOrderTypeChange}
              onPaymentMethodChange={handlePaymentMethodChange}
              onNotesChange={handleNotesChange}
              onDeliveryFeeChange={handleDeliveryFeeChange}
              onDiscountChange={handleDiscountChange}
              onDiscountTypeChange={handleDiscountTypeChange}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleResetForm}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Limpar Formulário
              </Button>
              
              <Button
                variant="outline"
                onClick={refreshProducts}
                disabled={isLoadingProducts}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                Atualizar Produtos
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {hasCartItems && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total do Pedido</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(orderSummary.total)}
                  </p>
                </div>
              )}
              
              <Button
                onClick={handleSubmitOrder}
                disabled={!canSubmitOrder || isSubmitting}
                className="flex items-center gap-2 min-w-[140px]"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Criar Pedido
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}