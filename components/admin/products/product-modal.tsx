"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Product, Category } from "@/types";

// Define a estrutura dos dados do formulário para clareza
interface FormData {
  name: string;
  description: string;
  price: string; // Manter como string para lidar com a formatação de vírgula
  categoryId: string;
  available: boolean;
  image?: string;
}

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Partial<Product> | null;
  categories: Category[];
  onSave: () => Promise<void>; // Função para recarregar os dados na página principal
}

export function ProductModal({ open, onOpenChange, product, categories, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<FormData>({ name: '', description: '', price: '0,00', categoryId: '', available: true });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Roda sempre que o modal é aberto
    if (open) {
      if (product) {
        // Preenche o formulário para edição
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: String(product.price?.toFixed(2) || '0.00').replace('.', ','),
          categoryId: product.categoryId || '',
          available: product.available ?? true,
          image: product.image || '',
        });
      } else {
        // Reseta o formulário para um novo produto
        setFormData({ name: '', description: '', price: '0,00', categoryId: '', available: true });
      }
      setSelectedFile(null); // Sempre reseta o arquivo selecionado
      setError(null);      // Sempre limpa os erros anteriores
    }
  }, [product, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Lógica para permitir apenas números e uma vírgula, e formatar
    let digitsOnly = value.replace(/[^0-9]/g, '');
    if(digitsOnly.length === 0) {
      setFormData(prev => ({ ...prev, price: '' }));
      return;
    }
    if (digitsOnly.length <= 2) {
      digitsOnly = digitsOnly.padStart(3, '0');
    }
    const formattedValue = digitsOnly.slice(0, -2) + ',' + digitsOnly.slice(-2);
    setFormData(prev => ({ ...prev, price: formattedValue }));
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
      // Etapa 1: Se um novo arquivo foi selecionado, faz o upload primeiro
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: uploadFormData });

        if (!uploadResponse.ok) {
          throw new Error('Falha no upload da imagem.');
        }
        const uploadResult = await uploadResponse.json();
        finalImageUrl = uploadResult.url;
      }
      
      // Etapa 2: Prepara os dados do produto, convertendo o preço para número
      const priceAsNumber = parseFloat(formData.price.replace(',', '.'));
      if (isNaN(priceAsNumber) || !formData.categoryId) {
          throw new Error('Preço ou Categoria inválida.');
      }

      const productPayload = {
        ...formData,
        price: priceAsNumber,
        image: finalImageUrl,
      };

      // Etapa 3: Envia os dados do produto para a API de produtos
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

      await onSave(); // Chama a função de recarregar da página pai
      onOpenChange(false); // Fecha o modal

    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label htmlFor="price">Preço Base (R$)</Label>
               <Input id="price" name="price" type="text" inputMode="decimal" placeholder="0,00" value={formData.price} onChange={handlePriceChange} required />
            </div>
            <div className="space-y-2">
               <Label htmlFor="categoryId">Categoria</Label>
               <Select name="categoryId" onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))} value={formData.categoryId || ''} required>
                 <SelectTrigger id="categoryId"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                 <SelectContent>
                   {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Imagem do Produto</Label>
            <Input id="file" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp, image/gif, image/avif"/>
          </div>
           <div className="flex items-center space-x-2">
             <Switch id="available" checked={formData.available} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))} />
             <Label htmlFor="available">Produto disponível</Label>
           </div>
          {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}