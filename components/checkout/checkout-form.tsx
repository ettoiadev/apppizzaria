"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddressInput } from "@/components/ui/address-input"
import { CreditCard, Banknote, QrCode, Upload } from "lucide-react"

interface CheckoutFormProps {
  onSubmit: (data: any) => void
  isLoading: boolean
}

export function CheckoutForm({ onSubmit, isLoading }: CheckoutFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: {
      zipCode: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      number: "",
      complement: "",
    },
    paymentMethod: "pix",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Format address for submission
    const fullAddress = `${formData.address.street}, ${formData.address.number}${
      formData.address.complement ? `, ${formData.address.complement}` : ""
    } - ${formData.address.neighborhood}, ${formData.address.city}/${formData.address.state} - CEP: ${
      formData.address.zipCode
    }`

    onSubmit({
      ...formData,
      address: fullAddress,
      addressData: formData.address, // Keep structured address data
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (address: any) => {
    setFormData((prev) => ({ ...prev, address }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Endereço de Entrega</h3>
            <AddressInput value={formData.address} onChange={handleAddressChange} required />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value) => handleInputChange("paymentMethod", value)}
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                <QrCode className="w-5 h-5" />
                <div>
                  <div className="font-semibold">PIX</div>
                  <div className="text-sm text-gray-600">Pagamento instantâneo</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Cartão na Entrega</div>
                  <div className="text-sm text-gray-600">Débito ou crédito</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                <Banknote className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Dinheiro na Entrega</div>
                  <div className="text-sm text-gray-600">Pagamento em espécie</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {formData.paymentMethod === "pix" && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                Após confirmar o pedido, você receberá o QR Code para pagamento via PIX.
              </p>
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Você poderá enviar o comprovante após o pagamento</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Alguma observação sobre seu pedido?"
          />
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Processando..." : "Confirmar Pedido"}
      </Button>
    </form>
  )
}
