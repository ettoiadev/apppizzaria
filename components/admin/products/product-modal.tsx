"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
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
  product: Partial<Product> | null
  categories: Category[]
  onSave: () => Promise<void>
}

export function ProductModal({ open, onOpenChange, product, categories, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use useCallback to memoize the reset function
  const resetForm = useCallback(() => {
    if (product) {
      setFormData({
        ...product,
        price: product.price || 0,
        sizes: product.sizes || [],
        toppings: product.toppings || [],
      });
      setImagePreview(product.image || "");
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
      });
      setImagePreview("");
    }
    setSelectedFile(null);
    setError(null);
    setIsSaving(false);
  }, [product]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [product, open, resetForm]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFloat(value);
    setFormData(prev => ({ ...prev, price: isNaN(numericValue) ? 0 : numericValue }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setFormData(prev => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    let finalImageUrl = product?.image && !selectedFile ? product.image : formData.image;

    try {
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
        if (!uploadResponse.ok) throw new Error('Falha no upload da imagem.');
        const uploadResult = await uploadResponse.json();
        finalImageUrl = uploadResult.url;
      }
      
      if (!formData.categoryId) throw new Error('Por favor, selecione uma categoria.');

      const productPayload = { ...formData, image: finalImageUrl };
      
      const apiUrl = product?.id ? `/api/products/${product.id}` : '/api/products';
      const apiMethod = product?.id ? 'PUT' : 'POST';

      const productResponse = await fetch(apiUrl, {
        method: apiMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      });

      if (!productResponse.ok) {
        const errorResult = await productResponse.json();
        throw new Error(errorResult.message || 'Falha ao salvar o produto.');
      }

      await onSave();
      onOpenChange(false);

    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDynamicListChange = (listName: 'sizes' | 'toppings', index: number, field: string, value: string | number) => {
    const list = formData[listName] as any[];
    const updatedList = list.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setFormData(prev => ({...prev, [listName]: updatedList}));
  }

  const addDynamicListItem = (listName: 'sizes' | 'toppings') => {
    const list = formData[listName] as any[];
    setFormData(prev => ({...prev, [listName]: [...list, {name: '', price: 0}]}));
  }

  const removeDynamicListItem = (listName: 'sizes' | 'toppings', index: number) => {
    const list = formData[listName] as any[];
    setFormData(prev => ({...prev, [listName]: list.filter((_, i) => i !== index)}));
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
              <Input id="name" value={formData.name || ''} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description || ''} onChange={handleInputChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preço Base (R$)</Label>
                <Input id="price" type="number" step="0.01" min="0" value={formData.price || 0} onChange={handlePriceChange} required />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))} required>
                  <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
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
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded border" />
                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
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
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="product-image-upload" disabled={isSaving} />
                  <Button type="button" variant="outline" onClick={() => document.getElementById("product-image-upload")?.click()} disabled={isSaving} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {isSaving ? "Processando..." : imagePreview ? "Alterar Imagem" : "Fazer Upload"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Imagens serão redimensionadas automaticamente.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={formData.available} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, available: checked }))} />
              <Label>Produto disponível</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={formData.showImage} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, showImage: checked }))} />
              <Label>Exibir imagem do produto</Label>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Tamanhos (Opcional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addDynamicListItem('sizes')}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Tamanho
              </Button>
            </div>
            {formData.sizes?.map((size, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1"><Label>Nome</Label><Input value={size.name} onChange={(e) => handleDynamicListChange('sizes', index, "name", e.target.value)} /></div>
                <div className="w-28"><Label>Preço (R$)</Label><Input type="number" step="0.01" min="0" value={size.price} onChange={(e) => handleDynamicListChange('sizes', index, "price", Number(e.target.value))} /></div>
                <Button type="button" variant="outline" size="icon" onClick={() => removeDynamicListItem('sizes', index)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>

          {/* Toppings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Adicionais (Opcional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addDynamicListItem('toppings')}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Adicional
              </Button>
            </div>
            {formData.toppings?.map((topping, index) => (
              <div key={index} className="flex gap-2 items-end">
                 <div className="flex-1"><Label>Nome</Label><Input value={topping.name} onChange={(e) => handleDynamicListChange('toppings', index, "name", e.target.value)} /></div>
                <div className="w-28"><Label>Preço (R$)</Label><Input type="number" step="0.01" min="0" value={topping.price} onChange={(e) => handleDynamicListChange('toppings', index, "price", Number(e.target.value))} /></div>
                <Button type="button" variant="outline" size="icon" onClick={() => removeDynamicListItem('toppings', index)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
          
          {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : product ? "Salvar Alterações" : "Criar Produto"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}