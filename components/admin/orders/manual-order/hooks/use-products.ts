import { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when search term or category changes
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner(id, name)
        `)
        .eq('active', true)
        .order('name');

      if (productsError) {
        logger.error('MODULE', 'Erro ao carregar produtos:', productsError);
        return;
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (categoriesError) {
        logger.error('MODULE', 'Erro ao carregar categorias:', categoriesError);
        return;
      }

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      logger.error('MODULE', 'Erro ao carregar dados:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.categories?.id === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.categories?.name.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find(product => product.id === id);
  };

  const getProductsByCategory = (categoryId: string): Product[] => {
    return products.filter(product => product.categories?.id === categoryId);
  };

  const refreshProducts = () => {
    fetchProducts();
  };

  return {
    // State
    products,
    filteredProducts,
    searchTerm,
    selectedCategory,
    isLoadingProducts,
    categories,
    
    // Actions
    handleSearchChange,
    handleCategoryChange,
    clearFilters,
    refreshProducts,
    
    // Computed
    getProductById,
    getProductsByCategory
  };
}