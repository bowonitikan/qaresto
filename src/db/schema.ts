import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';

// Users (Cashiers & Admins)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // We use standard text id (e.g., 'u1', 'u2') or Firebase uid
  uid: text('uid').unique(),   // Optional Firebase Auth UID for Google Login integration
  email: text('email'),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'admin' | 'cashier'
  avatar: text('avatar'),
  pin: text('pin').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Products (Menu items)
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: doublePrecision('price').notNull(),
  category: text('category').notNull(), // 'Coffee' | 'Beverages' | 'Food' | 'Snacks' | 'Desserts'
  imageUrl: text('image_url').notNull(),
  stock: integer('stock').notNull(),
  minStock: integer('min_stock').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Customers (CRM Loyalty members)
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  preferences: text('preferences').notNull(),
  points: integer('points').notNull().default(0),
  orderCount: integer('order_count').notNull().default(0),
  totalSpent: doublePrecision('total_spent').notNull().default(0),
  joinDate: text('join_date').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Promos (Coupons / discounts)
export const promos = pgTable('promos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  code: text('code').notNull().unique(),
  discountPercent: integer('discount_percent').notNull(),
  minPurchase: doublePrecision('min_purchase').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Orders
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  date: text('date').notNull(), // YYYY-MM-DD
  subtotal: doublePrecision('subtotal').notNull(),
  discount: doublePrecision('discount').notNull(),
  tax: doublePrecision('tax').notNull(),
  grandTotal: doublePrecision('grand_total').notNull(),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: text('customer_name'),
  paymentMethod: text('payment_method').notNull(), // 'Cash' | 'Debit' | 'QRIS' | 'Kredit'
  status: text('status').notNull(), // 'success' | 'pending'
  cashier: text('cashier').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Order Items (Join table for items in an order)
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  priceAtSale: doublePrecision('price_at_sale').notNull() // Capture historical selling price
});

// Settings (Key-Value general configuration)
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});

// -- Relations definitions for Drizzle --

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id]
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));
