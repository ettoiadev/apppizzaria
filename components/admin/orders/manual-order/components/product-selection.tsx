import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import { Product } from '../types';

interface ProductSelectionProps {
  products: Product[];
  filteredProducts: Product[];
  categories: Array<{ id: string; name: string }>;
  searchTerm: string;
  selectedCategory: string;
  isLoadingProducts: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onAddToCart: (product: Product) => void;
  onClearFilters: () => void;
}

export function ProductSelection({
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
}: ProductSelectionProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (isLoadingProducts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando produtos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Produtos
          <Badge variant="secondary">{products.length} disponíveis</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
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
          {(searchTerm || selectedCategory !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Nenhum produto encontrado com os filtros aplicados.'
                  : 'Nenhum produto disponível.'}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm leading-tight">{product.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {product.categories?.name}
                      </Badge>
                    </div>
                    
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => onAddToCart(product)}
                        className="h-8 px-3"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredProducts.length > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Mostrando {filteredProducts.length} de {products.length} produtos
          </div>
        )}
      </CardContent>
    </Card>
  );
}