import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sale, SaleItem, CustomerInfo, PaymentDetails } from '../types';
import { useInventory } from './InventoryContext';

interface SalesContextType {
  sales: Sale[];
  addSale: (customer: CustomerInfo, items: SaleItem[], payment: PaymentDetails) => void;
  getSale: (id: string) => Sale | undefined;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const { adjustStock } = useInventory();
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sales from local storage
  useEffect(() => {
    const storedSales = localStorage.getItem('stockmaster_sales');
    if (storedSales) {
      setSales(JSON.parse(storedSales));
    }
    setIsLoaded(true);
  }, []);

  // Save sales to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('stockmaster_sales', JSON.stringify(sales));
    }
  }, [sales, isLoaded]);

  const addSale = (customer: CustomerInfo, items: SaleItem[], payment: PaymentDetails) => {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    const newSale: Sale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customer,
      items,
      total,
      status: 'completed',
      payment
    };

    // 1. Update Sales History
    setSales(prev => [newSale, ...prev]);

    // 2. Decrement Stock in Inventory
    items.forEach(item => {
      adjustStock(item.productId, -item.quantity);
    });
  };

  const getSale = (id: string) => {
    return sales.find(s => s.id === id);
  };

  return (
    <SalesContext.Provider value={{ sales, addSale, getSale }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};