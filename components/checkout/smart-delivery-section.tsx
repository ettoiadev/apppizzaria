"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AddressInput } from "@/components/ui/address-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MapPin, Plus, ArrowLeft, Check, Edit3, Home, Loader2 } from "lucide-react"

interface Address {
  id: string
  name: string
  zip_code: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  is_default: boolean
}

interface SmartDeliverySectionProps {
  userId: string
  onAddressSelect: (address: any) => void
  selectedAddress?: any
}

type ViewMode = "loading" | "default" | "list" | "form"

export function SmartDeliverySection({ userId, onAddressSelect, selectedAddress }: SmartDeliverySectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("loading")
  const [addresses, setAddresses] = useState<Address[]>([])
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: {
      zipCode: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      number: "",
      complement: "",
    },
    setAsDefault: false,
  })

  useEffect(() => {
    console.log("SmartDeliverySection mounted with userId:", userId)
    if (userId) {
      loadAddresses()
    } else {
      console.log("No userId provided, showing form")
      setViewMode("form")
      setIsLoading(false)
    }
  }, [userId])

  const loadAddresses = async () => {
    setIsLoading(true)
    console.log("Loading addresses for userId:", userId)

    try {
      const response = await fetch(`/api/addresses?userId=${userId}`)
      console.log("API response status:", response.status)

      if (!response.ok) {
        console.error("Failed to fetch addresses:", response.status, response.statusText)
        setViewMode("form")
        return
      }

      const data = await response.json()
      console.log("API response data:", data)

      if (data.addresses && Array.isArray(data.addresses)) {
        setAddresses(data.addresses)
        const defaultAddr = data.addresses.find((addr: Address) => addr.is_default)
        console.log("Default address found:", defaultAddr)

        if (defaultAddr) {
          setDefaultAddress(defaultAddr)
          setViewMode("default")
          // Auto-select default address
          onAddressSelect({
            name: defaultAddr.name,
            address: formatAddressString(defaultAddr),
            addressData: {
              zipCode: defaultAddr.zip_code,
              street: defaultAddr.street,
              number: defaultAddr.number,
              complement: defaultAddr.complement || "",
              neighborhood: defaultAddr.neighborhood,
              city: defaultAddr.city,
              state: defaultAddr.state,
            },
          })
        } else if (data.addresses.length > 0) {
          console.log("No default address, showing list")
          setViewMode("list")
        } else {
          console.log("No addresses found, showing form")
          setViewMode("form")
        }
      } else {
        console.log("No addresses in response, showing form")
        setViewMode("form")
      }
    } catch (error) {
      console.error("Error loading addresses:", error)
      setViewMode("form")
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddressString = (address: Address) => {
    return `${address.street}, ${address.number}${
      address.complement ? `, ${address.complement}` : ""
    } - ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.zip_code}`
  }

  const handleAddressSelect = (address: Address) => {
    onAddressSelect({
      name: address.name,
      address: formatAddressString(address),
      addressData: {
        zipCode: address.zip_code,
        street: address.street,
        number: address.number,
        complement: address.complement || "",
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      },
    })
    setViewMode("default")
    setDefaultAddress(address)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: userId,
          name: formData.name || "Endereço Principal",
          zipCode: formData.address.zipCode,
          street: formData.address.street,
          number: formData.address.number,
          complement: formData.address.complement,
          neighborhood: formData.address.neighborhood,
          city: formData.address.city,
          state: formData.address.state,
          isDefault: formData.setAsDefault,
        }),
      })

      if (response.ok) {
        const { address } = await response.json()

        // Update local state
        setAddresses((prev) => [address, ...prev])

        // Select the new address
        onAddressSelect({
          name: formData.name || "Endereço Principal",
          address: `${formData.address.street}, ${formData.address.number}${
            formData.address.complement ? `, ${formData.address.complement}` : ""
          } - ${formData.address.neighborhood}, ${formData.address.city}/${formData.address.state} - CEP: ${formData.address.zipCode}`,
          addressData: formData.address,
        })

        if (formData.setAsDefault) {
          setDefaultAddress(address)
        }

        setViewMode("default")

        // Reset form
        setFormData({
          name: "",
          address: {
            zipCode: "",
            street: "",
            neighborhood: "",
            city: "",
            state: "",
            number: "",
            complement: "",
          },
          setAsDefault: false,
        })
      }
    } catch (error) {
      console.error("Error saving address:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (address: any) => {
    setFormData((prev) => ({ ...prev, address }))
  }

  if (viewMode === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Carregando seus endereços...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "default" && defaultAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">{defaultAddress.name}</span>
                {defaultAddress.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    Padrão
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{formatAddressString(defaultAddress)}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" size="lg">
              <Check className="w-4 h-4 mr-2" />
              Confirmar Endereço
            </Button>
            <Button variant="outline" onClick={() => setViewMode("list")} className="flex-1 sm:flex-none">
              <Edit3 className="w-4 h-4 mr-2" />
              Trocar Endereço
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "list") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Escolher Endereço de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="ghost" onClick={() => setViewMode("default")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleAddressSelect(address)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{address.name}</span>
                    {address.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Padrão
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{formatAddressString(address)}</p>
              </div>
            ))}
          </div>

          <Separator />

          <Button variant="outline" onClick={() => setViewMode("form")} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo Endereço
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {addresses.length > 0 ? "Adicionar Novo Endereço" : "Dados de Entrega"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {addresses.length > 0 && (
          <Button variant="ghost" onClick={() => setViewMode("list")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Endereços Salvos
          </Button>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressName">Nome do Endereço</Label>
              <Input
                id="addressName"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Casa, Trabalho, Apartamento..."
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Endereço Completo</h3>
              <AddressInput value={formData.address} onChange={handleAddressChange} required />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="setAsDefault"
                checked={formData.setAsDefault}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, setAsDefault: !!checked }))}
              />
              <Label htmlFor="setAsDefault" className="text-sm">
                Definir como endereço padrão
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando Endereço...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salvar e Usar Este Endereço
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
