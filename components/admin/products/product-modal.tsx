"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Upload, X } from "lucide-react"
import type { Product, Category, ProductSize, ProductTopping } from "@/types"

interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]
  onSave: (product: Partial<Product>) => void
}

export function ProductModal({ open, onOpenChange, product, categories, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    image: "",
    categoryId: "",
    available: true,
    showImage: true,
    sizes: [] as ProductSize[],
    toppings: [] as ProductTopping[],
  })
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        categoryId: product.categoryId,
        available: product.available,
        showImage: product.showImage ?? true,
        sizes: product.sizes || [],
        toppings: product.toppings || [],
      })
      setImagePreview(product.image)
      setUploadedImage(null)
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        image: "",
        categoryId: "",
        available: true,
        showImage: true,
        sizes: [],
        toppings: [],
      })
      setImagePreview("")
      setUploadedImage(null)
    }
    setError(null)
  }, [product, open])

  // Handle price input change - allow comma as decimal separator
  const handlePriceChange = (value: string): number => {
    // Replace comma with period for internal storage
    const sanitizedValue = value.replace(",", ".")
    return Number.parseFloat(sanitizedValue) || 0
  }

  // Format price for display - show with comma as decimal separator
  const formatPriceForDisplay = (price: number | string): string => {
    if (typeof price === "string") {
      return price
    }
    return price.toString().replace(".", ",")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setUploadedImage(file)
  }

  const removeImage = () => {
    setUploadedImage(null)
    setImagePreview("")
    setFormData((prev) => ({ ...prev, image: "" }))
  }

  // Upload image to our backend API
  const uploadImageToServer = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true)
      setError(null)

      // Create form data for the file upload
      const formData = new FormData()
      formData.append("file", file)

      console.log("Uploading file:", file.name, file.type, file.size)

      // Send the file to our upload API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload image")
      }

      // Get the URL from the response
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error uploading image:", error)
      setError(error instanceof Error ? error.message : "Failed to upload image")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      setIsUploading(true)

      // Create a copy of formData for submission
      const dataToSubmit = { ...formData }

      // Step 1: Handle image upload if a new file is selected
      if (uploadedImage) {
        const imageUrl = await uploadImageToServer(uploadedImage)

        if (imageUrl) {
          // Update the image URL in the data to submit
          dataToSubmit.image = imageUrl
        } else {
          // If upload failed, keep the existing image URL if editing
          if (product && product.image) {
            dataToSubmit.image = product.image
          } else {
            // For new products, use a placeholder if upload failed
            dataToSubmit.image = "/placeholder.svg"
          }
        }
      } else if (product && product.image && !dataToSubmit.image) {
        // If editing and no new image was uploaded, preserve the existing image
        dataToSubmit.image = product.image
      }

      // Step 2: Format price values - convert comma decimal separators to periods
      const formatPrice = (price: string | number): number => {
        return Number.parseFloat(String(price).replace(",", "."))
      }

      // Format the main product price
      dataToSubmit.price = formatPrice(dataToSubmit.price)

      // Format prices in sizes array if they exist
      if (dataToSubmit.sizes && dataToSubmit.sizes.length > 0) {
        dataToSubmit.sizes = dataToSubmit.sizes.map((size) => ({
          ...size,
          price: formatPrice(size.price),
        }))
      }

      // Format prices in toppings array if they exist
      if (dataToSubmit.toppings && dataToSubmit.toppings.length > 0) {
        dataToSubmit.toppings = dataToSubmit.toppings.map((topping) => ({
          ...topping,
          price: formatPrice(topping.price),
        }))
      }

      // Step 3: Call onSave with the data including the image URL and formatted prices
      onSave(dataToSubmit)
    } catch (error) {
      console.error("Error during form submission:", error)
      setError(error instanceof Error ? error.message : "Failed to save product")
    } finally {
      setIsUploading(false)
    }
  }

  const addSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { name: "", price: 0 }],
    }))
  }

  const updateSize = (index: number, field: keyof ProductSize, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => (i === index ? { ...size, [field]: value } : size)),
    }))
  }

  const removeSize = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
  }

  const addTopping = () => {
    setFormData((prev) => ({
      ...prev,
      toppings: [...prev.toppings, { name: "", price: 0 }],
    }))
  }

  const updateTopping = (index: number, field: keyof ProductTopping, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      toppings: prev.toppings.map((topping, i) => (i === index ? { ...topping, [field]: value } : topping)),
    }))
  }

  const removeTopping = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      toppings: prev.toppings.filter((_, i) => i !== index),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preço Base (R$)</Label>
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  value={formatPriceForDisplay(formData.price)}
                  onChange={(e) => {
                    const numericValue = handlePriceChange(e.target.value)
                    setFormData((prev) => ({ ...prev, price: numericValue }))
                  }}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Imagem do Produto</Label>
              <div className="space-y-2">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Nenhuma imagem selecionada</p>
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.avif"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("product-image-upload")?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {imagePreview ? "Alterar Imagem" : "Fazer Upload"}
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Formatos aceitos: JPG, PNG, WebP, GIF, AVIF
                  <br />
                  Tamanho máximo: 5MB
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.available}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, available: checked }))}
              />
              <Label>Produto disponível</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.showImage}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, showImage: checked }))}
              />
              <Label>Exibir imagem do produto</Label>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Tamanhos (Opcional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSize}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Tamanho
              </Button>
            </div>

            {formData.sizes.map((size, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Nome do Tamanho</Label>
                  <Input
                    value={size.name}
                    onChange={(e) => updateSize(index, "name", e.target.value)}
                    placeholder="Ex: Pequena, Média, Grande"
                  />
                </div>
                <div className="flex-1">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formatPriceForDisplay(size.price)}
                    onChange={(e) => {
                      const numericValue = handlePriceChange(e.target.value)
                      updateSize(index, "price", numericValue)
                    }}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => removeSize(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Toppings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Adicionais (Opcional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTopping}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Adicional
              </Button>
            </div>

            {formData.toppings.map((topping, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Nome do Adicional</Label>
                  <Input
                    value={topping.name}
                    onChange={(e) => updateTopping(index, "name", e.target.value)}
                    placeholder="Ex: Queijo Extra, Azeitona"
                  />
                </div>
                <div className="flex-1">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formatPriceForDisplay(topping.price)}
                    onChange={(e) => {
                      const numericValue = handlePriceChange(e.target.value)
                      updateTopping(index, "price", numericValue)
                    }}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => removeTopping(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Enviando..." : product ? "Salvar Alterações" : "Criar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
