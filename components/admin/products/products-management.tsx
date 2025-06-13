"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { ProductModal } from "./product-modal"
import { CategoryModal } from "./category-modal"
import { DeleteConfirmModal } from "./delete-confirm-modal"
import type { Product, Category } from "@/types"

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  const [productModalOpen, setProductModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: "product" | "category"; id: string; name: string } | null>(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products")
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error("Error loading categories:", error)
      setCategories([])
    }
  }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setProductModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductModalOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setDeletingItem({ type: "product", id: product.id, name: product.name })
    setDeleteModalOpen(true)
  }

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setCategoryModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  const handleDeleteCategory = (category: Category) => {
    setDeletingItem({ type: "category", id: category.id, name: category.name })
    setDeleteModalOpen(true)
  }

  // **CORREÇÃO 1: Função de callback para ser passada ao modal.**
  // A única responsabilidade dela é recarregar os dados.
  const handleDataSaved = async () => {
    await loadProducts();
    await loadCategories();
  }

  // **CORREÇÃO 2: Lógica de deleção que atualiza a UI otimisticamente.**
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    // Guarda o ID para usar depois do try/catch
    const { id: idToDelete, type } = deletingItem;
    
    // Atualiza a UI primeiro (remoção otimista)
    if (type === "product") {
      setProducts((prev) => prev.filter((p) => p.id !== idToDelete));
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== idToDelete));
    }
    setDeleteModalOpen(false);

    try {
      const endpoint = type === "product" ? "products" : "categories";
      const response = await fetch(`/api/${endpoint}/${idToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Se a API falhar, recarrega os dados do servidor para reverter a UI
        console.error("Failed to delete item from server, reverting UI.");
        await loadProducts();
        await loadCategories();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      // Se houver erro de rede, também reverte
      await loadProducts();
      await loadCategories();
    } finally {
      setDeletingItem(null);
    }
  }

  const toggleProductAvailability = async (productId: string) => {
    const originalProducts = products
    const product = products.find((p) => p.id === productId)
    if (!product) return

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, available: !p.available } : p)),
    )

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !product.available }),
      })

      if (!response.ok) throw new Error("Failed to update on server");
    } catch (error) {
      console.error("Error toggling product availability:", error)
      setProducts(originalProducts) // Reverte em caso de erro
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Produtos</h1>
          <p className="text-gray-600">Adicione, edite e gerencie seus produtos e categorias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateCategory}><Plus className="w-4 h-4 mr-2" />Nova Categoria</Button>
          <Button onClick={handleCreateProduct}><Plus className="w-4 h-4 mr-2" />Novo Produto</Button>
        </div>
      </div>
      <Card>
        <CardHeader><h2 className="text-xl font-semibold">Categorias</h2></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img src={category.image || "/placeholder.svg"} alt={category.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar produtos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (<SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader className="p-0">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                  </div>
                  <Badge variant={product.available ? "default" : "secondary"}>{product.available ? "Disponível" : "Indisponível"}</Badge>
                </div>
                <div className="text-xl font-bold text-primary">R$ {product.price.toFixed(2)}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch checked={product.available} onCheckedChange={() => toggleProductAvailability(product.id)} disabled={loading} />
                    <span className="text-sm">Disponível</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredProducts.length === 0 && !loading && (<div className="text-center py-12"><p className="text-gray-500">Nenhum produto encontrado</p></div>)}
      
      <ProductModal open={productModalOpen} onOpenChange={setProductModalOpen} product={editingProduct} categories={categories} onSave={handleDataSaved} />
      <CategoryModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} category={editingCategory} onSave={handleDataSaved} />
      <DeleteConfirmModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen} itemName={deletingItem?.name || ""} itemType={deletingItem?.type || "product"} onConfirm={handleConfirmDelete} />
    </div>
  )
}