import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, ProductStatus } from '../types';
import { MOCK_PRODUCTS } from '../constants';

interface InventoryContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  getProductByQR: (qr: string) => Product | undefined;
  adjustStock: (id: string, amount: number) => void;
  getProductStatus: (product: Product) => ProductStatus;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('stockmaster_products');
    if (stored) {
      setProducts(JSON.parse(stored));
    } else {
      setProducts(MOCK_PRODUCTS);
      localStorage.setItem('stockmaster_products', JSON.stringify(MOCK_PRODUCTS));
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage whenever products change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('stockmaster_products', JSON.stringify(products));
    }
  }, [products, isLoaded]);

  const getProductStatus = useCallback((product: Product): ProductStatus => {
    if (product.stock === 0) return 'out_of_stock';
    
    if (product.expiryDate) {
      const today = new Date().toISOString().split('T')[0];
      if (product.expiryDate < today) return 'expired';
    }

    if (product.stock <= product.minStock) return 'low_stock';
    
    return 'active';
  }, []);

  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getProductByQR = (qr: string) => {
    return products.find(p => p.qrCode === qr);
  };

  const adjustStock = (id: string, amount: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock + amount);
        return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
  };

  return (
    <InventoryContext.Provider value={{ 
      products, 
      addProduct, 
      updateProduct, 
      deleteProduct, 
      getProductByQR, 
      adjustStock,
      getProductStatus
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
