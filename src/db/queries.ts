import { db } from './index.ts';
import * as schema from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_PROMOS, INITIAL_USERS } from '../data.ts';

// Seeding function to initialize the database if products or users are empty
export async function seedDatabaseIfNeeded() {
  try {
    // 1. Check if users are empty
    const existingUsers = await db.select().from(schema.users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Seeding users...');
      await db.insert(schema.users).values(
        INITIAL_USERS.map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          avatar: u.avatar || '',
          pin: u.pin,
        }))
      );
    }

    // 2. Check if products are empty
    const existingProducts = await db.select().from(schema.products).limit(1);
    if (existingProducts.length === 0) {
      console.log('Seeding products...');
      await db.insert(schema.products).values(
        INITIAL_PRODUCTS.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          imageUrl: p.imageUrl,
          stock: p.stock,
          minStock: p.minStock,
          description: p.description,
        }))
      );
    }

    // 3. Check if customers are empty
    const existingCustomers = await db.select().from(schema.customers).limit(1);
    if (existingCustomers.length === 0) {
      console.log('Seeding customers...');
      await db.insert(schema.customers).values(
        INITIAL_CUSTOMERS.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          preferences: c.preferences,
          points: c.points,
          orderCount: c.orderCount,
          totalSpent: c.totalSpent,
          joinDate: c.joinDate,
        }))
      );
    }

    // 4. Check if promos are empty
    const existingPromos = await db.select().from(schema.promos).limit(1);
    if (existingPromos.length === 0) {
      console.log('Seeding promos...');
      await db.insert(schema.promos).values(
        INITIAL_PROMOS.map(pr => ({
          id: pr.id,
          title: pr.title,
          description: pr.description,
          code: pr.code,
          discountPercent: pr.discountPercent,
          minPurchase: pr.minPurchase,
          active: pr.active,
        }))
      );
    }

    console.log('Database verification & seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// --- DB Operations Helpers ---

// Products
export async function getProducts() {
  try {
    return await db.select().from(schema.products);
  } catch (err) {
    console.error('Error fetching products:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function upsertProduct(product: any) {
  try {
    return await db.insert(schema.products)
      .values({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        stock: product.stock,
        minStock: product.minStock,
        description: product.description,
      })
      .onConflictDoUpdate({
        target: schema.products.id,
        set: {
          name: product.name,
          price: product.price,
          category: product.category,
          imageUrl: product.imageUrl,
          stock: product.stock,
          minStock: product.minStock,
          description: product.description,
        }
      })
      .returning();
  } catch (err) {
    console.error('Error upserting product:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function deleteProduct(id: string) {
  try {
    return await db.delete(schema.products).where(eq(schema.products.id, id));
  } catch (err) {
    console.error('Error deleting product:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

// Customers
export async function getCustomers() {
  try {
    return await db.select().from(schema.customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function upsertCustomer(customer: any) {
  try {
    return await db.insert(schema.customers)
      .values({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        preferences: customer.preferences,
        points: customer.points,
        orderCount: customer.orderCount,
        totalSpent: customer.totalSpent,
        joinDate: customer.joinDate,
      })
      .onConflictDoUpdate({
        target: schema.customers.id,
        set: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          preferences: customer.preferences,
          points: customer.points,
          orderCount: customer.orderCount,
          totalSpent: customer.totalSpent,
          joinDate: customer.joinDate,
        }
      })
      .returning();
  } catch (err) {
    console.error('Error upserting customer:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function deleteCustomer(id: string) {
  try {
    return await db.delete(schema.customers).where(eq(schema.customers.id, id));
  } catch (err) {
    console.error('Error deleting customer:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

// Promos
export async function getPromos() {
  try {
    return await db.select().from(schema.promos);
  } catch (err) {
    console.error('Error fetching promos:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function upsertPromo(promo: any) {
  try {
    return await db.insert(schema.promos)
      .values({
        id: promo.id,
        title: promo.title,
        description: promo.description,
        code: promo.code,
        discountPercent: promo.discountPercent,
        minPurchase: promo.minPurchase,
        active: promo.active,
      })
      .onConflictDoUpdate({
        target: schema.promos.id,
        set: {
          title: promo.title,
          description: promo.description,
          code: promo.code,
          discountPercent: promo.discountPercent,
          minPurchase: promo.minPurchase,
          active: promo.active,
        }
      })
      .returning();
  } catch (err) {
    console.error('Error upserting promo:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function deletePromo(id: string) {
  try {
    return await db.delete(schema.promos).where(eq(schema.promos.id, id));
  } catch (err) {
    console.error('Error deleting promo:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

// Users
export async function getUsers() {
  try {
    return await db.select().from(schema.users);
  } catch (err) {
    console.error('Error fetching users:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function upsertUser(user: any) {
  try {
    return await db.insert(schema.users)
      .values({
        id: user.id,
        uid: user.uid || null,
        email: user.email || null,
        name: user.name,
        role: user.role,
        avatar: user.avatar || '',
        pin: user.pin,
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          uid: user.uid || null,
          email: user.email || null,
          name: user.name,
          role: user.role,
          avatar: user.avatar || '',
          pin: user.pin,
        }
      })
      .returning();
  } catch (err) {
    console.error('Error upserting user:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function deleteUser(id: string) {
  try {
    return await db.delete(schema.users).where(eq(schema.users.id, id));
  } catch (err) {
    console.error('Error deleting user:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

// Orders
export async function getOrders() {
  try {
    const ordersList = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
    
    // For each order, fetch items
    const fullOrders = [];
    for (const order of ordersList) {
      const itemsList = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
      
      // Map to include product objects so that it matches standard CartItem[] type
      const itemsWithProduct = [];
      for (const item of itemsList) {
        const productRes = await db.select().from(schema.products).where(eq(schema.products.id, item.productId)).limit(1);
        if (productRes.length > 0) {
          itemsWithProduct.push({
            product: productRes[0],
            quantity: item.quantity,
            notes: item.notes || undefined
          });
        }
      }

      fullOrders.push({
        ...order,
        items: itemsWithProduct
      });
    }

    return fullOrders;
  } catch (err) {
    console.error('Error fetching orders:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function addOrder(order: any) {
  try {
    // 1. Insert into main orders table
    await db.insert(schema.orders).values({
      id: order.id,
      invoiceNumber: order.invoiceNumber,
      date: order.date,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      grandTotal: order.grandTotal,
      customerId: order.customerId || null,
      customerName: order.customerName || null,
      paymentMethod: order.paymentMethod,
      status: order.status,
      cashier: order.cashier,
    });

    // 2. Insert items and decrement product stocks
    for (const item of order.items) {
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes || null,
        priceAtSale: item.product.price
      });

      // Decrement stock in database
      const productRes = await db.select().from(schema.products).where(eq(schema.products.id, item.product.id)).limit(1);
      if (productRes.length > 0) {
        const currentStock = productRes[0].stock;
        const newStock = Math.max(0, currentStock - item.quantity);
        await db.update(schema.products).set({ stock: newStock }).where(eq(schema.products.id, item.product.id));
      }
    }

    // 3. Update customer loyalty points/stats if a customer was present
    if (order.customerId) {
      const customerRes = await db.select().from(schema.customers).where(eq(schema.customers.id, order.customerId)).limit(1);
      if (customerRes.length > 0) {
        const current = customerRes[0];
        // Earn 1 point per 10,000 IDR spent
        const earnedPoints = Math.floor(order.grandTotal / 10000);
        await db.update(schema.customers)
          .set({
            points: current.points + earnedPoints,
            orderCount: current.orderCount + 1,
            totalSpent: current.totalSpent + order.grandTotal,
          })
          .where(eq(schema.customers.id, order.customerId));
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error adding order:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

// Settings (Key-Value general configuration)
export async function getSettings() {
  try {
    const list = await db.select().from(schema.settings);
    const config: any = {};
    for (const item of list) {
      config[item.key] = item.value;
    }
    return config;
  } catch (err) {
    console.error('Error fetching settings:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

export async function saveSetting(key: string, value: string) {
  try {
    return await db.insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value }
      })
      .returning();
  } catch (err) {
    console.error('Error saving setting:', err);
    throw new Error('Database query failed', { cause: err });
  }
}

// --- Backup, Restore, and Reset Database Helpers ---

export async function backupDatabase() {
  try {
    const allUsers = await db.select().from(schema.users);
    const allProducts = await db.select().from(schema.products);
    const allCustomers = await db.select().from(schema.customers);
    const allPromos = await db.select().from(schema.promos);
    const allOrders = await db.select().from(schema.orders);
    const allOrderItems = await db.select().from(schema.orderItems);
    const allSettings = await db.select().from(schema.settings);

    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        users: allUsers,
        products: allProducts,
        customers: allCustomers,
        promos: allPromos,
        orders: allOrders,
        orderItems: allOrderItems,
        settings: allSettings
      }
    };
  } catch (err) {
    console.error('Error creating database backup:', err);
    throw new Error('Database backup failed', { cause: err });
  }
}

export async function restoreDatabase(backup: any) {
  try {
    if (!backup || !backup.data) {
      throw new Error('Invalid backup file format.');
    }

    const { users: restoredUsers, products: restoredProducts, customers: restoredCustomers, promos: restoredPromos, orders: restoredOrders, orderItems: restoredOrderItems, settings: restoredSettings } = backup.data;

    // 1. Delete all existing records in reverse foreign key order to prevent constraint violations
    await db.delete(schema.orderItems);
    await db.delete(schema.orders);
    await db.delete(schema.customers);
    await db.delete(schema.promos);
    await db.delete(schema.products);
    await db.delete(schema.users);
    await db.delete(schema.settings);

    // 2. Insert restored data
    if (restoredUsers && restoredUsers.length > 0) {
      await db.insert(schema.users).values(restoredUsers);
    }
    if (restoredProducts && restoredProducts.length > 0) {
      await db.insert(schema.products).values(restoredProducts);
    }
    if (restoredCustomers && restoredCustomers.length > 0) {
      await db.insert(schema.customers).values(restoredCustomers);
    }
    if (restoredPromos && restoredPromos.length > 0) {
      await db.insert(schema.promos).values(restoredPromos);
    }
    if (restoredOrders && restoredOrders.length > 0) {
      await db.insert(schema.orders).values(restoredOrders);
    }
    if (restoredOrderItems && restoredOrderItems.length > 0) {
      await db.insert(schema.orderItems).values(restoredOrderItems);
    }
    if (restoredSettings && restoredSettings.length > 0) {
      await db.insert(schema.settings).values(restoredSettings);
    }

    return { success: true };
  } catch (err) {
    console.error('Error restoring database backup:', err);
    throw new Error('Database restore failed', { cause: err });
  }
}

export async function resetDatabase() {
  try {
    // 1. Clear everything
    await db.delete(schema.orderItems);
    await db.delete(schema.orders);
    await db.delete(schema.customers);
    await db.delete(schema.promos);
    await db.delete(schema.products);
    await db.delete(schema.users);
    await db.delete(schema.settings);

    // 2. Run seed process to populate with pristine initial mock data
    await seedDatabaseIfNeeded();

    return { success: true };
  } catch (err) {
    console.error('Error resetting database:', err);
    throw new Error('Database reset failed', { cause: err });
  }
}

