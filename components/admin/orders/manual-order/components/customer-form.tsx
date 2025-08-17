import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, MapPin, Plus, Check } from 'lucide-react';
import { Customer, CustomerAddress } from '../types';

interface CustomerFormProps {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: CustomerAddress;
  customerSuggestions: Customer[];
  showCustomerSuggestions: boolean;
  isSearchingCustomers: boolean;
  selectedCustomer: Customer | null;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onCustomerEmailChange: (value: string) => void;
  onAddressChange: (field: keyof CustomerAddress, value: string) => void;
  onZipCodeChange: (value: string) => void;
  onCustomerSelect: (customer: Customer) => void;
  onNewCustomer: () => void;
  onHideSuggestions: () => void;
  isValid: boolean;
}

export function CustomerForm({
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  customerSuggestions,
  showCustomerSuggestions,
  isSearchingCustomers,
  selectedCustomer,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCustomerEmailChange,
  onAddressChange,
  onZipCodeChange,
  onCustomerSelect,
  onNewCustomer,
  onHideSuggestions,
  isValid
}: CustomerFormProps) {
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Cliente
            {isValid && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Válido
              </Badge>
            )}
          </CardTitle>
          {selectedCustomer && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewCustomer}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Search/Selection */}
        <div className="space-y-2">
          <Label htmlFor="customerName">Nome do Cliente *</Label>
          <div className="relative">
            <Input
              id="customerName"
              placeholder="Digite o nome do cliente"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              className={selectedCustomer ? 'bg-green-50 border-green-200' : ''}
            />
            {isSearchingCustomers && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
            
            {/* Customer Suggestions */}
            {showCustomerSuggestions && customerSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {customerSuggestions.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => onCustomerSelect(customer)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                    {customer.email && (
                      <div className="text-xs text-gray-400">{customer.email}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCustomer && (
            <p className="text-xs text-green-600">
              Cliente existente selecionado
            </p>
          )}
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Telefone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="customerPhone"
                placeholder="(11) 99999-9999"
                value={formatPhone(customerPhone)}
                onChange={(e) => onCustomerPhoneChange(e.target.value.replace(/\D/g, ''))}
                className="pl-10"
                maxLength={15}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customerEmail">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="customerEmail"
                type="email"
                placeholder="cliente@email.com"
                value={customerEmail}
                onChange={(e) => onCustomerEmailChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <Label className="text-sm font-medium">Endereço de Entrega *</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP *</Label>
              <Input
                id="zipCode"
                placeholder="00000-000"
                value={formatZipCode(customerAddress.zipCode)}
                onChange={(e) => onZipCodeChange(e.target.value.replace(/\D/g, ''))}
                maxLength={9}
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                placeholder="Nome da rua"
                value={customerAddress.street}
                onChange={(e) => onAddressChange('street', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                placeholder="123"
                value={customerAddress.number}
                onChange={(e) => onAddressChange('number', e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                placeholder="Apto, bloco, etc."
                value={customerAddress.complement}
                onChange={(e) => onAddressChange('complement', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                placeholder="Nome do bairro"
                value={customerAddress.neighborhood}
                onChange={(e) => onAddressChange('neighborhood', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                placeholder="Nome da cidade"
                value={customerAddress.city}
                onChange={(e) => onAddressChange('city', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                placeholder="SP"
                value={customerAddress.state}
                onChange={(e) => onAddressChange('state', e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          * Campos obrigatórios
        </div>
      </CardContent>
    </Card>
  );
}