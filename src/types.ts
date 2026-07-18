export type Category = 'Coffee' | 'Beverages' | 'Food' | 'Snacks' | 'Desserts';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  imageUrl: string;
  stock: number;
  minStock: number;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferences: string; // e.g., "Kurang manis", "Tidak pakai bawang"
  points: number;
  orderCount: number;
  totalSpent: number;
  joinDate: string;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number; // nominal discount
  tax: number; // nominal tax (e.g., 10%)
  grandTotal: number;
  customerId?: string;
  customerName?: string;
  paymentMethod: 'Cash' | 'Debit' | 'QRIS' | 'Kredit';
  status: 'success' | 'pending';
  cashier: string;
  isOffline?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'cashier';
  avatar?: string;
  pin: string;
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  code: string;
  discountPercent: number;
  minPurchase: number;
  active: boolean;
}

export interface POSNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'sync';
  title: string;
  message: string;
  time: string;
  read: boolean;
}
