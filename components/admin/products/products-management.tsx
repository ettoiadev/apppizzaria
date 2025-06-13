"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query" // ADICIONAR ESTA IMPORTAÇÃO
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
  const queryClient = useQueryClient() // ADICIONAR ESTA LINHA

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false) // ADICIONAR ESTADO DE LOADING

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: "product" | "category"; id: string; name: string } | null>(
    null,
  )

  // Load data
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products")
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Product actions
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

  // FUNÇÃO CORRIGIDA - Esta é a principal correção
  const handleSaveProduct = async (productData: Partial<Product>) => {
    setSaving(true) // Definir loading
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        const savedProduct = await response.json()

        // ATUALIZAÇÃO OTIMISTA DO ESTADO LOCAL
        if (editingProduct) {
          // Editando produto existente
          setProducts((prevProducts) =>
            prevProducts.map((p) => (p.id === editingProduct.id ? { ...p, ...savedProduct } : p)),
          )
        } else {
          // Criando novo produto
          setProducts((prevProducts) => [...prevProducts, savedProduct])
        }

        // INVALIDAR CACHE DO REACT QUERY (se estiver usando)
        await queryClient.invalidateQueries({ queryKey: ["products"] })
        await queryClient.invalidateQueries({ queryKey: ["categories"] })

        // Fechar modal
        setProductModalOpen(false)

        // Opcional: Mostrar toast de sucesso
        // toast.success(editingProduct ? 'Produto atualizado!' : 'Produto criado!')
      } else {
        throw new Error("Falha ao salvar produto")
      }
    } catch (error) {
      console.error("Error saving product:", error)
      // Opcional: Mostrar toast de erro
      // toast.error('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  const toggleProductAvailability = async (productId: string) => {
    try {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      console.log(`Alterando disponibilidade do produto ${product.name}: ${product.available} -> ${!product.available}`)

      // Optimistically update the UI first
      setProducts((prevProducts) =>
        prevProducts.map((p) => (p.id === productId ? { ...p, available: !p.available } : p)),
      )

      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !product.available }),
      })

      if (!response.ok) {
        console.error("Failed to update product availability")
        // Revert the optimistic update if the API call failed
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === productId ? { ...p, available: product.available } : p)),
        )
      } else {
        console.log(`Disponibilidade do produto ${product.name} atualizada com sucesso`)
        // INVALIDAR CACHE APÓS ATUALIZAÇÃO BEM-SUCEDIDA
        await queryClient.invalidateQueries({ queryKey: ["products"] })
      }
    } catch (error) {
      console.error("Error toggling product availability:", error)
      // Revert the optimistic update on error
      const originalProduct = products.find((p) => p.id === productId)
      if (originalProduct) {
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === productId ? { ...p, available: originalProduct.available } : p)),
        )
      }
    }
  }

  // Category actions
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

  // FUNÇÃO DE CATEGORIA TAMBÉM CORRIGIDA
  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories"
      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      })

      if (response.ok) {
        const savedCategory = await response.json()

        // ATUALIZAÇÃO OTIMISTA DO ESTADO LOCAL
        if (editingCategory) {
          setCategories((prevCategories) =>
            prevCategories.map((c) => (c.id === editingCategory.id ? { ...c, ...savedCategory } : c)),
          )
        } else {
          setCategories((prevCategories) => [...prevCategories, savedCategory])
        }

        // INVALIDAR CACHE DO REACT QUERY
        await queryClient.invalidateQueries({ queryKey: ["categories"] })
        await queryClient.invalidateQueries({ queryKey: ["products"] })

        setCategoryModalOpen(false)
      }
    } catch (error) {
      console.error("Error saving category:", error)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    try {
      const endpoint = deletingItem.type === "product" ? "products" : "categories";
      
      // GARANTE QUE O ID É O UUID CORRETO
      const idToDelete = deletingItem.id;

      const response = await fetch(`/api/${endpoint}/${idToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao excluir item");
      }

      // ATUALIZA A LISTA NA TELA IMEDIATAMENTE APÓS O SUCESSO
      if (deletingItem.type === "product") {
        setProducts((prevProducts) => prevProducts.filter((p) => p.id !== idToDelete));
      } else {
        setCategories((prevCategories) => prevCategories.filter((c) => c.id !== idToDelete));
        if (selectedCategory === idToDelete) {
          setSelectedCategory("all");
        }
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      // Adicionar um toast de erro para o usuário aqui é uma boa prática
    } finally {
      setDeleteModalOpen(false);
      setDeletingItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Produtos</h1>
          <p className="text-gray-600">Adicione, edite e gerencie seus produtos e categorias</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateCategory}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
          <Button onClick={handleCreateProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Categorias</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader className="p-0">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                  </div>
                  <Badge variant={product.available ? "default" : "secondary"}>
                    {product.available ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>

                <div className="text-xl font-bold text-primary">R$ {product.price.toFixed(2)}</div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={product.available}
                      onCheckedChange={() => toggleProductAvailability(product.id)}
                      disabled={loading}
                    />
                    <span className="text-sm">Disponível</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum produto encontrado</p>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
      />

      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        itemName={deletingItem?.name || ""}
        itemType={deletingItem?.type || "product"}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}