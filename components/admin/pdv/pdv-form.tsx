'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, RefreshCw, CheckCircle, Monitor, ShoppingCart, User, CreditCard } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// Hooks reutilizados do pedido manual
import { useCart } from '../orders/manual-order/hooks/use-cart'
import { useCustomer } from '../orders/manual-order/hooks/use-customer'
import { useProducts } from '../orders/manual-order/hooks/use-products'
import { useOrderState } from '../orders/manual-order/hooks/use-order-state'
import { useOrderSubmission } from '../orders/manual-order/hooks/use-order-submission'

// Componentes adaptados para PDV
import { PDVProductSelection } from './components/pdv-product-selection'
import { PDVCartDisplay } from './components/pdv-cart-display'
import { PDVCustomerForm } from './components/pdv-customer-form'
import { PDVOrderSettings } from './components/pdv-order-settings'

interface PDVFormProps {
  onOrderCreated: (orderId: string) => void
}

export function PDVForm({ onOrderCreated }: PDVFormProps) {
  // Hooks reutilizados
  const {
    cartItems,
    cartTotal,
    cartItemsCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemNotes,
    clearCart
  } = useCart()

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
  } = useCustomer()

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
  } = useProducts()

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
  } = useOrderState()

  const { isSubmitting, submitOrder } = useOrderSubmission()

  // Computed values
  const hasCartItems = cartItems.length > 0
  const canSubmitOrder = isOrderValid(hasCartItems, isCustomerValid())
  const orderSummary = getOrderSummary(cartTotal)

  // Handlers
  const handleSubmitOrder = async () => {
    if (!canSubmitOrder) {
      toast({
        title: 'Erro',
        description: 'Verifique se todos os campos obrigatórios estão preenchidos.',
        variant: 'destructive'
      })
      return
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
    }

    const result = await submitOrder(orderData)

    if (result.success) {
      // Reset form
      clearCart()
      clearCustomer()
      resetOrderState()
      
      // Notify parent component
      if (onOrderCreated && result.orderId) {
        onOrderCreated(result.orderId)
      }
    }
  }

  const handleResetForm = () => {
    clearCart()
    clearCustomer()
    resetOrderState()
    clearFilters()
    
    toast({
      title: 'Formulário limpo',
      description: 'Todos os campos foram resetados.',
      variant: 'default'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  PDV - Novo Pedido
                </CardTitle>
                <p className="text-gray-600">Sistema otimizado para atendimento rápido</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasCartItems && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}
                </Badge>
              )}
              {isCustomerValid() && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <User className="h-3 w-3 mr-1" />
                  Cliente OK
                </Badge>
              )}
              {paymentMethod && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <CreditCard className="h-3 w-3 mr-1" />
                  {paymentMethod}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Layout Principal - 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
        {/* Coluna Esquerda: Dados do Cliente e Pedido */}
        <div className="space-y-6 overflow-y-auto">
          {/* Cliente */}
          <PDVCustomerForm
            selectedCustomer={selectedCustomer}
            searchTerm={customerName}
            searchResults={customerSuggestions}
            isSearching={isSearchingCustomers}
            isCreatingCustomer={false}
            newCustomer={{
              name: '',
              phone: '',
              email: '',
              address: '',
              neighborhood: '',
              city: '',
              state: '',
              zip_code: ''
            }}
            onSearchChange={setCustomerName}
            onSelectCustomer={handleCustomerSelect}
            onClearCustomer={clearCustomer}
            onNewCustomerChange={() => {}}
            onCreateCustomer={() => {}}
            onToggleCreateMode={() => {}}
          />

          {/* Configurações do Pedido */}
          <PDVOrderSettings
            orderType={orderType}
            paymentMethod={paymentMethod}
            isPaid={true}
            notes={notes}
            deliveryFee={deliveryFee}
            discount={discount}
            onOrderTypeChange={handleOrderTypeChange}
            onPaymentMethodChange={handlePaymentMethodChange}
            onPaidStatusChange={() => {}}
            onNotesChange={handleNotesChange}
            onDeliveryFeeChange={handleDeliveryFeeChange}
            onDiscountChange={handleDiscountChange}
          />

          {/* Carrinho/Resumo do Pedido */}
          <PDVCartDisplay
            items={cartItems}
            subtotal={cartTotal}
            deliveryFee={deliveryFee}
            discount={discount}
            total={orderSummary.total}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onUpdateNotes={updateItemNotes}
            onClearCart={clearCart}
          />
        </div>

        {/* Coluna Direita: Menu de Produtos */}
        <div className="overflow-y-auto">
          <PDVProductSelection
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
        </div>
      </div>

      {/* Barra de Ações Inferior */}
      <Card className="sticky bottom-4 shadow-lg border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleResetForm}
                disabled={isSubmitting}
                className="flex items-center gap-2"
                size="lg"
              >
                <RefreshCw className="h-5 w-5" />
                Limpar
              </Button>
              
              <Button
                variant="outline"
                onClick={refreshProducts}
                disabled={isLoadingProducts}
                className="flex items-center gap-2"
                size="lg"
              >
                <RefreshCw className={`h-5 w-5 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            {/* Total e Finalizar */}
            <div className="flex items-center gap-6">
              {hasCartItems && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total do Pedido</p>
                  <p className="text-3xl font-bold text-primary">
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
                className="flex items-center gap-2 min-w-[160px] h-14 text-lg"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Finalizar Pedido
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}