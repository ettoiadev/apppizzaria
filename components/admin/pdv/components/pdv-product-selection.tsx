'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Package, Plus, Filter, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  price: number
  category: string
  description?: string
  is_active: boolean
}

interface Category {
  id: string
  name: string
}

interface PDVProductSelectionProps {
  products: Product[]
  filteredProducts: Product[]
  categories: Category[]
  searchTerm: string
  selectedCategory: string
  isLoadingProducts: boolean
  onSearchChange: (term: string) => void
  onCategoryChange: (category: string) => void
  onAddToCart: (product: Product) => void
  onClearFilters: () => void
}

export function PDVProductSelection({
  products,
  filteredProducts,
  categories,
  searchTerm,
  selectedCategory,
  isLoadingProducts,
  onSearchChange,
  onCategoryChange,
  onAddToCart,
  onClearFilters
}: PDVProductSelectionProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Menu de Produtos
          <Badge variant="secondary">{filteredProducts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>

        {/* Filtros de Categoria */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Categorias</span>
            {(searchTerm || selectedCategory) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange('')}
              className="h-8"
            >
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(category.name)}
                className="h-8"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {isLoadingProducts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Carregando produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {searchTerm || selectedCategory ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(product.price)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  {product.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {product.description}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => onAddToCart(product)}
                  size="sm"
                  className="ml-3 h-10 w-10 p-0 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>


      </CardContent>
    </Card>
  )
}