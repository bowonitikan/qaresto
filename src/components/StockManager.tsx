import React, { useState } from 'react';
import { Product, Category } from '../types';
import { formatIDR } from '../utils';
import { Package, Search, Plus, Trash2, Edit2, Check, RefreshCcw, AlertTriangle, ChevronDown, Sparkles, Download } from 'lucide-react';

interface StockManagerProps {
  products: Product[];
  onUpdateProductStock: (id: string, newStock: number) => void;
  onEditProduct: (id: string, updated: Partial<Product>) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onDeleteProduct: (id: string) => void;
  currentUserRole: 'admin' | 'cashier';
}

export default function StockManager({
  products,
  onUpdateProductStock,
  onEditProduct,
  onAddProduct,
  onDeleteProduct,
  currentUserRole
}: StockManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  
  // Stock Adjust Modal/Inline Form
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);

  // New Product Modal/Form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newCategory, setNewCategory] = useState<Category>('Coffee');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newStock, setNewStock] = useState(10);
  const [newMinStock, setNewMinStock] = useState(5);
  const [newDescription, setNewDescription] = useState('');

  // Editing Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const isAdmin = currentUserRole === 'admin';

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    onUpdateProductStock(adjustingProduct.id, adjustQuantity);
    setAdjustingProduct(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice <= 0) return;
    
    // Auto-fallback image if left blank
    const fallbackImage = newImageUrl.trim() || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400';

    onAddProduct({
      name: newName,
      price: newPrice,
      category: newCategory,
      imageUrl: fallbackImage,
      stock: newStock,
      minStock: newMinStock,
      description: newDescription || 'Deskripsi menu belum diisi.'
    });

    // Reset Form
    setNewName('');
    setNewPrice(0);
    setNewImageUrl('');
    setNewStock(10);
    setNewMinStock(5);
    setNewDescription('');
    setIsAdding(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onEditProduct(editingProduct.id, editingProduct);
    setEditingProduct(null);
  };

  const handleExportCSV = () => {
    // Header for CSV
    const headers = ['ID', 'Nama Menu', 'Kategori', 'Harga', 'Stok Saat Ini', 'Batas Minimum Stok', 'Deskripsi'];
    
    // Rows
    const rows = filteredProducts.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.price,
      p.stock,
      p.minStock,
      `"${p.description.replace(/"/g, '""')}"`
    ]);

    // Combine
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Create a blob with BOM to support special characters in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daftar_Menu_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="stock-manager-container" className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="text-indigo-600" size={24} />
            Setup Menu & Pelacakan Stok
          </h2>
          <p className="text-xs text-slate-500">
            {isAdmin 
              ? 'Kelola jumlah inventori bahan/menu aktif, atur peringatan minimun stok, edit harga, serta tambah menu.' 
              : 'Pantau status ketersediaan menu secara real-time. (Mode Akses Kasir Terbatas: Edit dinonaktifkan)'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="Ekspor sebagai CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Tambah Item Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories filter and search bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600 transition-all"
          />
        </div>

        {/* Category horizontal scroll tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
          {(['All', 'Coffee', 'Beverages', 'Food', 'Snacks', 'Desserts'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'All' ? 'Semua Menu' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Produk</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Harga</th>
                <th className="py-2.5 px-3 text-center">Stok Saat Ini</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 font-medium">
                    Belum ada menu di kriteria pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${isLow ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                          />
                          <div>
                            <span className="font-semibold text-gray-900 block">{p.name}</span>
                            <span className="text-[10px] text-gray-400 max-w-[200px] block truncate">{p.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        {formatIDR(p.price)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono font-bold text-sm ${isLow ? 'text-rose-600' : 'text-gray-900'}`}>
                          {p.stock} porsi
                        </span>
                        <div className="text-[9px] text-gray-400">Min. {p.minStock}</div>
                      </td>
                      <td className="py-3 px-3">
                        {isOut ? (
                          <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-max animate-pulse">
                            <AlertTriangle size={10} />
                            Hampir Habis
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        {/* Always allow restocking, even for cashiers (simple quick adjust) but restrict full edits to admins */}
                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setAdjustQuantity(p.stock);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                        >
                          Atur Stok
                        </button>
                        
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                            >
                              Edit Info
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus "${p.name}" dari menu?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Overlay */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Sesuaikan Stok</h3>
            <p className="text-xs text-gray-500 mb-4">
              Atur jumlah stok yang tersedia secara instan untuk menu: <strong>{adjustingProduct.name}</strong>
            </p>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Stok Saat Ini</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustQuantity(prev => Math.max(0, prev - 1))}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold text-lg select-none w-10 text-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-center font-mono font-bold text-lg focus:outline-hidden focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustQuantity(prev => prev + 1)}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold text-lg select-none w-10 text-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Info Overlay */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Edit Info Produk</h3>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Kategori</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as Category })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="Coffee">Kopi</option>
                    <option value="Beverages">Minuman</option>
                    <option value="Food">Makanan</option>
                    <option value="Snacks">Camilan</option>
                    <option value="Desserts">Pencuci Mulut</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Min. Peringatan Stok</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.minStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">URL Gambar (Opsional)</label>
                <input
                  type="text"
                  value={editingProduct.imageUrl}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden font-mono text-[10px]"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Deskripsi Menu</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-750 shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Form Overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Tambah Menu Kuliner Baru</h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Nasi Goreng Kambing"
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Harga Menu (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPrice || ''}
                    onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)}
                    placeholder="25000"
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Kategori *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="Coffee">Kopi</option>
                    <option value="Beverages">Minuman</option>
                    <option value="Food">Makanan</option>
                    <option value="Snacks">Camilan</option>
                    <option value="Desserts">Pencuci Mulut</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Batas Minimum Peringatan</label>
                  <input
                    type="number"
                    required
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">URL Gambar (Opsional)</label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden font-mono text-[10px]"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Deskripsi Menu</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Bahan dasar, cita rasa, tingkat pedas..."
                  rows={2}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-750 shadow-sm"
                >
                  Tambah Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
