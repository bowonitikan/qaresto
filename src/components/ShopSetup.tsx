import React, { useState, FormEvent } from 'react';
import { Store, Printer, Save, CheckCircle2, RotateCcw, AlertCircle, FileText, Image, Phone } from 'lucide-react';
import { formatIDR } from '../utils';

interface ReceiptConfig {
  address: string;
  phone: string;
  headerMessage: string;
  footerMessage: string;
  showLogo: boolean;
  paperWidth: '80mm' | '58mm';
}

interface ShopSetupProps {
  restaurantName: string;
  restaurantMotto: string;
  receiptConfig: ReceiptConfig;
  onSave: (name: string, motto: string, config: ReceiptConfig) => void;
  currentUserRole: 'admin' | 'cashier';
}

export default function ShopSetup({
  restaurantName: initialName,
  restaurantMotto: initialMotto,
  receiptConfig: initialConfig,
  onSave,
  currentUserRole,
}: ShopSetupProps) {
  const isAdmin = currentUserRole === 'admin';

  // State values
  const [name, setName] = useState(initialName);
  const [motto, setMotto] = useState(initialMotto);
  const [address, setAddress] = useState(initialConfig.address);
  const [phone, setPhone] = useState(initialConfig.phone);
  const [headerMessage, setHeaderMessage] = useState(initialConfig.headerMessage);
  const [footerMessage, setFooterMessage] = useState(initialConfig.footerMessage);
  const [showLogo, setShowLogo] = useState(initialConfig.showLogo);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(initialConfig.paperWidth);

  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    onSave(name, motto, {
      address,
      phone,
      headerMessage,
      footerMessage,
      showLogo,
      paperWidth,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handleReset = () => {
    setName(initialName);
    setMotto(initialMotto);
    setAddress(initialConfig.address);
    setPhone(initialConfig.phone);
    setHeaderMessage(initialConfig.headerMessage);
    setFooterMessage(initialConfig.footerMessage);
    setShowLogo(initialConfig.showLogo);
    setPaperWidth(initialConfig.paperWidth);
  };

  // Mock dummy order data for the live receipt preview
  const previewItems = [
    { name: 'Kopi Susu Gula Aren', qty: 2, price: 18000 },
    { name: 'Ayam Kalasan Madu', qty: 1, price: 25000 },
    { name: 'Mendoan Crispy', qty: 1, price: 12000 },
  ];
  const previewSubtotal = 73000;
  const previewDiscount = 5000;
  const previewTax = 6800;
  const previewTotal = 74800;

  return (
    <div id="shop-setup-tab" className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="text-indigo-600" size={24} />
            Setup Toko & Desain Struk
          </h2>
          <p className="text-xs text-slate-500">
            {isAdmin 
              ? 'Sesuaikan nama restoran, motto, informasi kontak, dan format tampilan struk cetak thermal Anda.' 
              : 'Pantau konfigurasi identitas restoran & struk saat ini. (Mode Akses Kasir Terbatas: Edit dinonaktifkan)'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Input Form Panel (Cols 1-3) */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="text-indigo-600" size={16} />
              Identitas & Parameter Toko
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Restaurant Name */}
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Nama Restoran / Cafe *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: QA Pos Resto"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 font-medium"
              />
            </div>

            {/* Restaurant Motto */}
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Motto Usaha</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="Contoh: Solusi cetak struk transaksi UMKM"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Alamat Lengkap Toko</label>
              <textarea
                disabled={!isAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Kembaran Raya No. 12, Banyumas"
                rows={2}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 text-xs leading-relaxed"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nomor Telepon Kontak</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0888-0666-7171"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 font-mono"
              />
            </div>

            {/* Paper Width Selection */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Ukuran Kertas Struk</label>
              <select
                disabled={!isAdmin}
                value={paperWidth}
                onChange={(e) => setPaperWidth(e.target.value as '80mm' | '58mm')}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 bg-white disabled:bg-slate-50 disabled:text-slate-500 font-medium"
              >
                <option value="80mm">80mm (Desktop POS Standar)</option>
                <option value="58mm">58mm (Mini Portable / Kasir HP)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Printer className="text-indigo-600" size={16} />
              Konfigurasi Teks Struk Cetak
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Header Message */}
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Pesan Tambahan Header (Atas)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={headerMessage}
                  onChange={(e) => setHeaderMessage(e.target.value)}
                  placeholder="Contoh: Selamat menikmati kuliner Banyumas!"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Footer Message */}
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Pesan Terima Kasih / Info Footer (Bawah)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={footerMessage}
                  onChange={(e) => setFooterMessage(e.target.value)}
                  placeholder="Contoh: Kritik & saran WhatsApp: 088806667171"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Show logo toggle switch */}
              <div className="sm:col-span-2 flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${showLogo ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-400'}`}>
                    <Image size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Tampilkan Logo Toko Virtual</h4>
                    <p className="text-[10px] text-slate-500">Cetak ikon cangkir kopi/makanan di atas struk</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setShowLogo(!showLogo)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 ${
                    showLogo ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      showLogo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {isAdmin ? (
            <div className="flex gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Default</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save size={14} />
                <span>Simpan Konfigurasi Toko</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle size={14} />
              <span>Hanya Administrator yang memiliki wewenang untuk mengubah pengaturan struk toko.</span>
            </div>
          )}

          {/* Saved Toast Animation */}
          {isSaved && (
            <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl flex items-center gap-2 text-emerald-800 font-semibold text-xs animate-pulse">
              <CheckCircle2 size={16} />
              <span>Konfigurasi identitas restoran & struk belanja sukses disimpan ke POS engine!</span>
            </div>
          )}
        </form>

        {/* Right: Virtual Thermal Receipt Live Preview (Cols 4-5) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-start gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Preview Struk Cetak ({paperWidth})</span>
          
          <div className="relative w-full max-w-[280px]">
            {/* Paper jagged top edge */}
            <div className="absolute top-0 left-0 right-0 h-2 flex overflow-hidden select-none pointer-events-none z-10">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="w-3 h-3 bg-white rotate-45 transform origin-top-left -translate-y-1.5 shrink-0 border-t border-l border-slate-200" />
              ))}
            </div>

            {/* Receipt Frame */}
            <div className={`bg-white border border-slate-200 p-4 pt-6 pb-6 shadow-sm font-mono text-[10px] text-slate-800 select-none ${
              paperWidth === '58mm' ? 'max-w-[220px] mx-auto text-[9px]' : ''
            }`}>
              {/* Virtual Logo */}
              {showLogo && (
                <div className="text-center text-xs mb-1.5 text-indigo-600">
                  ☕🍽️
                </div>
              )}

              {/* Header */}
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 leading-tight">
                  {name || 'NAMA TOKO BELUM DIATUR'}
                </h3>
                {motto && (
                  <p className="italic text-[9px] text-slate-500 font-sans tracking-wide">
                    "{motto}"
                  </p>
                )}
                {address && (
                  <p className="text-[9px] text-slate-500 leading-snug">
                    {address}
                  </p>
                )}
                {phone && (
                  <p className="text-[9px] text-slate-500">
                    Telp: {phone}
                  </p>
                )}
              </div>

              {headerMessage && (
                <div className="text-center mt-2 text-[9px] text-slate-500 border-t border-dashed border-slate-200 pt-1.5">
                  {headerMessage}
                </div>
              )}

              <div className="border-b border-dashed border-slate-200 my-2" />

              {/* Receipt metadata */}
              <div className="space-y-0.5 text-slate-500">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-semibold text-slate-800">INV/20260717/999</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>Demo Kasir</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>17/07/2026 12:00</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-200 my-2" />

              {/* Items list */}
              <div className="space-y-1.5">
                {previewItems.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-slate-900 font-semibold">
                      <span>{item.name}</span>
                      <span>{formatIDR(item.price * item.qty)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>{item.qty} x {formatIDR(item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-slate-200 my-2" />

              {/* Calculations summary */}
              <div className="space-y-0.5 text-right text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatIDR(previewSubtotal)}</span>
                </div>
                <div className="flex justify-between text-indigo-600">
                  <span>Diskon:</span>
                  <span>-{formatIDR(previewDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak (10%):</span>
                  <span>{formatIDR(previewTax)}</span>
                </div>
                <div className="border-t border-dashed border-slate-100 my-1" />
                <div className="flex justify-between font-bold text-slate-900">
                  <span>GRAND TOTAL:</span>
                  <span>{formatIDR(previewTotal)}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-200 my-2.5" />

              {/* Footer messages */}
              {footerMessage ? (
                <div className="text-center text-[9px] text-slate-500 space-y-1 leading-relaxed">
                  <p className="font-semibold uppercase">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
                  <p>{footerMessage}</p>
                </div>
              ) : (
                <div className="text-center text-[9px] text-slate-400 italic">
                  -- Terima Kasih --
                </div>
              )}
              
              <div className="text-center text-[8px] text-slate-300 font-mono mt-2.5">
                QA POS Engine v1.0 • Offline-Ready
              </div>
            </div>

            {/* Paper jagged bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 h-2 flex overflow-hidden select-none pointer-events-none z-10 transform translate-y-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="w-3 h-3 bg-white -rotate-45 transform origin-bottom-left -translate-y-1.5 shrink-0 border-b border-l border-slate-200" />
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
