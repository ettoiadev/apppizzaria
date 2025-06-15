"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AddressInput } from "@/components/address-input"
import { SmartDeliverySection } from "./smart-delivery-section"

interface FormData {
  name: string
  address: string
  addressData: any // Replace 'any' with a more specific type if possible
}

interface CheckoutFormProps {
  userId: string | null | undefined
}

export function CheckoutForm({ userId }: CheckoutFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    addressData: null,
  })

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Dados de Entrega</h2>
        {userId ? (
          <SmartDeliverySection
            userId={userId}
            onAddressSelect={(addressData) => {
              setFormData((prev) => ({
                ...prev,
                name: addressData.name,
                address: addressData.address,
                addressData: addressData.addressData,
              }))
            }}
            selectedAddress={formData.addressData}
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <AddressInput
              value={formData.addressData}
              onChange={(address) => setFormData((prev) => ({ ...prev, addressData: address }))}
              required
            />
          </div>
        )}
      </div>
    </div>
  )
}
