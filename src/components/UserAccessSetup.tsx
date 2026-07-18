import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheck, UserCheck, Lock, Unlock, CheckCircle, RefreshCcw, Key, AlertTriangle, Check, Eye, EyeOff } from 'lucide-react';

interface UserAccessSetupProps {
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onUpdateUserPin: (userId: string, newPin: string) => boolean;
}

export default function UserAccessSetup({ users, currentUser, onSelectUser, onUpdateUserPin }: UserAccessSetupProps) {
  const isAdmin = currentUser.role === 'admin';

  // PIN change state
  const [targetUserId, setTargetUserId] = useState<string>(currentUser.id);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync targetUserId with currentUser when currentUser changes
  useEffect(() => {
    setTargetUserId(currentUser.id);
    setFeedback(null);
  }, [currentUser]);

  const handlePinChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Basic 5-digit verification
    if (!/^\d{5}$/.test(newPin)) {
      setFeedback({
        type: 'error',
        message: 'Gagal: PIN harus berupa 5 digit angka numerik (0-9).'
      });
      return;
    }

    if (newPin !== confirmPin) {
      setFeedback({
        type: 'error',
        message: 'Gagal: Konfirmasi PIN tidak cocok dengan PIN baru Anda.'
      });
      return;
    }

    // Role checks
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      setFeedback({ type: 'error', message: 'Gagal: Pengguna target tidak ditemukan.' });
      return;
    }

    if (currentUser.id !== targetUserId && !isAdmin) {
      setFeedback({
        type: 'error',
        message: 'Gagal: Kasir hanya diperbolehkan mengubah PIN miliknya sendiri.'
      });
      return;
    }

    if (targetUser.role === 'admin' && !isAdmin) {
      setFeedback({
        type: 'error',
        message: 'Gagal: Anda tidak memiliki wewenang untuk mengubah PIN Administrator Utama.'
      });
      return;
    }

    // Call state updater
    const success = onUpdateUserPin(targetUserId, newPin);
    if (success) {
      setFeedback({
        type: 'success',
        message: `Berhasil: PIN untuk "${targetUser.name}" telah diperbarui.`
      });
      setNewPin('');
      setConfirmPin('');
    } else {
      setFeedback({
        type: 'error',
        message: 'Gagal memperbarui PIN keamanan.'
      });
    }
  };

  return (
    <div id="user-access-container" className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" size={24} />
          Manajemen Hak Akses & PIN Pengguna
        </h2>
        <p className="text-xs text-slate-500">
          Atur peran petugas kasir, pantau batasan keamanan, ganti pengguna aktif, dan kelola PIN keamanan kasir POS secara real-time.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Picker Profiles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Pengguna Masuk (Kunci & Masuk)</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {users.map((user) => {
                const isSelected = currentUser.id === user.id;
                const isAdminRole = user.role === 'admin';

                return (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-40 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80'}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full border-2 border-white shadow-xs object-cover"
                      />

                      {isSelected && (
                        <span className="bg-indigo-600 text-white p-1 rounded-full text-xs">
                          <CheckCircle size={12} />
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-3">
                      <p className="font-bold text-sm text-slate-950 truncate w-full">{user.name}</p>
                      <div className="flex items-center gap-1">
                        {isAdminRole ? (
                          <span className="bg-indigo-100 text-indigo-850 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            Administrator
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            Kasir POS
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Security Management Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-950 flex items-center gap-2">
              <Key className="text-indigo-600" size={18} />
              Ganti PIN Keamanan Otorisasi
            </h3>

            <form onSubmit={handlePinChangeSubmit} className="space-y-4">
              {feedback && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-semibold ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <Check size={16} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target User selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Pilih Pengguna yang Diubah PIN-nya
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={targetUserId}
                    onChange={(e) => {
                      setTargetUserId(e.target.value);
                      setFeedback(null);
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-250 bg-white rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {users.map((u) => {
                      // Non-admin can only select themselves
                      if (!isAdmin && u.id !== currentUser.id) return null;
                      return (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === 'admin' ? 'Admin' : 'Kasir'})
                        </option>
                      );
                    })}
                  </select>
                  {!isAdmin && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      * Peran Kasir hanya diizinkan memperbarui PIN-nya sendiri.
                    </p>
                  )}
                  {isAdmin && (
                    <p className="text-[10px] text-indigo-600 font-mono">
                      * Anda adalah Administrator. Anda dapat memperbarui PIN siapapun.
                    </p>
                  )}
                </div>

                {/* Pin info indicator */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center text-xs space-y-1 text-slate-600">
                  <p className="font-bold text-slate-800">Aturan Penggantian PIN:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>PIN wajib terdiri dari tepat 5 digit angka.</li>
                    <li>Hanya karakter angka (0-9) yang diperbolehkan.</li>
                    <li>Gunakan PIN unik yang mudah diingat kasir.</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* PIN Baru Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    PIN Baru (5 Digit Angka)
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={5}
                      value={newPin}
                      onChange={(e) => {
                        // Only allow numeric input
                        const val = e.target.value.replace(/\D/g, '');
                        setNewPin(val);
                      }}
                      placeholder="Contoh: 12345"
                      className="w-full pl-3.5 pr-10 py-2.5 border border-slate-250 rounded-xl text-xs font-bold tracking-widest text-slate-800 focus:outline-hidden focus:border-indigo-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi PIN Baru Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Konfirmasi PIN Baru
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={5}
                    value={confirmPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setConfirmPin(val);
                    }}
                    placeholder="Ulangi PIN baru"
                    className="w-full px-3.5 py-2.5 border border-slate-250 rounded-xl text-xs font-bold tracking-widest text-slate-800 focus:outline-hidden focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Key size={14} />
                  <span>Simpan PIN Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Roles Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-950 flex items-center gap-1.5">
            <UserCheck className="text-indigo-600" size={16} />
            Matriks Otorisasi Aktif
          </h3>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-600">Peran Aktif:</span>
              <span className={`font-bold uppercase ${currentUser.role === 'admin' ? 'text-indigo-600' : 'text-blue-700'}`}>
                {currentUser.role === 'admin' ? 'Administrator' : 'Kasir'}
              </span>
            </div>

            {/* Permission checklist */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Buat Transaksi / Kasir POS</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Unlock size={12} /> Diizinkan
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Atur Stok Ketersediaan</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Unlock size={12} /> Diizinkan
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Edit Harga & Informasi Menu</span>
                {currentUser.role === 'admin' ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Unlock size={12} /> Diizinkan
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <Lock size={12} /> Dikunci
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Hapus Produk Menu</span>
                {currentUser.role === 'admin' ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Unlock size={12} /> Diizinkan
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <Lock size={12} /> Dikunci
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Unduh & Sinkronisasi Sheets</span>
                {currentUser.role === 'admin' ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Unlock size={12} /> Diizinkan
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <Lock size={12} /> Dikunci
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Akses Laporan & Analitik Keuangan</span>
                {currentUser.role === 'admin' ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Unlock size={12} /> Diizinkan
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <Lock size={12} /> Dikunci
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 italic leading-relaxed">
            * Batasan di atas diberlakukan secara ketat pada aplikasi. Saat masuk sebagai peran "Kasir", tab menu atau tombol manajemen tertentu akan disembunyikan/dikunci secara otomatis untuk keamanan restoran.
          </p>
        </div>

      </div>

    </div>
  );
}
