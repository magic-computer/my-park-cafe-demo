import React from "react";
import { 
  Receipt, 
  Plus, 
  Search, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Printer, 
  Download 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../Card";
import { AzDatePicker } from "../AzDatePicker";
import { Table, Reservation } from "../../types";
import { getTodayStr, matchesDatePeriod, formatAzDate } from "../../utils/dateUtils";

export interface ReservationsTabProps {
  t: any;
  tText: (key: string, defaultText?: string) => string;
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  tables: Table[];
  reservationPeriod: "daily" | "monthly" | "yearly";
  setReservationPeriod: (period: "daily" | "monthly" | "yearly") => void;
  reservationSelectedDate: string;
  setReservationSelectedDate: (date: string) => void;
  showCompletedReservations: boolean;
  setShowCompletedReservations: (show: boolean) => void;
  reservationSearch: string;
  setReservationSearch: (search: string) => void;
  getLocale: () => string;
  isAddingReservation: boolean;
  setIsAddingReservation: (val: boolean) => void;
  newReservation: { customerName: string; tableId: any; time: string; guests: any; date: string; phone?: string; note?: string };
  setNewReservation: React.Dispatch<React.SetStateAction<{ customerName: string; tableId: any; time: string; guests: any; date: string; phone?: string; note?: string }>>;
  handleAddReservation: (e: React.FormEvent) => void;
  editingReservationId: number | null;
  setEditingReservationId: (id: number | null) => void;
  editReservation: { customerName: string; tableId: any; time: string; guests: any; date: string; phone?: string; note?: string };
  setEditReservation: React.Dispatch<React.SetStateAction<{ customerName: string; tableId: any; time: string; guests: any; date: string; phone?: string; note?: string }>>;
  startEditingReservation: (res: Reservation) => void;
  handleSaveReservationEdit: (id: number) => void;
  deleteReservation: (id: number) => void;
  updateReservationStatus: (id: number, status: Reservation['status']) => void;
  handleConfirmArrivedReservation: (resId: number, tableId: number) => void;
  exportToExcel: (data: any, filename: string, headers?: string[]) => void;
  setReportPrintPreview: (preview: any) => void;
}

export const ReservationsTab: React.FC<ReservationsTabProps> = ({
  t,
  tText,
  reservations,
  setReservations,
  tables,
  reservationPeriod,
  setReservationPeriod,
  reservationSelectedDate,
  setReservationSelectedDate,
  showCompletedReservations,
  setShowCompletedReservations,
  reservationSearch,
  setReservationSearch,
  getLocale,
  isAddingReservation,
  setIsAddingReservation,
  newReservation,
  setNewReservation,
  handleAddReservation,
  editingReservationId,
  setEditingReservationId,
  editReservation,
  setEditReservation,
  startEditingReservation,
  handleSaveReservationEdit,
  deleteReservation,
  updateReservationStatus,
  handleConfirmArrivedReservation,
  exportToExcel,
  setReportPrintPreview
}) => {
  React.useEffect(() => {
    if (!reservationSelectedDate) {
      setReservationSelectedDate(getTodayStr());
    }
  }, [reservationSelectedDate, setReservationSelectedDate]);

  const effectiveDate = reservationSelectedDate || getTodayStr();

  const filteredReservations = reservations.filter(res => {
    const matchesPeriod = matchesDatePeriod(res.date, effectiveDate, reservationPeriod);
    const matchesStatus = showCompletedReservations ? true : res.status !== 'completed';

    const q = (reservationSearch || '').toLowerCase();
    const matchesSearch = !q || 
      (res.customerName || '').toLowerCase().includes(q) ||
      (tables.find(t => t.id === res.tableId)?.number || '').toLowerCase().includes(q);

    return matchesPeriod && matchesStatus && matchesSearch;
  });

        return (
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
              {/* Control Board: Search + Date Selector + Period Controls + Quick Actions */}
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="flex flex-wrap items-center gap-3.5 flex-1">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={tText("Müştəri və ya masa axtar...")} 
                      className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-56 text-xs font-semibold"
                      value={reservationSearch}
                      onChange={e => setReservationSearch(e.target.value)}
                    />
                  </div>

                  {/* Period Selector Tabs */}
                  <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setReservationPeriod('daily')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                        reservationPeriod === 'daily'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {tText("GÜNDƏLİK")}
                    </button>
                    <button
                      onClick={() => setReservationPeriod('monthly')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                        reservationPeriod === 'monthly'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {tText("AYLIQ")}
                    </button>
                    <button
                      onClick={() => setReservationPeriod('yearly')}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                        reservationPeriod === 'yearly'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {tText("İLLİK")}
                    </button>
                  </div>

                  {/* Date Input */}
                  <div className="shrink-0">
                    <AzDatePicker 
                      value={effectiveDate}
                      onChange={(val) => {
                        if (val) setReservationSelectedDate(val);
                      }}
                      format="dd.mm.yyyy"
                      prefix={tText("SEÇİM:")}
                      placeholder="Tarix seçin"
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 text-[10.5px] font-black text-slate-800 shadow-xs cursor-pointer select-none flex items-center gap-1.5"
                    />
                  </div>

                  {/* Show Completed Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={showCompletedReservations}
                      onChange={e => setShowCompletedReservations(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{tText("Bitmişlərə bax (Arxiv)")}</span>
                  </label>

                  {/* Shortcuts */}
                  {reservationPeriod === 'daily' && (
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => setReservationSelectedDate(getTodayStr())}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${reservationSelectedDate === getTodayStr() ? 'bg-orange-100 text-orange-700 font-extrabold' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                      >
                        {tText("BGN")}
                      </button>
                      <button 
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const tmrStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                          setReservationSelectedDate(tmrStr);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${(() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const tmrStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                          return reservationSelectedDate === tmrStr;
                        })() ? 'bg-orange-100 text-orange-700 font-extrabold' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                      >
                        {tText("SBH")}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const headers = [tText("ID"), tText("Müştəri Adı"), tText("Masa No"), tText("Tarix"), tText("Saat"), tText("Qonaq Sayı"), tText("Status")];
                      const rows = filteredReservations.map(res => ({
                        id: res.id,
                        customerName: res.customerName,
                        tableName: tables.find(t => t.id === res.tableId)?.number || `Masa #${res.tableId}`,
                        date: res.date,
                        time: res.time,
                        guests: res.guests,
                        status: res.status === 'confirmed' ? tText('Təsdiqləndi') :
                                res.status === 'arrived' ? tText('Müştəri gəldi') :
                                res.status === 'completed' ? tText('Tamamlandı') : tText('Ləğv edildi')
                      }));
                      exportToExcel(rows, "Rezervasiyalar_Hesabati_" + reservationSelectedDate, headers);
                    }}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center whitespace-nowrap transition-all"
                    title={tText("Excelə çıxart")}
                  >
                    <Download className="w-4 h-4 mr-2 text-slate-500" />
                    {tText("Excel")}
                  </button>
                  <button
                    onClick={() => {
                      const headers = [tText("Müştəri Adı"), tText("Masa No"), tText("Tarix"), tText("Saat"), tText("Qonaq Sayı"), tText("Status")];
                      const rows = filteredReservations.map(res => [
                        res.customerName,
                        tables.find(t => t.id === res.tableId)?.number || `Masa #${res.tableId}`,
                        res.date,
                        res.time,
                        `${res.guests} ${tText("nəfər")}`,
                        res.status === 'confirmed' ? tText('Təsdiqləndi') :
                        res.status === 'arrived' ? tText('Gəldi') :
                        res.status === 'completed' ? tText('Tamamlandı') : tText('Ləğv edilib')
                      ]);
                      setReportPrintPreview({
                        isOpen: true,
                        title: `${tText("Rezervasiya Hesabatı")} (${reservationSelectedDate})`,
                        headers,
                        rows
                      });
                    }}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center whitespace-nowrap transition-all"
                    title={tText("Masa hesabatını çap et")}
                  >
                    <Printer className="w-4 h-4 mr-2 text-slate-500" />
                    {tText("Çap et")}
                  </button>
                  <button 
                    onClick={() => {
                      if (!isAddingReservation) {
                        setNewReservation({ customerName: '', tableId: '', time: '12:00', guests: '', date: reservationSelectedDate });
                      }
                      setIsAddingReservation(!isAddingReservation);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-200 flex items-center justify-center whitespace-nowrap transition-all shrink-0"
                  >
                    <Plus className={`w-4 h-4 mr-2 transition-transform ${isAddingReservation ? 'rotate-45' : ''}`} /> 
                    {tText(isAddingReservation ? 'Ləğv Et' : 'Yeni Rezervasiya')}
                  </button>
                </div>
              </div>

              {/* Table Occupancy / Reservation Status Grid by Selected Date */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      {tText("MASA REZERVASIYA VƏZİYYƏTİ —")} {
                        reservationPeriod === 'daily' ? formatAzDate(effectiveDate) :
                        reservationPeriod === 'monthly' ? `${effectiveDate.substring(5, 7)}.${effectiveDate.substring(0, 4)} (${tText("AYLIQ SEÇİM")})` :
                        `${effectiveDate.substring(0, 4)} (${tText("İLLİK SEÇİM")})`
                      }
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">{tText("Seçilmiş tarixə görə masaların doluluq və rezervasiya vəziyyəti (boş masaya klikləyərək sürətli rezervasiya edin).")}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-slate-50 border border-slate-200 rounded" />
                      <span className="text-slate-500">{tText("Boş")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-orange-500 rounded" />
                      <span className="text-orange-600">{tText("Rezerv olunub")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-green-600">{tText("Gəlib (Masa fəal)")}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3 pt-2">
                  {tables.map(table => {
                    const activeResOnDate = reservations.find(r => {
                      const matchesTable = r.tableId === table.id;
                      const matchesStatus = r.status !== 'completed';
                      const matchesPeriod = matchesDatePeriod(r.date, reservationSelectedDate, reservationPeriod);
                      return matchesTable && matchesPeriod && matchesStatus;
                    });
                    
                    let statusBg = 'bg-slate-50/50 hover:bg-slate-100/80 text-slate-800 border-slate-200 hover:border-orange-200';
                    let statusLabel = 'BOŞ';
                    let tooltip = tText('Rezervasiya yoxdur. Sürətli rezervasiya üçün klikləyin.');
                    
                    if (activeResOnDate) {
                       if (activeResOnDate.status === 'arrived') {
                         statusBg = 'bg-green-500 text-white border-green-600 shadow-sm shadow-green-100';
                         statusLabel = activeResOnDate.time;
                         tooltip = `${activeResOnDate.customerName} (${activeResOnDate.guests} ${tText("nəfər")}) — ${tText("Müştəri artıq gəlib.")}`;
                       } else {
                         statusBg = 'bg-orange-500 text-white border-orange-600 shadow-sm shadow-orange-105';
                         statusLabel = activeResOnDate.time;
                         tooltip = `${activeResOnDate.customerName} (${activeResOnDate.guests} ${tText("nəfər")}) — ${tText("Rezerv olunub.")}`;
                       }
                    }
                    
                    return (
                      <div 
                        key={table.id}
                        title={tooltip}
                        onClick={() => {
                          if (!activeResOnDate) {
                            setNewReservation({
                              customerName: '',
                              tableId: table.id.toString(),
                              time: '18:00',
                              guests: table.capacity.toString(),
                              date: reservationSelectedDate
                            });
                            setIsAddingReservation(true);
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer select-none ${statusBg}`}
                      >
                        <span className="text-[10px] font-black tracking-wide">{tText(table.number)}</span>
                        <span className="text-[11px] font-black mt-1 uppercase tracking-tight">{tText(statusLabel)}</span>
                        {activeResOnDate ? (
                          <span className="text-[8px] font-black opacity-90 truncate max-w-full mt-1.5 px-1 py-0.5 bg-black/10 rounded-md">
                            {activeResOnDate.customerName.split(' ')[0]}
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400 mt-1.5">
                            {table.capacity} {tText("nəfərlik")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form to add a new reservation */}
              {isAddingReservation && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-blue-50/80 border border-blue-100 rounded-3xl grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest px-1">{tText("MÜŞTƏRİ ADI")}</span>
                    <input 
                      placeholder={tText("Müştəri adı")} 
                      value={newReservation.customerName}
                      onChange={e => setNewReservation({...newReservation, customerName: e.target.value})}
                      className="px-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-bold text-slate-700"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest px-1">{tText("MASA SEÇİMİ")}</span>
                    <select 
                      value={newReservation.tableId}
                      onChange={e => setNewReservation({...newReservation, tableId: e.target.value})}
                      className="px-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-bold text-slate-700 h-[42px]"
                    >
                      <option value="">{tText("Masa Seçin")}</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>{tText(t.number)} ({t.capacity} {tText("nəfərlik")})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest px-1">{tText("TARİX")}</span>
                    <AzDatePicker 
                      value={newReservation.date || reservationSelectedDate}
                      onChange={val => setNewReservation({...newReservation, date: val})}
                      format="dd.mm.yyyy"
                      className="px-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-bold text-slate-700 h-[42px] flex items-center gap-1.5"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest px-1">{tText("SAAT (24s)")}</span>
                    <div className="flex items-center gap-1">
                      <select
                        value={newReservation.time ? newReservation.time.split(':')[0] || '12' : '12'}
                        onChange={e => {
                          const currentMin = newReservation.time ? newReservation.time.split(':')[1] || '00' : '00';
                          setNewReservation({...newReservation, time: `${e.target.value}:${currentMin}`});
                        }}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-700 text-sm h-[42px] appearance-none"
                      >
                        {Array.from({ length: 24 }).map((_, i) => {
                          const val = i.toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                      <span className="font-extrabold text-blue-800 text-sm">:</span>
                      <select
                        value={newReservation.time ? newReservation.time.split(':')[1] || '00' : '00'}
                        onChange={e => {
                          const currentHr = newReservation.time ? newReservation.time.split(':')[0] || '12' : '12';
                          setNewReservation({...newReservation, time: `${currentHr}:${e.target.value}`});
                        }}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-700 text-sm h-[42px] appearance-none"
                      >
                        {Array.from({ length: 60 }).map((_, i) => {
                          const val = i.toString().padStart(2, '0');
                          return <option key={val} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest px-1">{tText("QONAQ SAYI")}</span>
                    <input 
                      type="number" 
                      placeholder={tText("Qonaq sayı")}
                      value={newReservation.guests}
                      onChange={e => setNewReservation({...newReservation, guests: e.target.value})}
                      className="px-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-bold text-slate-700"
                    />
                  </div>

                  <button 
                    onClick={handleAddReservation}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-3 h-[42px] transition-all grid place-items-center uppercase text-xs tracking-wider"
                  >
                    {tText("Rezerv Et")}
                  </button>
                </motion.div>
              )}

              {/* List/Cards of current reservations */}
              {filteredReservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                  <h5 className="font-extrabold text-slate-700 text-sm uppercase tracking-wider">{tText("Rezervasiya tapılmadı")}</h5>
                  <p className="text-slate-400 text-xs mt-1">{tText("Seçilmiş tarixdə ({reservationSelectedDate}) axtarış meyarlarına uyğun rezervasiya yoxdur.").replace("{reservationSelectedDate}", formatAzDate(effectiveDate))}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReservations.map(res => (
                    <Card 
                      key={res.id} 
                      className={`relative group overflow-hidden border-t-4 transition-all duration-300 ${
                        res.status === 'completed' 
                          ? 'border-t-slate-300 bg-slate-50/50 grayscale opacity-70' 
                          : 'border-t-orange-500 hover:shadow-xl hover:shadow-orange-100'
                      }`}
                    >
                      {res.status === 'completed' && (
                        <div className="absolute top-2 right-2 z-10">
                          <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-50 animate-in zoom-in duration-300" />
                        </div>
                      )}
                      {editingReservationId === res.id ? (
                        <div className="space-y-4 p-2">
                          <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{tText("Müştəri Məlumatları")}</label>
                            <input 
                              value={editReservation.customerName}
                              onChange={e => setEditReservation({...editReservation, customerName: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700"
                              placeholder={tText("Müştəri adı")}
                            />
                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{tText("Masa")}</label>
                                 <select 
                                    value={editReservation.tableId}
                                    onChange={e => setEditReservation({...editReservation, tableId: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 appearance-none"
                                  >
                                    {tables.map(t => (
                                      <option key={t.id} value={t.id}>{tText(t.number)}</option>
                                    ))}
                                  </select>
                               </div>
                                <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{tText("Saat (24s)")}</label>
                                 <div className="flex items-center gap-1">
                                   <select
                                     value={editReservation.time ? editReservation.time.split(':')[0] || '12' : '12'}
                                     onChange={e => {
                                       const currentMin = editReservation.time ? editReservation.time.split(':')[1] || '00' : '00';
                                       setEditReservation({...editReservation, time: `${e.target.value}:${currentMin}`});
                                     }}
                                     className="w-full px-2 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 h-[50px] appearance-none"
                                   >
                                     {Array.from({ length: 24 }).map((_, i) => {
                                       const val = i.toString().padStart(2, '0');
                                       return <option key={val} value={val}>{val}</option>;
                                     })}
                                   </select>
                                   <span className="font-extrabold text-slate-500">:</span>
                                   <select
                                     value={editReservation.time ? editReservation.time.split(':')[1] || '00' : '00'}
                                     onChange={e => {
                                       const currentHr = editReservation.time ? editReservation.time.split(':')[0] || '12' : '12';
                                       setEditReservation({...editReservation, time: `${currentHr}:${e.target.value}`});
                                     }}
                                     className="w-full px-2 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 h-[50px] appearance-none"
                                   >
                                     {Array.from({ length: 60 }).map((_, i) => {
                                       const val = i.toString().padStart(2, '0');
                                       return <option key={val} value={val}>{val}</option>;
                                     })}
                                   </select>
                                 </div>
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{tText("Tarix")}</label>
                                <AzDatePicker 
                                  value={editReservation.date}
                                  onChange={val => setEditReservation({...editReservation, date: val})}
                                  format="dd.mm.yyyy"
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-700 flex items-center gap-1.5"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{tText("Qonaq Sayı")}</label>
                                <input 
                                  type="number"
                                  value={editReservation.guests}
                                  onChange={e => setEditReservation({...editReservation, guests: e.target.value})}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700"
                                  placeholder={tText("Qonaq")}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <button 
                              onClick={() => handleSaveReservationEdit(res.id)} 
                              className="flex-1 py-3 bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-100"
                            >
                              {tText("YADDA SAXLA")}
                            </button>
                            <button 
                              onClick={() => setEditingReservationId(null)} 
                              className="flex-1 py-3 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-colors"
                            >
                              {tText("LƏĞV ET")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm font-bold text-slate-400">
                                {res.customerName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-800 tracking-tight">{res.customerName}</h4>
                                <div className="flex flex-wrap items-center text-xs text-slate-400 font-bold uppercase tracking-widest gap-2 mt-1">
                                  <Clock className="w-3 h-3" /> {res.time}
                                  <span className="text-slate-300">|</span>
                                  <Calendar className="w-3 h-3" /> {res.date}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => startEditingReservation(res)}
                                className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteReservation(res.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Plus className="w-5 h-5 rotate-45" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-6">
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tText("MASA")}</p>
                              <p className="font-black text-slate-700">{tables.find(t => t.id === res.tableId)?.number || res.tableId}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200" />
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tText("QONAQ")}</p>
                              <p className="font-black text-slate-700">{res.guests} {tText("Nəfər")}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200" />
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tText("STATUS")}</p>
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                                res.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                                res.status === 'arrived' ? 'bg-blue-100 text-blue-600' :
                                res.status === 'completed' ? 'bg-slate-200 text-slate-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                {res.status === 'confirmed' ? tText('Təsdiqli') : 
                                 res.status === 'arrived' ? tText('Gəlib') : 
                                 res.status === 'completed' ? tText('Bitib') : 
                                 tText('Gözləyir')}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {res.status !== 'arrived' && res.status !== 'completed' && (
                              <button 
                                onClick={() => updateReservationStatus(res.id, 'arrived')}
                                className="py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-slate-200"
                              >
                                {tText("GƏLDİ")}
                              </button>
                            )}
                            {res.status !== 'completed' ? (
                              <button 
                                onClick={() => {
                                  if (res.status === 'arrived') {
                                    handleConfirmArrivedReservation(res.id, res.tableId);
                                  } else {
                                    updateReservationStatus(res.id, res.status === 'confirmed' ? 'pending' : 'confirmed');
                                  }
                                }}
                                className={`py-3 border border-slate-250 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-orange-500 hover:text-orange-600 transition-all ${res.status === 'arrived' ? 'col-span-2 bg-orange-500 text-white border-orange-600 hover:bg-orange-600 hover:text-white shadow-lg shadow-orange-100 font-extrabold' : ''}`}
                              >
                                {res.status === 'arrived' ? tText('TƏSDİQ ET VƏ MASAYA KEÇ') : (res.status === 'confirmed' ? tText('GÖZLƏMƏYƏ SAL') : tText('TƏSDİQLƏ'))}
                              </button>
                            ) : (
                              <div className="col-span-2 py-3 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-xl text-center border border-green-200 flex items-center justify-center gap-2 animate-pulse">
                                 <Receipt className="w-3 h-3" /> {tText("ÖDƏNİŞ EDİLİB / ARTIQ BİTİB")}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
};
