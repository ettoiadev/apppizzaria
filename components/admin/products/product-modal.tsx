// Arquivo: /components/admin/products/product-modal.tsx
"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Upload, X } from "lucide-react";
import type { Product, Category, ProductSize, ProductTopping } from "@/types";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Partial<Product> | null;
  categories: Category[];
  onSave: () => Promise<void>;
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
};

export function ProductModal({ open, onOpenChange, product, categories, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>(initialFormData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    if (product) {
      setFormData({ ...initialFormData, ...product });
      setImagePreview(product.image || "");
    } else {
      setFormData(initialFormData);
      setImagePreview("");
    }
    setSelectedFile(null);
    setError(null);
    setIsSaving(false);
  }, [product]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);
  
  const handleFormChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  
  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    handleFormChange('image', '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    let finalImageUrl = formData.image;

    try {
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: uploadFormData });

        if (!uploadResponse.ok) {
          const errData = await uploadResponse.json();
          throw new Error(errData.message || 'Falha no upload da imagem.');
        }
        const uploadResult = await uploadResponse.json();
        finalImageUrl = uploadResult.url;
      }
      
      if (!formData.categoryId) throw new Error('Por favor, selecione uma categoria.');

      const payload = { ...formData, image: finalImageUrl };
      const apiUrl = product?.id ? `/api/products/${product.id}` : '/api/products';
      const apiMethod = product?.id ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method: apiMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Falha ao salvar o produto.');
      }
      
      await onSave();
      onOpenChange(false);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Funções para gerenciar listas dinâmicas (Tamanhos e Adicionais)
  const addDynamicListItem = (listName: 'sizes' | 'toppings') => {
    handleFormChange(listName, [...(formData[listName] || []), { name: "", price: 0 }]);
  };
  const updateDynamicListItem = (listName: 'sizes' | 'toppings', index: number, field: string, value: string | number) => {
    const list = (formData[listName] || []).map((item, i) => i === index ? { ...item, [field]: value } : item);
    handleFormChange(listName, list);
  };
  const removeDynamicListItem = (listName: 'sizes' | 'toppings', index: number) => {
    const list = (formData[listName] || []).filter((_, i) => i !== index);
    handleFormChange(listName, list);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Informações Básicas</h3>
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} />
            </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="price">Preço Base (R$)</Label>
                 <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)} required />
               </div>
               <div>
                 <Label htmlFor="category">Categoria</Label>
                 <Select value={formData.categoryId} onValueChange={(value) => handleFormChange('categoryId', value)} required>
                   <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                   <SelectContent>
                     {categories.map((category) => (
                       <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
          </div>
          {/* Imagem */}
          <div className="space-y-2">
            <Label>Imagem do Produto</Label>
            {imagePreview ? (
              <div className="relative w-24 h-24">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded border" />
                <Button type="button" size="icon" variant="destructive" onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-500">
                <Upload className="w-12 h-12 mx-auto mb-2" />
                <p>Nenhuma imagem</p>
              </div>
            )}
            <Input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="product-image-upload" disabled={isSaving} />
            <Button type="button" variant="outline" onClick={() => document.getElementById("product-image-upload")?.click()} disabled={isSaving} className="w-full">
              <Upload className="w-4 h-4 mr-2" />{isSaving ? "Enviando..." : "Escolher Arquivo"}
            </Button>
          </div>
          {/* Opções */}
          <div className="space-y-2">
             <div className="flex items-center space-x-2">
               <Switch id="available" checked={formData.available} onCheckedChange={(checked) => handleFormChange('available', checked)} />
               <Label htmlFor="available">Produto disponível</Label>
             </div>
             <div className="flex items-center space-x-2">
               <Switch id="showImage" checked={formData.showImage} onCheckedChange={(checked) => handleFormChange('showImage', checked)} />
               <Label htmlFor="showImage">Exibir imagem do produto</Label>
             </div>
           </div>

          {/* Tamanhos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Tamanhos (Opcional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addDynamicListItem('sizes')}>
                <Plus className="w-4 h-4 mr-2" />Adicionar
              </Button>
            </div>
            {formData.sizes?.map((size, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1"><Label>Nome</Label><Input value={size.name} onChange={(e) => updateDynamicListItem('sizes', index, "name", e.target.value)} /></div>
                <div className="w-28"><Label>Preço (R$)</Label><Input type="number" step="0.01" min="0" value={size.price} onChange={(e) => updateDynamicListItem('sizes', index, "price", Number(e.target.value))} /></div>
                <Button type="button" variant="destructive-outline" size="icon" onClick={() => removeDynamicListItem('sizes', index)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>

          {/* Adicionais */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Adicionais (Opcional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => addDynamicListItem('toppings')}>
                <Plus className="w-4 h-4 mr-2" />Adicionar
              </Button>
            </div>
            {formData.toppings?.map((topping, index) => (
              <div key={index} className="flex gap-2 items-end">
                 <div className="flex-1"><Label>Nome</Label><Input value={topping.name} onChange={(e) => updateDynamicListItem('toppings', index, "name", e.target.value)} /></div>
                <div className="w-28"><Label>Preço (R$)</Label><Input type="number" step="0.01" min="0" value={topping.price} onChange={(e) => updateDynamicListItem('toppings', index, "price", Number(e.target.value))} /></div>
                <Button type="button" variant="destructive-outline" size="icon" onClick={() => removeDynamicListItem('toppings', index)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </form>
        <DialogFooter className="pt-4">
          {error && <p className="text-sm font-medium text-destructive mr-auto">{error}</p>}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="product-form" disabled={isSaving}>
            {isSaving ? 'Salvando...' : product ? "Salvar Alterações" : "Criar Produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}