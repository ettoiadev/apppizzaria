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
import { Plus, Trash2, Upload, X, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const [errors, setErrors] = useState<string[]>([])

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
    setErrors([])
  }, [product, open])

  // Cleanup function para URLs de preview
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const processImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Set canvas size to target dimensions
        canvas.width = 433
        canvas.height = 433

        // Calculate scaling and cropping
        const scale = Math.max(433 / img.width, 433 / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale

        // Calculate crop position (center crop)
        const cropX = (scaledWidth - 433) / 2
        const cropY = (scaledHeight - 433) / 2

        // Draw the image
        ctx?.drawImage(img, -cropX, -cropY, scaledWidth, scaledHeight)

        // Convert to blob and then to File
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(processedFile)
            } else {
              reject(new Error("Failed to process image"))
            }
          },
          "image/jpeg",
          0.9,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(["A imagem deve ter no máximo 5MB"])
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(["Apenas arquivos de imagem são permitidos"])
      return
    }

    setIsProcessing(true)
    setErrors([])
    
    try {
      const processedFile = await processImage(file)
      setUploadedImage(processedFile)

      // Cleanup previous preview URL
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(processedFile)
      setImagePreview(previewUrl)

      // Update form data with the processed image
      setFormData((prev) => ({ ...prev, image: previewUrl }))
    } catch (error) {
      console.error("Error processing image:", error)
      setErrors(["Erro ao processar a imagem. Tente novamente."])
    } finally {
      setIsProcessing(false)
    }
  }

  const removeImage = () => {
    // Cleanup preview URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    
    setUploadedImage(null)
    setImagePreview("")
    setFormData((prev) => ({ ...prev, image: "" }))
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.name.trim()) {
      newErrors.push("Nome do produto é obrigatório")
    }

    if (!formData.description.trim()) {
      newErrors.push("Descrição é obrigatória")
    }

    if (formData.price < 0) {
      newErrors.push("Preço deve ser maior ou igual a zero")
    }

    if (!formData.categoryId) {
      newErrors.push("Categoria é obrigatória")
    }

    // Validate sizes
    formData.sizes.forEach((size, index) => {
      if (!size.name.trim()) {
        newErrors.push(`Nome do tamanho ${index + 1} é obrigatório`)
      }
      if (size.price < 0) {
        newErrors.push(`Preço do tamanho ${index + 1} deve ser maior ou igual a zero`)
      }
    })

    // Validate toppings
    formData.toppings.forEach((topping, index) => {
      if (!topping.name.trim()) {
        newErrors.push(`Nome do adicional ${index + 1} é obrigatório`)
      }
      if (topping.price < 0) {
        newErrors.push(`Preço do adicional ${index + 1} deve ser maior ou igual a zero`)
      }
    })

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSave(formData)
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
          {/* Error Display */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preço Base (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
                  required
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
              <Label htmlFor="image">URL da Imagem</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div>
              <Label>Upload de Imagem</Label>
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
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                    disabled={isProcessing}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("product-image-upload")?.click()}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processando..." : imagePreview ? "Alterar Imagem" : "Fazer Upload"}
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Tamanho recomendado: 433x433 pixels • Máximo: 5MB
                  <br />
                  Formatos aceitos: JPG, PNG, WebP
                  <br />
                  Imagens serão redimensionadas automaticamente
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
                    type="number"
                    step="0.01"
                    min="0"
                    value={size.price}
                    onChange={(e) => updateSize(index, "price", Number.parseFloat(e.target.value) || 0)}
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
                    type="number"
                    step="0.01"
                    min="0"
                    value={topping.price}
                    onChange={(e) => updateTopping(index, "price", Number.parseFloat(e.target.value) || 0)}
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
            <Button type="submit" disabled={isProcessing}>
              {product ? "Salvar Alterações" : "Criar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
