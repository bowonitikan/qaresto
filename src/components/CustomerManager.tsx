import React, { useState } from 'react';
import { Customer } from '../types';
import { getGoogleSheetsExportUrl, parseCustomerCSV } from '../utils';
import { Users, Plus, Search, FileSpreadsheet, Sparkles, MessageSquare, History, Phone, Mail, FileUp, AlertCircle, RefreshCw, Check } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'points' | 'orderCount' | 'totalSpent' | 'joinDate'>) => void;
  onImportCustomers: (imported: Customer[]) => void;
}

export default function CustomerManager({
  customers,
  onAddCustomer,
  onImportCustomers
}: CustomerManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [csvPasteData, setCsvPasteData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSource, setImportSource] = useState<'url' | 'paste'>('url');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // New Customer Form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPreferences, setNewPreferences] = useState('');

  // Selected customer for viewing history
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCustomer({
      name: newName,
      phone: newPhone || '-',
      email: newEmail,
      preferences: newPreferences || 'Tidak ada preferensi khusus'
    });
    // Reset Form
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewPreferences('');
    setIsAdding(false);
  };

  // Pre-filled Demo Sheets URL for easy cashier testing!
  const demoSheetsUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';

  const handleFetchFromGoogleSheet = async () => {
    if (!sheetUrl.trim()) return;
    setIsImporting(true);
    setImportError(null);
    setImportSuccessCount(null);

    const directExportUrl = getGoogleSheetsExportUrl(sheetUrl);

    try {
      // Fetching public CSV link
      const response = await fetch(directExportUrl);
      if (!response.ok) {
        throw new Error('Gagal mengunduh dokumen. Pastikan link Google Sheet diset ke publik (Siapa saja yang memiliki link dapat melihat).');
      }
      const csvText = await response.text();
      const imported = parseCustomerCSV(csvText);
      
      if (imported.length === 0) {
        throw new Error('Format CSV tidak dikenali. Pastikan kolom pertama berisi "Nama" atau "Name".');
      }

      onImportCustomers(imported);
      setImportSuccessCount(imported.length);
      setSheetUrl('');
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Terjadi kesalahan saat menghubungkan ke Google Sheets.');
    } finally {
      setIsImporting(false);
    }
  };

  const handlePasteCsvImport = () => {
    if (!csvPasteData.trim()) return;
    setImportError(null);
    setImportSuccessCount(null);
    try {
      const imported = parseCustomerCSV(csvPasteData);
      if (imported.length === 0) {
        throw new Error('Format CSV tidak valid atau baris kosong.');
      }
      onImportCustomers(imported);
      setImportSuccessCount(imported.length);
      setCsvPasteData('');
    } catch (err: any) {
      setImportError(err.message || 'Gagal memproses data CSV.');
    }
  };

  return (
    <div id="customer-manager-container" className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-indigo-600" size={24} />
            Database Customer & Loyalty
          </h2>
          <p className="text-xs text-slate-505">Kelola profil, riwayat pembelian, preferensi kuliner pelanggan, dan import dari Google Sheet.</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Grid Layout: Main database on left, sync tools on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Customer Database List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, telepon, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Nama</th>
                  <th className="py-2.5 px-3">Kontak</th>
                  <th className="py-2.5 px-3">Preferensi</th>
                  <th className="py-2.5 px-3 text-right">Poin</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">
                      Tidak ditemukan customer yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">{customer.name}</div>
                        <div className="text-[10px] text-gray-400">Gabung: {customer.joinDate}</div>
                      </td>
                      <td className="py-3 px-3 space-y-0.5">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone size={11} className="text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Mail size={11} />
                            <span className="truncate max-w-[120px]">{customer.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[11px] font-medium max-w-[180px] truncate" title={customer.preferences}>
                          <MessageSquare size={10} className="text-amber-500 shrink-0" />
                          {customer.preferences}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-600 font-mono">
                        {customer.points} Pts
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setViewingCustomer(customer)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold transition-all cursor-pointer"
                        >
                          Detail Riwayat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Tools Side Panel */}
        <div className="space-y-6">
          
          {/* Add New Customer Form (if active) */}
          {isAdding && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-950 flex items-center gap-1.5">
                  <Plus className="text-indigo-600" size={16} />
                  Customer Baru
                </h3>
                <button onClick={() => setIsAdding(false)} className="text-xs text-slate-400 hover:text-slate-600">
                  Batal
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Pelanggan *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Contoh: 0812xxxxxxxx"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Contoh: customer@email.com"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Preferensi Menu / Alergi</label>
                  <textarea
                    value={newPreferences}
                    onChange={(e) => setNewPreferences(e.target.value)}
                    placeholder="Contoh: Kurang manis, pantang kacang, minta pedas..."
                    rows={2}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Customer
                </button>
              </form>
            </div>
          )}

          {/* Google Sheets Syncer Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-950 flex items-center gap-1.5">
              <FileSpreadsheet className="text-indigo-600" size={16} />
              Google Sheets Customer Sync
            </h3>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sinkronkan data pelanggan dari lembar kerja Google Sheets secara online. Caranya: <strong>Bagikan dokumen di Google Sheet sebagai publik</strong> (Anyone with link can view) lalu tempelkan link di bawah.
            </p>

            {/* Selector Source */}
            <div className="flex border-b border-slate-100 pb-1 gap-4 text-xs">
              <button
                onClick={() => setImportSource('url')}
                className={`pb-1 font-bold ${importSource === 'url' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
              >
                URL Google Sheet
              </button>
              <button
                onClick={() => setImportSource('paste')}
                className={`pb-1 font-bold ${importSource === 'paste' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
              >
                Tempel CSV Manual
              </button>
            </div>

            {importSource === 'url' ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Link Google Sheets</label>
                  <input
                    type="text"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 text-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSheetUrl(demoSheetsUrl)}
                    className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    Gunakan Demo Sheet Publik
                  </button>
                </div>

                <button
                  onClick={handleFetchFromGoogleSheet}
                  disabled={isImporting || !sheetUrl.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Mengunduh...</span>
                    </>
                  ) : (
                    <>
                      <FileUp size={13} />
                      <span>Unduh & Sinkronisasi</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tempel Data CSV</label>
                  <textarea
                    value={csvPasteData}
                    onChange={(e) => setCsvPasteData(e.target.value)}
                    placeholder="Nama,Telepon,Email,Preferensi&#10;Budiman,081211112222,budi@email.com,Kurang manis"
                    rows={4}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 font-mono text-[10px]"
                  />
                </div>

                <button
                  onClick={handlePasteCsvImport}
                  disabled={!csvPasteData.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet size={13} />
                  <span>Proses CSV Manual</span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-150 rounded-lg flex gap-2 text-xs text-rose-800 leading-relaxed">
                <AlertCircle className="shrink-0 text-rose-600 mt-0.5" size={14} />
                <span>{importError}</span>
              </div>
            )}

            {/* Success Feedback */}
            {importSuccessCount !== null && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg flex gap-2 text-xs text-emerald-800 font-semibold">
                <Check className="shrink-0 text-emerald-600" size={14} />
                <span>Sukses memuat {importSuccessCount} customer baru ke dalam sistem POS!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Detail Drawer Overlay (View History) */}
      {viewingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setViewingCustomer(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-full">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{viewingCustomer.name}</h3>
                  <p className="text-xs text-slate-500">Mulai bergabung: {viewingCustomer.joinDate}</p>
                </div>
              </div>

              {/* Profil Stats */}
              <div className="grid grid-cols-3 gap-2.5 text-center bg-slate-50 p-3 rounded-xl border border-slate-150 font-mono text-xs">
                <div>
                  <p className="text-slate-400 text-[9px] uppercase font-bold">Total Poin</p>
                  <p className="font-extrabold text-indigo-600 mt-0.5 text-sm">{viewingCustomer.points} Pts</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[9px] uppercase font-bold">Kunjungan</p>
                  <p className="font-extrabold text-slate-800 mt-0.5 text-sm">{viewingCustomer.orderCount} Kali</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[9px] uppercase font-bold">Total Belanja</p>
                  <p className="font-extrabold text-slate-800 mt-0.5 text-xs">Rp {viewingCustomer.totalSpent.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Preferensi Spesifik Kuliner</span>
                <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                  <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="italic leading-relaxed font-semibold">"{viewingCustomer.preferences}"</p>
                </div>
              </div>

              {/* History */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Kontak Profil</span>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span>Telepon:</span>
                    <span className="font-mono font-semibold">{viewingCustomer.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span>Email:</span>
                    <span className="font-semibold">{viewingCustomer.email || '-'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewingCustomer(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal X component since we need it for modal closes
function X({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
