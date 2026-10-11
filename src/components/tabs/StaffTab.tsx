import React, { useRef, useEffect } from "react";
import { 
  Receipt, 
  Users, 
  Trash2, 
  UserPlus, 
  Edit, 
  Phone, 
  FileText, 
  Calendar, 
  Printer, 
  Database, 
  Info 
} from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../Card";
import { StaffMember } from "../../types";

export interface StaffTabProps {
  t: any;
  tText: (key: string, defaultText?: string) => string;
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  currencySymbol: string;
  currencyText: string;
  formatPrice: (amount: number | string | undefined | null) => string;
  getLocale: () => string;
  isAddingStaff: boolean;
  setIsAddingStaff: (val: boolean) => void;
  newStaff: { firstName: string; lastName: string; role: string; docNumber: string; phone: string; status: 'on-shift' | 'off-shift' };
  setNewStaff: React.Dispatch<React.SetStateAction<{ firstName: string; lastName: string; role: string; docNumber: string; phone: string; status: 'on-shift' | 'off-shift' }>>;
  newStaffError: string | null;
  setNewStaffError: (err: string | null) => void;
  handleAddNewStaff: (e: React.FormEvent) => void;
  editingStaffId: number | null;
  setEditingStaffId: (id: number | null) => void;
  editStaff: { firstName: string; lastName: string; role: string; docNumber: string; phone: string };
  setEditStaff: React.Dispatch<React.SetStateAction<{ firstName: string; lastName: string; role: string; docNumber: string; phone: string }>>;
  editStaffError: string | null;
  handleStartEditStaff: (member: StaffMember) => void;
  handleSaveEditStaff: (id: number) => void;
  handleDeleteStaff: (id: number) => void;
  setConfirmDialog: (dialog: any) => void;
  toggleStaffShift: (id: number) => void;
  setReportPrintPreview: (preview: any) => void;
}

export const StaffTab: React.FC<StaffTabProps> = ({
  t,
  tText,
  staff,
  setStaff,
  currencySymbol,
  currencyText,
  formatPrice,
  getLocale,
  isAddingStaff,
  setIsAddingStaff,
  newStaff,
  setNewStaff,
  newStaffError,
  setNewStaffError,
  handleAddNewStaff,
  editingStaffId,
  setEditingStaffId,
  editStaff,
  setEditStaff,
  editStaffError,
  handleStartEditStaff,
  handleSaveEditStaff,
  handleDeleteStaff,
  setConfirmDialog,
  toggleStaffShift,
  setReportPrintPreview
}) => {
  const firstNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingStaff) {
      setTimeout(() => {
        firstNameInputRef.current?.focus();
      }, 50);
    }
  }, [isAddingStaff]);

const getMonthlyAttendance = (attendanceList: string[] = []) => {
          const months: Record<string, string[]> = {};
          const sortedList = [...attendanceList].sort((a, b) => b.localeCompare(a));
          sortedList.forEach(dt => {
            const parts = dt.split('-');
            if (parts.length === 3) {
              const year = parts[0];
              const monthNum = parts[1];
              const monthNames: Record<string, string> = {
                '01': 'Yanvar', '02': 'Fevral', '03': 'Mart', '04': 'Aprel',
                '05': 'May', '06': 'İyun', '07': 'İyul', '08': 'Avqust',
                '09': 'Sentyabr', '10': 'Oktyabr', '11': 'Noyabr', '12': 'Dekabr'
              };
              const monthName = monthNames[monthNum] || monthNum;
              const key = `${monthName} ${year}`;
              if (!months[key]) months[key] = [];
              months[key].push(parts[2]);
            }
          });
          return months;
        };

        return (
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
              {/* Staff Top Bar Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{tText("İşçi Qəbulu və Nəzarət Sistemi")}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                  {tText("Yeni işçilərin alınması, fərdi sənəd/əlaqə məlumatlarının qeydiyyatı, vəzifə idarəçiliyi və gündəlik iş nizamı")}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => {
                    const headers = ["İşçi Adı", "Vəzifə / Rol", "Telefon No", "Maaş", "Növbə Vəziyyəti", "Ümumi İş Günü"];
                    const rows = staff.map(person => [
                      `${person.firstName} ${person.lastName}`,
                      person.role,
                      person.phone || "-",
                      `${person.salary || 0} ₼`,
                      person.status === 'on-shift' ? 'Növbədə (İşdə)' : 'Kənardadır',
                      `${person.attendance?.length || 0} gün`
                    ]);
                    setReportPrintPreview({
                      isOpen: true,
                      title: "İşçi Heyəti və Növbə Hesabatı",
                      headers,
                      rows
                    });
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs uppercase px-5 py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Siyahını Çap Et
                </button>
                <button
                  onClick={() => {
                    const nextState = !isAddingStaff;
                    setIsAddingStaff(nextState);
                    setNewStaffError(null);
                    if (nextState) {
                      setTimeout(() => {
                        firstNameInputRef.current?.focus();
                      }, 50);
                    }
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase px-5 py-3 rounded-2xl shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-2 tracking-widest cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  {tText(isAddingStaff ? "YIĞ" : "YENİ İŞÇİ GÖTÜR")}
                </button>
              </div>
            </div>

            {/* Collapsible Add New Staff Form */}
            {isAddingStaff && (
              <motion.div
                initial={{ opacity: 0, y: -25 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-orange-50/50 border border-orange-100 rounded-3xl flex flex-col gap-4 shadow-sm"
              >
                <div className="flex items-center gap-2 border-b border-orange-100/60 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{tText("Yeni İşçinin Anket Məlumatları")}</h4>
                    <p className="text-[10px] text-orange-600 font-bold uppercase">{tText("Sistemdə qeydiyyata alınacaq yeni əməkdaş kartı")}</p>
                  </div>
                </div>

                {newStaffError && (
                  <div className="bg-red-50 border border-red-155 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    {newStaffError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">{tText("Adı")}</label>
                    <input
                      ref={firstNameInputRef}
                      type="text"
                      placeholder={tText("Məs. Əhməd")}
                      value={newStaff.firstName}
                      onChange={e => setNewStaff(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">{tText("Soyadı")}</label>
                    <input
                      type="text"
                      placeholder={tText("Məs. Məmmədov")}
                      value={newStaff.lastName}
                      onChange={e => setNewStaff(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">{tText("Vəzifəsi / Rolu")}</label>
                    <select
                      value={newStaff.role}
                      onChange={e => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                      className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Ofisiant">{tText("Ofisiant")}</option>
                      <option value="Aşpaz">{tText("Aşpaz")}</option>
                      <option value="Kassir">{tText("Kassir")}</option>
                      <option value="Barista">{tText("Barista")}</option>
                      <option value="Müdir">{tText("Müdir")}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">{tText("Şəxsiyyət Sənədinin Nömrəsi")}</label>
                    <input
                      type="text"
                      placeholder={tText("Məs. AZE1234567")}
                      value={newStaff.docNumber}
                      onChange={e => setNewStaff(prev => ({ ...prev, docNumber: e.target.value }))}
                      className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">{tText("Mobil Telefon Nömrəsi")}</label>
                    <input
                      type="text"
                      placeholder={tText("Məs. +994 50 123 45 67")}
                      value={newStaff.phone}
                      onChange={e => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">{tText("İlkin İş Nizamı (Status)")}</label>
                    <div className="flex items-center gap-3 h-[42px] px-2">
                      <button
                        type="button"
                        onClick={() => setNewStaff(prev => ({ ...prev, status: prev.status === 'on-shift' ? 'off-shift' : 'on-shift' }))}
                        className={`w-10 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                          newStaff.status === 'on-shift' ? 'bg-green-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            newStaff.status === 'on-shift' ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-bold text-slate-700">
                        {newStaff.status === 'on-shift' ? tText("Həmin dəqiqə İşdədir") : tText("Kənardadır")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsAddingStaff(false);
                      setNewStaffError(null);
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase px-5 py-2.5 rounded-xl"
                  >
                    {tText("Ləğv Et")}
                  </button>
                  <button
                    onClick={handleAddNewStaff}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase px-6 py-2.5 rounded-xl shadow-md"
                  >
                    {tText("Qeydiyyata Al (İşə Götür)")}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Workers Grid */}
            {staff.length === 0 ? (
              <div className="bg-white rounded-[24px] p-10 text-center border border-slate-100 shadow-sm max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shadow-inner">
                  <Users className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Sistemdə Qeydiyyatlı İşçi Yoxdur</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-semibold">
                    Bütün işçi məlumatları sıfırlanmışdır. Yuxarıdakı <span className="text-orange-500">"YENİ İŞÇİ GÖTÜR"</span> düyməsinə klikləyərək yeni əməkdaş kartı qeydiyyatdan keçirə bilərsiniz.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {staff.map(person => {
                const isEditing = editingStaffId === person.id;
                const todayStr = new Date().toISOString().split('T')[0];
                const hasWorkedToday = person.attendance?.includes(todayStr) || false;
                const totalDaysWorked = person.attendance?.length || 0;

                return (
                  <Card
                    key={person.id}
                    className={`flex flex-col gap-4 p-5 border relative bg-white transition-all rounded-[24px] ${
                      person.status === 'on-shift'
                        ? 'border-green-200 shadow-sm ring-1 ring-green-100/60'
                        : 'border-slate-150 shadow-sm opacity-95'
                    }`}
                  >
                    {/* Card Header Info */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} alt={person.name} />
                        </div>
                        <div className="min-w-0">
                          {isEditing ? (
                            <p className="text-[10px] font-black text-orange-600 uppercase">{tText("Əsgər redaktəsi")}</p>
                          ) : (
                            <>
                              <h4 className="font-black text-slate-800 tracking-tight text-base leading-tight truncate">
                                {person.name}
                              </h4>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                {tText(person.role)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Quick Shift Switch (İşdədir (Green) or Kənardadır (Grey)) */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleStaffShift(person.id)}
                          className={`w-10 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                            person.status === 'on-shift' ? 'bg-green-500 shadow-md shadow-green-100' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                              person.status === 'on-shift' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[8px] font-black uppercase ${
                          person.status === 'on-shift' ? 'text-green-600 font-extrabold' : 'text-slate-400'
                        }`}>
                          {person.status === 'on-shift' ? tText('İŞDƏDİR') : tText('KƏNARDADIR')}
                        </span>
                      </div>
                    </div>

                    {/* Inline Edit Form when isEditing is true */}
                    {isEditing ? (
                      <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                        {editStaffError && (
                          <p className="text-[9px] font-bold text-red-500">{editStaffError}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] font-black uppercase text-slate-400">Adı</label>
                            <input
                              type="text"
                              value={editStaff.firstName}
                              onChange={e => setEditStaff(prev => ({ ...prev, firstName: e.target.value }))}
                              className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-850"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] font-black uppercase text-slate-400">Soyadı</label>
                            <input
                              type="text"
                              value={editStaff.lastName}
                              onChange={e => setEditStaff(prev => ({ ...prev, lastName: e.target.value }))}
                              className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-850"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-black uppercase text-slate-400">{tText("Vəzifə / Rol")}</label>
                          <select
                            value={editStaff.role}
                            onChange={e => setEditStaff(prev => ({ ...prev, role: e.target.value }))}
                            className="bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-bold"
                          >
                            <option value="Ofisiant">{tText("Ofisiant")}</option>
                            <option value="Aşpaz">{tText("Aşpaz")}</option>
                            <option value="Kassir">{tText("Kassir")}</option>
                            <option value="Barista">{tText("Barista")}</option>
                            <option value="Müdir">{tText("Müdir")}</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <div className="flex flex-col gap-0.5">
                             <label className="text-[8px] font-black uppercase text-slate-400">{tText("Sənəd")} №</label>
                             <input
                               type="text"
                               placeholder="AZE..."
                               value={editStaff.docNumber}
                               onChange={e => setEditStaff(prev => ({ ...prev, docNumber: e.target.value }))}
                               className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-bold"
                             />
                           </div>
                           <div className="flex flex-col gap-0.5">
                             <label className="text-[8px] font-black uppercase text-slate-400">{tText("Telefon")}</label>
                             <input
                               type="text"
                               placeholder="+994..."
                               value={editStaff.phone}
                               onChange={e => setEditStaff(prev => ({ ...prev, phone: e.target.value }))}
                               className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-xs font-bold"
                             />
                           </div>
                         </div>
 
                         <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/55">
                           <button
                             onClick={() => setEditingStaffId(null)}
                             className="text-[9px] font-bold text-slate-500 hover:text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200"
                           >
                             {tText("İmtina")}
                           </button>
                           <button
                             onClick={() => handleSaveEditStaff(person.id)}
                             className="text-[9px] font-black text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md shadow-sm"
                           >
                             {tText("Yadda Saxla")}
                           </button>
                         </div>
                       </div>
                     ) : (
                       // Plain Details State
                       <div className="space-y-2 border-t border-slate-50 pt-3">
                         {/* Custom Data Fields Grid */}
                         <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-500 font-bold bg-slate-50 p-2.5 rounded-xl">
                           <div className="flex items-center gap-1.5 min-w-0">
                             <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                             <span className="truncate" title={person.docNumber || tText("Sənəd yoxdur")}>
                               {tText("Sənəd:")} <b className="text-slate-700">{person.docNumber || tText("Qeyd yox")}</b>
                             </span>
                           </div>
                           <div className="flex items-center gap-1.5 min-w-0">
                             <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                             <span className="truncate" title={person.phone || tText("Telefon yoxdur")}>
                               {tText("Tel:")} <b className="text-slate-700">{person.phone || tText("Qeyd yox")}</b>
                             </span>
                           </div>
                         </div>
 
                         {/* Special Waiter Live Income Track (ONLY for Waiter / Ofisiant roles!) */}
                         {Boolean(person.role && person.role.toLowerCase() === 'ofisiant') && (
                           <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800">
                             <div className="flex items-center gap-2">
                               <Receipt className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
                               <span className="text-[10px] uppercase font-black tracking-wide text-emerald-600">{tText("ALINAN MÜŞTƏRİ NAĞDLARI")}</span>
                             </div>
                             <span className="font-black text-emerald-700">
                               {(person.totalSales || 0).toFixed(2)} {currencySymbol}
                             </span>
                           </div>
                         )}
 
                         {/* Attendance Database (İşlədiyi günlərin qeydiyyatı) */}
                         <div className="border border-slate-100 rounded-xl p-3 bg-white space-y-2.5">
                           <div className="flex items-center justify-between pb-1.5 border-b border-slate-50">
                             <div className="flex items-center gap-1">
                               <Calendar className="w-3.5 h-3.5 text-orange-500" />
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{tText("İŞ GÜNLƏRİ JURNALI")}</span>
                             </div>
                             <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                               {tText("Ümumi:")} <b>{totalDaysWorked} {tText("gün")}</b>
                             </span>
                           </div>
 
                           {/* Monthly Attendance Grouping - Display only, no edit/delete option */}
                           {(() => {
                             const monthlyData = getMonthlyAttendance(person.attendance);
                             const monthsKeys = Object.keys(monthlyData);
                             if (monthsKeys.length > 0) {
                               return (
                                 <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                                   {monthsKeys.map(monthYear => {
                                     const days = monthlyData[monthYear];
                                     return (
                                       <div key={monthYear} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col gap-1.5">
                                         <div className="flex justify-between items-center text-[9px] font-black text-slate-600">
                                           <span className="uppercase tracking-wider">{tText(monthYear)}</span>
                                           <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md font-extrabold">{days.length} {tText("gün")}</span>
                                         </div>
                                         <div className="flex flex-wrap gap-1">
                                           {days.sort((a,b) => parseInt(a) - parseInt(b)).map(day => (
                                             <span key={day} className="bg-white border border-slate-150 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-extrabold shadow-3xs">
                                               {day}
                                             </span>
                                           ))}
                                         </div>
                                       </div>
                                     );
                                   })}
                                 </div>
                               );
                             }
                             return (
                               <p className="text-[8px] leading-snug text-slate-400 font-bold italic py-3 bg-slate-50/50 rounded text-center">
                                 {tText("Heç bir iş günü qeydiyyatı yoxdur.")}
                               </p>
                             );
                           })()}
                         </div>
 
                         {/* Options Section: Modify duty / Remove employee */}
                         <div className="flex justify-between items-center border-t border-slate-50/80 pt-2 bg-slate-50/20 px-1 rounded-b-xl">
                           <button
                             type="button"
                             onClick={() => handleStartEditStaff(person)}
                             className="inline-flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-orange-600 transition-colors py-1 px-2 hover:bg-orange-50 rounded-lg"
                           >
                             <Edit className="w-3.5 h-3.5" />
                             {tText("VƏZİFƏ VƏ DETAILS DƏYİŞDİR")}
                           </button>
                           <button
                             type="button"
                             onClick={() => {
                               setConfirmDialog({
                                 isOpen: true,
                                 title: tText('İŞÇİNİ SİL / İŞDƏN ÇIXART'),
                                 message: `"${person.name}" ${tText("adlı işçini sistemdən silmək və işdən çıxartmaq istədiyinizə əminsiniz?")}`,
                                 confirmText: tText('Bəli, Sil'),
                                 cancelText: tText('Ləğv Et'),
                                 onConfirm: () => handleDeleteStaff(person.id),
                               });
                             }}
                             className="inline-flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors py-1 px-2 hover:bg-red-50 rounded-lg"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                             {tText("İŞDƏN ÇIXART")}
                           </button>
                         </div>
                       </div>
                     )}
                    </Card>
                  );
                })}
                </div>
              )}
            </div>
          </div>
        );
};
