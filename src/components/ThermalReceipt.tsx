import { useState } from 'react';
import { Order, Customer } from '../types';
import { formatIDR } from '../utils';
import { Printer, Bluetooth, Check, Wifi, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface ReceiptConfig {
  address: string;
  phone: string;
  headerMessage: string;
  footerMessage: string;
  showLogo: boolean;
  paperWidth: '80mm' | '58mm';
}

interface ThermalReceiptProps {
  order: Order | null;
  customer: Customer | null;
  onClose: () => void;
  restaurantName: string;
  restaurantMotto: string;
  receiptConfig: ReceiptConfig;
}

export default function ThermalReceipt({
  order,
  customer,
  onClose,
  restaurantName,
  restaurantMotto,
  receiptConfig,
}: ThermalReceiptProps) {
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [printers, setPrinters] = useState([
    { id: 'p_1', name: 'Rongta RP80 Thermal POS', connected: false, type: 'Bluetooth' },
    { id: 'p_2', name: 'Epson TM-T82 (USB/LAN)', connected: false, type: 'LAN' },
    { id: 'p_3', name: 'Sunmi V2 Portable Printer', connected: false, type: 'Bluetooth' },
  ]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printPaperHeight, setPrintPaperHeight] = useState(0);

  if (!order) return null;

  const handleToggleBluetooth = () => {
    setIsBluetoothEnabled(!isBluetoothEnabled);
  };

  const handleConnectPrinter = (id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setPrinters(prev =>
        prev.map(p => {
          if (p.id === id) return { ...p, connected: !p.connected };
          // For bluetooth, only one active printer at a time
          if (p.type === 'Bluetooth') return { ...p, connected: false };
          return p;
        })
      );
      setConnectingId(null);
    }, 1500);
  };

  const activePrinter = printers.find(p => p.connected);

  const handlePrint = () => {
    setIsPrinting(true);
    // Simulate paper sliding up from printer slot
    setPrintPaperHeight(0);
    setTimeout(() => {
      setPrintPaperHeight(100);
    }, 100);

    setTimeout(() => {
      setIsPrinting(false);
      // Native browser print helper
      window.print();
    }, 2000);
  };

  return (
    <div id="receipt-modal-container" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Setup & Bluetooth Config */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Printer className="text-emerald-700" size={24} />
              <h3 className="text-lg font-bold text-gray-900">Setup Printer Thermal</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Hubungkan POS ke printer struk thermal nirkabel via Bluetooth atau jaringan LAN lokal untuk mencetak struk kasir secara instan.
            </p>

            {/* Bluetooth Switch */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isBluetoothEnabled ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
                  <Bluetooth size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-950">Bluetooth Device Scanner</h4>
                  <p className="text-xs text-gray-500">Pindai printer struk thermal terdekat</p>
                </div>
              </div>
              <button
                onClick={handleToggleBluetooth}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isBluetoothEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isBluetoothEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* List of Devices */}
            <div className="space-y-3 mb-5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Daftar Printer Tersedia</span>
              
              {!isBluetoothEnabled ? (
                <div className="text-center p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
                  <Bluetooth size={24} className="mx-auto mb-2 opacity-50" />
                  Aktifkan Bluetooth Scanner di atas untuk melihat printer thermal nirkabel terdekat.
                </div>
              ) : (
                <div className="space-y-2">
                  {printers.map((printer) => (
                    <div
                      key={printer.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-sm transition-all ${
                        printer.connected
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Printer className={printer.connected ? 'text-emerald-600' : 'text-gray-400'} size={16} />
                        <div>
                          <p className="font-semibold text-gray-900">{printer.name}</p>
                          <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded uppercase">
                            {printer.type}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConnectPrinter(printer.id)}
                        disabled={connectingId !== null}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          printer.connected
                            ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        } flex items-center gap-1.5 cursor-pointer`}
                      >
                        {connectingId === printer.id ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Menghubungkan...</span>
                          </>
                        ) : printer.connected ? (
                          <>
                            <Check size={12} />
                            <span>Putuskan</span>
                          </>
                        ) : (
                          <span>Hubungkan</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connection Info */}
            {activePrinter ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                <Check size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Printer Terhubung ({activePrinter.name})</p>
                  <p className="opacity-90">Sistem siap mencetak struk secara otomatis setelah setiap transaksi.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Printer Belum Terpilih</p>
                  <p className="opacity-90">Anda dapat melakukan pencetakan virtual atau menggunakan printer bawaan browser (Ctrl+P / Cmd+P).</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm"
            >
              Tutup Setup
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
            >
              {isPrinting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Mencetak Struk...</span>
                </>
              ) : (
                <>
                  <Printer size={16} />
                  <span>Cetak Struk POS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Virtual Thermal Receipt Paper Preview */}
        <div id="receipt-print-area" className="flex-1 bg-gray-100 p-6 flex items-center justify-center overflow-y-auto max-h-[95vh] md:max-h-none print:p-0 print:bg-white">
          <div className={`relative w-full transition-all duration-300 ${receiptConfig.paperWidth === '58mm' ? 'max-w-[240px]' : 'max-w-[340px]'}`}>
            {/* Top jagged paper edge design */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-radial-gradient flex overflow-hidden select-none pointer-events-none z-10 print:hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-4 h-4 bg-white rotate-45 transform origin-top-left -translate-y-2 shrink-0 border-t border-l border-gray-200" />
              ))}
            </div>

            {/* Receipt Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0.9 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.08), 0 0 1px 1px rgba(0,0,0,0.03)'
              }}
              className={`bg-white p-5 pt-8 pb-10 text-gray-800 font-mono border border-gray-200 select-all print:border-0 print:p-0 print:shadow-none transition-all ${
                receiptConfig.paperWidth === '58mm' ? 'text-[10px] leading-snug p-3' : 'text-xs'
              }`}
            >
              {/* Virtual Logo */}
              {receiptConfig.showLogo && (
                <div className="text-center text-sm mb-2 text-indigo-600">
                  ☕🍽️
                </div>
              )}

              {/* Header */}
              <div className="text-center space-y-1 mb-4">
                <h2 className="text-sm md:text-base font-extrabold uppercase tracking-wider text-slate-900 leading-tight">
                  {restaurantName}
                </h2>
                {restaurantMotto && (
                  <p className="italic text-[9px] text-slate-500 font-sans tracking-wide">
                    "{restaurantMotto}"
                  </p>
                )}
                {receiptConfig.address && (
                  <p className="text-[10px] leading-snug text-slate-600">
                    {receiptConfig.address}
                  </p>
                )}
                {receiptConfig.phone && (
                  <p className="text-[10px] text-slate-600">
                    Telp: {receiptConfig.phone}
                  </p>
                )}
                {receiptConfig.headerMessage && (
                  <p className="text-[9px] text-slate-500 italic mt-1.5 border-t border-dashed border-gray-200 pt-1">
                    {receiptConfig.headerMessage}
                  </p>
                )}
                <div className="border-b border-dashed border-gray-300 my-2" />
                
                {/* Invoice Meta */}
                <div className="text-left text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Invoice:</span>
                    <span className="font-semibold">{order.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{order.cashier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{order.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-semibold uppercase">{order.paymentMethod}</span>
                  </div>
                  {order.isOffline && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Mode:</span>
                      <span>OFFLINE ENCRYPTED</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-b border-dashed border-gray-300 my-3" />

              {/* Items List */}
              <div className="space-y-2 mb-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-semibold text-gray-900">
                      <span>{item.product.name}</span>
                      <span>{formatIDR(item.product.price * item.quantity)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>{item.quantity} x {formatIDR(item.product.price)}</span>
                      {item.notes && <span>(* {item.notes})</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-gray-300 my-3" />

              {/* Financial Calculation summary */}
              <div className="space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatIDR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Diskon:</span>
                    <span>-{formatIDR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pajak (10%):</span>
                  <span>{formatIDR(order.tax)}</span>
                </div>
                <div className="border-b border-dashed border-gray-200 my-1" />
                <div className="flex justify-between font-bold text-sm text-gray-950">
                  <span>GRAND TOTAL:</span>
                  <span>{formatIDR(order.grandTotal)}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-300 my-3" />

              {/* Customer Details */}
              {customer ? (
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-150 text-[10px] space-y-1">
                  <p className="font-bold text-gray-950 uppercase text-[9px] tracking-wider">MEMBER LOYALTY</p>
                  <div className="flex justify-between">
                    <span>Nama:</span>
                    <span className="font-semibold">{customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nomor Telp:</span>
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Poin Reward Baru:</span>
                    <span>+{Math.floor(order.grandTotal / 10000)} Pts ({customer.points + Math.floor(order.grandTotal / 10000)} Total)</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-[10px] text-gray-400 italic">
                  -- Bukan Member Terdaftar --
                </div>
              )}

              <div className="border-b border-dashed border-gray-300 my-4" />

              {/* Receipt Footer */}
              <div className="text-center space-y-1 text-[9px] text-gray-500">
                <p className="font-semibold uppercase">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
                {receiptConfig.footerMessage && <p>{receiptConfig.footerMessage}</p>}
                <p className="font-mono text-[8px] opacity-75">Powered by QA POS • Cloud Sync Engine</p>
              </div>
            </motion.div>

            {/* Bottom jagged paper edge design */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-radial-gradient flex overflow-hidden select-none pointer-events-none z-10 print:hidden transform translate-y-1.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-4 h-4 bg-white -rotate-45 transform origin-bottom-left -translate-y-2.5 shrink-0 border-b border-l border-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
