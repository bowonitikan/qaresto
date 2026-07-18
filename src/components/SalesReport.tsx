import { useState, useMemo } from 'react';
import { Order, Product, Category } from '../types';
import { formatIDR, exportToCSV } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, FileSpreadsheet, Printer, Award, Calendar, DollarSign, ShoppingBag, CreditCard, RefreshCw } from 'lucide-react';

interface SalesReportProps {
  orders: Order[];
  products: Product[];
}

export default function SalesReport({ orders, products }: SalesReportProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Compute metrics
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Date format is YYYY-MM-DD
      const dateParts = o.date.split('-');
      if (dateParts.length < 3) return true;
      const year = dateParts[0];
      const month = dateParts[1]; // "07"

      const matchYear = year === selectedYear;
      const matchMonth = selectedMonth === 'All' || month === selectedMonth;
      return matchYear && matchMonth;
    });
  }, [orders, selectedMonth, selectedYear]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalTransactions = filteredOrders.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    let totalItemsSold = 0;
    filteredOrders.forEach(o => {
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
  }, [filteredOrders]);

  // Chart 1: Daily Revenue Trend
  const dailyData = useMemo(() => {
    const dailyMap: { [date: string]: number } = {};
    filteredOrders.forEach(o => {
      const date = o.date; // YYYY-MM-DD
      dailyMap[date] = (dailyMap[date] || 0) + o.grandTotal;
    });

    return Object.keys(dailyMap)
      .sort()
      .map(date => ({
        Tanggal: date.split('-')[2] + '/' + date.split('-')[1], // Just DD/MM
        Revenue: dailyMap[date]
      }));
  }, [filteredOrders]);

  // Chart 2: Category distribution
  const categoryData = useMemo(() => {
    const categoryMap: { [cat in Category]?: number } = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.product.category;
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.product.price * item.quantity);
      });
    });

    return Object.keys(categoryMap).map(cat => ({
      name: cat,
      value: categoryMap[cat as Category] || 0
    }));
  }, [filteredOrders]);

  // Chart 3: Best Selling Products
  const bestSellers = useMemo(() => {
    const productMap: { [name: string]: { quantity: number; revenue: number } } = {};
    filteredOrders.forEach(o => {
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
      .slice(0, 5); // top 5
  }, [filteredOrders]);

  const COLORS = ['#312e81', '#4338ca', '#4f46e5', '#6366f1', '#818cf8'];

  // Handle Excel Export
  const handleExportExcel = () => {
    const headers = ['ID Pesanan', 'Nomor Invoice', 'Tanggal', 'Subtotal', 'Diskon', 'Pajak (10%)', 'Total Akhir', 'Metode Bayar', 'Customer', 'Kasir'];
    const rows = filteredOrders.map(o => [
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

  // Printable Financial Report Dialog Trigger (native print)
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div id="sales-report-container" className="space-y-6">
      
      {/* Title & Filter Options */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={24} />
            Laporan Keuangan & Analitik Penjualan
          </h2>
          <p className="text-xs text-slate-505">
            Analisis data omset, performa produk terlaris, dan buat laporan keuangan bulanan otomatis siap cetak.
          </p>
        </div>

        {/* Date Filter & Export Panel */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Select */}
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

          {/* Year Select */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>Ekspor Excel</span>
          </button>

          {/* Export PDF Print Button */}
          <button
            onClick={handlePrintPDF}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer size={14} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Numerical Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric Card 1: Revenue */}
        <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-850 rounded-xl">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Pendapatan</span>
            <p className="font-extrabold text-slate-900 text-base leading-tight mt-0.5">{formatIDR(metrics.totalRevenue)}</p>
          </div>
        </div>

        {/* Metric Card 2: Transactions */}
        <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Transaksi</span>
            <p className="font-extrabold text-gray-900 text-base leading-tight mt-0.5">{metrics.totalTransactions} Pesanan</p>
          </div>
        </div>

        {/* Metric Card 3: AOV */}
        <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl">
            <CreditCard size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Rata-Rata Nota</span>
            <p className="font-extrabold text-gray-900 text-base leading-tight mt-0.5">{formatIDR(metrics.averageOrderValue)}</p>
          </div>
        </div>

        {/* Metric Card 4: Items Sold */}
        <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Porsi Terjual</span>
            <p className="font-extrabold text-gray-900 text-base leading-tight mt-0.5">{metrics.totalItemsSold} Porsi</p>
          </div>
        </div>

      </div>

      {/* Visual Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Line/Bar Chart (Left spans 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-950 flex items-center gap-2">
            Tren Pendapatan Harian ({selectedMonth === 'All' ? 'Tahunan' : 'Bulan Ini'})
          </h3>

          <div className="h-64 w-full">
            {dailyData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                Belum ada data transaksi di periode ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

        {/* Category Contribution (Right spans 1 col) */}
        <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-gray-950">Kontribusi Kategori (Rp)</h3>

          <div className="h-44 w-full relative">
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                Belum ada data kontribusi.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatIDR(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">{formatIDR(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid: Best Sellers & Monthly Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Best Selling List */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-gray-950 flex items-center gap-1.5">
            <Award className="text-amber-500" size={16} />
            Top 5 Menu Paling Laris
          </h3>

          <div className="space-y-3">
            {bestSellers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Belum ada menu yang laku terjual.</p>
            ) : (
              bestSellers.map((item, index) => (
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

        {/* Audit Statement / Monthly Financial Ledger Table */}
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
                {filteredOrders.length === 0 ? (
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
                      {formatIDR(filteredOrders.reduce((sum, o) => sum + o.subtotal, 0))}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600">
                      -{formatIDR(filteredOrders.reduce((sum, o) => sum + o.discount, 0))}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatIDR(filteredOrders.reduce((sum, o) => sum + o.tax, 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-600">
                      {formatIDR(metrics.totalRevenue)}
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
