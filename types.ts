export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'expired';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator';
}

export interface Product {
  id: string;
  name: string;
  qrCode: string;
  category: string;
  type: string;
  brand: string;
  expiryDate: string | null; // ISO string YYYY-MM-DD
  stock: number;
  minStock: number;
  supplier: string;
  buyPrice: number;
  sellPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PaymentMethodType = 'cash' | 'debit_card' | 'credit_card' | 'transfer' | 'qr_wallet';

export interface PaymentDetails {
  method: PaymentMethodType;
  // Common
  amount: number;
  // Cash specific
  amountTendered?: number;
  change?: number;
  // Card/Digital specific
  authCode?: string; // Authorization code or Transaction ID
  lastFourDigits?: string;
  cardBrand?: string; // Visa, Mastercard
}

export interface CustomerInfo {
  name: string;
  taxId: string; // DNI, CUIT, RUT
  address?: string;
  email?: string;
}

export interface Sale {
  id: string;
  date: string;
  customer: CustomerInfo;
  items: SaleItem[];
  total: number;
  status: 'completed' | 'cancelled';
  payment: PaymentDetails;
}

export interface CategoryNode {
  name: string;
  icon: string;
  subcategories?: string[];
}

export interface DashboardMetrics {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  expiredCount: number;
  activeCount: number;
  outOfStockCount: number;
}

export interface FilterState {
  search: string;
  category: string;
  status: 'all' | ProductStatus;
  sortBy: 'name' | 'stock' | 'expiryDate';
}