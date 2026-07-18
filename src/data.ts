import { Product, Promo, Customer, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // COFFEE
  {
    id: 'p1',
    name: 'Kopi Susu Aren Gula Merah',
    price: 18000,
    category: 'Coffee',
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400',
    stock: 45,
    minStock: 10,
    description: 'Kopi espresso robusta dengan paduan susu segar dan sirup gula aren murni khas nusantara.'
  },
  {
    id: 'p2',
    name: 'Caramel Macchiato Ice',
    price: 28000,
    category: 'Coffee',
    imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&q=80&w=400',
    stock: 8, // Low stock on purpose to trigger warning notifications
    minStock: 10,
    description: 'Espresso blend lembut dengan susu vanilla hangat dan sirup caramel premium yang melimpah.'
  },
  {
    id: 'p3',
    name: 'Cafe Latte Classic',
    price: 24000,
    category: 'Coffee',
    imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?auto=format&fit=crop&q=80&w=400',
    stock: 30,
    minStock: 5,
    description: 'Satu shot espresso premium dipadu susu microfoam tebal bermotif latte art.'
  },
  {
    id: 'p4',
    name: 'Espresso Single Shot',
    price: 15000,
    category: 'Coffee',
    imageUrl: 'https://images.unsplash.com/photo-1510707513156-46c49f9dfced?auto=format&fit=crop&q=80&w=400',
    stock: 100,
    minStock: 15,
    description: 'Ekstraksi murni biji kopi arabika pilihan dengan crema tebal dan aroma intens.'
  },

  // BEVERAGES
  {
    id: 'p5',
    name: 'Es Teh Manis Jumbo',
    price: 8000,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=400',
    stock: 120,
    minStock: 20,
    description: 'Teh melati seduh tradisional dengan rasa manis gula pasir asli, disajikan dingin segar.'
  },
  {
    id: 'p6',
    name: 'Avocado Juice Special',
    price: 20000,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400',
    stock: 5, // Low stock
    minStock: 8,
    description: 'Jus buah alpukat mentega segar disiram susu kental manis cokelat premium.'
  },
  {
    id: 'p7',
    name: 'Lemon Tea Ice',
    price: 12000,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400',
    stock: 60,
    minStock: 10,
    description: 'Perpaduan teh berkualitas tinggi dengan kesegaran perasan jeruk lemon asli.'
  },

  // FOOD
  {
    id: 'p8',
    name: 'Nasi Goreng Spesial Resto',
    price: 25000,
    category: 'Food',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400',
    stock: 50,
    minStock: 12,
    description: 'Nasi goreng bumbu jawa otentik disajikan dengan telur mata sapi, ayam suwir, acar dan kerupuk.'
  },
  {
    id: 'p9',
    name: 'Mie Goreng Jawa Klasik',
    price: 22000,
    category: 'Food',
    imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400',
    stock: 40,
    minStock: 10,
    description: 'Mie basah tebal ditumis bumbu kemiri khas Jawa Tengah, sayuran kol, sawi, telur, ayam.'
  },
  {
    id: 'p10',
    name: 'Ayam Goreng Kalasan Madu',
    price: 28000,
    category: 'Food',
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=400',
    stock: 3, // Very low stock
    minStock: 10,
    description: 'Satu potong ayam kampung bumbu ungkep Kalasan manis gurih, disajikan dengan sambal bajak.'
  },
  {
    id: 'p11',
    name: 'Sate Ayam Madura (10 tusuk)',
    price: 30000,
    category: 'Food',
    imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=400',
    stock: 25,
    minStock: 8,
    description: 'Daging ayam fillet empuk dibakar arang tradisional dengan siraman bumbu kacang gurih pedas.'
  },

  // SNACKS
  {
    id: 'p12',
    name: 'Kentang Goreng Mayo Crinkle',
    price: 15000,
    category: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400',
    stock: 40,
    minStock: 10,
    description: 'Kentang potong bergelombang renyah gurih ditaburi garam laut, saus sambal dan mayonnaise.'
  },
  {
    id: 'p13',
    name: 'Pisang Goreng Keju Caramel',
    price: 14000,
    category: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=400',
    stock: 35,
    minStock: 8,
    description: 'Pisang tanduk goreng tepung crispy disiram kental manis caramel dan parutan keju cheddar tebal.'
  },
  {
    id: 'p14',
    name: 'Cireng Crispy Bumbu Rujak',
    price: 12000,
    category: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=400',
    stock: 4, // Low stock
    minStock: 8,
    description: 'Renyahnya cireng tapioka khas Sunda disajikan hangat dengan cocolan saus gula merah asam pedas.'
  },

  // DESSERTS
  {
    id: 'p15',
    name: 'Es Campur Resto Premium',
    price: 18000,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=400',
    stock: 30,
    minStock: 5,
    description: 'Campuran alpukat, kelapa muda, nangka segar, cincau hitam, pacar cina, kolang kaling dengan es serut.'
  },
  {
    id: 'p16',
    name: 'Waffle Ice Cream Double Scoop',
    price: 22000,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=400',
    stock: 20,
    minStock: 5,
    description: 'Waffle panggang gurih disajikan dengan satu scoop es krim vanilla dan satu scoop es krim cokelat.'
  }
];

export const INITIAL_PROMOS: Promo[] = [
  {
    id: 'pr1',
    title: 'PROMO JUMAT BERKAH',
    description: 'Diskon 15% makanan minimal belanja Rp 50.000 (Kode: JUMAT15)',
    code: 'JUMAT15',
    discountPercent: 15,
    minPurchase: 50000,
    active: true
  },
  {
    id: 'pr2',
    title: 'DISKON SCAN QRIS SEHAT',
    description: 'Diskon 10% transaksi via QRIS minimal belanja Rp 20.000 (Kode: QRIS10)',
    code: 'QRIS10',
    discountPercent: 10,
    minPurchase: 20000,
    active: true
  },
  {
    id: 'pr3',
    title: 'PROMO ULANG TAHUN POS',
    description: 'Potongan spesial 20% bagi pelanggan terdaftar di sistem! (Kode: HUTPOS20)',
    code: 'HUTPOS20',
    discountPercent: 20,
    minPurchase: 30000,
    active: true
  },
  {
    id: 'pr4',
    title: 'DISKON MEMBER SETIA',
    description: 'Diskon 5% untuk pelanggan loyal tanpa minimal belanja! (Kode: MEMBER5)',
    code: 'MEMBER5',
    discountPercent: 5,
    minPurchase: 0,
    active: true
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi.santoso@gmail.com',
    preferences: 'Kopi kurang manis, es batu melimpah',
    points: 120,
    orderCount: 12,
    totalSpent: 340000,
    joinDate: '2026-01-15'
  },
  {
    id: 'c2',
    name: 'Siti Aminah',
    phone: '085789012345',
    email: 'siti.aminah@yahoo.com',
    preferences: 'Ayam bagian paha bawah, sambal dipisah, minta lalapan banyak',
    points: 245,
    orderCount: 21,
    totalSpent: 620000,
    joinDate: '2026-02-10'
  },
  {
    id: 'c3',
    name: 'Andi Wijaya',
    phone: '089876543210',
    email: 'andi.wijaya@outlook.com',
    preferences: 'Tanpa bawang daun & seledri pada Nasi/Mie Goreng',
    points: 40,
    orderCount: 4,
    totalSpent: 110000,
    joinDate: '2026-05-18'
  },
  {
    id: 'c4',
    name: 'Dewi Lestari',
    phone: '081344556677',
    email: 'dewi.lestari@gmail.com',
    preferences: 'Es Teh tawar, sate ayam bumbu kacang dipisah',
    points: 95,
    orderCount: 9,
    totalSpent: 220000,
    joinDate: '2026-06-01'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin Utama',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
    pin: '54321'
  },
  {
    id: 'u2',
    name: 'Kasino (Kasir Shift A)',
    role: 'cashier',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
    pin: '33344'
  },
  {
    id: 'u3',
    name: 'Karsini (Kasir Shift B)',
    role: 'cashier',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
    pin: '12345'
  }
];
