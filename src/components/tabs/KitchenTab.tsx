import React from "react";
import { Utensils, CheckCircle2, AlertTriangle, RotateCcw, Trash2, ChevronDown, Check, Layers, Gift } from "lucide-react";
import { motion } from "motion/react";
import { AzDatePicker } from "../AzDatePicker";
import { KitchenItem, Table, OrderItem, DefectRecord } from "../../types";
import { matchesDatePeriod, getTodayStr, normalizeDateKey } from "../../utils/dateUtils";

export interface KitchenTabProps {
  t: any;
  tText: (key: string, defaultText?: string) => string;
  kitchenLog: KitchenItem[];
  kitchenSearch?: string;
  setKitchenSearch?: (search: string) => void;
  kitchenDate: string;
  setKitchenDate: (date: string) => void;
  activeShiftBusinessDate?: string;
  tables?: Table[];
  activeOrders?: Record<number, OrderItem[]>;
  defectRecords?: DefectRecord[];
}

export const KitchenTab: React.FC<KitchenTabProps> = ({
  t,
  tText,
  kitchenLog,
  kitchenDate,
  setKitchenDate,
  activeShiftBusinessDate,
  tables,
  activeOrders,
  defectRecords
}) => {
  const [kitchenPeriod, setKitchenPeriod] = React.useState<'daily' | 'monthly' | 'yearly' | 'all'>('daily');
  const [selectedTableFilter, setSelectedTableFilter] = React.useState<string>('all');
  const [isTableMenuOpen, setIsTableMenuOpen] = React.useState(false);
  const tableMenuRef = React.useRef<HTMLDivElement>(null);

  // Mətbəx səhifəsi açılanda təqvimdə (kalendarda) həmişə kompüterin cari tarixi göstərilsin
  React.useEffect(() => {
    const today = getTodayStr();
    if (today) {
      setKitchenDate(today);
    }
  }, [setKitchenDate]);

  // Menyunun kənarına kliklədikdə bağlanması
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target as Node)) {
        setIsTableMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Jurnalda və masalar siyahısında mövcud olan bütün unikal masalar və kosmik dəqiqliklə hesablanmış jurnal
  const unifiedKitchenLog = React.useMemo(() => {
    const list: KitchenItem[] = [...kitchenLog];

    // Helper functions for precise table, date, and dish normalization
    const getCleanTable = (t: any): string => {
      const s = String(t || '').trim();
      const digits = s.replace(/\D/g, '');
      return digits || s.toLowerCase();
    };

    const getCleanDate = (d: any): string => {
      return normalizeDateKey(d) || '';
    };

    const getCleanDish = (dish: any): string => {
      return String(dish || '').trim().toLowerCase();
    };

    // Calculate existing quantities already in kitchenLog for every (date, table, dish, status)
    // Key format: `${cleanDate}__${cleanTable}__${cleanDish}__${status}`
    const logQuantities = new Map<string, number>();

    kitchenLog.forEach(k => {
      const d = getCleanDate((k as any).date || k.timestamp);
      const t = getCleanTable(k.tableNumber);
      const dish = getCleanDish(k.dishName);
      const st = (k.status === 'gift' || k.isGift) ? 'gift' : k.status;
      const key = `${d}__${t}__${dish}__${st}`;
      const qty = Number(k.quantity) || 1;
      logQuantities.set(key, (logQuantities.get(key) || 0) + qty);
    });

    // Track additional quantities we add so we never overcount or duplicate
    const addedQuantities = new Map<string, number>();

    // 2. Check defectRecords (defective / returned)
    // Only if defectRecords has MORE quantities than already logged in kitchenLog, add the exact delta!
    if (defectRecords && Array.isArray(defectRecords)) {
      const defectMap = new Map<string, { totalQty: number; record: DefectRecord }>();
      defectRecords.forEach(d => {
        const st = d.type === 'defective' ? 'defective' : 'returned';
        const dateKey = getCleanDate(d.date || activeShiftBusinessDate || getTodayStr());
        const tableKey = getCleanTable(d.tableNumber);
        const dishKey = getCleanDish(d.dishName);
        const groupKey = `${dateKey}__${tableKey}__${dishKey}__${st}`;
        const existing = defectMap.get(groupKey);
        const qty = Number(d.quantity) || 1;
        if (existing) {
          existing.totalQty += qty;
        } else {
          defectMap.set(groupKey, { totalQty: qty, record: d });
        }
      });

      defectMap.forEach(({ totalQty, record }, groupKey) => {
        const loggedQty = logQuantities.get(groupKey) || 0;
        const currentAdded = addedQuantities.get(groupKey) || 0;
        const missingDelta = totalQty - (loggedQty + currentAdded);
        if (missingDelta > 0) {
          const st = record.type === 'defective' ? 'defective' : 'returned';
          list.push({
            id: record.id || Date.now() + Math.random(),
            dishName: record.dishName,
            quantity: missingDelta,
            tableNumber: record.tableNumber || 'Masa',
            waiterName: record.waiterName || 'Ofisiant',
            status: st as any,
            timestamp: new Date(record.timestamp || Date.now()),
            date: record.date || activeShiftBusinessDate || getTodayStr(),
            notes: record.reason || (st === 'defective' ? 'Xarab məhsul' : 'Geri qaytarıldı'),
            shiftId: record.shiftId,
            isClosed: record.isClosed
          });
          addedQuantities.set(groupKey, currentAdded + missingDelta);
        }
      });
    }

    // 3. Check activeOrders items (cancelled, defective, returned, gift)
    // Only if activeOrders has MORE items than already accounted for in kitchenLog, add the exact delta!
    if (activeOrders && typeof activeOrders === 'object') {
      Object.entries(activeOrders).forEach(([tableKey, items]) => {
        if (!Array.isArray(items)) return;
        const tblObj = tables?.find(t => String(t.id) === String(tableKey));
        const tNum = tblObj?.number ? (tblObj.number.toLowerCase().includes('masa') ? tblObj.number : `Masa ${tblObj.number}`) : `Masa ${tableKey}`;
        const waiter = tblObj?.waiterName || 'Ofisiant';
        const dateKey = getCleanDate(activeShiftBusinessDate || getTodayStr());
        const cleanT = getCleanTable(tblObj?.number || tableKey);

        const activeGroupMap = new Map<string, { totalQty: number; item: OrderItem; status: string }>();

        items.forEach(item => {
          let st = '';
          if (item.status === 'cancelled') st = 'cancelled';
          else if (item.status === 'defective') st = 'defective';
          else if (item.status === 'returned') st = 'returned';
          else if ((item as any).status === 'gift' || item.isGift) st = 'gift';

          if (st) {
            const cleanDish = getCleanDish(item.name);
            const groupKey = `${dateKey}__${cleanT}__${cleanDish}__${st}`;
            const qty = Number(item.quantity) || 1;
            const existing = activeGroupMap.get(groupKey);
            if (existing) {
              existing.totalQty += qty;
            } else {
              activeGroupMap.set(groupKey, { totalQty: qty, item, status: st });
            }
          }
        });

        activeGroupMap.forEach(({ totalQty, item, status: st }, groupKey) => {
          const loggedQty = logQuantities.get(groupKey) || 0;
          const currentAdded = addedQuantities.get(groupKey) || 0;
          const missingDelta = totalQty - (loggedQty + currentAdded);
          if (missingDelta > 0) {
            const noteText = st === 'gift' 
              ? (item.notes && item.notes.trim() ? item.notes : 'Müştəriyə hədiyyə verilib')
              : item.deleteReason || (st === 'cancelled' ? 'Sifarişdən silindi' : st === 'defective' ? 'Xarab məhsul' : 'Geri qaytarıldı');

            list.push({
              id: item.id || Date.now() + Math.random(),
              dishName: item.name,
              quantity: missingDelta,
              tableNumber: tNum,
              waiterName: waiter,
              status: st as any,
              isGift: st === 'gift',
              timestamp: new Date(),
              date: activeShiftBusinessDate || getTodayStr(),
              notes: noteText,
              isClosed: false
            });
            addedQuantities.set(groupKey, currentAdded + missingDelta);
          }
        });
      });
    }

    // Sort by timestamp descending (newest first)
    return list.sort((a, b) => {
      const timeA = new Date((a as any).timestamp || 0).getTime();
      const timeB = new Date((b as any).timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [kitchenLog, defectRecords, activeOrders, tables, activeShiftBusinessDate]);

  const availableTables = React.useMemo(() => {
    const tableSet = new Set<string>();
    unifiedKitchenLog.forEach(item => {
      if (item.tableNumber) {
        tableSet.add(String(item.tableNumber).trim());
      }
    });
    if (tables && Array.isArray(tables)) {
      tables.forEach(t => {
        if (t.number) tableSet.add(String(t.number).trim());
      });
    }
    return Array.from(tableSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [unifiedKitchenLog, tables]);

  const filteredKitchen = unifiedKitchenLog.filter(item => {
    const itemTableRaw = String(item.tableNumber || '').trim();
    const itemTableDigits = itemTableRaw.replace(/\D/g, '');
    const filterDigits = selectedTableFilter.replace(/\D/g, '');

    const matchesTable = selectedTableFilter === 'all' ||
      itemTableRaw.toLowerCase() === selectedTableFilter.toLowerCase() ||
      (Boolean(filterDigits) && itemTableDigits === filterDigits);

    const matchesDate = matchesDatePeriod(
      (item as any).date || item.timestamp,
      kitchenDate || getTodayStr(),
      kitchenPeriod
    );

    return matchesTable && matchesDate;
  });

  const formatExactKitchenTime = (item: KitchenItem): string => {
    if ((item as any).time && typeof (item as any).time === 'string' && (item as any).time.includes(':')) {
      const parts = (item as any).time.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
    }
    const ts: any = item.timestamp;
    if (!ts) {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    if (ts instanceof Date && !isNaN(ts.getTime())) {
      return `${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`;
    }
    if (typeof ts === 'number') {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    if (typeof ts === 'string') {
      const match = ts.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
      }
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusInfo = (item: KitchenItem) => {
    if (item.status === 'gift' || item.isGift) {
      return {
        text: tText('Hədiyyə'),
        badgeClass: 'bg-purple-50 text-purple-600 border-purple-200'
      };
    }
    if (item.status === 'defective') {
      return {
        text: tText('Xarab'),
        badgeClass: 'bg-rose-50 text-rose-600 border-rose-200'
      };
    }
    if (item.status === 'returned') {
      return {
        text: tText('Geri qayıdan'),
        badgeClass: 'bg-amber-50 text-amber-600 border-amber-200'
      };
    }
    if (item.status === 'cancelled') {
      return {
        text: tText('Silindi'),
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
      };
    }
    if (item.status === 'delivered') {
      return {
        text: tText('Təhvil verildi'),
        badgeClass: 'bg-green-50 text-green-600 border-green-200'
      };
    }

    // Əgər status 'preparing' və ya 'ready'-dirsə, həmin masanın hələ də aktiv olub-olmamasını yoxlayırıq
    const itemTableClean = String(item.tableNumber || '').replace(/\D/g, '');
    const isTableCurrentlyActive = Boolean(
      tables?.some(t => String(t.number).replace(/\D/g, '') === itemTableClean && t.status === 'occupied') ||
      (activeOrders && Object.keys(activeOrders).some(tId => {
        const tObj = tables?.find(t => String(t.id) === String(tId));
        return (
          tObj &&
          String(tObj.number).replace(/\D/g, '') === itemTableClean &&
          (activeOrders[Number(tId)] || []).length > 0
        );
      }))
    );

    if (isTableCurrentlyActive) {
      return {
        text: tText('Hazırlanır'),
        badgeClass: 'bg-blue-50 text-blue-600 border-blue-200'
      };
    }

    // Əgər masa artıq ödənilib və təmizlənibsə, status "Təhvil verildi"-dir
    return {
      text: tText('Təhvil verildi'),
      badgeClass: 'bg-green-50 text-green-600 border-green-200'
    };
  };

  const getNoteInfo = (item: KitchenItem) => {
    if (item.status === 'gift' || item.isGift) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 uppercase tracking-wide">
            {tText("Hədiyyə")}
          </span>
          <span className="text-[11px] font-bold text-purple-600 italic">
            ({item.notes && item.notes.trim() ? tText(item.notes) : tText("Müştəriyə hədiyyə verilib")})
          </span>
        </div>
      );
    }

    if (item.status === 'defective') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 uppercase tracking-wide">
            {tText("Xarab")}
          </span>
          {item.notes && item.notes.trim() && (
            <span className="text-[11px] font-bold text-rose-600 italic">
              ({tText(item.notes)})
            </span>
          )}
        </div>
      );
    }

    if (item.status === 'returned') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 uppercase tracking-wide">
            {tText("Geri qayıdan")}
          </span>
          {item.notes && item.notes.trim() && (
            <span className="text-[11px] font-bold text-amber-600 italic">
              ({tText(item.notes)})
            </span>
          )}
        </div>
      );
    }

    if (item.status === 'cancelled') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wide">
            {tText("Silindi")}
          </span>
          {item.notes && item.notes.trim() && (
            <span className="text-[11px] font-bold text-slate-600 italic">
              ({tText(item.notes)})
            </span>
          )}
        </div>
      );
    }

    // Normal məhsullar
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 uppercase tracking-wide">
          {tText("Normal")}
        </span>
        {item.notes && item.notes.trim() && (
          <span className="text-[11px] font-medium text-slate-500 italic">
            ({tText(item.notes)})
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{tText("Hazırlıq Jurnalı")}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              {tText("Mətbəx Hesabatı")}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
          {/* Masa filtr düyməsi */}
          <div className="relative w-full sm:w-56" ref={tableMenuRef}>
            <button
              type="button"
              onClick={() => setIsTableMenuOpen(prev => !prev)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 hover:border-orange-500 rounded-2xl flex items-center justify-between font-bold text-slate-700 shadow-sm text-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">
                  {selectedTableFilter === 'all' 
                    ? tText("Bütün Masalar") 
                    : (selectedTableFilter.toLowerCase().includes('masa') ? selectedTableFilter : `Masa ${selectedTableFilter}`)}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isTableMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTableMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-30 py-2 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTableFilter('all');
                    setIsTableMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                    selectedTableFilter === 'all' ? 'bg-orange-50 text-orange-600 font-black' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{tText("Bütün Masalar")}</span>
                  {selectedTableFilter === 'all' && <Check className="w-3.5 h-3.5 text-orange-600" />}
                </button>
                <div className="h-px bg-slate-100 my-1" />
                {availableTables.map(tbl => {
                  const isSelected = selectedTableFilter === tbl;
                  const displayLabel = tbl.toLowerCase().includes('masa') ? tbl : `Masa ${tbl}`;
                  return (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => {
                        setSelectedTableFilter(tbl);
                        setIsTableMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected ? 'bg-orange-50 text-orange-600 font-black' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{displayLabel}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
            {(['daily', 'monthly', 'yearly', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setKitchenPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  kitchenPeriod === p
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p === 'daily' ? tText('GÜNDƏLİK') : p === 'monthly' ? tText('AYLIQ') : p === 'yearly' ? tText('İLLİK') : tText('HAMISI')}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-48 shrink-0">
            <AzDatePicker 
              value={kitchenDate || getTodayStr()}
              onChange={(val) => {
                if (val) {
                  setKitchenDate(val);
                  if (kitchenPeriod === 'all') setKitchenPeriod('daily');
                }
              }}
              format="dd.mm.yyyy"
              placeholder="Tarix seçin"
              className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 shadow-sm text-xs flex items-center gap-2 cursor-pointer select-none"
            />
          </div>
        </div>
      </div>

      {/* 5 Ədəd Dəqiq Statistika Qutusu (Normal, Xarab, Geri Qayıdan, Silinən, Hədiyyə) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. MƏHSUL (NORMAL) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tText("MƏHSUL (NORMAL)")}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-800">
              {filteredKitchen
                .filter(i => (i.status === 'ready' || i.status === 'preparing' || i.status === 'delivered') && !i.isGift)
                .reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* 2. MƏHSUL (XARAB) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">{tText("MƏHSUL (XARAB)")}</p>
            <p className="text-2xl sm:text-3xl font-black text-rose-600">
              {filteredKitchen
                .filter(i => i.status === 'defective')
                .reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)}
            </p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* 3. GERİ QAYIDAN */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">{tText("GERİ QAYIDAN")}</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">
              {filteredKitchen
                .filter(i => i.status === 'returned')
                .reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        {/* 4. SİLİNƏN MƏHSULLAR */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tText("SİLİNƏN MƏHSULLAR")}</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-700">
              {filteredKitchen
                .filter(i => i.status === 'cancelled')
                .reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)}
            </p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
        </div>

        {/* 5. HƏDİYYƏ EDİLƏN */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">{tText("HƏDİYYƏ EDİLƏN")}</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600">
              {filteredKitchen
                .filter(i => i.status === 'gift' || i.isGift)
                .reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Cədvəl */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div 
          id="kitchen-table-scroll-container"
          className="overflow-x-auto overflow-y-auto max-h-[560px] table-scrollbar pr-1"
        >
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="bg-slate-50/80 backdrop-blur-sm text-left border-b border-slate-100 shadow-sm">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tText("Saat (24s)")}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tText("Yemək / Məhsul")}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tText("Masa")}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tText("Ofisiant")}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tText("Status")}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tText("Qeyd")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredKitchen.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    {tText("Seçilmiş parametr və tarix üçün məlumat tapılmadı")}
                  </td>
                </tr>
              ) : (
                filteredKitchen.map(item => {
                  const statusInfo = getStatusInfo(item);
                  const isGift = item.status === 'gift' || item.isGift;
                  const isAbnormal = item.status === 'defective' || item.status === 'returned' || item.status === 'cancelled';
                  const rowClass = item.status === 'defective' 
                    ? 'bg-rose-50/30' 
                    : item.status === 'returned' 
                    ? 'bg-amber-50/30' 
                    : item.status === 'cancelled' 
                    ? 'bg-slate-50/40 opacity-75' 
                    : isGift
                    ? 'bg-purple-50/25'
                    : '';

                  return (
                    <motion.tr 
                       layout
                      key={item.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${rowClass}`}
                    >
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-800 text-sm">
                          {formatExactKitchenTime(item)}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            item.status === 'defective' ? 'bg-rose-100 text-rose-600' :
                            item.status === 'returned' ? 'bg-amber-100 text-amber-600' :
                            item.status === 'cancelled' ? 'bg-slate-200 text-slate-500' :
                            isGift ? 'bg-purple-100 text-purple-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.quantity}x
                          </div>
                          <span className={`font-black tracking-tight ${
                            item.status === 'cancelled' ? 'line-through text-slate-400' :
                            isGift ? 'text-purple-900' :
                            'text-slate-800'
                          }`}>
                            {item.dishName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap">
                          {tText(item.tableNumber)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.waiterName}`} alt="" />
                           </div>
                           <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{item.waiterName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border ${statusInfo.badgeClass}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {getNoteInfo(item)}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
};
