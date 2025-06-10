"use client"

import { useState } from "react"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { AddressInput } from "@/components/ui/address-input"
import { useToast } from "@/hooks/use-toast"

export default function AccountPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    addressData: user?.addressData || {
      zipCode: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      number: "",
      complement: "",
    },
  })

  const handleSave = async () => {
    try {
      // In production, make API call to update user data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Dados atualizados",
        description: "Suas informações foram atualizadas com sucesso.",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      addressData: user?.addressData || {
        zipCode: "",
        street: "",
        neighborhood: "",
        city: "",
        state: "",
        number: "",
        complement: "",
      },
    })
    setIsEditing(false)
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dados da Conta</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informações Pessoais</CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Editar</Button>
              ) : (
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Salvar</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label>Endereço de Entrega</Label>
              <AddressInput
                value={formData.addressData}
                onChange={(addressData, fullAddress) => setFormData({ ...formData, addressData, address: fullAddress })}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
