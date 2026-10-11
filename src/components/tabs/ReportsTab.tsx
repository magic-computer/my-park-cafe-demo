import React, { useState } from "react";
import { 
  Utensils, 
  Receipt, 
  Package, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Briefcase, 
  Calendar, 
  BarChart3, 
  Printer, 
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../Card";
import { AzDatePicker } from "../AzDatePicker";
import { 
  Table, 
  OrderItem, 
  Reservation, 
  InventoryItem, 
  StaffMember,
  KitchenItem
} from "../../types";
import { matchesDatePeriod, parseDateToYMD, formatAzDate } from "../../utils/dateUtils";

export interface ReportsTabProps {
  t: any;
  tText: (key: string, defaultText?: string) => string;
  memoizedReportStats: any;
  activeOrders: Record<number, OrderItem[]>;
  reportDate: string;
  setReportDate: (date: string) => void;
  reportPeriod: "daily" | "monthly" | "yearly" | "custom";
  setReportPeriod: (period: "daily" | "monthly" | "yearly" | "custom") => void;
  reportsSubTab: "general" | "waiters" | "categories" | "dishes" | "expenses" | "defective" | "returned" | "profit" | "sales" | "reservations" | "inventory" | "kitchen" | "staff";
  setReportsSubTab: (tab: any) => void;
  reservations: Reservation[];
  expenses: any[];
  inventory: InventoryItem[];
  staff: StaffMember[];
  tables: Table[];
  kitchenLog: KitchenItem[];
  currencySymbol: string;
  currencyText: string;
  formatPrice: (amount: number | string | undefined | null) => string;
  getLocale: () => string;
  getActiveLocaleForApp: () => string;
  exportToExcel: (data: any, filename: string, headers?: string[]) => void;
  setReportPrintPreview: (preview: any) => void;
  activeShiftBusinessDate?: string;
  shiftId?: string;
  setShiftId?: (id: string) => void;
  closedShifts?: Record<string, any>;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  t,
  tText,
  memoizedReportStats,
  activeOrders,
  reportDate,
  setReportDate,
  reportPeriod,
  setReportPeriod,
  reportsSubTab,
  setReportsSubTab,
  reservations,
  expenses,
  inventory,
  staff,
  tables,
  kitchenLog,
  currencySymbol,
  currencyText,
  formatPrice,
  getLocale,
  getActiveLocaleForApp,
  exportToExcel,
  setReportPrintPreview,
  activeShiftBusinessDate,
  shiftId,
  setShiftId,
  closedShifts = {}
}) => {
// Fetch filtered statistics based on selected period and date
      const reportStats = memoizedReportStats;

      const totalSalesSum = reportStats.totalSales;
      const completedCount = reportStats.filteredOrders.length;
      const averageOrderValue = completedCount > 0 ? totalSalesSum / completedCount : 0;

      // Active orders details
      const currentActiveOrdersCount = Object.keys(activeOrders).length;

      // Filter reservations by selected report period
      const matchesReportDate = (resDate: string) => {
        return matchesDatePeriod(resDate, reportDate, reportPeriod);
      };

      const filteredReservations = reservations.filter(r => matchesReportDate(r.date));
      const totalReservationsCount = filteredReservations.length;
      const activeReservationsCount = filteredReservations.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length;
      const arrivedReservationsCount = filteredReservations.filter(r => r.status === 'arrived').length;
      const cancelledReservationsCount = filteredReservations.filter(r => r.status === 'cancelled').length;

      // Inventory report variables
      const totalInventoryItems = inventory.length;
      const lowStockCount = inventory.filter(item => item.quantity <= item.minLevel).length;

      // Kitchen activity variables
      const kitchenItemsCount = kitchenLog.length;
      const kitchenDefectiveCount = kitchenLog.filter(k => k.status === 'defective' || k.status === 'returned').length;

      const getPeriodLabelAZ = () => {
        const p = parseDateToYMD(reportDate);
        if (!p) return reportDate;
        const year = p.year;
        const monthNum = parseInt(p.month, 10);
        const day = parseInt(p.day, 10);
        
        const monthNames = [
          "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
          "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
        ];
        const monthName = monthNames[monthNum - 1] || p.month;

        if (reportPeriod === 'daily' || reportPeriod === 'custom') {
          return `${day} ${monthName} ${year}`;
        } else if (reportPeriod === 'monthly') {
          return `${monthName} ${year}`;
        } else if (reportPeriod === 'yearly') {
          return `${year}-ci İl`;
        }
        return reportDate;
      };

      // Custom staff mapping for dynamic sales calculations in selected period
      const waitersWithFilteredSales = staff.map(st => {
        const waiterTransactions = reportStats.filteredOrders.filter(tx => 
          tx.paymentMethod !== 'gift' && (
            tx.waiterName === `${st.firstName} ${st.lastName}` || 
            tx.waiterName === st.name || 
            (st.firstName && tx.waiterName.includes(st.firstName))
          )
        );
        const waiterSalesSum = Math.round(waiterTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) * 100) / 100;
        return {
          ...st,
          filteredSales: waiterSalesSum,
          filteredOrdersCount: waiterTransactions.length
        };
      });

      const otherTransactions = reportStats.filteredOrders.filter(tx => {
        if (tx.paymentMethod === 'gift') return false;
        return !staff.some(st => 
          tx.waiterName === `${st.firstName} ${st.lastName}` || 
          tx.waiterName === st.name || 
          (st.firstName && tx.waiterName.includes(st.firstName))
        );
      });

      if (otherTransactions.length > 0) {
        const otherSalesSum = Math.round(otherTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) * 100) / 100;
        waitersWithFilteredSales.push({
          id: 999999,
          name: 'Sistem Admini / Digər',
          firstName: 'Sistem Admini',
          lastName: '/ Digər',
          role: 'Kassa / Rəhbərlik',
          status: 'on-shift',
          phone: '-',
          salary: 0,
          totalSales: otherSalesSum,
          filteredSales: otherSalesSum,
          filteredOrdersCount: otherTransactions.length
        } as any);
      }

      // Reconcile archive closed shifts deltas into waiters table so table sum matches Dashboard & Report top cards 100%
      if (reportStats.salesDeltasByDate && Array.isArray(reportStats.salesDeltasByDate)) {
        reportStats.salesDeltasByDate.forEach((dItem: { dateKey: string; deltaSales: number }, dIdx: number) => {
          if (dItem.deltaSales > 0) {
            const formattedDKey = formatAzDate(dItem.dateKey);
            waitersWithFilteredSales.push({
              id: `__reconciled_waiter_${dItem.dateKey}__` as any,
              name: `Naməlum Ofisiant (Arxiv Delta - ${formattedDKey})`,
              firstName: `Naməlum Ofisiant`,
              lastName: `(Arxiv ${formattedDKey})`,
              role: 'Arxiv Satışlar',
              status: 'off-shift',
              phone: '-',
              salary: 0,
              totalSales: dItem.deltaSales,
              filteredSales: dItem.deltaSales,
              filteredOrdersCount: 1
            } as any);
          }
        });
      }

      const [reportTablePage, setReportTablePage] = useState(1);
      const REPORT_PER_PAGE = 25;

      const currentTableList = 
        reportsSubTab === 'sales' ? waitersWithFilteredSales :
        reportsSubTab === 'reservations' ? filteredReservations :
        reportsSubTab === 'inventory' ? inventory :
        reportsSubTab === 'kitchen' ? kitchenLog :
        staff;

      const totalReportPages = Math.max(1, Math.ceil(currentTableList.length / REPORT_PER_PAGE));
      const pagedTableList = currentTableList.slice(
        (reportTablePage - 1) * REPORT_PER_PAGE,
        reportTablePage * REPORT_PER_PAGE
      );

      const [inventoryTxPage, setInventoryTxPage] = useState(1);
      const totalInventoryTxPages = Math.max(1, Math.ceil(reportStats.filteredInventory.length / REPORT_PER_PAGE));
      const pagedInventoryTx = reportStats.filteredInventory.slice(
        (inventoryTxPage - 1) * REPORT_PER_PAGE,
        inventoryTxPage * REPORT_PER_PAGE
      );

      // Render Sub-tab selector, summaries, data-table, with Excel & Print buttons
      return (
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in duration-300">
          <div className="max-w-7xl mx-auto space-y-6 pb-16">
            
            {/* Tabbed report header controls */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
              
              {/* Report Sub Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100 flex-1">
                <button
                  type="button"
                  onClick={() => { setReportsSubTab('sales'); setReportTablePage(1); }}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${reportsSubTab === 'sales' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Satış & Sifariş
                </button>
                <button
                  type="button"
                  onClick={() => { setReportsSubTab('reservations'); setReportTablePage(1); }}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${reportsSubTab === 'reservations' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Rezervasiyalar
                </button>
                <button
                  type="button"
                  onClick={() => { setReportsSubTab('inventory'); setReportTablePage(1); }}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${reportsSubTab === 'inventory' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Anbar & Stok
                </button>
                <button
                  type="button"
                  onClick={() => { setReportsSubTab('kitchen'); setReportTablePage(1); }}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${reportsSubTab === 'kitchen' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Mətbəx Jurnalı
                </button>
                <button
                  type="button"
                  onClick={() => { setReportsSubTab('staff'); setReportTablePage(1); }}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-xl transition-all ${reportsSubTab === 'staff' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Ofisiantlar & Növbə
                </button>
              </div>

              {/* Excel and Print Global Trigger for Report sub-tab */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    let headers: string[] = [];
                    let rows: any[] = [];
                    let filename = `Hesabat_${reportsSubTab}`;

                    if (reportsSubTab === 'sales') {
                      headers = ["Ofisiant Adı / Şöbə", "Status", "Rolu", "Aktivlik dövrü", "Cəmi Satışlar"];
                      rows = waitersWithFilteredSales.map(st => ({
                        name: `${st.firstName} ${st.lastName}`,
                        status: st.status === 'on-shift' ? 'Növbədədir' : 'Növbədə deyil',
                        role: st.role,
                        attendance: `${st.filteredOrdersCount} sifariş`,
                        sales: `${st.filteredSales.toFixed(2)} ₼`
                      }));
                      // append general details
                      rows.push({ name: "Cəmi Satış Dövriyyəsi", status: "-", role: "-", attendance: "-", sales: `${totalSalesSum.toFixed(2)} ₼` });
                    } else if (reportsSubTab === 'reservations') {
                      headers = ["Müştəri Adı", "Masa No", "Tarix", "Saat", "Qonaq Sayı", "Status"];
                      rows = filteredReservations.map(r => ({
                        name: r.customerName,
                        table: tables.find(t => t.id === r.tableId)?.number || `Masa #${r.tableId}`,
                        date: r.date,
                        time: r.time,
                        guests: `${r.guests} nəfər`,
                        status: r.status === 'confirmed' ? 'Aktiv' : r.status === 'arrived' ? 'Müştəri gəlib' : r.status === 'completed' ? 'Tamamlandı' : 'Ləğv edilib'
                      }));
                    } else if (reportsSubTab === 'inventory') {
                      headers = ["Məhsulun Adı", "Mövcud Səviyyə", "Kritik Limit", "Status"];
                      rows = inventory.map(i => ({
                        name: i.name,
                        stock: `${i.quantity} ${i.unit}`,
                        limit: `${i.minLevel} ${i.unit}`,
                        status: i.quantity <= i.minLevel ? 'KRİTİK' : 'Normal'
                      }));
                    } else if (reportsSubTab === 'kitchen') {
                      headers = ["Sifariş ID", "Yemək Adı", "Masa", "Ofisiant", "Tarix", "Qeyd", "Status"];
                      rows = kitchenLog.map(k => ({
                        id: k.orderId,
                        dish: k.dishName,
                        table: k.tableNumber,
                        waiter: k.waiterName,
                        date: (k.timestamp instanceof Date ? k.timestamp : new Date(k.timestamp)).toLocaleDateString(getActiveLocaleForApp()),
                        notes: k.notes || '-',
                        status: k.status === 'ready' ? 'Hazırdır' : k.status === 'preparing' ? 'Hazırlanır' : k.status === 'defective' ? 'Xarab' : 'Geri Qaytarılıb'
                      }));
                    } else if (reportsSubTab === 'staff') {
                      headers = ["İşçi Adı", "Aktiv Növbə", "Sənəd No", "Telefon", "Şəxsi Satış"];
                      rows = waitersWithFilteredSales.map(s => ({
                        name: `${s.firstName} ${s.lastName}`,
                        shift: s.status === 'on-shift' ? 'AKTİV' : 'MƏZUNİYYƏT',
                        doc: s.docNumber,
                        phone: s.phone,
                        sales: formatPrice(s.filteredSales)
                      }));
                    }
                    exportToExcel(rows, filename, headers);
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center whitespace-nowrap transition-all"
                >
                  <Download className="w-4 h-4 mr-2 text-slate-500" />
                  Excelə köçür
                </button>
                <button
                  type="button"
                  onClick={() => {
                    let headers: string[] = [];
                    let rows: any[][] = [];
                    let title = "Restoran Hesabatı";

                    if (reportsSubTab === 'sales') {
                      title = `Satış Hesabatı - ${getPeriodLabelAZ()}`;
                      headers = ["Ofisiant Adı", "Rolu", "Aktivlik", "Cəmi Satış"];
                      rows = waitersWithFilteredSales.map(st => [
                        `${st.firstName} ${st.lastName}`,
                        st.role,
                        `${st.filteredOrdersCount} sifariş`,
                        `${st.filteredSales.toFixed(2)} ₼`
                      ]);
                      rows.push(["CƏMİ MÜRACİƏT DÖVRİYYƏSİ", "-", "-", `${totalSalesSum.toFixed(2)} ₼`]);
                    } else if (reportsSubTab === 'reservations') {
                      title = `Rezervasiya Hesabatı - ${getPeriodLabelAZ()}`;
                      headers = ["Müştəri Adı", "Masa", "Tarix", "Saat", "Qonaq", "Status"];
                      rows = filteredReservations.map(r => [
                        r.customerName,
                        tables.find(t => t.id === r.tableId)?.number || `Masa #${r.tableId}`,
                        r.date,
                        r.time,
                        `${r.guests} nəfər`,
                        r.status === 'confirmed' ? 'Aktiv' : r.status === 'arrived' ? 'Müştəri gəlib' : r.status === 'completed' ? 'Tamamlandı' : (r.status as any) === 'cancelled' ? 'Ləğv edilib' : '-'
                      ]);
                    } else if (reportsSubTab === 'inventory') {
                      title = "Anbar Qalığı və Stok Vəziyyəti";
                      headers = ["Məhsulun Adı", "Qalığı", "Minimal Limit", "Vəziyyəti"];
                      rows = inventory.map(i => [
                        i.name,
                        `${i.quantity} ${i.unit}`,
                        `${i.minLevel} ${i.unit}`,
                        i.quantity <= i.minLevel ? 'KRİTİK' : 'Normal'
                      ]);
                    } else if (reportsSubTab === 'kitchen') {
                      title = "Mətbəx Hazırlıq və Defekt Jurnalı";
                      headers = ["Yemək Adı", "Masa", "Ofisiant", "Mətbəx Statusu"];
                      rows = kitchenLog.map(k => [
                        k.dishName,
                        k.tableNumber,
                        k.waiterName,
                        k.status === 'ready' ? 'Hazırdır' : k.status === 'preparing' ? 'Hazırlanır' : k.status === 'defective' ? 'Xarab' : 'Geri Qaytarılıb'
                      ]);
                    } else if (reportsSubTab === 'staff') {
                      title = `Ofisiant Satış Hesabatı - ${getPeriodLabelAZ()}`;
                      headers = ["Ofisiant Adı", "Rolu", "Şəxsi Satış", "Növbə statusu"];
                      rows = waitersWithFilteredSales.map(s => [
                        `${s.firstName} ${s.lastName}`,
                        s.role,
                        `${s.filteredSales.toFixed(2)} ₼`,
                        s.status === 'on-shift' ? 'AKTİV NÖVBƏDƏ' : 'NÖVBƏDƏ DEYİL'
                      ]);
                    }
                    setReportPrintPreview({
                      isOpen: true,
                      title,
                      headers,
                      rows
                    });
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center whitespace-nowrap transition-all"
                >
                  <Printer className="w-4 h-4 mr-2 text-slate-500" />
                  Çap et
                </button>
              </div>

            </div>

            {/* Date Filters row for System Reports */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">HESABAT METRİKA SÜZGƏCİ</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Cədvəllər və qalıq süzgəcləri bu tarixə əsasən hesablanır: <span className="text-orange-500 font-extrabold">{getPeriodLabelAZ()}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                  {(['daily', 'monthly', 'yearly'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setReportPeriod(p);
                        if (p === 'daily') {
                          setReportDate(activeShiftBusinessDate || reportDate);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        reportPeriod === p
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {p === 'daily' ? 'GÜNDƏLİK' : p === 'monthly' ? 'AYLIQ' : 'İLLİK'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 border-l pl-2 border-slate-200">
                  <AzDatePicker
                    value={reportDate}
                    onChange={(val) => {
                      if (val) {
                        setReportDate(val);
                        setReportPeriod('custom');
                      }
                    }}
                    placeholder="Tarix seçin"
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs font-bold text-slate-700 select-none cursor-pointer flex items-center gap-1.5"
                    activeShiftBusinessDate={activeShiftBusinessDate}
                  />

                  <select 
                    value={shiftId || 'auto'} 
                    onChange={(e) => setShiftId && setShiftId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs font-bold text-slate-700 select-none cursor-pointer"
                  >
                    <option value="auto">Aktiv Növbə (Auto)</option>
                    <option value="all">Bütün Gün (Cəmi)</option>
                    {Object.values(closedShifts || {}).map((cs: any) => (
                      cs && cs.id ? <option key={cs.id} value={cs.id}>{cs.name || cs.id}</option> : null
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Metrics of the Selected Sub-Tab */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {reportsSubTab === 'sales' && (
                <>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ümumi Dövriyyə</p>
                      <p className="text-2xl font-black text-slate-800">{totalSalesSum.toFixed(2)} ₼</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                      <Receipt className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ödənilmiş Çeklər</p>
                      <p className="text-2xl font-black text-slate-800">{completedCount} ədəd</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aktiv Masalar (İndi)</p>
                      <p className="text-2xl font-black text-slate-800">{tables.filter(t => t.status === 'occupied').length} masa</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                      <Utensils className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ortalama Çek</p>
                      <p className="text-2xl font-black text-slate-800">{averageOrderValue.toFixed(2)} ₼</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                  </div>
                </>
              )}

              {reportsSubTab === 'reservations' && (
                <>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cəmi Rezervasiyalar</p>
                      <p className="text-2xl font-black text-slate-800">{totalReservationsCount} ədəd</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aktiv Gözləyən</p>
                      <p className="text-2xl font-black text-slate-800">{activeReservationsCount} ədəd</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gəlmiş Rezervlər</p>
                      <p className="text-2xl font-black text-slate-800">{arrivedReservationsCount} ədəd</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ləğv Edilənlər</p>
                      <p className="text-2xl font-black text-red-600">{cancelledReservationsCount} ədəd</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                </>
              )}

              {reportsSubTab === 'inventory' && (
                <>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between col-span-2">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cəmi Anbar Məhsulları</p>
                      <p className="text-2xl font-black text-slate-800">{totalInventoryItems} çeşid məhsul</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between col-span-2">
                    <div>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">KRİTİK STOK SƏVİYYƏSİNDƏ</p>
                      <p className="text-2xl font-black text-red-600">{lowStockCount} çeşid (DƏRHAL ALINMALIDIR)</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                </>
              )}

              {reportsSubTab === 'kitchen' && (
                <>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between col-span-2">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hazırlanmış / Hazırlanan Sifarişlər</p>
                      <p className="text-2xl font-black text-slate-800">{kitchenItemsCount} yemək</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                      <Utensils className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between col-span-2">
                    <div>
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Defekt jurnalı (Xarab / Geri qaytarılan)</p>
                      <p className="text-2xl font-black text-red-600">{kitchenDefectiveCount} yemək kəsiri</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                </>
              )}

              {reportsSubTab === 'staff' && (
                <>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between col-span-2">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cəmi Ofisiant Qrupu</p>
                      <p className="text-2xl font-black text-slate-800">{staff.length} nəfər</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between col-span-2">
                    <div>
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Hal-hazırda Növbədədirlər</p>
                      <p className="text-2xl font-black text-orange-600">{staff.filter(s => s.status === 'on-shift').length} nəfər</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                      <Briefcase className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Comprehensive Report Data-Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Ətraflı Məlumat Jurnalı</h4>
                <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg uppercase tracking-wider">REAL VAXT DATASI</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {reportsSubTab === 'sales' && (
                        <>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ofisiant</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vəzifə</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Növbə Aktivliyi</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Şəxsi Satışlar</th>
                        </>
                      )}
                      {reportsSubTab === 'reservations' && (
                        <>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Müştəri Adı</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ayrılmış Masa</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarix</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saat</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qonaq Sayı</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </>
                      )}
                      {reportsSubTab === 'inventory' && (
                        <>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Məhsul</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Anbardakı Mövcud Stok</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Minimum Limit Səviyyəsi</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </>
                      )}
                      {reportsSubTab === 'kitchen' && (
                        <>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Sifariş ID</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Yemək Adı</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Masa</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ofisiant</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Qeyd (İstekler)</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </>
                      )}
                      {reportsSubTab === 'staff' && (
                        <>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İşçinin Adı Soyadı</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Sənəd No</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefon nömrəsi</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saat Hesabı</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {reportsSubTab === 'sales' && (pagedTableList as typeof waitersWithFilteredSales).map((st, idx) => (
                      <tr key={st.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                        <td className="px-6 py-4">{st.firstName} {st.lastName}</td>
                        <td className="px-6 py-4 text-slate-400">{st.role}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${st.status === 'on-shift' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                            {st.status === 'on-shift' ? 'NÖVBƏDƏ' : 'DEYİL'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{st.filteredOrdersCount} fəal sifariş</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-black">{st.filteredSales.toFixed(2)} ₼</td>
                      </tr>
                    ))}

                    {reportsSubTab === 'reservations' && (filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">
                          Bu dövr üzrə rezervasiya tapılmadı
                        </td>
                      </tr>
                    ) : (
                      (pagedTableList as typeof filteredReservations).map((r, idx) => (
                        <tr key={r.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                          <td className="px-6 py-4">{r.customerName}</td>
                          <td className="px-6 py-4 text-slate-500 font-black">{tables.find(t => t.id === r.tableId)?.number || `Masa #${r.tableId}`}</td>
                          <td className="px-6 py-4 text-slate-400">{r.date}</td>
                          <td className="px-6 py-4 text-slate-400">{r.time}</td>
                          <td className="px-6 py-4 text-slate-500">{r.guests} nəfərlik</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                              r.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                              r.status === 'arrived' ? 'bg-green-50 text-green-600' :
                              r.status === 'completed' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600'
                            }`}>
                              {r.status === 'confirmed' ? 'TƏSDİQLƏNDİ' :
                               r.status === 'arrived' ? 'GƏLİB' :
                               r.status === 'completed' ? 'BİTMİŞ' : 'LƏĞV'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ))}

                    {reportsSubTab === 'inventory' && (pagedTableList as typeof inventory).map((i, idx) => {
                      const isLow = i.quantity <= i.minLevel;
                      return (
                        <tr key={i.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                          <td className="px-6 py-4">{i.name}</td>
                          <td className={`px-6 py-4 font-black ${isLow ? 'text-red-600' : 'text-slate-700'}`}>{i.quantity} {i.unit}</td>
                          <td className="px-6 py-4 text-slate-400">{i.minLevel} {i.unit}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${isLow ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {isLow ? 'KRİTİK/AZALIB' : 'MÖVCUD STOK OKEY'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {reportsSubTab === 'kitchen' && (pagedTableList as typeof kitchenLog).map((k, idx) => (
                      <tr key={k.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">#{k.orderId}</td>
                        <td className="px-6 py-4">{k.dishName}</td>
                        <td className="px-6 py-4 font-black text-slate-500">{k.tableNumber}</td>
                        <td className="px-6 py-4 text-slate-400">{k.waiterName}</td>
                        <td className="px-6 py-4 text-slate-400 font-sans italic max-w-[200px] truncate">{k.notes || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                            k.status === 'ready' ? 'bg-green-50 text-green-600' :
                            k.status === 'preparing' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {k.status === 'ready' ? 'HAZIRDIR' : k.status === 'preparing' ? 'HAZIRLANIR' : 'DEFEKTIV'}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {reportsSubTab === 'staff' && (pagedTableList as typeof staff).map((s, idx) => (
                      <tr key={s.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                        <td className="px-6 py-4">{s.firstName} {s.lastName}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono">{s.docNumber}</td>
                        <td className="px-6 py-4 text-slate-500">{s.phone}</td>
                        <td className="px-6 py-4 text-slate-400">{s.role}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${s.status === 'on-shift' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                            {s.status === 'on-shift' ? 'AKTİV NÖVBƏ' : 'YAXINDA'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Main Report Table Pagination */}
              {currentTableList.length > REPORT_PER_PAGE && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs">
                  <span className="text-slate-400 font-bold">
                    Cəmi {currentTableList.length} qeyd • Səhifə {reportTablePage} / {totalReportPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={reportTablePage <= 1}
                      onClick={() => setReportTablePage(p => Math.max(1, p - 1))}
                      className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all ${
                        reportTablePage <= 1
                          ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                          : 'text-slate-700 border-slate-200 hover:bg-white active:scale-95 cursor-pointer shadow-2xs'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Əvvəlki</span>
                    </button>
                    <button
                      type="button"
                      disabled={reportTablePage >= totalReportPages}
                      onClick={() => setReportTablePage(p => Math.min(totalReportPages, p + 1))}
                      className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all ${
                        reportTablePage >= totalReportPages
                          ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                          : 'text-slate-700 border-slate-200 hover:bg-white active:scale-95 cursor-pointer shadow-2xs'
                      }`}
                    >
                      <span>Növbəti</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {reportsSubTab === 'inventory' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in mt-6">
                <div className="px-6 py-5 border-b border-amber-100 flex items-center justify-between bg-amber-50/10">
                  <div>
                    <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                      <Package className="w-4 h-4 text-amber-500" />
                      SEÇİLMİŞ DÖVRÜN MƏDAXİL JURNALI (MALIN MƏBLƏĞİ)
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Seçilmiş dövrdə anbara daxil edilmiş bütün xammal məbləğləri siyahısı.</p>
                  </div>
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-lg uppercase tracking-wider">
                    CƏMİ MƏDAXİL: {reportStats.totalInventoryImportSum.toFixed(2)} ₼
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-amber-50/5 border-b border-amber-100">
                        <th className="px-6 py-4 text-[10px] font-black text-amber-600 uppercase tracking-widest">Xammal / Malın Adı</th>
                        <th className="px-6 py-4 text-[10px] font-black text-amber-600 uppercase tracking-widest">Miqdar (Daxil olan)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-amber-600 uppercase tracking-widest">Alış / Mədaxil Qiyməti</th>
                        <th className="px-6 py-4 text-[10px] font-black text-amber-600 uppercase tracking-widest font-mono">Daxilolma Tarixi</th>
                        <th className="px-6 py-4 text-[10px] font-black text-amber-600 uppercase tracking-widest text-right">Ümumi Mədaxil Məbləği</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportStats.filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">
                            Seçilmiş tarixdə anbara yeni mal daxil edilməyib
                          </td>
                        </tr>
                      ) : (
                        pagedInventoryTx.map(tx => (
                          <tr key={tx.id} className="border-b border-amber-50/50 hover:bg-amber-50/10 transition-colors text-xs font-bold text-slate-700">
                            <td className="px-6 py-4 font-extrabold text-slate-800">{tx.itemName}</td>
                            <td className="px-6 py-4 text-slate-600">{tx.quantity} vahid</td>
                            <td className="px-6 py-4 text-slate-500">{tx.costPrice.toFixed(2)} ₼</td>
                            <td className="px-6 py-4 font-mono text-slate-400">{tx.date}</td>
                            <td className="px-6 py-4 text-right text-amber-600 font-black">+{tx.totalCost.toFixed(2)} ₼</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Inventory Import Transactions Pagination */}
                {reportStats.filteredInventory.length > REPORT_PER_PAGE && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-amber-100 bg-amber-50/20 text-xs">
                    <span className="text-amber-700/70 font-bold">
                      Cəmi {reportStats.filteredInventory.length} qeyd • Səhifə {inventoryTxPage} / {totalInventoryTxPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={inventoryTxPage <= 1}
                        onClick={() => setInventoryTxPage(p => Math.max(1, p - 1))}
                        className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all ${
                          inventoryTxPage <= 1
                            ? 'text-amber-300 border-amber-100 cursor-not-allowed'
                            : 'text-amber-800 border-amber-200 hover:bg-white active:scale-95 cursor-pointer shadow-2xs'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Əvvəlki</span>
                      </button>
                      <button
                        type="button"
                        disabled={inventoryTxPage >= totalInventoryTxPages}
                        onClick={() => setInventoryTxPage(p => Math.min(totalInventoryTxPages, p + 1))}
                        className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all ${
                          inventoryTxPage >= totalInventoryTxPages
                            ? 'text-amber-300 border-amber-100 cursor-not-allowed'
                            : 'text-amber-800 border-amber-200 hover:bg-white active:scale-95 cursor-pointer shadow-2xs'
                        }`}
                      >
                        <span>Növbəti</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      );
};
