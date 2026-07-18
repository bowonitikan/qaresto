import React, { useState } from 'react';
import { Promo } from '../types';
import { formatIDR } from '../utils';
import { Tag, Plus, Trash2, Edit2, Check, X, Ticket, Percent, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromoManagerProps {
  promos: Promo[];
  onAddPromo: (newPromo: Omit<Promo, 'id'>) => void;
  onEditPromo: (id: string, updated: Partial<Promo>) => void;
  onDeletePromo: (id: string) => void;
  currentUserRole: 'admin' | 'cashier';
}

export default function PromoManager({
  promos,
  onAddPromo,
  onEditPromo,
  onDeletePromo,
  currentUserRole
}: PromoManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [minPurchase, setMinPurchase] = useState(10000);
  const [active, setActive] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCode('');
    setDiscountPercent(10);
    setMinPurchase(10000);
    setActive(true);
    setFormError(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
    setEditingPromoId(null);
  };

  const handleStartEdit = (promo: Promo) => {
    setTitle(promo.title);
    setDescription(promo.description);
    setCode(promo.code);
    setDiscountPercent(promo.discountPercent);
    setMinPurchase(promo.minPurchase);
    setActive(promo.active);
    setFormError(null);
    setEditingPromoId(promo.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingPromoId(null);
    resetForm();
  };

  const validateForm = () => {
    if (!title.trim()) return 'Judul promo harus diisi.';
    if (!description.trim()) return 'Deskripsi promo harus diisi.';
    if (!code.trim()) return 'Kode promo harus diisi.';
    if (code.includes(' ')) return 'Kode promo tidak boleh mengandung spasi.';
    if (discountPercent <= 0 || discountPercent > 100) return 'Diskon harus bernilai antara 1% - 100%.';
    if (minPurchase < 0) return 'Minimal pembelian tidak boleh bernilai negatif.';
    
    // Check duplication of code
    const isDuplicate = promos.some(p => 
      p.code.toLowerCase() === code.trim().toLowerCase() && p.id !== editingPromoId
    );
    if (isDuplicate) return `Kode promo "${code.toUpperCase()}" sudah digunakan.`;

    return null;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      code: code.trim().toUpperCase(),
      discountPercent: Number(discountPercent),
      minPurchase: Number(minPurchase),
      active
    };

    if (editingPromoId) {
      onEditPromo(editingPromoId, payload);
      setEditingPromoId(null);
    } else {
      onAddPromo(payload);
      setIsAdding(false);
    }
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus promo "${name}"?`)) {
      onDeletePromo(id);
    }
  };

  const handleToggleActive = (promo: Promo) => {
    if (currentUserRole !== 'admin') {
      alert('Hanya Administrator yang diperbolehkan mengubah status promo.');
      return;
    }
    onEditPromo(promo.id, { active: !promo.active });
  };

  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 text-rose-600 p-2.5 rounded-2xl">
            <Ticket size={24} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">Manajemen Setup Promo</h2>
            <p className="text-xs text-slate-500 font-mono">Daftar diskon aktif, kode voucher kasir, dan penawaran berbatas waktu.</p>
          </div>
        </div>
        
        {isAdmin && !isAdding && !editingPromoId && (
          <button
            onClick={handleStartAdd}
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Promo Baru</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle area: Promos List */}
        <div className={`lg:col-span-${isAdding || editingPromoId ? '2' : '3'} space-y-4`}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {promos.map((promo) => (
                <motion.div
                  key={promo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 relative ${
                    promo.active 
                      ? 'border-slate-200 shadow-xs hover:border-rose-200' 
                      : 'border-slate-200 opacity-75'
                  }`}
                >
                  {/* Decorative Ticket Notch design */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-slate-100 border-r border-slate-200 transform -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-slate-100 border-l border-slate-200 transform -translate-y-1/2" />

                  <div className="p-5 flex flex-col justify-between h-full space-y-4">
                    
                    {/* Upper Row: Title and Active Status Badge */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
                            Code: {promo.code}
                          </span>
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Percent size={10} />
                            <span>{promo.discountPercent}% OFF</span>
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{promo.title}</h3>
                      </div>

                      {/* Active switch */}
                      <button
                        onClick={() => handleToggleActive(promo)}
                        disabled={!isAdmin}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          promo.active ? 'bg-rose-600' : 'bg-slate-200'
                        } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            promo.active ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Middle: Description */}
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">{promo.description}</p>

                    {/* Minimum purchase indicator */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 font-mono flex items-center justify-between">
                      <span>Min. Belanja:</span>
                      <span className="font-bold text-slate-800">{promo.minPurchase > 0 ? formatIDR(promo.minPurchase) : 'Tanpa Minimal'}</span>
                    </div>

                    {/* Footer Row: Edit / Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-100">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {promo.id}</span>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(promo)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Promo"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id, promo.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Promo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {promos.length === 0 && (
            <div className="bg-white border border-slate-150 p-12 rounded-2xl text-center space-y-3">
              <div className="bg-slate-50 text-slate-400 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
                <Ticket size={24} />
              </div>
              <p className="text-sm font-bold text-slate-800">Tidak ada promo terdaftar</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Buat promosi menu kuliner menarik seperti diskon persen atau gratis ongkir dengan mendaftarkannya sekarang.
              </p>
            </div>
          )}
        </div>

        {/* Right area: Form (Rendered only during add/edit mode) */}
        <AnimatePresence>
          {(isAdding || editingPromoId !== null) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden sticky top-24">
                
                {/* Form Header */}
                <div className="bg-slate-50 border-b border-slate-150 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-rose-600 animate-pulse" />
                    <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                      {editingPromoId ? 'Edit Promo' : 'Tambah Promo'}
                    </span>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-150 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSave} className="p-4 space-y-4">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Promo Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Judul Promo</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., PROMO JUMAT BERKAH"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-rose-500 font-sans"
                    />
                  </div>

                  {/* Promo Code */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Kode Voucher (Voucher Code)</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g., JUMAT15 (Tanpa Spasi)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:border-rose-500 font-mono uppercase"
                    />
                  </div>

                  {/* Discount Percentage */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Diskon Persen (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Math.max(1, Math.min(100, Number(e.target.value))))}
                        className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:border-rose-500 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">%</span>
                    </div>
                  </div>

                  {/* Min Purchase */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Min. Belanja (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={minPurchase}
                        onChange={(e) => setMinPurchase(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Promo Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Deskripsi Lengkap</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Sebutkan detail syarat diskon dan ketentuan lainnya di sini..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-rose-500 font-sans leading-relaxed"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-800">Aktifkan Voucher</p>
                      <p className="text-[9px] text-slate-400">Kasir dapat menggunakan voucher ini saat checkout.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActive(!active)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        active ? 'bg-rose-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Save button actions */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer text-center"
                    >
                      <Check size={14} />
                      <span>{editingPromoId ? 'Simpan' : 'Tambahkan'}</span>
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
