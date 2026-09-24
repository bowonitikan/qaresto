import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, CartItem, Customer, Promo, Order, User } from '../types';
import { formatIDR } from '../utils';
import { Search, Plus, Minus, Trash2, ShoppingCart, User as UserIcon, Ticket, Check, RefreshCw, Sparkles, Smile, MessageSquare, CreditCard, Ban, ShieldAlert, KeyRound } from 'lucide-react';
import ThermalReceipt from './ThermalReceipt';

interface ReceiptConfig {
  address: string;
  phone: string;
  headerMessage: string;
  footerMessage: string;
  showLogo: boolean;
  paperWidth: '80mm' | '58mm';
}

interface OrderTerminalProps {
  products: Product[];
  customers: Customer[];
  promos: Promo[];
  isOnline: boolean;
  currentUser: { name: string; role: string };
  users: User[];
  onProcessOrder: (order: Omit<Order, 'id' | 'invoiceNumber' | 'date'>, customerId?: string) => Order;
  onApplyPromoCode: (code: string) => Promo | null;
  activePromoCodeFromTicker: string | null;
  onResetTickerPromo: () => void;
  restaurantName: string;
  restaurantMotto: string;
  receiptConfig: ReceiptConfig;
}

export default function OrderTerminal({
  products,
  customers,
  promos,
  isOnline,
  currentUser,
  users,
  onProcessOrder,
  onApplyPromoCode,
  activePromoCodeFromTicker,
  onResetTickerPromo,
  restaurantName,
  restaurantMotto,
  receiptConfig,
}: OrderTerminalProps) {
  // Navigation tabs for Categories
  const [selectedCategory, setSelectedCategory] = useState<Category>('Coffee');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Debit' | 'QRIS' | 'Kredit'>('Cash');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [itemNotes, setItemNotes] = useState<{ [productId: string]: string }>({});

  // Void Item & Order state (with passcode authorization for cashiers)
  const [pendingVoidAction, setPendingVoidAction] = useState<{
    label: string;
    execute: () => void;
  } | null>(null);
  const [voidPin, setVoidPin] = useState('');
  const [voidPinError, setVoidPinError] = useState<string | null>(null);

  // Track total items voided during this cashier terminal session
  const [voidedItemsCount, setVoidedItemsCount] = useState<number>(0);

  const requestVoidAction = (label: string, action: () => void) => {
    setPendingVoidAction({
      label,
      execute: action
    });
    setVoidPin('');
    setVoidPinError(null);
  };

  const handleVerifyVoidPin = (e: React.FormEvent) => {
    e.preventDefault();
    setVoidPinError(null);
    
    // Check if entered pin belongs to an admin user
    const adminUser = users.find(u => u.role === 'admin' && u.pin === voidPin);
    if (adminUser) {
      if (pendingVoidAction) {
        pendingVoidAction.execute();
      }
      setPendingVoidAction(null);
      setVoidPin('');
    } else {
      setVoidPinError('PIN Admin tidak valid. Otorisasi void ditolak!');
    }
  };

  // Mobile viewport view switch: 'menu' or 'cart'
  const [mobileTab, setMobileTab] = useState<'menu' | 'cart'>('menu');

  // Completed order popup (for receipt triggers)
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Selected customer object helper
  const activeCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Handle applied promo from ticker
  useEffect(() => {
    if (activePromoCodeFromTicker) {
      const promo = onApplyPromoCode(activePromoCodeFromTicker);
      if (promo) {
        setAppliedPromo(promo);
        setPromoCodeInput(activePromoCodeFromTicker);
        setPromoError(null);
      }
      onResetTickerPromo(); // clear ticker request
    }
  }, [activePromoCodeFromTicker, onApplyPromoCode, onResetTickerPromo]);

  // Filter products by selected category and search input
  const filteredProducts = products.filter(p => {
    const matchCategory = p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Cart operations
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        // Enforce maximum stock limit
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.product.id === productId);
      if (!item) return prev;
      const targetQty = item.quantity + delta;
      
      if (targetQty <= 0) {
        return prev.filter(i => i.product.id !== productId);
      }
      // Enforce stock bounds
      if (targetQty > item.product.stock) return prev;

      return prev.map(i =>
        i.product.id === productId ? { ...i, quantity: targetQty } : i
      );
    });
  };

  const handleUpdateNotes = (productId: string, notes: string) => {
    setItemNotes(prev => ({ ...prev, [productId]: notes }));
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, notes } : item
    ));
  };

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cart]);

  const loyaltyDiscountAmount = useMemo(() => {
    if (!activeCustomer) return 0;
    // Automatic 10% loyalty discount for registered member
    return Math.floor(subtotal * 0.10);
  }, [activeCustomer, subtotal]);

  const promoDiscountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (subtotal < appliedPromo.minPurchase) return 0;
    return Math.floor((subtotal * appliedPromo.discountPercent) / 100);
  }, [appliedPromo, subtotal]);

  const discountAmount = useMemo(() => {
    return loyaltyDiscountAmount + promoDiscountAmount;
  }, [loyaltyDiscountAmount, promoDiscountAmount]);

  const taxAmount = useMemo(() => {
    const taxedBase = Math.max(0, subtotal - discountAmount);
    return Math.floor(taxedBase * 0.1); // 10% tax
  }, [subtotal, discountAmount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount) + taxAmount;
  }, [subtotal, discountAmount, taxAmount]);

  // Handle Manual Promo Code Application
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const promo = onApplyPromoCode(promoCodeInput);
    if (promo) {
      if (subtotal < promo.minPurchase) {
        setPromoError(`Minimal belanja untuk promo ini adalah ${formatIDR(promo.minPurchase)}`);
        setAppliedPromo(null);
      } else {
        setAppliedPromo(promo);
        setPromoError(null);
      }
    } else {
      setPromoError('Kode promo tidak ditemukan.');
      setAppliedPromo(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError(null);
  };

  // Cancel overall cart
  const handleCancelOrder = () => {
    setCart([]);
    setSelectedCustomerId('');
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError(null);
  };

  // Place/Process the Billing
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessingCheckout(true);

    try {
      const cashReceivedVal = paymentMethod === 'Cash' ? (Number(cashReceivedInput) || grandTotal) : undefined;
      const changeAmountVal = cashReceivedVal !== undefined ? Math.max(0, cashReceivedVal - grandTotal) : undefined;

      // Package order
      const orderPayload = {
        items: cart.map(item => ({
          ...item,
          notes: itemNotes[item.product.id] || ''
        })),
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        grandTotal,
        paymentMethod,
        cashier: currentUser.name,
        status: 'success' as const,
        cashReceived: cashReceivedVal,
        changeAmount: changeAmountVal
      };

      const completedOrder = onProcessOrder(orderPayload, selectedCustomerId || undefined);
      setLastOrder(completedOrder);
      
      // Delay slightly for high-fidelity loading experience
      setTimeout(() => {
        setIsProcessingCheckout(false);
        setShowReceipt(true);
        // Clear Cart
        setCart([]);
        setSelectedCustomerId('');
        setAppliedPromo(null);
        setPromoCodeInput('');
        setItemNotes({});
        setCashReceivedInput('');
      }, 1200);

    } catch (error) {
      console.error(error);
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div id="pos-terminal-layout" className="grid grid-cols-12 gap-4 min-h-[75vh]">
      
      {/* LEFT: Product Grid Area (Cols 1-3 renamed to side-by-side grid) */}
      <div className="col-span-12 landscape:col-span-7 md:col-span-8 space-y-4">
        {/* Search menu */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari makanan atau minuman..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all shadow-xs"
          />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[58vh] overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400">
              Menu tidak ditemukan. Coba kategori lain.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const inCartItem = cart.find(i => i.product.id === p.id);
              const qtyInCart = inCartItem ? inCartItem.quantity : 0;
              const isLowStock = p.stock <= p.minStock;
              const isOutOfStock = p.stock === 0;

              return (
                <button
                  key={p.id}
                  onClick={() => handleAddToCart(p)}
                  disabled={isOutOfStock}
                  className={`bg-white rounded-2xl border text-left overflow-hidden transition-all flex flex-col justify-between group cursor-pointer relative h-56 ${
                    isOutOfStock 
                      ? 'border-slate-200 opacity-60' 
                      : qtyInCart > 0 
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' 
                        : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Image panel */}
                    <div className="h-28 w-full relative overflow-hidden bg-slate-100">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Quantity in Cart Badge Overlay */}
                      {qtyInCart > 0 && (
                        <div className="absolute top-2.5 right-2.5 bg-indigo-600 text-white text-xs font-bold w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                          {qtyInCart}
                        </div>
                      )}

                      {/* Stock Warning Indicators Overlay */}
                      {isOutOfStock ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-black uppercase">
                          Habis
                        </div>
                      ) : isLowStock ? (
                        <div className="absolute bottom-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5 shadow-sm">
                          Terbatas ({p.stock})
                        </div>
                      ) : null}
                    </div>

                    {/* Meta Panel */}
                    <div className="p-3 space-y-1">
                      <span className="font-bold text-gray-900 text-xs line-clamp-2 leading-tight">
                        {p.name}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 pt-0 flex justify-between items-center w-full">
                    <span className="text-indigo-600 font-extrabold text-sm font-mono leading-none">
                      {formatIDR(p.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Stok: {p.stock}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Categories Scrolling Footer Tabs (matches screen guidelines) */}
        <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-xs flex gap-2 overflow-x-auto">
          {([
            { id: 'Coffee', label: 'Kopi', emoji: '☕' },
            { id: 'Beverages', label: 'Minuman', emoji: '🍹' },
            { id: 'Food', label: 'Makanan', emoji: '🍛' },
            { id: 'Snacks', label: 'Camilan', emoji: '🍟' },
            { id: 'Desserts', label: 'Pencuci Mulut', emoji: '🍦' }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Billing & Checkout Area (Col span 5 on mobile/tablet, 4 on desktop) */}
      <div className="col-span-12 landscape:col-span-5 md:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between h-full">
        
        <div>
          {/* Section title */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-3.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
              <ShoppingCart className="text-indigo-600" size={18} />
              Struk Checkout
            </h3>
            <div className="flex gap-1.5 items-center">
              {voidedItemsCount > 0 && (
                <span className="text-[10px] bg-rose-50 text-rose-650 border border-rose-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 animate-pulse" title="Total item yang di-void dalam sesi kasir ini untuk transparansi audit">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-550 animate-ping"></span>
                  Void: {voidedItemsCount}
                </span>
              )}
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono font-bold">
                Item: {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
          </div>

          {/* Customer Selection profiling */}
          <div className="mb-4 space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Loyalty</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden"
              >
                <option value="">Walk-In / Non-Member</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.points} Pts
                  </option>
                ))}
              </select>
            </div>

            {/* Display Customer preference trigger if selected */}
            {activeCustomer && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 flex gap-2 items-start animate-fade-in shadow-xs">
                <Smile className="text-amber-500 shrink-0 mt-0.5" size={14} />
                <div className="space-y-0.5">
                  <p className="font-bold uppercase tracking-wide text-[9px] text-amber-800">Catatan Preferensi Pelanggan:</p>
                  <p className="italic font-semibold">"{activeCustomer.preferences}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Cart list layout */}
          <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1 mb-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs italic">
                Keranjang kosong. Pilih menu kuliner di samping kiri untuk memesan.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="p-2 border border-gray-100 rounded-xl space-y-1.5 text-xs hover:border-gray-200 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 leading-tight">{item.product.name}</h4>
                      <span className="text-[10px] text-gray-400 font-mono">{formatIDR(item.product.price)} / porsi</span>
                    </div>

                    <span className="font-bold text-gray-900 font-mono text-xs">
                      {formatIDR(item.product.price * item.quantity)}
                    </span>
                  </div>

                  {/* Note field & adjustment panel */}
                  <div className="flex gap-2 items-center justify-between">
                    {/* Notes Trigger Input */}
                    <div className="flex items-center gap-1 flex-1">
                      <MessageSquare size={12} className="text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tambahkan catatan khusus..."
                        value={itemNotes[item.product.id] || ''}
                        onChange={(e) => handleUpdateNotes(item.product.id, e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-slate-250 focus:border-indigo-600 focus:outline-hidden text-[10px] text-slate-500 w-full"
                      />
                    </div>

                    {/* Adjust Panel */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (item.quantity === 1) {
                            requestVoidAction(
                              `kurangi & hapus "${item.product.name}" dari pesanan`,
                              () => {
                                handleUpdateQuantity(item.product.id, -1);
                                setVoidedItemsCount(prev => prev + 1);
                              }
                            );
                          } else {
                            handleUpdateQuantity(item.product.id, -1);
                          }
                        }}
                        className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="font-mono font-bold text-xs w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        onClick={() => {
                          requestVoidAction(
                            `hapus menu "${item.product.name}" dari pesanan`,
                            () => {
                              handleRemoveFromCart(item.product.id);
                              setVoidedItemsCount(prev => prev + item.quantity);
                            }
                          );
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors ml-1 cursor-pointer"
                        title="Hapus dari keranjang (Void)"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Promo Code Coupon Area */}
        <div className="border-t border-gray-100 pt-3 mb-3">
          <form onSubmit={handleApplyPromo} className="flex gap-2 text-xs">
            <div className="relative flex-1">
              <Ticket className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                type="text"
                placeholder="Kode Promo (e.g. JUMAT15)"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase"
              />
            </div>
            {appliedPromo ? (
              <button
                type="button"
                onClick={handleRemovePromo}
                className="bg-rose-50 border border-rose-200 text-rose-600 font-bold px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-rose-100 text-xs"
              >
                Hapus
              </button>
            ) : (
              <button
                type="submit"
                disabled={!promoCodeInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs"
              >
                Terapkan
              </button>
            )}
          </form>

          {promoError && (
            <p className="text-[10px] text-rose-600 mt-1 font-semibold">{promoError}</p>
          )}

          {appliedPromo && (
            <div className="mt-1.5 bg-indigo-50 border border-indigo-150 p-2.5 rounded-xl text-[10px] text-indigo-900 animate-fade-in shadow-xs space-y-1.5">
              <div className="flex justify-between items-center border-b border-indigo-100/50 pb-1 mb-1">
                <span className="font-bold uppercase tracking-wider text-[9px] text-indigo-700">PROMO AKTIF</span>
                <span className="font-mono font-black text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                  -{appliedPromo.discountPercent}%
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="font-extrabold text-slate-900">{appliedPromo.title}</p>
                <p className="text-slate-500 font-medium text-[9px] leading-relaxed">{appliedPromo.description}</p>
                <p className="text-[9px] font-mono font-bold text-indigo-700 mt-1.5 bg-indigo-100/65 px-2 py-1 rounded-lg inline-block">
                  Kode Promo: <span className="font-extrabold uppercase">{appliedPromo.code}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Financial calculation details summary */}
        <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatIDR(subtotal)}</span>
          </div>

          {loyaltyDiscountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50/50 p-1.5 rounded-lg animate-fade-in">
              <span>Diskon Loyalty (10%):</span>
              <span className="font-mono font-bold">-{formatIDR(loyaltyDiscountAmount)}</span>
            </div>
          )}

          {promoDiscountAmount > 0 && (
            <div className="flex justify-between text-indigo-600 font-semibold bg-indigo-50/50 p-1.5 rounded-lg animate-fade-in">
              <span>Diskon Promo ({appliedPromo?.discountPercent}%):</span>
              <span className="font-mono font-bold">-{formatIDR(promoDiscountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500">
            <span>Pajak Restoran (10%):</span>
            <span className="font-mono font-semibold">{formatIDR(taxAmount)}</span>
          </div>

          <div className="flex justify-between font-bold text-slate-950 text-base border-t border-dashed border-slate-200 pt-2 pb-1">
            <span>Grand Total:</span>
            <span className="font-mono text-indigo-600">{formatIDR(grandTotal)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Metode Pembayaran</span>
            <div className="grid grid-cols-4 gap-1.5 text-[10px]">
              {(['Cash', 'Debit', 'QRIS', 'Kredit'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 rounded-lg border font-bold transition-all text-center cursor-pointer ${
                    paymentMethod === method
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {method === 'Cash' ? 'TUNAI' : method}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'Cash' && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5 mt-2 animate-fade-in text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Nominal Uang Diterima:</span>
                <span className="text-[10px] text-slate-400 font-medium">Ketik atau Pilih tombol cepat</span>
              </div>
              
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">Rp</span>
                <input
                  type="text"
                  placeholder={grandTotal.toString()}
                  value={cashReceivedInput}
                  onChange={(e) => setCashReceivedInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-right text-indigo-750 focus:outline-hidden focus:border-indigo-600 transition-all text-xs"
                />
              </div>

              {/* Quick Suggestion Buttons: 20k, 50k, 100k, 300k, Pas */}
              <div className="grid grid-cols-5 gap-1 text-[10px]">
                {([20000, 50000, 100000, 300000] as const).map((amount) => {
                  const isDisabled = amount < grandTotal;
                  return (
                    <button
                      key={amount}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setCashReceivedInput(amount.toString())}
                      className={`py-1 rounded-md border font-semibold transition-all text-center cursor-pointer ${
                        isDisabled
                          ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                          : cashReceivedInput === amount.toString()
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {amount / 1000}k
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCashReceivedInput(grandTotal.toString())}
                  className={`py-1 rounded-md border font-bold transition-all text-center cursor-pointer ${
                    cashReceivedInput === grandTotal.toString()
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Pas
                </button>
              </div>

              {/* Change calculator display (Kembalian) */}
              {(() => {
                const cashAmt = Number(cashReceivedInput) || 0;
                const changeAmt = cashAmt - grandTotal;
                return (
                  <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2 text-xs">
                    <span className="font-bold text-slate-600">Uang Kembalian:</span>
                    <span className={`font-mono font-extrabold text-sm ${changeAmt >= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {changeAmt >= 0 ? formatIDR(changeAmt) : 'Rp 0'}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Core Checkout Buttons */}
          <div className="grid grid-cols-5 gap-2 pt-3">
            <button
              onClick={() => {
                const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
                requestVoidAction('membatalkan seluruh pesanan saat ini', () => {
                  handleCancelOrder();
                  setVoidedItemsCount(prev => prev + totalQty);
                });
              }}
              disabled={cart.length === 0}
              className="col-span-1 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
              title="Batalkan Pesanan (Void)"
            >
              <Ban size={16} />
            </button>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessingCheckout}
              className="col-span-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
            >
              {isProcessingCheckout ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Memproses Kasir...</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>BAYAR ({formatIDR(grandTotal)})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Embedded thermal receipt popup */}
      {showReceipt && (
        <ThermalReceipt
          order={lastOrder}
          customer={activeCustomer}
          onClose={() => setShowReceipt(false)}
          restaurantName={restaurantName}
          restaurantMotto={restaurantMotto}
          receiptConfig={receiptConfig}
        />
      )}

      {/* Void Item / Order Custom Confirmation & Authorization Modal */}
      {pendingVoidAction && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-xs text-slate-900">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="space-y-4">
              
              {/* Icon & Title */}
              <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-2">
                <ShieldAlert size={24} className="animate-bounce" />
              </div>
              
              <div className="text-center space-y-1.5">
                <h3 className="font-extrabold text-slate-950 text-base">Otorisasi Void Item / Pesanan</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Konfirmasi pembatalan pesanan yang belum terselesaikan.
                </p>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Tindakan Void:</span>
                  <span className="font-bold text-xs text-slate-800 capitalize">"{pendingVoidAction.label}"</span>
                </div>
              </div>

              {currentUser.role === 'admin' ? (
                // ADMIN: Direct clearance confirmation
                <div className="space-y-3 pt-2">
                  <p className="text-center text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100">
                    ✓ Anda masuk sebagai Admin. Otorisasi instan disetujui.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPendingVoidAction(null)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        pendingVoidAction.execute();
                        setPendingVoidAction(null);
                      }}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-sm shadow-rose-100"
                    >
                      Ya, Lakukan Void
                    </button>
                  </div>
                </div>
              ) : (
                // CASHIER: Needs PIN Authorization
                <form onSubmit={handleVerifyVoidPin} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-center">
                      <KeyRound size={11} className="text-indigo-600" />
                      Sandi PIN Otorisasi Admin
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      placeholder="Masukkan PIN Admin (e.g. 54321)"
                      value={voidPin}
                      onChange={(e) => {
                        setVoidPin(e.target.value.replace(/\D/g, ''));
                        setVoidPinError(null);
                      }}
                      autoFocus
                      className="w-full text-center tracking-widest font-mono font-bold text-lg bg-slate-50 border border-slate-200 rounded-xl py-2 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                    />
                    {voidPinError && (
                      <p className="text-[10px] text-rose-600 font-bold text-center animate-pulse">{voidPinError}</p>
                    )}
                  </div>

                  {/* Easy Touch Screen Numeric Keypad */}
                  <div className="grid grid-cols-3 gap-1 px-4 max-w-[220px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setVoidPin(prev => (prev + num).slice(0, 8));
                          setVoidPinError(null);
                        }}
                        className="py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-200/65 active:scale-95 transition-all cursor-pointer flex items-center justify-center font-mono"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setVoidPin('')}
                      className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] rounded-lg border border-slate-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center font-sans"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoidPin(prev => (prev + '0').slice(0, 8));
                        setVoidPinError(null);
                      }}
                      className="py-1 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center font-mono"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoidPin(prev => prev.slice(0, -1));
                        setVoidPinError(null);
                      }}
                      className="py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] rounded-lg border border-slate-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center font-sans"
                    >
                      Del
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPendingVoidAction(null)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!voidPin}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-sm shadow-rose-100"
                    >
                      Autorisasi Void
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
