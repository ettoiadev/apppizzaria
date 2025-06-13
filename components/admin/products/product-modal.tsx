"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import type { Product, Category } from "@/types";

// Define the shape of the form data for clarity
interface FormData {
  name: string;
  description: string;
  price: string; // Keep price as a string in state to handle comma formatting
  categoryId: string;
  available: boolean;
  image?: string;
}

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Partial<Product> | null;
  categories: Category[];
  onSave: () => Promise<void>;
}

export function ProductModal({ open, onOpenChange, product, categories, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<FormData>({ name: '', description: '', price: '0,00', categoryId: '', available: true });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (product) {
        // Pre-fill form for editing an existing product
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: String(product.price?.toFixed(2) || '0.00').replace('.', ','),
          categoryId: product.categoryId || '',
          available: product.available ?? true,
          image: product.image || '',
        });
      } else {
        // Reset form for creating a new product
        setFormData({ name: '', description: '', price: '0,00', categoryId: '', available: true });
      }
      // Reset file input and errors whenever the modal is opened
      setSelectedFile(null);
      setError(null);
    }
  }, [product, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, ''); // Remove all non-digit characters
    value = value.replace(/(\d)(\d{2})$/, '$1,$2'); // Add comma before the last two digits
    value = value.replace(/(?=(\d{3})+(\D))\B/g, '.'); // Add thousand separators
    setFormData(prev => ({ ...prev, price: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    let finalImageUrl = formData.image;

    try {
      // Step 1: If a new file is selected, upload it via our backend API
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);

        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: uploadFormData });

        if (!uploadResponse.ok) {
          throw new Error('Falha no upload da imagem. Verifique o tipo do arquivo.');
        }
        const uploadResult = await uploadResponse.json();
        finalImageUrl = uploadResult.url;
      }
      
      // Step 2: Prepare product data, converting price to a proper number
      const priceAsNumber = parseFloat(formData.price.replace(/\./g, '').replace(',', '.'));
      if (isNaN(priceAsNumber) || formData.categoryId === '') {
          throw new Error('Preço ou Categoria inválida.');
      }

      const productPayload = {
        ...formData,
        price: priceAsNumber,
        image: finalImageUrl,
      };

      // Step 3: Send product data to our products API
      const productApiUrl = product ? `/api/products/${product.id}` : '/api/products';
      const productApiMethod = product ? 'PUT' : 'POST';

      const productResponse = await fetch(productApiUrl, {
        method: productApiMethod,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do produto. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Preço (R$)</Label>
            <Input id="price" name="price" type="text" inputMode="numeric" placeholder="25,50" value={formData.price} onChange={handlePriceChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="categoryId" className="text-right">Categoria</Label>
             <Select name="categoryId" onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))} value={formData.categoryId} required>
               <SelectTrigger id="categoryId" className="col-span-3">
                 <SelectValue placeholder="Selecione..." />
               </SelectTrigger>
               <SelectContent>
                 {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
               </SelectContent>
             </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">Imagem</Label>
            <Input id="file" type="file" onChange={handleFileChange} className="col-span-3" accept="image/png, image/jpeg, image/webp, image/gif"/>
          </div>
           <div className="flex items-center space-x-2 col-start-2 col-span-3">
             <Switch id="available" checked={formData.available} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))} />
             <Label htmlFor="available">Produto disponível</Label>
           </div>
          {error && <p className="col-span-4 text-center text-sm font-medium text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}