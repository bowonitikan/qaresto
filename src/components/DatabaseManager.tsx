import React, { useState, useRef } from 'react';
import { Database, Check, AlertCircle, Download, Upload, Trash2, ShieldAlert, Key, RefreshCw } from 'lucide-react';

interface DatabaseManagerProps {
  currentUserRole: 'admin' | 'cashier';
  onDatabaseStateChange?: () => void;
}

export default function DatabaseManager({
  currentUserRole,
  onDatabaseStateChange,
}: DatabaseManagerProps) {
  const isAdmin = currentUserRole === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [dbBackupLoading, setDbBackupLoading] = useState(false);
  const [dbRestoreLoading, setDbRestoreLoading] = useState(false);
  const [dbResetLoading, setDbResetLoading] = useState(false);

  // Security/Validation states
  const [dbAdminPin, setDbAdminPin] = useState('');
  const [dbSuccessMessage, setDbSuccessMessage] = useState<string | null>(null);
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleDownloadBackup = async () => {
    setDbBackupLoading(true);
    setDbSuccessMessage(null);
    setDbErrorMessage(null);
    try {
      const response = await fetch('/api/database/backup');
      if (!response.ok) {
        throw new Error('Gagal membuat backup database dari server.');
      }
      const backupJson = await response.json();
      
      const blob = new Blob([JSON.stringify(backupJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `qapos_backup_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDbSuccessMessage('Backup database berhasil diunduh ke perangkat Anda.');
    } catch (err: any) {
      console.error(err);
      setDbErrorMessage(err.message || 'Terjadi kesalahan saat membackup database.');
    } finally {
      setDbBackupLoading(false);
    }
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDbRestoreLoading(true);
    setDbSuccessMessage(null);
    setDbErrorMessage(null);

    try {
      const text = await file.text();
      const parsedJson = JSON.parse(text);

      if (!parsedJson.version || !parsedJson.data) {
        throw new Error('Format file backup tidak dikenali / tidak valid.');
      }

      const response = await fetch('/api/database/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedJson)
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || 'Gagal memulihkan database.');
      }

      setDbSuccessMessage('Database berhasil dipulihkan dari file backup!');
      if (onDatabaseStateChange) {
        onDatabaseStateChange();
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error(err);
      setDbErrorMessage(err.message || 'Format JSON rusak atau gagal diunggah ke server.');
    } finally {
      setDbRestoreLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!dbAdminPin.trim()) {
      setDbErrorMessage('Sandi PIN Admin wajib diisi untuk melakukan reset.');
      return;
    }

    setDbResetLoading(true);
    setDbSuccessMessage(null);
    setDbErrorMessage(null);

    try {
      const response = await fetch('/api/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: dbAdminPin })
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || 'PIN Admin tidak valid atau gagal mereset database.');
      }

      setDbSuccessMessage('Database berhasil direset ke kondisi awal semula.');
      setDbAdminPin('');
      setShowResetConfirm(false);
      if (onDatabaseStateChange) {
        onDatabaseStateChange();
      }
    } catch (err: any) {
      console.error(err);
      setDbErrorMessage(err.message || 'Terjadi kegagalan saat mereset database.');
    } finally {
      setDbResetLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 w-full">
      <h3 className="font-bold text-sm text-slate-950 flex items-center gap-1.5">
        <Database className="text-indigo-600" size={16} />
        Pemeliharaan & Ekspor Database (DatabaseManager)
      </h3>
      
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Utilitas untuk mencadangkan (backup), memperbarui (restore), atau mereset seluruh data aplikasi POS langsung ke/dari Cloud SQL (PostgreSQL).
      </p>

      {/* Success and Error Indicators */}
      {dbSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg flex gap-2 text-xs text-emerald-800 font-semibold animate-pulse">
          <Check className="shrink-0 text-emerald-600" size={14} />
          <span>{dbSuccessMessage}</span>
        </div>
      )}

      {dbErrorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-150 rounded-lg flex gap-2 text-xs text-rose-800 leading-relaxed">
          <AlertCircle className="shrink-0 text-rose-600 mt-0.5" size={14} />
          <span>{dbErrorMessage}</span>
        </div>
      )}

      <div className="space-y-3 text-xs">
        {/* BACKUP BUTTON */}
        <div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={dbBackupLoading}
            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-50 text-indigo-700 disabled:text-slate-400 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all border border-indigo-200/50 cursor-pointer"
          >
            {dbBackupLoading ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Memproses Backup...</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Cadangkan (Backup JSON)</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 mt-1 pl-1">Mengunduh seluruh tabel menu, order, diskon, dan customer dalam satu file.</p>
        </div>

        {/* RESTORE BUTTON WITH FILE INPUT */}
        <div className="border-t border-slate-100 pt-3">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleUploadBackup}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => isAdmin ? fileInputRef.current?.click() : setDbErrorMessage('Hanya Admin yang berwenang memperbarui database.')}
            disabled={dbRestoreLoading}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-50 text-emerald-700 disabled:text-slate-400 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all border border-emerald-200/50 cursor-pointer"
          >
            {dbRestoreLoading ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Memproses Unggahan...</span>
              </>
            ) : (
              <>
                <Upload size={13} />
                <span>Unggah & Perbarui (Restore JSON)</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 mt-1 pl-1">Unggah file JSON backup untuk menggantikan seluruh database aktif.</p>
        </div>

        {/* RESET DATABASE WITH ADMIN PIN CONFIRMATION */}
        <div className="border-t border-slate-100 pt-3">
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => {
                if (!isAdmin) {
                  setDbErrorMessage('Hanya Administrator yang memiliki wewenang mereset database.');
                  return;
                }
                setShowResetConfirm(true);
                setDbSuccessMessage(null);
                setDbErrorMessage(null);
              }}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all border border-rose-200/50 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Reset Database Aplikasi</span>
            </button>
          ) : (
            <div className="bg-rose-50/55 border border-rose-150 p-3 rounded-lg space-y-2.5">
              <div className="flex items-start gap-1.5 text-rose-800 font-bold text-[11px]">
                <ShieldAlert size={14} className="text-rose-600 shrink-0 mt-0.5" />
                <span>PERINGATAN: Tindakan ini akan mengosongkan dan mengembalikan database ke setelan pabrik (seeding default)!</span>
              </div>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 pl-0.5">Konfirmasi PIN Admin Keamanan</label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={5}
                    value={dbAdminPin}
                    onChange={(e) => setDbAdminPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Masukkan 5-digit PIN Admin"
                    className="w-full p-2 pl-7.5 border border-slate-200 rounded-md focus:outline-hidden focus:border-rose-500 font-mono text-center tracking-widest text-xs"
                  />
                  <Key className="absolute left-2.5 top-2.5 text-slate-400" size={11} />
                </div>
              </div>

              <div className="flex gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirm(false);
                    setDbAdminPin('');
                  }}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  disabled={dbResetLoading || dbAdminPin.length < 5}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md transition-colors disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer"
                >
                  {dbResetLoading ? 'Mereset...' : 'Ya, Reset Total'}
                </button>
              </div>
            </div>
          )}
          <p className="text-[10px] text-slate-400 mt-1 pl-1">Menghapus seluruh transaksi, mengembalikan database kasir ke setelan pabrik awal.</p>
        </div>
      </div>
    </div>
  );
}
