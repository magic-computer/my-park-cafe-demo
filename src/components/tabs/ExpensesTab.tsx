import React from "react";
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  DollarSign, 
  TrendingDown,
  Lock 
} from "lucide-react";
import { Card } from "../Card";
import { AzDatePicker } from "../AzDatePicker";
import { ExpenseItem } from "../../types";
import { matchesDatePeriod, normalizeDateKey, calculateExpensesReconciliation, getActiveShiftBusinessDate, getTodayStr } from "../../utils/dateUtils";

export interface ExpensesTabProps {
  tText: (key: string, defaultText?: string) => string;
  expenses: ExpenseItem[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  expenseCategoryFilter: string;
  setExpenseCategoryFilter: (filter: string) => void;
  expenseSearch: string;
  setExpenseSearch: (search: string) => void;
  expenseDate: string;
  setExpenseDate: (date: string) => void;
  expensePeriod: "daily" | "monthly" | "yearly" | "custom";
  setExpensePeriod: (period: "daily" | "monthly" | "yearly" | "custom") => void;
  setIsAddExpenseOpen: (open: boolean) => void;
  currencySymbol: string;
  currencyText: string;
  formatAzDate: (dateStr: string, period?: string) => string;
  formatPrice: (amount: number | string | undefined | null) => string;
  onDeleteExpense?: (id: number | string) => void;
  closedShifts?: Record<string, any>;
  activeShiftBusinessDate?: string;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  tText,
  expenses,
  setExpenses,
  expenseCategoryFilter,
  setExpenseCategoryFilter,
  expenseSearch,
  setExpenseSearch,
  expenseDate,
  setExpenseDate,
  expensePeriod,
  setExpensePeriod,
  setIsAddExpenseOpen,
  currencySymbol,
  currencyText,
  formatAzDate,
  formatPrice,
  onDeleteExpense,
  closedShifts = {},
  activeShiftBusinessDate
}) => {
  // Always default calendar and list to current computer date on mount
  React.useEffect(() => {
    const currentToday = getTodayStr();
    if (currentToday) {
      setExpenseDate(currentToday);
      setExpensePeriod('daily');
    }
  }, [setExpenseDate, setExpensePeriod]);

  const normKey = normalizeDateKey(expenseDate);
  const activeNormKey = normalizeDateKey(activeShiftBusinessDate);
  const isShiftClosed = (expensePeriod === 'daily' || expensePeriod === 'custom') && !!normKey && !!closedShifts[normKey] && normKey !== activeNormKey;

  const effectiveExpensesList = React.useMemo(() => {
    let baseList: ExpenseItem[] = [...expenses];
    if (isShiftClosed && closedShifts[normKey]) {
      const targetClosed = closedShifts[normKey];
      if (targetClosed.allShifts && Array.isArray(targetClosed.allShifts)) {
        const allExp: ExpenseItem[] = [];
        const seenIds = new Set<string>();
        targetClosed.allShifts.forEach((s: any) => {
          (s.expenses || []).forEach((e: ExpenseItem) => {
            const idStr = String(e.id);
            if (!seenIds.has(idStr)) {
              seenIds.add(idStr);
              allExp.push(e);
            }
          });
        });
        baseList = allExp;
      } else if (Array.isArray(targetClosed.expenses)) {
        baseList = targetClosed.expenses as ExpenseItem[];
      }
    }

    // Delta reconciliation for Monthly / Yearly periods against frozen shift snapshots
    // Uses shared calculateExpensesReconciliation helper so App.tsx and ExpensesTab.tsx NEVER drift apart!
    if (expensePeriod === 'monthly' || expensePeriod === 'yearly') {
      const expensesByDate: Record<string, number> = {};
      baseList.forEach(ex => {
        const dKey = normalizeDateKey(ex.date) || String(ex.date);
        expensesByDate[dKey] = (expensesByDate[dKey] || 0) + Number(ex.amount || 0);
      });

      const { deltasByDate } = calculateExpensesReconciliation(
        closedShifts,
        expenseDate,
        expensePeriod,
        expensesByDate
      );

      if (deltasByDate.length > 0) {
        const extraExpenseItems: ExpenseItem[] = deltasByDate.map(d => ({
          id: 9990000 + Math.abs(d.dateKey.split('-').reduce((acc, part) => acc * 31 + Number(part || 0), 0) % 9999),
          title: `Arxiv Növbə Xərcləri (${formatAzDate(d.dateKey)})`,
          category: 'Arxiv Xərc',
          amount: d.delta,
          date: d.dateKey,
          notes: `Bağlanmış növbənin dondurulmuş Z-hesabat xərcləri (Delta bərpa sətri).`,
          operator: 'Sistem Z-Hesabat'
        }));
        return [...baseList, ...extraExpenseItems];
      }
    }

    return baseList;
  }, [isShiftClosed, normKey, closedShifts, expenses, expensePeriod, expenseDate, formatAzDate]);

  const matchesExpenseFilter = (ex: ExpenseItem) => {
    if (expenseCategoryFilter !== 'all' && ex.category !== expenseCategoryFilter) {
      return false;
    }
    if (expenseSearch && expenseSearch.trim() !== '') {
      const q = expenseSearch.toLowerCase();
      const matchTitle = (ex.title || '').toLowerCase().includes(q);
      const matchCat = (ex.category || '').toLowerCase().includes(q);
      const matchNotes = (ex.notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchNotes) return false;
    }
    return matchesDatePeriod(ex.date, expenseDate, expensePeriod);
  };

  const filteredExpensesList = effectiveExpensesList.filter(matchesExpenseFilter);
  const totalExpensesSum = Math.round(filteredExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0) * 100) / 100;
  const maxExpenseItem = filteredExpensesList.length > 0 
    ? [...filteredExpensesList].sort((a, b) => b.amount - a.amount)[0]
    : null;

  const handleDeleteExpenseItem = (id: number | string) => {
    if (onDeleteExpense) {
      onDeleteExpense(id);
      return;
    }
    if (isShiftClosed) {
      alert(tText("Bağlanmış növbəyə aid xərc silinə bilməz."));
      return;
    }
    if (window.confirm(tText("Bu xərc qeydini silməyə əminsiniz?"))) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

        return (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="max-w-7xl mx-auto space-y-6 pb-16">
              
              {/* Header Deck */}
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      {tText("XƏRCLƏR VƏ ƏMƏLİYYAT ÇIXARLARI")}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">
                      {tText("Restoranın gündəlik, aylıq və illik xərclərinin kosmik dəqiqliklə hesablanması")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isShiftClosed && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs font-black">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{tText("Növbə Bağlanıb və Dondurulub")}</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (isShiftClosed) {
                        alert(tText("Bu tarixin növbəsi bağlanıb və dondurulub. Bağlanmış günə yeni xərc əlavə etmək mümkün deyil."));
                        return;
                      }
                      setIsAddExpenseOpen(true);
                    }}
                    className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isShiftClosed 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md shadow-red-200 hover:shadow-lg'
                    }`}
                  >
                    {isShiftClosed ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {tText("Yeni Xərc Əlavə Et")}
                  </button>
                </div>
              </div>

              {/* Filter Controls & Search */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
                
                {/* Period selector */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
                    {(['daily', 'monthly', 'yearly', 'custom'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setExpensePeriod(p)}
                        className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                          expensePeriod === p
                            ? 'bg-white text-slate-850 shadow-xs'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {p === 'daily' ? tText('GÜNDƏLİK') : p === 'monthly' ? tText('AYLIQ') : p === 'yearly' ? tText('İLLİK') : tText('HAMISI')}
                      </button>
                    ))}
                  </div>

                  {expensePeriod !== 'custom' && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-700 min-w-[200px]">
                      <AzDatePicker
                        value={expenseDate || getTodayStr()}
                        onChange={(val) => setExpenseDate(val)}
                        className="bg-transparent border-none p-0 focus:outline-none cursor-pointer text-xs font-black text-slate-800 flex items-center gap-2"
                      />
                      <span className="text-[10px] text-orange-600 font-extrabold shrink-0">
                        ({formatAzDate(expenseDate || getTodayStr(), expensePeriod)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Category & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  >
                    <option value="all">{tText("Bütün Kateqoriyalar")}</option>
                    <option value="Kommunal">{tText("Kommunal (İşıq, Qaz, Su)")}</option>
                    <option value="Təchizat">{tText("Təchizat və Ərzaq")}</option>
                    <option value="Arenda">{tText("Arenda / İcarə")}</option>
                    <option value="Maaş">{tText("Əməkhaqqı / Maaş")}</option>
                    <option value="Təmir/Avariya">{tText("Təmir və Avadanlıq")}</option>
                    <option value="Digər">{tText("Digər Xərclər")}</option>
                  </select>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={tText("Xərc axtar...")}
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-3xl text-white shadow-lg shadow-red-100 flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-[10px] font-black uppercase tracking-wider mb-1">
                      {tText("CƏMİ FİLTRLƏNMİŞ XƏRCLƏR")}
                    </p>
                    <h3 className="text-2xl font-black">{totalExpensesSum.toFixed(2)} {currencyText}</h3>
                    <p className="text-[10px] text-red-200 font-bold mt-1">
                      {expensePeriod !== 'custom' ? formatAzDate(expenseDate, expensePeriod) : tText("Bütün dövrlər daxil")}
                    </p>
                  </div>
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-xs">
                    <TrendingDown className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
                      {tText("XƏRC QEYDLƏRİNİN SAYI")}
                    </p>
                    <h3 className="text-2xl font-black text-slate-850">{filteredExpensesList.length} {tText("Əməliyyat")}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{tText("Aktiv filtredəki qeydlər")}</p>
                  </div>
                  <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                    <Receipt className="w-8 h-8" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
                      {tText("ƏN YÜKSƏK TƏK XƏRC")}
                    </p>
                    <h3 className="text-2xl font-black text-red-600">
                      {maxExpenseItem ? `${maxExpenseItem.amount.toFixed(2)} ${currencyText}` : `0.00 ${currencyText}`}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold truncate max-w-[180px] mt-1">
                      {maxExpenseItem ? maxExpenseItem.title : tText("Qeyd Yoxdur")}
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                    <DollarSign className="w-8 h-8" />
                  </div>
                </div>

              </div>

              {/* Table */}
              <Card className="p-6 border border-slate-100 shadow-sm rounded-3xl bg-white">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-500" />
                    {tText("Xərc Qeydləri Siyahısı")}
                  </h3>
                  <span className="text-xs font-black bg-red-50 text-red-600 px-3 py-1.5 rounded-xl border border-red-100">
                    {filteredExpensesList.length} {tText("Qeyd")}
                  </span>
                </div>

                {filteredExpensesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <TrendingDown className="w-12 h-12 text-slate-300" />
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {tText("Axtarışınıza və ya filtrinizə uyğun xərc tapılmadı")}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/80">
                          <th className="py-3 px-4 rounded-l-xl">#</th>
                          <th className="py-3 px-4">{tText("Təyinat / Təsvir")}</th>
                          <th className="py-3 px-4">{tText("Kateqoriya")}</th>
                          <th className="py-3 px-4 text-right">{tText("Məbləğ")}</th>
                          <th className="py-3 px-4">{tText("Tarix")}</th>
                          <th className="py-3 px-4">{tText("Qeyd / İcraçı")}</th>
                          <th className="py-3 px-4 text-center rounded-r-xl">{tText("Əməliyyat")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {filteredExpensesList.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-red-50/20 transition-colors">
                            <td className="py-3.5 px-4 text-slate-400 text-[11px] font-black">{idx + 1}</td>
                            <td className="py-3.5 px-4 text-slate-850 font-extrabold">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{tText(item.title)}</span>
                                {((typeof item.id === 'string' && item.id.startsWith('defect_exp_')) || (typeof item.id === 'number' && item.id >= 9000000) || item.category === 'Xarab') && (
                                  <span className="text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    {tText("Defekt Jurnalı")}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                                {tText(item.category)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-red-600 text-sm">
                              -{item.amount.toFixed(2)} {currencySymbol}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-bold whitespace-nowrap">
                              {formatAzDate(item.date, 'daily')}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                              {item.notes ? item.notes : item.operator || '-'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isShiftClosed || item.isClosed ? (
                                <span className="inline-flex p-2 text-slate-300" title={tText("Dondurulmuş xərc (Silinə bilməz)")}>
                                  <Lock className="w-4 h-4" />
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteExpenseItem(item.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                  title={((typeof item.id === 'string' && item.id.startsWith('defect_exp_')) || (typeof item.id === 'number' && item.id >= 9000000)) ? tText("Defekt jurnalından sil") : tText("Sil")}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

            </div>
          </div>
        );
};
