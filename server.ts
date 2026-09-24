import express from 'express';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import { seedDatabaseIfNeeded, getProducts, upsertProduct, deleteProduct, getCustomers, upsertCustomer, deleteCustomer, getPromos, upsertPromo, deletePromo, getUsers, upsertUser, deleteUser, getOrders, addOrder, getSettings, saveSetting, backupDatabase, restoreDatabase, resetDatabase } from './src/db/queries.ts';

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Run database seeding on startup to ensure initial data is populated
  console.log('Initializing database tables & seeds...');
  await seedDatabaseIfNeeded();

  // --- API Routes ---

  // Products
  app.get('/api/products', async (req, res) => {
    try {
      const data = await getProducts();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const data = await upsertProduct(req.body);
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      await deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Customers
  app.get('/api/customers', async (req, res) => {
    try {
      const data = await getCustomers();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const data = await upsertCustomer(req.body);
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      await deleteCustomer(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Promos
  app.get('/api/promos', async (req, res) => {
    try {
      const data = await getPromos();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/promos', async (req, res) => {
    try {
      const data = await upsertPromo(req.body);
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/promos/:id', async (req, res) => {
    try {
      await deletePromo(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Users (Cashiers / Admins)
  app.get('/api/users', async (req, res) => {
    try {
      const data = await getUsers();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const data = await upsertUser(req.body);
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      await deleteUser(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Orders
  app.get('/api/orders', async (req, res) => {
    try {
      const data = await getOrders();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const data = await addOrder(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings
  app.get('/api/settings', async (req, res) => {
    try {
      const data = await getSettings();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const { key, value } = req.body;
      const data = await saveSetting(key, value);
      res.json(data[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Database Administration APIs ---
  app.get('/api/database/backup', async (req, res) => {
    try {
      const data = await backupDatabase();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/database/restore', async (req, res) => {
    try {
      const data = await restoreDatabase(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/database/reset', async (req, res) => {
    try {
      const { pin } = req.body;
      const allUsers = await getUsers();
      const adminUser = allUsers.find(u => u.role === 'admin' && u.pin === pin);
      
      if (!adminUser) {
        return res.status(401).json({ error: 'PIN Admin tidak valid!' });
      }

      const data = await resetDatabase();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Serve Static / Frontend ---

  if (isProduction) {
    console.log('Serving production static files from ./dist');
    app.use(express.static('./dist'));
    
    // SPA fallback route
    app.get('*', (req, res) => {
      res.sendFile('./dist/index.html', { root: '.' });
    });
  } else {
    console.log('Running in DEVELOPMENT mode, mounting Vite Dev Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Fullstack QAPos Resto server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Critical server startup failure:', error);
});
