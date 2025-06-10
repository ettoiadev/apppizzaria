"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Upload, Save, MapPin, Phone, Mail, Clock, X, Zap, Truck } from "lucide-react"

export function GeneralSettings() {
  const [settings, setSettings] = useState({
    companyName: "Pizza Express",
    description: "A melhor pizza da cidade, entregue na sua porta",
    address: "Rua das Pizzas, 123 - Centro, São Paulo/SP",
    phone: "(11) 99999-9999",
    email: "contato@pizzaexpress.com",
    website: "www.pizzaexpress.com",
    openingHours: "18:00",
    closingHours: "23:00",
    isOpen: true,
    acceptOrders: true,
    minimumOrderValue: 25.0,
    logo: null as File | null,
    // Landing page hero image
    heroImage: null as File | null,
    // Feature boxes
    fastDeliveryEnabled: true,
    fastDeliveryTitle: "Super Rápido",
    fastDeliverySubtext: "Entrega expressa em até 30 minutos ou sua pizza é grátis",
    freeDeliveryEnabled: true,
    freeDeliveryTitle: "Frete Grátis",
    freeDeliverySubtext: "Entrega gratuita para pedidos acima de R$ 50,00",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingHeroImage, setIsProcessingHeroImage] = useState(false)

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSettings((prev) => ({ ...prev, logo: file }))
    }
  }

  const processImage = async (file: File, targetWidth: number, targetHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }

          canvas.width = targetWidth
          canvas.height = targetHeight

          // Calculate dimensions for center cropping
          const sourceAspectRatio = img.width / img.height
          const targetAspectRatio = targetWidth / targetHeight

          let sourceWidth, sourceHeight, sourceX, sourceY

          if (sourceAspectRatio > targetAspectRatio) {
            // Image is wider than target, crop width
            sourceHeight = img.height
            sourceWidth = img.height * targetAspectRatio
            sourceX = (img.width - sourceWidth) / 2
            sourceY = 0
          } else {
            // Image is taller than target, crop height
            sourceWidth = img.width
            sourceHeight = img.width / targetAspectRatio
            sourceX = 0
            sourceY = (img.height - sourceHeight) / 2
          }

          // Draw the cropped and resized image
          ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
                resolve(processedFile)
              } else {
                reject(new Error("Could not process image"))
              }
            },
            "image/jpeg",
            0.9,
          )
        }
        img.onerror = () => reject(new Error("Could not load image"))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error("Could not read file"))
      reader.readAsDataURL(file)
    })
  }

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsProcessingHeroImage(true)
      try {
        // Process image to 800x600 for hero section
        const processedFile = await processImage(file, 660, 660)
        setSettings((prev) => ({ ...prev, heroImage: processedFile }))
      } catch (error) {
        console.error("Error processing hero image:", error)
      } finally {
        setIsProcessingHeroImage(false)
      }
    }
  }

  const removeHeroImage = () => {
    setSettings((prev) => ({ ...prev, heroImage: null }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Saving general settings:", settings)
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                {settings.logo ? (
                  <img
                    src={URL.createObjectURL(settings.logo) || "/placeholder.svg"}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <input type="file" id="logo" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <Button variant="outline" onClick={() => document.getElementById("logo")?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer Upload
                </Button>
                <p className="text-sm text-gray-600 mt-1">PNG, JPG até 2MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroImage">Imagem Principal da Landing Page</Label>
            <div className="space-y-3">
              {settings.heroImage && (
                <div className="relative w-full max-w-md">
                  <img
                    src={URL.createObjectURL(settings.heroImage) || "/placeholder.svg"}
                    alt="Hero"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeHeroImage}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="heroImage"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleHeroImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("heroImage")?.click()}
                  disabled={isProcessingHeroImage}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessingHeroImage ? "Processando..." : settings.heroImage ? "Alterar Imagem" : "Fazer Upload"}
                </Button>
                <p className="text-sm text-gray-600 mt-1">
                  Tamanho recomendado: 660x660 pixels
                  <br />
                  Imagens serão redimensionadas automaticamente
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </Label>
            <Textarea
              id="address"
              value={settings.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input id="phone" value={settings.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openingHours" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário de Abertura
              </Label>
              <Input
                id="openingHours"
                type="time"
                value={settings.openingHours}
                onChange={(e) => handleInputChange("openingHours", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingHours" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário de Fechamento
              </Label>
              <Input
                id="closingHours"
                type="time"
                value={settings.closingHours}
                onChange={(e) => handleInputChange("closingHours", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isOpen">Estabelecimento Aberto</Label>
                <p className="text-sm text-gray-600">Permite que clientes vejam o cardápio e façam pedidos</p>
              </div>
              <Switch
                id="isOpen"
                checked={settings.isOpen}
                onCheckedChange={(checked) => handleInputChange("isOpen", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="acceptOrders">Aceitar Novos Pedidos</Label>
                <p className="text-sm text-gray-600">Permite que novos pedidos sejam feitos</p>
              </div>
              <Switch
                id="acceptOrders"
                checked={settings.acceptOrders}
                onCheckedChange={(checked) => handleInputChange("acceptOrders", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minimumOrderValue">Valor Mínimo do Pedido (R$)</Label>
            <Input
              id="minimumOrderValue"
              type="number"
              step="0.01"
              value={settings.minimumOrderValue}
              onChange={(e) => handleInputChange("minimumOrderValue", Number.parseFloat(e.target.value))}
            />
            <p className="text-sm text-gray-600">Valor mínimo para aceitar pedidos</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caixas de Destaque da Landing Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fast Delivery Feature Box */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Entrega Rápida</h4>
              </div>
              <Switch
                checked={settings.fastDeliveryEnabled}
                onCheckedChange={(checked) => handleInputChange("fastDeliveryEnabled", checked)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fastDeliveryTitle">Título</Label>
                <Input
                  id="fastDeliveryTitle"
                  value={settings.fastDeliveryTitle}
                  onChange={(e) => handleInputChange("fastDeliveryTitle", e.target.value)}
                  disabled={!settings.fastDeliveryEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fastDeliverySubtext">Subtexto</Label>
                <Textarea
                  id="fastDeliverySubtext"
                  value={settings.fastDeliverySubtext}
                  onChange={(e) => handleInputChange("fastDeliverySubtext", e.target.value)}
                  disabled={!settings.fastDeliveryEnabled}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Free Delivery Feature Box */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Frete Grátis</h4>
              </div>
              <Switch
                checked={settings.freeDeliveryEnabled}
                onCheckedChange={(checked) => handleInputChange("freeDeliveryEnabled", checked)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="freeDeliveryTitle">Título</Label>
                <Input
                  id="freeDeliveryTitle"
                  value={settings.freeDeliveryTitle}
                  onChange={(e) => handleInputChange("freeDeliveryTitle", e.target.value)}
                  disabled={!settings.freeDeliveryEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeDeliverySubtext">Subtexto</Label>
                <Textarea
                  id="freeDeliverySubtext"
                  value={settings.freeDeliverySubtext}
                  onChange={(e) => handleInputChange("freeDeliverySubtext", e.target.value)}
                  disabled={!settings.freeDeliveryEnabled}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
