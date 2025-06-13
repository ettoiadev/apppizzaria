"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, Upload, X } from "lucide-react"
import type { Product, Category, ProductSize, ProductTopping } from "@/types"
import { debugLog } from "@/lib/debug-utils"

interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Partial<Product> | null
  categories: Category[]
  onSave: () => Promise<void>
}

const initialFormData = {
  name: "",
  description: "",
  price: 0,
  image: "",
  categoryId: "",
  available: true,
  showImage: true,
  sizes: [] as ProductSize[],
  toppings: [] as ProductTopping[],
}

export function ProductModal({ open, onOpenChange, product, categories, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>(initialFormData)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    if (product) {
      setFormData({ ...initialFormData, ...product })
      setImagePreview(product.image || "")
    } else {
      setFormData(initialFormData)
      setImagePreview("")
    }
    setSelectedFile(null)
    setError(null)
    setIsSaving(false)
  }, [product])

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open, resetForm])

  const handleFormChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview("")
    handleFormChange("image", "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    let finalImageUrl = formData.image

    try {
      debugLog.product.saving("Iniciando salvamento")

      if (selectedFile) {
        console.log("📤 Fazendo upload da imagem...")
        const uploadFormData = new FormData()
        uploadFormData.append("file", selectedFile)
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: uploadFormData })

        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json()
          throw new Error(errData.message || "Falha no upload da imagem.")
        }
        const uploadResult = await uploadResponse.json()
        finalImageUrl = uploadResult.url
        console.log("✅ Upload da imagem concluído:", finalImageUrl)
      }

      if (!formData.categoryId) {
        throw new Error("Por favor, selecione uma categoria.")
      }

      const payload = { ...formData, image: finalImageUrl }
      const apiUrl = product?.id ? `/api/products/${product.id}` : "/api/products"
      const apiMethod = product?.id ? "PUT" : "POST"

      debugLog.api.request(apiMethod, apiUrl, payload)

      const response = await fetch(apiUrl, {
        method: apiMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.message || "Falha ao salvar o produto.")
      }

      const savedProduct = await response.json()
      debugLog.product.success("Produto salvo", savedProduct)

      // Aguardar a atualização da lista antes de fechar o modal
      console.log("🔄 Atualizando lista de produtos...")
      await onSave()
      debugLog.product.success("Lista atualizada")

      // Fechar modal apenas após tudo estar concluído
      onOpenChange(false)
      console.log("🎉 Modal fechado - processo concluído!")
    } catch (err: any) {
      console.error("❌ Erro ao salvar produto:", err)
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Funções para gerenciar Tamanhos e Adicionais
  const addDynamicListItem = (listName: "sizes" | "toppings") => {
    handleFormChange(listName, [...(formData[listName] || []), { name: "", price: 0 }])
  }
  const updateDynamicListItem = (
    listName: "sizes" | "toppings",
    index: number,
    field: string,
    value: string | number,
  ) => {
    const list = (formData[listName] || []).map((item, i) => (i === index ? { ...item, [field]: value } : item))
    handleFormChange(listName, list)
  }
  const removeDynamicListItem = (listName: "sizes" | "toppings", index: number) => {
    const list = (formData[listName] || []).filter((_, i) => i !== index)
    handleFormChange(listName, list)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleFormChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleFormChange("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preço Base (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || 0}
                  onChange={(e) => handleFormChange("price", Number.parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleFormChange("categoryId", value)}
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
              <Label>Upload de Imagem</Label>
              <div className="space-y-2">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
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
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="product-image-upload"
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("product-image-upload")?.click()}
                    disabled={isSaving}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isSaving ? "Processando..." : imagePreview ? "Alterar Imagem" : "Fazer Upload"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Tamanho recomendado: 433x433 pixels.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => handleFormChange("available", checked)}
              />
              <Label htmlFor="available">Produto disponível</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="showImage"
                checked={formData.showImage}
                onCheckedChange={(checked) => handleFormChange("showImage", checked)}
              />
              <Label htmlFor="showImage">Exibir imagem do produto</Label>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Tamanhos (Opcional)</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => addDynamicListItem("sizes")}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Tamanho
              </Button>
            </div>
            {formData.sizes?.map((size, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Nome (Ex: Grande)"
                  value={size.name}
                  onChange={(e) => updateDynamicListItem("sizes", index, "name", e.target.value)}
                />
                <Input
                  placeholder="Preço"
                  type="number"
                  step="0.01"
                  min="0"
                  value={size.price}
                  onChange={(e) => updateDynamicListItem("sizes", index, "price", Number(e.target.value))}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeDynamicListItem("sizes", index)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Adicionais (Opcional)</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => addDynamicListItem("toppings")}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Adicional
              </Button>
            </div>
            {formData.toppings?.map((topping, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Nome (Ex: Queijo Extra)"
                  value={topping.name}
                  onChange={(e) => updateDynamicListItem("toppings", index, "name", e.target.value)}
                />
                <Input
                  placeholder="Preço"
                  type="number"
                  step="0.01"
                  min="0"
                  value={topping.price}
                  onChange={(e) => updateDynamicListItem("toppings", index, "price", Number(e.target.value))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDynamicListItem("toppings", index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {error && <p className="text-sm font-medium text-destructive text-center pt-2">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : product ? "Salvar Alterações" : "Criar Produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
