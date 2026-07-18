import { useState, useEffect } from 'react';
import { Product, Customer, Promo, Order, User, POSNotification } from './types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_PROMOS, INITIAL_USERS } from './data';
import PromoTicker from './components/PromoTicker';
import NotificationCenter from './components/NotificationCenter';
import OfflineSyncIndicator from './components/OfflineSyncIndicator';
import OrderTerminal from './components/OrderTerminal';
import StockManager from './components/StockManager';
import CustomerManager from './components/CustomerManager';
import SalesReport from './components/SalesReport';
import UserAccessSetup from './components/UserAccessSetup';
import ShopSetup from './components/ShopSetup';
import PromoManager from './components/PromoManager';
import { Shield, ShoppingBag, Package, Users, BarChart3, Settings, Bell, Menu, X, Wifi, Store, Info, MessageSquare, Ticket, Lock, LogOut, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pre-fill a list of past orders to make the charts and financial reports stunning on launch!
const PRE_POPULATED_ORDERS: Order[] = [
  {
    id: 'o_1',
    invoiceNumber: 'INV/20260714/001',
    date: '2026-07-14',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 2, notes: 'Es banyak' },
      { product: INITIAL_PRODUCTS[7], quantity: 1, notes: 'Pedas sedang' }
    ],
    subtotal: 61000,
    discount: 5000,
    tax: 5600,
    grandTotal: 61600,
    customerId: 'c1',
    customerName: 'Budi Santoso',
    paymentMethod: 'Cash',
    status: 'success',
    cashier: 'Kasino (Kasir Shift A)'
  },
  {
    id: 'o_2',
    invoiceNumber: 'INV/20260715/002',
    date: '2026-07-15',
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 1 },
      { product: INITIAL_PRODUCTS[10], quantity: 2 }
    ],
    subtotal: 84000,
    discount: 8400,
    tax: 7560,
    grandTotal: 83160,
    customerId: 'c2',
    customerName: 'Siti Aminah',
    paymentMethod: 'QRIS',
    status: 'success',
    cashier: 'Kasino (Kasir Shift A)'
  },
  {
    id: 'o_3',
    invoiceNumber: 'INV/20260716/003',
    date: '2026-07-16',
    items: [
      { product: INITIAL_PRODUCTS[1], quantity: 1 },
      { product: INITIAL_PRODUCTS[11], quantity: 1 }
    ],
    subtotal: 43000,
    discount: 0,
    tax: 4300,
    grandTotal: 47300,
    paymentMethod: 'Debit',
    status: 'success',
    cashier: 'Karsini (Kasir Shift B)'
  },
  {
    id: 'o_4',
    invoiceNumber: 'INV/20260717/004',
    date: '2026-07-17',
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 3 },
      { product: INITIAL_PRODUCTS[4], quantity: 2 }
    ],
    subtotal: 70000,
    discount: 10500,
    tax: 5950,
    grandTotal: 65450,
    customerId: 'c1',
    customerName: 'Budi Santoso',
    paymentMethod: 'QRIS',
    status: 'success',
    cashier: 'Kasino (Kasir Shift A)'
  }
];

export default function App() {
  // Navigation tabs: 'kasir' | 'stok' | 'pelanggan' | 'laporan' | 'pengguna' | 'setup' | 'promo'
  const [activeTab, setActiveTab] = useState<'kasir' | 'stok' | 'pelanggan' | 'laporan' | 'pengguna' | 'setup' | 'promo'>('kasir');

  // Core App states with LocalStorage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('qapos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('qapos_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  const [promos, setPromos] = useState<Promo[]>(() => {
    const saved = localStorage.getItem('qapos_promos');
    return saved ? JSON.parse(saved) : INITIAL_PROMOS;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('qapos_orders');
    return saved ? JSON.parse(saved) : PRE_POPULATED_ORDERS;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('qapos_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUsers = localStorage.getItem('qapos_users');
    const loadedUsers: User[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
    const savedCur = localStorage.getItem('qapos_currentUser');
    if (savedCur) {
      try {
        const parsed = JSON.parse(savedCur);
        const matched = loadedUsers.find(u => u.id === parsed.id);
        if (matched) return matched;
      } catch (e) {
        console.error(e);
      }
    }
    return loadedUsers[1] || INITIAL_USERS[1];
  });
  const [isLocked, setIsLocked] = useState<boolean>(true); // Terminal locked on start
  const [selectedLockUser, setSelectedLockUser] = useState<User>(() => {
    const savedUsers = localStorage.getItem('qapos_users');
    const loadedUsers: User[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
    return loadedUsers[1] || INITIAL_USERS[1];
  });
  const [lockPin, setLockPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Restaurant settings states with LocalStorage persistence
  const [restaurantName, setRestaurantName] = useState<string>(() => {
    return localStorage.getItem('qapos_restaurantName') || 'Resto Makmur Lezat';
  });
  const [restaurantMotto, setRestaurantMotto] = useState<string>(() => {
    return localStorage.getItem('qapos_restaurantMotto') || 'Sajian Lezat, Pelayanan Hangat';
  });
  const [receiptConfig, setReceiptConfig] = useState(() => {
    const saved = localStorage.getItem('qapos_receiptConfig');
    return saved ? JSON.parse(saved) : {
      address: 'Jl. Kuliner No. 123, Bandung',
      phone: '(022) 8765-4321',
      headerMessage: 'SELAMAT MENIKMATI hidangan istimewa kami!',
      footerMessage: 'Kritik & Saran Hubungi: admin@restomakmur.com',
      showLogo: true,
      paperWidth: '80mm' as '80mm' | '58mm'
    };
  });

  // Sync state modifications to localStorage via useEffect
  useEffect(() => {
    localStorage.setItem('qapos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('qapos_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('qapos_promos', JSON.stringify(promos));
  }, [promos]);

  useEffect(() => {
    localStorage.setItem('qapos_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('qapos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('qapos_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('qapos_restaurantName', restaurantName);
  }, [restaurantName]);

  useEffect(() => {
    localStorage.setItem('qapos_restaurantMotto', restaurantMotto);
  }, [restaurantMotto]);

  useEffect(() => {
    localStorage.setItem('qapos_receiptConfig', JSON.stringify(receiptConfig));
  }, [receiptConfig]);

  const [aboutOpen, setAboutOpen] = useState(false);

  // Connectivity Sync simulation state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<Order[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Notification management state
  const [notifications, setNotifications] = useState<POSNotification[]>([
    {
      id: 'n_welcome',
      type: 'info',
      title: 'RestoPOS Siap Digunakan',
      message: 'Sistem POS kasir restoran telah dimuat dengan data produk kuliner, daftar customer, dan promo aktif.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false
    },
    {
      id: 'n_stock_warning',
      type: 'warning',
      title: 'Peringatan Stok Tipis',
      message: 'Stok menu Ayam Goreng Kalasan Madu tersisa tinggal 3 porsi! Segera lakukan pengisian.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false
    }
  ]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Active Promo Code requested from ticker
  const [tickerPromoCode, setTickerPromoCode] = useState<string | null>(null);

  // Mobile navigation sidebar menu toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle PIN Keyboard Input
  const handlePinKeyPress = (key: string) => {
    setPinError(null);
    
    if (key === 'clear') {
      setLockPin('');
      return;
    }
    
    if (key === 'delete') {
      setLockPin(prev => prev.slice(0, -1));
      return;
    }
    
    if (lockPin.length < 5) {
      const nextPin = lockPin + key;
      setLockPin(nextPin);
      
      if (nextPin.length === 5) {
        const matchedUser = users.find(u => u.id === selectedLockUser.id);
        if (matchedUser && matchedUser.pin === nextPin) {
          setCurrentUser(matchedUser);
          setIsLocked(false);
          setLockPin('');
          setPinError(null);
          
          const loginNote: POSNotification = {
            id: `n_login_${Date.now()}`,
            type: 'info',
            title: 'Operator Masuk',
            message: `Operator "${matchedUser.name}" (${matchedUser.role === 'admin' ? 'Admin Utama' : 'Kasir'}) berhasil masuk ke sistem POS.`,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            read: false
          };
          setNotifications(prev => [loginNote, ...prev]);
        } else {
          setIsShaking(true);
          setPinError('PIN salah, silakan coba lagi!');
          setLockPin('');
          setTimeout(() => setIsShaking(false), 500);
        }
      }
    }
  };

  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handlePinKeyPress('delete');
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handlePinKeyPress('clear');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, lockPin, selectedLockUser, users]);

  // Handle Automatic/Manual Sync process when going back online
  const triggerSynchronization = () => {
    if (pendingSyncQueue.length === 0) return;
    setIsSyncing(true);

    setTimeout(() => {
      // Append queued transactions to cloud database (main state pool)
      setOrders(prev => [...prev, ...pendingSyncQueue]);
      
      // Raise success notification
      const syncNote: POSNotification = {
        id: `n_sync_${Date.now()}`,
        type: 'success',
        title: 'Sinkronisasi Otomatis Sukses',
        message: `${pendingSyncQueue.length} pesanan offline berhasil diunggah dan disinkronisasikan ke cloud server.`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setNotifications(prev => [syncNote, ...prev]);

      // Reset Sync Queue
      setPendingSyncQueue([]);
      setIsSyncing(false);
    }, 1500);
  };

  // Listen connection toggle transitions
  const handleToggleConnection = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    const connectionNote: POSNotification = {
      id: `n_conn_${Date.now()}`,
      type: nextState ? 'success' : 'warning',
      title: nextState ? 'Koneksi Internet Pulih' : 'Koneksi Terputus (Offline)',
      message: nextState
        ? 'Aplikasi kembali online. Memulai sinkronisasi otomatis latar belakang...'
        : 'Kasir beralih ke penyimpanan lokal (IndexedDB). Transaksi tetap bisa diproses dengan aman.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications(prev => [connectionNote, ...prev]);

    // Automatically trigger sync if transition to online
    if (nextState) {
      setTimeout(() => triggerSynchronization(), 1000);
    }
  };

  // Add Product to database
  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const item: Product = {
      ...newProduct,
      id: `p_new_${Math.random().toString(36).substring(2, 9)}`
    };
    setProducts(prev => [item, ...prev]);

    const addNote: POSNotification = {
      id: `n_prod_${Date.now()}`,
      type: 'success',
      title: 'Menu Baru Ditambahkan',
      message: `Menu "${item.name}" berhasil dipublikasikan di sistem POS kasir dengan harga ${item.price.toLocaleString('id-ID')}.`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [addNote, ...prev]);
  };

  const handleEditProduct = (id: string, updated: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Update Product Stock levels
  const handleUpdateProductStock = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return { ...p, stock: newStock };
    }));

    const prod = products.find(p => p.id === productId);
    if (prod) {
      const stockNote: POSNotification = {
        id: `n_stock_adj_${Date.now()}`,
        type: 'info',
        title: 'Penyesuaian Stok',
        message: `Stok menu "${prod.name}" disesuaikan menjadi ${newStock} porsi.`,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setNotifications(prev => [stockNote, ...prev]);
    }
  };

  // Apply promo code requested from scrolling ticker
  const handleApplyTickerPromo = (code: string) => {
    setTickerPromoCode(code);
    setActiveTab('kasir'); // direct user back to the POS
  };

  // Add Promo to database
  const handleAddPromo = (newPromo: Omit<Promo, 'id'>) => {
    const item: Promo = {
      ...newPromo,
      id: `pr_new_${Math.random().toString(36).substring(2, 9)}`
    };
    setPromos(prev => [item, ...prev]);

    const addNote: POSNotification = {
      id: `n_promo_add_${Date.now()}`,
      type: 'success',
      title: 'Voucher Promo Ditambahkan',
      message: `Promo "${item.title}" dengan kode "${item.code}" (Diskon ${item.discountPercent}%) siap digunakan di kasir.`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [addNote, ...prev]);
  };

  const handleEditPromo = (id: string, updated: Partial<Promo>) => {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const handleDeletePromo = (id: string) => {
    setPromos(prev => prev.filter(p => p.id !== id));
  };

  // Update User PIN securely with role verification
  const handleUpdateUserPin = (targetUserId: string, newPin: string): boolean => {
    if (!/^\d{5}$/.test(newPin)) {
      return false;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return false;

    const isCurrentAdmin = currentUser.role === 'admin';
    const isTargetAdmin = targetUser.role === 'admin';

    // Cashier cannot edit anyone else's PIN
    if (currentUser.id !== targetUserId && !isCurrentAdmin) {
      return false;
    }

    // Cashier cannot edit Admin's PIN
    if (isTargetAdmin && !isCurrentAdmin) {
      return false;
    }

    // Apply PIN update
    setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, pin: newPin } : u));

    if (currentUser.id === targetUserId) {
      setCurrentUser(prev => ({ ...prev, pin: newPin }));
    }

    // Add a beautiful POS notification
    const changeNote: POSNotification = {
      id: `n_pin_chg_${Date.now()}`,
      type: 'success',
      title: 'PIN Diperbarui',
      message: `PIN keamanan untuk "${targetUser.name}" telah berhasil diperbarui di sistem.`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [changeNote, ...prev]);

    return true;
  };

  // Add Customer manually
  const handleAddCustomer = (newCust: Omit<Customer, 'id' | 'points' | 'orderCount' | 'totalSpent' | 'joinDate'>) => {
    const item: Customer = {
      ...newCust,
      id: `c_new_${Math.random().toString(36).substring(2, 9)}`,
      points: 20, // free bonus points
      orderCount: 0,
      totalSpent: 0,
      joinDate: new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => [item, ...prev]);
  };

  // Import batch customers from Google Sheets
  const handleImportCustomers = (importedList: Customer[]) => {
    setCustomers(prev => [...importedList, ...prev]);

    const importNote: POSNotification = {
      id: `n_import_${Date.now()}`,
      type: 'success',
      title: 'Import Google Sheet Sukses',
      message: `Berhasil menyinkronkan & mengimport ${importedList.length} rekam customer baru ke dalam database lokal.`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [importNote, ...prev]);
  };

  // Validate applied promo code from terminal
  const handleApplyPromoCode = (code: string): Promo | null => {
    return promos.find(p => p.code.toLowerCase() === code.toLowerCase() && p.active) || null;
  };

  // Core order placement process
  const handleProcessOrder = (orderPayload: Omit<Order, 'id' | 'invoiceNumber' | 'date'>, customerId?: string): Order => {
    const generatedInvoice = `INV/${new Date().toISOString().split('T')[0].replace(/-/g, '')}/${Math.floor(100 + Math.random() * 900)}`;
    
    const completedOrder: Order = {
      ...orderPayload,
      id: `o_${Math.random().toString(36).substring(2, 9)}`,
      invoiceNumber: generatedInvoice,
      date: new Date().toISOString().split('T')[0],
      isOffline: !isOnline
    };

    // Deduct stock from products locally & scan for low stocks
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(p => {
        const itemOrdered = orderPayload.items.find(item => item.product.id === p.id);
        if (!itemOrdered) return p;
        return { ...p, stock: Math.max(0, p.stock - itemOrdered.quantity) };
      });

      // Scan and push low stock warnings
      updatedProducts.forEach(p => {
        const originallyLow = prevProducts.find(orig => orig.id === p.id)?.stock! <= p.minStock;
        const nowLow = p.stock <= p.minStock;

        if (nowLow && !originallyLow) {
          const lowNote: POSNotification = {
            id: `n_low_${p.id}_${Date.now()}`,
            type: 'warning',
            title: 'Peringatan Bahan Tipis',
            message: `Stok kuliner "${p.name}" tersisa tinggal ${p.stock} porsi! Segera lakukan pengisian ulang.`,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            read: false
          };
          setNotifications(prev => [lowNote, ...prev]);
        }
      });

      return updatedProducts;
    });

    // Handle Loyalty Point updates
    if (customerId) {
      setCustomers(prevCust =>
        prevCust.map(c => {
          if (c.id !== customerId) return c;
          // Every Rp 10.000 spent earns 1 loyalty point
          const pointsEarned = Math.floor(orderPayload.grandTotal / 10000);
          return {
            ...c,
            points: c.points + pointsEarned,
            orderCount: c.orderCount + 1,
            totalSpent: c.totalSpent + orderPayload.grandTotal
          };
        })
      );
    }

    // Save transaction
    if (isOnline) {
      setOrders(prev => [completedOrder, ...prev]);
    } else {
      // Queue offline orders
      setPendingSyncQueue(prev => [...prev, completedOrder]);
    }

    return completedOrder;
  };

  // Notification action triggers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans text-white">
        {/* Abstract background decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

        <div className="w-full max-w-md flex flex-col items-center space-y-6 z-10">
          
          {/* Logo & Branding */}
          <div className="text-center space-y-2">
            <div className="mx-auto bg-indigo-600 text-white w-12 h-12 rounded-2xl font-black text-xl flex items-center justify-center shadow-lg border border-indigo-400/30">
              QA
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight shimmer-text">{restaurantName}</h1>
            <p className="text-xs text-indigo-300 uppercase tracking-widest font-mono font-bold">
              {restaurantMotto || 'Cloud POS Kasir'}
            </p>
          </div>

          {/* Core Panel Card */}
          <div className="w-full bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-7 shadow-2xl flex flex-col items-center space-y-6">
            
            <div className="text-center space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Pilih Operator Shift</h2>
              <p className="text-xs text-slate-500">Ketuk profil Anda lalu masukkan PIN keamanan</p>
            </div>

            {/* Profile Picker in Lock Screen */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {users.map((user) => {
                const isSelected = selectedLockUser.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedLockUser(user);
                      setLockPin('');
                      setPinError(null);
                    }}
                    className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer relative border ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/50 shadow-md scale-105'
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80'}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/20 object-cover shadow-sm"
                    />
                    <span className="text-[10px] sm:text-xs font-bold mt-2 truncate w-full">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider scale-90 mt-0.5 font-bold">
                      {user.role === 'admin' ? 'Admin' : 'Kasir'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="w-full border-t border-white/5 pt-4 flex flex-col items-center space-y-4">
              
              {/* PIN Code Dots Indicator */}
              <div className="flex flex-col items-center space-y-1.5 w-full">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                  Sandi Otorisasi PIN
                </span>
                
                <div className={`flex justify-center gap-4 py-2 ${isShaking ? 'shake-anim' : ''}`}>
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                        idx < lockPin.length
                          ? 'bg-indigo-400 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/40'
                          : 'border-white/20 bg-transparent'
                      }`}
                    />
                  ))}
                </div>

                {pinError && (
                  <span className="text-xs text-rose-400 font-semibold animate-pulse">
                    {pinError}
                  </span>
                )}
              </div>

              {/* PIN Virtual Number Pad */}
              <div className="grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinKeyPress(num)}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 hover:bg-white/15 active:bg-white/25 transition-all text-lg sm:text-xl font-extrabold flex items-center justify-center cursor-pointer border border-white/5 text-white"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Clear Button */}
                <button
                  onClick={() => handlePinKeyPress('clear')}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-transparent hover:bg-white/5 active:bg-white/10 transition-all text-xs font-bold flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"
                >
                  CLEAR
                </button>

                {/* Zero Button */}
                <button
                  onClick={() => handlePinKeyPress('0')}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 hover:bg-white/15 active:bg-white/25 transition-all text-lg sm:text-xl font-extrabold flex items-center justify-center cursor-pointer border border-white/5 text-white"
                >
                  0
                </button>

                {/* Delete/Backspace Button */}
                <button
                  onClick={() => handlePinKeyPress('delete')}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-transparent hover:bg-white/5 active:bg-white/10 transition-all text-xs font-bold flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"
                >
                  DELETE
                </button>
              </div>

            </div>

          </div>

          {/* Footer Lock Screen info */}
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-mono">
              Petunjuk PIN Bawaan: Admin (Hubungi WA / Menu About) | Kasino (33344) | Karsini (12345)
            </p>
            <p className="text-[9px] text-indigo-400/60 mt-1">
              * Sandi PIN dapat disesuaikan kapan saja lewat tab "Setup User Akses" jika Anda berwenang.
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans relative antialiased text-slate-800">
      
      {/* Offline Mode alert banner (Stays at the very top of view) */}
      {!isOnline && (
        <div className="bg-rose-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 animate-pulse shrink-0">
          <Wifi size={14} className="animate-bounce" />
          <span>SISTEM BERJALAN OFFLINE. Semua transaksi disimpan di database lokal aman dan akan disinkronisasi ketika koneksi kembali.</span>
        </div>
      )}

      {/* Primary header navbar */}
      <header className="bg-indigo-900 text-white shadow-sm py-3 px-4 sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            {/* Unified Hamburger toggle for the sidebar drawer */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-850 hover:bg-indigo-800 rounded-xl transition-all cursor-pointer border border-indigo-700/50"
              aria-label="Buka menu"
            >
              <Menu size={16} />
              <span className="text-xs font-bold hidden sm:inline">Menu</span>
            </button>

            {/* Restaurant brand logo */}
            <div className="flex items-center gap-2">
              <div className="bg-white text-indigo-950 p-1.5 rounded-xl font-black text-xs shadow-xs tracking-tight">
                QA
              </div>
              <div>
                <h1 className="font-extrabold text-sm md:text-base leading-none tracking-tight shimmer-text">{restaurantName}</h1>
                <span className="text-[10px] text-indigo-200 font-mono tracking-wider uppercase">{restaurantMotto || 'Cloud POS Kasir'}</span>
              </div>
            </div>
          </div>

          {/* Sync status controller and Profile controls */}
          <div className="flex items-center gap-3">
            {/* Online/Offline Simulator */}
            <OfflineSyncIndicator
              isOnline={isOnline}
              onToggleConnection={handleToggleConnection}
              pendingSyncCount={pendingSyncQueue.length}
              isSyncing={isSyncing}
              onManualSync={triggerSynchronization}
            />

            {/* Interactive Notifications Bell Badge */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="p-2 bg-indigo-800 hover:bg-indigo-700 rounded-xl relative transition-all cursor-pointer"
              aria-label="Buka notifikasi"
            >
              <Bell size={18} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-indigo-900 animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Current Active Employee Avatar Profile */}
            <div className="hidden sm:flex items-center gap-2 border-l border-indigo-800/60 pl-3">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80'}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border-2 border-indigo-800/50 object-cover"
              />
              <div className="text-left text-xs">
                <p className="font-bold leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-indigo-200 capitalize font-medium">{currentUser.role}</p>
              </div>
            </div>

            {/* Lock Terminal Button */}
            <button
              onClick={() => {
                setSelectedLockUser(currentUser);
                setIsLocked(true);
              }}
              className="p-2 bg-indigo-800 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-white border border-indigo-700/50"
              title="Kunci Layar POS / Ganti Shift"
            >
              <Lock size={15} />
              <span className="text-[10px] font-bold hidden md:inline">Kunci</span>
            </button>
          </div>

        </div>
      </header>

      {/* Dynamic scrolling marquee promo ticker */}
      <PromoTicker
        promos={promos}
        onApplyPromo={handleApplyTickerPromo}
      />

      {/* Main Responsive Layout Frame (Full width with sliding overlay drawer) */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 gap-6 overflow-hidden">
        
        {/* Navigation Sidebar Drawer panel (Fully animated overlay drawer on both mobile and desktop) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
              />

              {/* Drawer Content */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative bg-white w-72 h-full flex flex-col justify-between shadow-2xl border-r border-slate-200 z-50"
              >
                <div className="p-5 overflow-y-auto flex-1 space-y-6">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-600 text-white p-1.5 rounded-xl font-black text-xs shadow-xs tracking-tight">
                        QA
                      </div>
                      <span className="font-extrabold text-slate-900 text-sm">QA POS Menu</span>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1.5 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Navigation button arrays */}
                  <nav className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2">Kasir Utama</span>
                    
                    <button
                      onClick={() => { setActiveTab('kasir'); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'kasir'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ShoppingBag size={16} />
                      <span>Kasir POS Terminal</span>
                    </button>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 pt-4 mb-2">Manajemen Resto</span>

                    <button
                      onClick={() => { setActiveTab('stok'); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'stok'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Package size={16} />
                      <span>Setup Menu</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('pelanggan'); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'pelanggan'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Users size={16} />
                      <span>Database Customer</span>
                    </button>

                    {/* Lock analysis/reports for Cashier roles */}
                    {currentUser.role === 'admin' ? (
                      <button
                        onClick={() => { setActiveTab('laporan'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'laporan'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <BarChart3 size={16} />
                        <span>Laporan Keuangan</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 opacity-60 select-none">
                        <div className="flex items-center gap-3">
                          <BarChart3 size={16} />
                          <span>Laporan Keuangan</span>
                        </div>
                        <Shield size={12} className="text-slate-400" />
                      </div>
                    )}

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 pt-4 mb-2">Konfigurasi & Akses</span>

                    {/* Setup Toko & Cetak Struk */}
                    {currentUser.role === 'admin' ? (
                      <button
                        onClick={() => { setActiveTab('setup'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'setup'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Store size={16} />
                        <span>Setup Toko & Struk</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 opacity-60 select-none">
                        <div className="flex items-center gap-3">
                          <Store size={16} />
                          <span>Setup Toko & Struk</span>
                        </div>
                        <Shield size={12} className="text-slate-400" />
                      </div>
                    )}

                    <button
                      onClick={() => { setActiveTab('pengguna'); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'pengguna'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Settings size={16} />
                      <span>Setup User Akses</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('promo'); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'promo'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Ticket size={16} />
                      <span>Setup Promo & Diskon</span>
                    </button>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 pt-4 mb-2">Informasi</span>

                    {/* About QA POS button */}
                    <button
                      onClick={() => { setAboutOpen(true); setIsSidebarOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <Info size={16} className="text-indigo-600" />
                      <span>About QA Pos</span>
                    </button>

                    {/* Interactive HTML Documentation button */}
                    <a
                      href="/dokumentasi.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all cursor-pointer"
                    >
                      <BookOpen size={16} className="text-emerald-600" />
                      <span>Dokumentasi Sistem</span>
                    </a>

                    {/* Operational Marketing Guide button */}
                    <a
                      href="/panduan_operasional.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-750 transition-all cursor-pointer"
                    >
                      <Store size={16} className="text-indigo-600" />
                      <span>Buku Panduan Promosi (Bebas Kredensial)</span>
                    </a>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 pt-4 mb-2">Keamanan</span>

                    {/* Lock Terminal inside Sidebar */}
                    <button
                      onClick={() => {
                        setSelectedLockUser(currentUser);
                        setIsSidebarOpen(false);
                        setIsLocked(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
                    >
                      <Lock size={16} />
                      <span>Kunci Layar POS</span>
                    </button>
                  </nav>
                </div>

                {/* Cashier system footer status inside sidebar */}
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 p-4 font-mono bg-slate-50">
                  <div>Petugas: <span className="font-bold text-slate-700">{currentUser.name}</span></div>
                  <div>Format Struk: <span className="font-bold text-slate-700">{receiptConfig.paperWidth}</span></div>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* RIGHT Content workspace container panel */}
        <main className="flex-1 bg-transparent overflow-y-auto max-h-[82vh] pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'kasir' && (
                <OrderTerminal
                  products={products}
                  customers={customers}
                  promos={promos}
                  isOnline={isOnline}
                  currentUser={currentUser}
                  onProcessOrder={handleProcessOrder}
                  onApplyPromoCode={handleApplyPromoCode}
                  activePromoCodeFromTicker={tickerPromoCode}
                  onResetTickerPromo={() => setTickerPromoCode(null)}
                  restaurantName={restaurantName}
                  restaurantMotto={restaurantMotto}
                  receiptConfig={receiptConfig}
                />
              )}

              {activeTab === 'stok' && (
                <StockManager
                  products={products}
                  onUpdateProductStock={handleUpdateProductStock}
                  onEditProduct={handleEditProduct}
                  onAddProduct={handleAddProduct}
                  onDeleteProduct={handleDeleteProduct}
                  currentUserRole={currentUser.role}
                />
              )}

              {activeTab === 'pelanggan' && (
                <CustomerManager
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                  onImportCustomers={handleImportCustomers}
                />
              )}

              {activeTab === 'laporan' && (
                <SalesReport
                  orders={orders}
                  products={products}
                />
              )}

              {activeTab === 'setup' && (
                <ShopSetup
                  restaurantName={restaurantName}
                  restaurantMotto={restaurantMotto}
                  receiptConfig={receiptConfig}
                  currentUserRole={currentUser.role}
                  onSave={(name, motto, config) => {
                    setRestaurantName(name);
                    setRestaurantMotto(motto);
                    setReceiptConfig(config);
                  }}
                />
              )}

              {activeTab === 'pengguna' && (
                <UserAccessSetup
                  users={users}
                  currentUser={currentUser}
                  onSelectUser={(u) => {
                    setSelectedLockUser(u);
                    setIsLocked(true);
                  }}
                  onUpdateUserPin={handleUpdateUserPin}
                />
              )}

              {activeTab === 'promo' && (
                <PromoManager
                  promos={promos}
                  onAddPromo={handleAddPromo}
                  onEditPromo={handleEditPromo}
                  onDeletePromo={handleDeletePromo}
                  currentUserRole={currentUser.role}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* Modern Glassmorphic About Modal */}
      <AnimatePresence>
        {aboutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with strong blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAboutOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
            />

            {/* Glassmorphic card container */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-white/75 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-6 md:p-8 text-center overflow-hidden z-10"
            >
              {/* Abstract decorative floating bubble behind glass */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-300/35 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-200/35 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setAboutOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100/50 cursor-pointer z-20"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>

              {/* Logo / Icon */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-4 text-white text-2xl font-black tracking-tighter">
                QP
              </div>

              {/* Header: All Caps QA POS */}
              <h2 className="text-3xl font-black text-slate-900 tracking-wider mb-1.5 uppercase font-sans">
                QA POS
              </h2>

              {/* Subheading: Solusi cetak struk transaksi UMKM */}
              <p className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider mb-5">
                solusi cetak struk transaksi UMKM
              </p>

              {/* Main App Description */}
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 backdrop-blur-xs p-4 rounded-2xl border border-white/30 text-center space-y-2 mb-5">
                <p className="font-semibold text-slate-800">
                  Aplikasi pencatat transaksi usaha (UMKM) sederhana.
                </p>
                <p>
                  Sangat mudah digunakan dan memiliki fitur customer database.
                </p>
              </div>

              {/* Supporting entity details */}
              <div className="space-y-3 mb-6 flex flex-col items-center">
                <p className="text-xs font-extrabold text-slate-900 tracking-wide">
                  Digital Aspikmas Kembaran
                </p>
                <p className="text-[11px] font-medium text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100 animate-pulse">
                  Selamat menggunakan.
                </p>
                
                {/* Link to view HTML documentation */}
                <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
                  <a
                    href="/dokumentasi.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider transition-all shadow-xs hover:shadow-md hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    <BookOpen size={12} />
                    <span>Buku Panduan Utama</span>
                  </a>
                  
                  <a
                    href="/panduan_operasional.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider transition-all shadow-xs hover:shadow-md hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    <Store size={12} />
                    <span>Brosur & Panduan Promosi</span>
                  </a>
                </div>
              </div>

              {/* Divider line */}
              <div className="border-t border-slate-200/50 my-4" />

              {/* Footer WhatsApp Contact */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  info lebih lanjut silakan whatsapp
                </p>
                
                <a
                  href="https://wa.me/6288806667171"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <MessageSquare size={14} className="fill-white/20" />
                  <span>+62 888 0666 7171</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating sliding notification center */}
      <NotificationCenter
        notifications={notifications}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAllNotifications}
      />

    </div>
  );
}
