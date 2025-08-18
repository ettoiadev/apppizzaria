'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Search, Plus, Check, X, Phone, Mail, MapPin } from 'lucide-react'
import { formatPhone } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string
}

interface PDVCustomerFormProps {
  selectedCustomer: Customer | null
  searchTerm: string
  searchResults: Customer[]
  isSearching: boolean
  isCreatingCustomer: boolean
  newCustomer: {
    name: string
    phone: string
    email: string
    address: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
  }
  onSearchChange: (term: string) => void
  onSelectCustomer: (customer: Customer) => void
  onClearCustomer: () => void
  onNewCustomerChange: (field: string, value: string) => void
  onCreateCustomer: () => void
  onToggleCreateMode: () => void
}

export function PDVCustomerForm({
  selectedCustomer,
  searchTerm,
  searchResults,
  isSearching,
  isCreatingCustomer,
  newCustomer,
  onSearchChange,
  onSelectCustomer,
  onClearCustomer,
  onNewCustomerChange,
  onCreateCustomer,
  onToggleCreateMode
}: PDVCustomerFormProps) {
  const [showCreateForm, setShowCreateForm] = React.useState(false)

  const handleToggleCreateForm = () => {
    setShowCreateForm(!showCreateForm)
    onToggleCreateMode()
  }

  const handleCreateCustomer = () => {
    onCreateCustomer()
    setShowCreateForm(false)
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Cliente
          {selectedCustomer && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Selecionado
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cliente Selecionado */}
        {selectedCustomer ? (
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{selectedCustomer.name}</h4>
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span>{formatPhone(selectedCustomer.phone)}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {selectedCustomer.address}
                        {selectedCustomer.neighborhood && `, ${selectedCustomer.neighborhood}`}
                        {selectedCustomer.city && `, ${selectedCustomer.city}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearCustomer}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Busca de Cliente */}
            {!showCreateForm && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>

                {/* Resultados da Busca */}
                {searchTerm && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">Buscando...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-center py-4">
                        <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Nenhum cliente encontrado</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleCreateForm}
                          className="mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Criar novo cliente
                        </Button>
                      </div>
                    ) : (
                      searchResults.map((customer) => (
                        <div
                          key={customer.id}
                          className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => onSelectCustomer(customer)}
                        >
                          <h4 className="font-medium text-gray-900">{customer.name}</h4>
                          <p className="text-sm text-gray-600">
                            {formatPhone(customer.phone)}
                          </p>
                          {customer.email && (
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Botão Criar Novo Cliente */}
                {!searchTerm && (
                  <Button
                    variant="outline"
                    onClick={handleToggleCreateForm}
                    className="w-full h-12"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Novo Cliente
                  </Button>
                )}
              </div>
            )}

            {/* Formulário de Novo Cliente */}
            {showCreateForm && (
              <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Novo Cliente</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleCreateForm}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nome *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Nome completo"
                      value={newCustomer.name}
                      onChange={(e) => onNewCustomerChange('name', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={newCustomer.phone}
                      onChange={(e) => onNewCustomerChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newCustomer.email}
                      onChange={(e) => onNewCustomerChange('email', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">
                      Endereço
                    </Label>
                    <Input
                      id="address"
                      placeholder="Rua, número"
                      value={newCustomer.address}
                      onChange={(e) => onNewCustomerChange('address', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="neighborhood" className="text-sm font-medium">
                        Bairro
                      </Label>
                      <Input
                        id="neighborhood"
                        placeholder="Bairro"
                        value={newCustomer.neighborhood}
                        onChange={(e) => onNewCustomerChange('neighborhood', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium">
                        Cidade
                      </Label>
                      <Input
                        id="city"
                        placeholder="Cidade"
                        value={newCustomer.city}
                        onChange={(e) => onNewCustomerChange('city', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="state" className="text-sm font-medium">
                        Estado
                      </Label>
                      <Input
                        id="state"
                        placeholder="SP"
                        value={newCustomer.state}
                        onChange={(e) => onNewCustomerChange('state', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip_code" className="text-sm font-medium">
                        CEP
                      </Label>
                      <Input
                        id="zip_code"
                        placeholder="00000-000"
                        value={newCustomer.zip_code}
                        onChange={(e) => onNewCustomerChange('zip_code', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleCreateCustomer}
                    disabled={isCreatingCustomer || !newCustomer.name || !newCustomer.phone}
                    className="flex-1"
                  >
                    {isCreatingCustomer ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Criar Cliente
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleToggleCreateForm}
                    disabled={isCreatingCustomer}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}