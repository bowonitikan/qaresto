import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface OfflineSyncIndicatorProps {
  isOnline: boolean;
  onToggleConnection: () => void;
  pendingSyncCount: number;
  isSyncing: boolean;
  onManualSync: () => void;
}

export default function OfflineSyncIndicator({
  isOnline,
  onToggleConnection,
  pendingSyncCount,
  isSyncing,
  onManualSync
}: OfflineSyncIndicatorProps) {
  return (
    <div id="offline-sync-indicator" className="flex items-center gap-2">
      {/* Simulation Toggle Switch */}
      <div className="flex items-center gap-1.5 bg-indigo-950/40 p-1 rounded-full border border-indigo-800/40 shadow-inner">
        <button
          onClick={onToggleConnection}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
            isOnline
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-rose-600 text-white shadow-xs'
          }`}
          title="Klik untuk simulasi putus/sambung internet"
        >
          {isOnline ? (
            <>
              <Wifi size={13} className="animate-pulse" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="animate-bounce" />
              <span>Offline</span>
            </>
          )}
        </button>
      </div>

      {/* Sync Queue Badge and Action */}
      {pendingSyncCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold">
            <AlertCircle size={14} className="animate-pulse" />
            <span>{pendingSyncCount} Pesanan Tertunda</span>
          </div>

          {isOnline && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className={`bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white p-1 rounded-full hover:shadow-sm transition-all ${
                isSyncing ? 'animate-spin' : ''
              }`}
              title="Sinkronisasi sekarang"
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      )}

      {/* Cloud Sync State Indicators */}
      {isSyncing && (
        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full animate-pulse">
          <RefreshCw size={13} className="animate-spin" />
          <span>Sinkronisasi...</span>
        </div>
      )}
    </div>
  );
}
