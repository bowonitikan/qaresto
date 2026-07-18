import { useState, useMemo } from 'react';
import { Order, Product, Category, User } from '../types';
import { formatIDR, exportToCSV } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, FileSpreadsheet, Printer, Award, Calendar, DollarSign, ShoppingBag, CreditCard, RefreshCw, Shield, CheckCircle2, AlertTriangle, AlertCircle, Coins, ChevronRight, User as UserIcon, Check, Copy, HelpCircle } from 'lucide-react';

interface SalesReportProps {
  orders: Order[];
  products: Product[];
  currentUser?: User;
}

interface ShiftReportLog {
  id: string;
  timestamp: string;
  periode: 'Harian' | 'Mingguan';
  operator: string;
  expectedCash: number;
  actualCash: number;
  discrepancy: number;
  notes: string;
  transactionsCount: number;
}

export default function SalesReport({ orders, products, currentUser }: SalesReportProps) {
  // If user is Admin, we show the standard monthly financial report
  const isAdmin = currentUser?.role === 'admin';

  // State for Admin
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // State for Cashier
  const [periode, setPeriode] = useState<'harian' | 'mingguan'>('harian');
  const [operatorFilter, setOperatorFilter] = useState<'me' | 'all'>('me');
  const [uangFisikInput, setUangFisikInput] = useState<string>('');
  const [catatanShift, setCatatanShift] = useState<string>('');
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [isSuccessReported, setIsSuccessReported] = useState<boolean>(false);

  // In-session shift report logs for cashier history
  const [reportedLogs, setReportedLogs] = useState<ShiftReportLog[]>(() => {
    const saved = localStorage.getItem('qapos_shift_reports');
    return saved ? JSON.parse(saved) : [];
  });

  // Latest order date in dataset to use as "Today" for mock data continuity
  const todayStr = useMemo(() => {
    if (orders.length === 0) return new Date().toISOString().split('T')[0];
    const sorted = [...orders].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0].date;
  }, [orders]);

  // --- ADMIN COMPUTATIONS ---
  const filteredOrdersAdmin = useMemo(() => {
    return orders.filter(o => {
      const dateParts = o.date.split('-');
      if (dateParts.length < 3) return true;
      const year = dateParts[0];
      const month = dateParts[1];

      const matchYear = year === selectedYear;
      const matchMonth = selectedMonth === 'All' || month === selectedMonth;
      return matchYear && matchMonth;
    });
  }, [orders, selectedMonth, selectedYear]);

  const metricsAdmin = useMemo(() => {
    const totalRevenue = filteredOrdersAdmin.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalTransactions = filteredOrdersAdmin.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    let totalItemsSold = 0;
    filteredOrdersAdmin.forEach(o => {
      o.items.forEach(item => {
        totalItemsSold += item.quantity;
      });
    });

    return {
      totalRevenue,
      totalTransactions,
      averageOrderValue,
      totalItemsSold
    };
  }, [filteredOrdersAdmin]);

  const dailyDataAdmin = useMemo(() => {
    const dailyMap: { [date: string]: number } = {};
    filteredOrdersAdmin.forEach(o => {
      const date = o.date;
      dailyMap[date] = (dailyMap[date] || 0) + o.grandTotal;
    });

    return Object.keys(dailyMap)
      .sort()
      .map(date => ({
        Tanggal: date.split('-')[2] + '/' + date.split('-')[1],
        Revenue: dailyMap[date]
      }));
  }, [filteredOrdersAdmin]);

  const categoryDataAdmin = useMemo(() => {
    const categoryMap: { [cat in Category]?: number } = {};
    filteredOrdersAdmin.forEach(o => {
      o.items.forEach(item => {
        const cat = item.product.category;
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.product.price * item.quantity);
      });
    });

    return Object.keys(categoryMap).map(cat => ({
      name: cat,
      value: categoryMap[cat as Category] || 0
    }));
  }, [filteredOrdersAdmin]);

  const bestSellersAdmin = useMemo(() => {
    const productMap: { [name: string]: { quantity: number; revenue: number } } = {};
    filteredOrdersAdmin.forEach(o => {
      o.items.forEach(item => {
        const name = item.product.name;
        if (!productMap[name]) {
          productMap[name] = { quantity: 0, revenue: 0 };
        }
        productMap[name].quantity += item.quantity;
        productMap[name].revenue += item.product.price * item.quantity;
      });
    });

    return Object.keys(productMap)
      .map(name => ({
        name,
        quantity: productMap[name].quantity,
        revenue: productMap[name].revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrdersAdmin]);

  const COLORS_PIE = ['#312e81', '#4338ca', '#4f46e5', '#6366f1', '#818cf8'];

  const handleExportExcelAdmin = () => {
    const headers = ['ID Pesanan', 'Nomor Invoice', 'Tanggal', 'Subtotal', 'Diskon', 'Pajak (10%)', 'Total Akhir', 'Metode Bayar', 'Customer', 'Kasir'];
    const rows = filteredOrdersAdmin.map(o => [
      o.id,
      o.invoiceNumber,
      o.date,
      o.subtotal,
      o.discount,
      o.tax,
      o.grandTotal,
      o.paymentMethod,
      o.customerName || 'Walk-In',
      o.cashier
    ]);

    exportToCSV(`Laporan_Keuangan_POS_${selectedMonth === 'All' ? 'Tahunan' : 'Bulan_' + selectedMonth}_${selectedYear}`, headers, rows);
  };


  // --- CASHIER COMPUTATIONS ---
  const cashierFilteredOrders = useMemo(() => {
    return orders.filter(o => {
      // 1. Date Filter
      let matchDate = false;
      if (periode === 'harian') {
        matchDate = o.date === todayStr;
      } else {
        // Mingguan: Filter last 7 days from todayStr (e.g. 2026-07-12 to 2026-07-18)
        const oTime = new Date(o.date).getTime();
        const tTime = new Date(todayStr).getTime();
        const diffDays = (tTime - oTime) / (1000 * 60 * 60 * 24);
        matchDate = diffDays >= 0 && diffDays < 7;
      }

      // 2. Operator Filter
      const matchOperator = operatorFilter === 'all' || o.cashier === currentUser?.name;

      return matchDate && matchOperator;
    });
  }, [orders, periode, operatorFilter, todayStr, currentUser]);

  const cashierMetrics = useMemo(() => {
    let grossSales = 0;
    let discountGiven = 0;
    let taxCollected = 0;
    let netSales = 0;

    let expectedCash = 0;
    let expectedQRIS = 0;
    let expectedDebit = 0;
    let expectedKredit = 0;

    let countCash = 0;
    let countQRIS = 0;
    let countDebit = 0;
    let countKredit = 0;

    cashierFilteredOrders.forEach(o => {
      grossSales += o.subtotal;
      discountGiven += o.discount;
      taxCollected += o.tax;
      netSales += o.grandTotal;

      if (o.paymentMethod === 'Cash') {
        expectedCash += o.grandTotal;
        countCash++;
      } else if (o.paymentMethod === 'QRIS') {
        expectedQRIS += o.grandTotal;
        countQRIS++;
      } else if (o.paymentMethod === 'Debit') {
        expectedDebit += o.grandTotal;
        countDebit++;
      } else if (o.paymentMethod === 'Kredit') {
        expectedKredit += o.grandTotal;
        countKredit++;
      }
    });

    return {
      grossSales,
      discountGiven,
      taxCollected,
      netSales,
      expectedCash,
      expectedQRIS,
      expectedDebit,
      expectedKredit,
      countCash,
      countQRIS,
      countDebit,
      countKredit,
      totalTransactions: cashierFilteredOrders.length
    };
  }, [cashierFilteredOrders]);

  const actualCashValue = Number(uangFisikInput) || 0;
  const cashDiscrepancy = actualCashValue - cashierMetrics.expectedCash;

  // Handle Shift Reporting Submit Simulation
  const handleReportShiftSubmit = () => {
    if (uangFisikInput.trim() === '') {
      alert('Silakan masukkan jumlah uang tunai fisik di laci kas terlebih dahulu!');
      return;
    }

    setIsReporting(true);

    setTimeout(() => {
      const now = new Date();
      const timestampStr = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) + ' pukul ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      const newLog: ShiftReportLog = {
        id: `rep_${Date.now()}`,
        timestamp: timestampStr,
        periode: periode === 'harian' ? 'Harian' : 'Mingguan',
        operator: currentUser?.name || 'Kasir',
        expectedCash: cashierMetrics.expectedCash,
        actualCash: actualCashValue,
        discrepancy: cashDiscrepancy,
        notes: catatanShift.trim() || 'Tidak ada catatan khusus.',
        transactionsCount: cashierMetrics.totalTransactions
      };

      const updatedLogs = [newLog, ...reportedLogs];
      setReportedLogs(updatedLogs);
      localStorage.setItem('qapos_shift_reports', JSON.stringify(updatedLogs));

      setIsReporting(false);
      setIsSuccessReported(true);
    }, 1500);
  };

  const handleResetForm = () => {
    setIsSuccessReported(false);
    setUangFisikInput('');
    setCatatanShift('');
  };


  // --- RENDERING VIEWS ---

  // ADMIN VIEW
  if (isAdmin) {
    return (
      <div id="sales-report-container" className="space-y-6">
        
        {/* Title & Filter Options */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={24} />
              Laporan Keuangan & Analitik Penjualan
            </h2>
            <p className="text-xs text-slate-500">
              Analisis data omset, performa produk terlaris, dan buat laporan keuangan bulanan otomatis siap cetak.
            </p>
          </div>

          {/* Date Filter & Export Panel */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden"
            >
              <option value="All">Sepanjang Tahun</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            <button
              onClick={handleExportExcelAdmin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <FileSpreadsheet size={14} />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Printer size={14} />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Numerical Metrics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-850 rounded-xl">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Pendapatan</span>
              <p className="font-extrabold text-slate-900 text-base leading-tight mt-0.5">{formatIDR(metricsAdmin.totalRevenue)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Transaksi</span>
              <p className="font-extrabold text-gray-900 text-base leading-tight mt-0.5">{metricsAdmin.totalTransactions} Pesanan</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl">
              <CreditCard size={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Rata-Rata Nota</span>
              <p className="font-extrabold text-gray-900 text-base leading-tight mt-0.5">{formatIDR(metricsAdmin.averageOrderValue)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
              <ShoppingBag size={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Porsi Terjual</span>
              <p className="font-extrabold text-gray-900 text-base leading-tight mt-0.5">{metricsAdmin.totalItemsSold} Porsi</p>
            </div>
          </div>
        </div>

        {/* Visual Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 p-4 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-950 flex items-center gap-2">
              Tren Pendapatan Harian ({selectedMonth === 'All' ? 'Tahunan' : 'Bulan Ini'})
            </h3>

            <div className="h-64 w-full">
              {dailyDataAdmin.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Belum ada data transaksi di periode ini.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyDataAdmin} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="Tanggal" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(val) => `Rp ${val/1000}k`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => formatIDR(Number(value))} labelStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs space-y-3 flex flex-col justify-between">
            <h3 className="font-bold text-sm text-gray-950">Kontribusi Kategori (Rp)</h3>

            <div className="h-44 w-full relative">
              {categoryDataAdmin.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                  Belum ada data kontribusi.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDataAdmin}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryDataAdmin.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatIDR(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              {categoryDataAdmin.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_PIE[index % COLORS_PIE.length] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 font-mono">{formatIDR(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Best Sellers & Ledger Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-gray-950 flex items-center gap-1.5">
              <Award className="text-amber-500" size={16} />
              Top 5 Menu Paling Laris
            </h3>

            <div className="space-y-3">
              {bestSellersAdmin.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Belum ada menu yang laku terjual.</p>
              ) : (
                bestSellersAdmin.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-400 w-5 text-center font-mono">#{index + 1}</span>
                      <div>
                        <span className="font-semibold text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatIDR(item.revenue)}</span>
                      </div>
                    </div>
                    <span className="bg-indigo-50 text-indigo-850 font-bold px-2 py-0.5 rounded text-[11px] font-mono shrink-0">
                      {item.quantity} Terjual
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-150 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-950">Rincian Buku Keuangan Bulanan</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-2 px-3">Periode</th>
                    <th className="py-2 px-3 text-right">Kotor (Subtotal)</th>
                    <th className="py-2 px-3 text-right">Potongan Diskon</th>
                    <th className="py-2 px-3 text-right">Pajak Negara</th>
                    <th className="py-2 px-3 text-right">Omset Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {filteredOrdersAdmin.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400 italic">
                        Tidak ada catatan pembukuan transaksi.
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        {selectedMonth === 'All' ? 'Tahun ' + selectedYear : 'Bulan ' + selectedMonth + '/' + selectedYear}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {formatIDR(filteredOrdersAdmin.reduce((sum, o) => sum + o.subtotal, 0))}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-600">
                        -{formatIDR(filteredOrdersAdmin.reduce((sum, o) => sum + o.discount, 0))}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {formatIDR(filteredOrdersAdmin.reduce((sum, o) => sum + o.tax, 0))}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-600">
                        {formatIDR(metricsAdmin.totalRevenue)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] text-gray-400 italic border-t border-gray-50 pt-2.5 leading-normal">
              * Laporan ini diringkas secara real-time dari data penjualan terenkripsi lokal dan cloud server. Gunakan tombol "Cetak PDF" untuk mencetak laporan ke printer berukuran A4 untuk berkas arsip restoran.
            </div>
          </div>
        </div>

      </div>
    );
  }

  // CASHIER VIEW (LAPORAN SHIFT & REKONSILIASI PENJUALAN)
  return (
    <div className="space-y-6">
      
      {/* Title Header with gradient badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Shift Aktif
            </span>
            <span className="text-[11px] text-indigo-200 font-mono">
              Terminal: POS-01
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight font-sans">
            Laporan Shift & Rekonsiliasi Penjualan
          </h2>
          <p className="text-xs text-indigo-150 max-w-xl font-medium">
            Halo <span className="text-emerald-300 font-bold">{currentUser?.name}</span>, laporkan penjualan harian atau mingguan Anda di sini. Cocokkan uang fisik di laci kasir sebelum melakukan serah terima shift.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          {/* Quick window print of shift */}
          <button
            onClick={() => window.print()}
            className="bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-white/10 cursor-pointer"
          >
            <Printer size={14} />
            <span>Cetak Struk Shift</span>
          </button>
        </div>
      </div>

      {/* Control Filters Area */}
      <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Toggle Periode (Harian vs Mingguan) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Periode Penjualan</label>
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 self-start">
            <button
              onClick={() => { setPeriode('harian'); handleResetForm(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periode === 'harian'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Harian (Hari Ini: {todayStr.split('-')[2]}/{todayStr.split('-')[1]})
            </button>
            <button
              onClick={() => { setPeriode('mingguan'); handleResetForm(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periode === 'mingguan'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Mingguan (7 Hari Terakhir)
            </button>
          </div>
        </div>

        {/* Toggle Operator Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cakup Operator</label>
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 self-start">
            <button
              onClick={() => { setOperatorFilter('me'); handleResetForm(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                operatorFilter === 'me'
                  ? 'bg-indigo-650 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Hanya Penjualanku ({currentUser?.name?.split(' ')[0]})
            </button>
            <button
              onClick={() => { setOperatorFilter('all'); handleResetForm(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                operatorFilter === 'all'
                  ? 'bg-indigo-650 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Seluruh Operator (Restoran)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Sales Metrics & Payment Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Omset Bersih</span>
              <p className="font-black text-slate-900 text-xl font-mono mt-1">
                {formatIDR(cashierMetrics.netSales)}
              </p>
              <div className="text-[10px] text-slate-400 mt-2 font-semibold">
                Kotor: {formatIDR(cashierMetrics.grossSales)} (Diskon: -{formatIDR(cashierMetrics.discountGiven)})
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Total Transaksi</span>
              <p className="font-black text-slate-900 text-xl font-mono mt-1">
                {cashierMetrics.totalTransactions} Nota
              </p>
              <div className="text-[10px] text-slate-400 mt-2 font-semibold">
                Pajak PB1 Terkumpul: {formatIDR(cashierMetrics.taxCollected)}
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown Box */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Coins className="text-indigo-600 animate-pulse" size={15} />
              Rincian Metode Pembayaran (Reconciliation Target)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Cash expected */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-emerald-800">
                  <span>UANG TUNAI (CASH)</span>
                  <span className="bg-emerald-100 px-1.5 py-0.2 rounded text-[9px]">{cashierMetrics.countCash}x</span>
                </div>
                <p className="text-base font-black text-emerald-950 font-mono">
                  {formatIDR(cashierMetrics.expectedCash)}
                </p>
                <p className="text-[9px] text-emerald-600 font-semibold leading-normal">
                  * Harus ada di laci kas fisik kasir.
                </p>
              </div>

              {/* QRIS expected */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-blue-800">
                  <span>QRIS DIGITAL</span>
                  <span className="bg-blue-100 px-1.5 py-0.2 rounded text-[9px]">{cashierMetrics.countQRIS}x</span>
                </div>
                <p className="text-base font-black text-blue-950 font-mono">
                  {formatIDR(cashierMetrics.expectedQRIS)}
                </p>
                <p className="text-[9px] text-blue-600 font-semibold leading-normal">
                  * Tercatat di mutasi e-wallet restoran.
                </p>
              </div>

              {/* Debit expected */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-indigo-800">
                  <span>DEBIT CARD</span>
                  <span className="bg-indigo-100 px-1.5 py-0.2 rounded text-[9px]">{cashierMetrics.countDebit}x</span>
                </div>
                <p className="text-base font-black text-indigo-950 font-mono">
                  {formatIDR(cashierMetrics.expectedDebit)}
                </p>
                <p className="text-[9px] text-indigo-600 font-semibold leading-normal">
                  * Periksa slip edc bank bersangkutan.
                </p>
              </div>

              {/* Kredit expected */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-amber-800">
                  <span>KREDIT</span>
                  <span className="bg-amber-100 px-1.5 py-0.2 rounded text-[9px]">{cashierMetrics.countKredit}x</span>
                </div>
                <p className="text-base font-black text-amber-950 font-mono">
                  {formatIDR(cashierMetrics.expectedKredit)}
                </p>
                <p className="text-[9px] text-amber-600 font-semibold leading-normal">
                  * Berkas piutang / tunda bayar.
                </p>
              </div>

            </div>
          </div>

          {/* Table list of transactions under this period */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              Log Transaksi Terfilter ({cashierMetrics.totalTransactions} Pesanan)
            </h3>

            <div className="overflow-x-auto max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                    <th className="py-2.5 px-3">Invoice</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3">Kasir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {cashierFilteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        Tidak ada transaksi pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    cashierFilteredOrders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-900">{o.invoiceNumber}</td>
                        <td className="py-2 px-3">{o.date}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            o.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-800' :
                            o.paymentMethod === 'QRIS' ? 'bg-blue-100 text-blue-850' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{formatIDR(o.grandTotal)}</td>
                        <td className="py-2 px-3 text-[10px] text-slate-400">{o.cashier.split(' ')[0]}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Cash Reconciliation & Submit Report (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Reconciliation Card Form */}
          <div className="bg-white border-2 border-indigo-600/20 rounded-2xl p-5 shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Shield className="text-indigo-600" size={16} />
              Form Rekonsiliasi & Kirim Laporan
            </h3>

            {isSuccessReported ? (
              // Success Screen after Reporting
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
                  <Check size={32} strokeWidth={3} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase">Laporan Berhasil Terkirim!</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-4">
                    Data shift dan rekonsiliasi kas berhasil diselaraskan ke database cloud pusat. Pemilik restoran / manager telah menerima laporan penyerahan Anda.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-left text-[10px] font-mono text-slate-500 space-y-1">
                  <div>✓ Operator: <span className="font-bold text-slate-850">{currentUser?.name}</span></div>
                  <div>✓ Periode: <span className="font-bold text-slate-850">{periode === 'harian' ? 'Harian (Hari Ini)' : 'Mingguan'}</span></div>
                  <div>✓ Transaksi Terhitung: <span className="font-bold text-slate-850">{cashierMetrics.totalTransactions} Nota</span></div>
                  <div>✓ Selisih Kas: <span className={`font-bold ${cashDiscrepancy === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatIDR(cashDiscrepancy)}</span></div>
                </div>

                <button
                  onClick={handleResetForm}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Buat Laporan Baru / Edit Laporan
                </button>
              </div>
            ) : (
              // Input Form fields
              <div className="space-y-4">
                
                {/* Auto Calculated Expected Cash Box */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Target Uang Tunai (Sistem)</span>
                    <p className="font-black text-slate-800 text-lg font-mono">
                      {formatIDR(cashierMetrics.expectedCash)}
                    </p>
                  </div>
                  <Coins size={24} className="text-indigo-400/50" />
                </div>

                {/* Actual counted Cash Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    Uang Tunai Fisik di Laci Kasir (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs font-mono">Rp</span>
                    <input
                      type="number"
                      value={uangFisikInput}
                      onChange={(e) => setUangFisikInput(e.target.value)}
                      placeholder="Masukkan total hitungan uang kertas & koin..."
                      className="w-full bg-white border border-slate-250 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono font-bold focus:outline-indigo-600"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    * Hitunglah seluruh uang tunai fisik di laci kasir (kembalian + penjualan) untuk diverifikasi oleh sistem.
                  </p>
                </div>

                {/* Live Discrepancy Status Board */}
                {uangFisikInput.trim() !== '' && (
                  <div className={`rounded-xl p-3.5 border text-xs leading-relaxed space-y-1 ${
                    cashDiscrepancy === 0 ? 'bg-emerald-50 border-emerald-150 text-emerald-950' :
                    cashDiscrepancy < 0 ? 'bg-rose-50 border-rose-150 text-rose-950' :
                    'bg-amber-50 border-amber-150 text-amber-950'
                  }`}>
                    <div className="flex justify-between items-center font-bold">
                      <span className="uppercase tracking-wider text-[10px]">Selisih Kas Terhitung:</span>
                      <span className="font-mono text-sm">
                        {cashDiscrepancy > 0 ? '+' : ''}{formatIDR(cashDiscrepancy)}
                      </span>
                    </div>
                    {cashDiscrepancy === 0 ? (
                      <p className="text-[10px] text-emerald-700 font-medium">
                        ✓ <strong>Sempurna!</strong> Jumlah uang fisik di laci cocok 100% dengan total transaksi tunai sistem. Anda dapat melanjutkan penutupan shift.
                      </p>
                    ) : cashDiscrepancy < 0 ? (
                      <p className="text-[10px] text-rose-700 font-medium">
                        ⚠ <strong>Peringatan Selisih Kurang!</strong> Uang fisik kurang {formatIDR(Math.abs(cashDiscrepancy))} dari target sistem. Tuliskan kendala / kembalian gantung pada kolom catatan di bawah.
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-700 font-medium">
                        ⚠ <strong>Peringatan Selisih Lebih!</strong> Uang fisik berlebih {formatIDR(cashDiscrepancy)} dari target sistem. Catatlah sisa modal kembalian atau tips yang belum dikeluarkan di catatan.
                      </p>
                    )}
                  </div>
                )}

                {/* Textarea Catatan Shift */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">Catatan Serah Terima / Masalah Shift</label>
                  <textarea
                    rows={3}
                    value={catatanShift}
                    onChange={(e) => setCatatanShift(e.target.value)}
                    placeholder="Contoh: Selisih kurang Rp 2.000 karena pembulatan, struk manual hang hang, atau modal awal masih tersimpan di laci..."
                    className="w-full bg-white border border-slate-250 rounded-xl p-3 text-xs focus:outline-indigo-600 font-medium"
                  />
                </div>

                {/* Action button triggers report sync */}
                <button
                  type="button"
                  onClick={handleReportShiftSubmit}
                  disabled={isReporting || uangFisikInput.trim() === ''}
                  className={`w-full font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    uangFisikInput.trim() === ''
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isReporting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Mengirim Laporan ke Cloud...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      <span>Kirim Laporan & Selesaikan Shift</span>
                    </>
                  )}
                </button>

              </div>
            )}

          </div>

          {/* Real-time printable Mini Thermal Bill Format Preview */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4 text-slate-800 font-mono text-[10px] leading-normal select-none">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-sans border-b border-amber-200 pb-2">
              Pratinjau Struk Laporan Shift (58mm/80mm)
            </h3>
            
            {/* Struk Content Area */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-amber-150 space-y-3 font-mono text-[9px] text-slate-850">
              <div className="text-center space-y-0.5">
                <p className="font-black text-xs">QA RESTO MAKMUR</p>
                <p>STRUK LAPORAN PENYERAHAN SHIFT</p>
                <p className="border-b border-dashed border-slate-350 py-1" />
              </div>

              <div className="space-y-1">
                <p>Waktu Cetak: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                <p>Petugas: {currentUser?.name}</p>
                <p>Cakupan : {periode === 'harian' ? 'Harian (Hari Ini)' : 'Mingguan'}</p>
                <p>Status  : Berhasil Disinkronkan ke Cloud</p>
                <p className="border-b border-dashed border-slate-350 py-1" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Gross Sales:</span>
                  <span>{formatIDR(cashierMetrics.grossSales)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Potongan Diskon:</span>
                  <span>-{formatIDR(cashierMetrics.discountGiven)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PB1 Tax (10%):</span>
                  <span>{formatIDR(cashierMetrics.taxCollected)}</span>
                </div>
                <div className="flex justify-between font-black">
                  <span>Total Omset Bersih:</span>
                  <span>{formatIDR(cashierMetrics.netSales)}</span>
                </div>
                <p className="border-b border-dashed border-slate-350 py-1" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Penerimaan Tunai:</span>
                  <span>{formatIDR(cashierMetrics.expectedCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uang Laci Fisik:</span>
                  <span>{uangFisikInput.trim() !== '' ? formatIDR(actualCashValue) : 'Rp 0'}</span>
                </div>
                <div className="flex justify-between font-black">
                  <span>Selisih Laci Kas:</span>
                  <span className={cashDiscrepancy < 0 ? 'text-rose-600' : cashDiscrepancy > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    {uangFisikInput.trim() !== '' ? (cashDiscrepancy > 0 ? '+' : '') + formatIDR(cashDiscrepancy) : 'Rp 0'}
                  </span>
                </div>
                <p className="border-b border-dashed border-slate-350 py-1" />
              </div>

              <div className="space-y-1">
                <p className="font-bold">Rincian Non-Tunai:</p>
                <div className="flex justify-between pl-2">
                  <span>- QRIS E-Wallet:</span>
                  <span>{formatIDR(cashierMetrics.expectedQRIS)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>- Kartu Debit:</span>
                  <span>{formatIDR(cashierMetrics.expectedDebit)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span>- Kredit:</span>
                  <span>{formatIDR(cashierMetrics.expectedKredit)}</span>
                </div>
                <p className="border-b border-dashed border-slate-350 py-1" />
              </div>

              <div className="space-y-1">
                <p className="font-bold">Catatan Kasir:</p>
                <p className="italic text-slate-500 pl-2 leading-tight">
                  "{catatanShift.trim() || 'Tidak ada catatan Khusus.'}"
                </p>
                <p className="border-b border-dashed border-slate-350 py-1" />
              </div>

              <div className="text-center pt-2 space-y-1 text-[8px] text-slate-400">
                <p>TERIMA KASIH ATAS DEDIKASI ANDA</p>
                <p>-- LEMBAR ARSIP RESTORAN --</p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              <span>Cetak Struk Ke Printer Thermal</span>
            </button>
          </div>

          {/* History of Shift Report Logs (Local Session Database) */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              Riwayat Laporan Shift Terkirim ({reportedLogs.length})
            </h3>

            {reportedLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 italic font-medium">
                Belum ada shift yang dilaporkan pada sesi ini.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {reportedLogs.map(log => (
                  <div key={log.id} className="border border-slate-100 rounded-xl p-3 text-[11px] space-y-2 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="font-bold text-slate-800">{log.timestamp.split(' pukul ')[0]}</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-1.5 py-0.2 rounded font-mono uppercase">
                        {log.periode}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-500 font-medium">
                      <div>
                        Operator: <span className="text-slate-800 font-bold">{log.operator}</span>
                      </div>
                      <div>
                        Nota: <span className="text-slate-800 font-bold">{log.transactionsCount} pcs</span>
                      </div>
                      <div>
                        Uang Laci: <span className="text-slate-800 font-bold font-mono">{formatIDR(log.actualCash)}</span>
                      </div>
                      <div>
                        Selisih: <span className={`font-mono font-bold ${log.discrepancy === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.discrepancy > 0 ? '+' : ''}{formatIDR(log.discrepancy)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg leading-snug border border-slate-100 italic">
                      " {log.notes} "
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
