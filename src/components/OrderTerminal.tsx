import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, CartItem, Customer, Promo, Order } from '../types';
import { formatIDR } from '../utils';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, Ticket, Check, RefreshCw, Sparkles, Smile, MessageSquare, CreditCard, Ban } from 'lucide-react';
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
  const [itemNotes, setItemNotes] = useState<{ [productId: string]: string }>({});

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
    if (confirm('Apakah Anda yakin ingin membatalkan pesanan saat ini?')) {
      setCart([]);
      setSelectedCustomerId('');
      setAppliedPromo(null);
      setPromoCodeInput('');
      setPromoError(null);
    }
  };

  // Place/Process the Billing
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessingCheckout(true);

    try {
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
        status: 'success' as const
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
      }, 1200);

    } catch (error) {
      console.error(error);
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div id="pos-terminal-layout" className="grid grid-cols-12 gap-4 min-h-[75vh]">
      
      {/* LEFT: Product Grid Area (Cols 1-3 renamed to side-by-side grid) */}
      <div className="col-span-7 md:col-span-8 space-y-4">
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
      <div className="col-span-5 md:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between h-full">
        
        <div>
          {/* Section title */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-3.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm md:text-base">
              <ShoppingCart className="text-indigo-600" size={18} />
              Struk Checkout
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
              Item: {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </div>

          {/* Customer Selection profiling */}
          <div className="mb-4 space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Loyalty</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
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
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="font-mono font-bold text-xs w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors ml-1"
                        title="Hapus dari keranjang"
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
            <div className="mt-1.5 bg-indigo-50 border border-indigo-100 p-1.5 rounded-lg flex justify-between items-center text-[10px] text-indigo-800 animate-fade-in shadow-xs">
              <span className="font-semibold">{appliedPromo.title} AKTIF</span>
              <span className="font-bold">Potongan -{appliedPromo.discountPercent}%</span>
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

          {/* Core Checkout Buttons */}
          <div className="grid grid-cols-5 gap-2 pt-3">
            <button
              onClick={handleCancelOrder}
              disabled={cart.length === 0}
              className="col-span-1 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
              title="Batalkan Pesanan"
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

    </div>
  );
}
