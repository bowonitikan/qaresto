import { POSNotification } from '../types';
import { Bell, X, CheckCheck, AlertTriangle, CloudRain, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  notifications: POSNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export default function NotificationCenter({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: POSNotification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="text-amber-500 shrink-0 animate-bounce" size={18} />;
      case 'sync':
        return <RefreshCw className="text-blue-500 shrink-0 animate-spin" size={18} style={{ animationDuration: '3s' }} />;
      case 'success':
        return <CheckCircle className="text-emerald-500 shrink-0" size={18} />;
      default:
        return <Info className="text-sky-500 shrink-0" size={18} />;
    }
  };

  const getBgClass = (type: POSNotification['type'], read: boolean) => {
    if (read) return 'bg-gray-50 border-gray-100 hover:bg-gray-100/70';
    switch (type) {
      case 'warning':
        return 'bg-amber-50/70 border-amber-100 hover:bg-amber-50';
      case 'sync':
        return 'bg-blue-50/70 border-blue-100 hover:bg-blue-50';
      case 'success':
        return 'bg-emerald-50/70 border-emerald-100 hover:bg-emerald-50';
      default:
        return 'bg-sky-50/70 border-sky-100 hover:bg-sky-50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            id="notification-backdrop"
            className="fixed inset-0 bg-black/45 z-45 transition-opacity"
            onClick={onClose}
          />

          {/* Sliding Panel */}
          <motion.div
            id="notification-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-indigo-900 text-white">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-indigo-900">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg">Notifikasi POS</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-indigo-800 transition-colors text-indigo-100 hover:text-white cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Actions */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500">
                <span>{unreadCount} Belum dibaca</span>
                <div className="flex gap-3">
                  <button
                    onClick={onMarkAllAsRead}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                  >
                    <CheckCheck size={14} />
                    Tandai Semua Dibaca
                  </button>
                  <button
                    onClick={onClearAll}
                    className="text-rose-600 hover:text-rose-700 font-medium transition-colors cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>
            )}

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400 p-6">
                  <div className="bg-slate-100 p-4 rounded-full mb-3 text-slate-400">
                    <Bell size={36} />
                  </div>
                  <p className="font-medium text-slate-600 mb-1">Tidak Ada Notifikasi</p>
                  <p className="text-xs">Semua pemberitahuan, status stok, dan log offline sync akan ditampilkan di sini.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      onClick={() => onMarkAsRead(item.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${getBgClass(item.type, item.read)}`}
                    >
                      <div className="flex gap-3">
                        {getIcon(item.type)}
                        <div className="flex-1 space-y-1 pr-4">
                          <p className={`text-sm font-semibold ${item.read ? 'text-slate-600' : 'text-slate-900'}`}>
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {item.message}
                          </p>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {item.time}
                          </span>
                        </div>
                      </div>

                      {/* Unread Indicator */}
                      {!item.read && (
                        <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-center text-slate-400 font-mono">
              RestoPOS Engine v1.0 • Offline-Ready
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
