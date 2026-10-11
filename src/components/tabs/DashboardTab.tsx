import React, { useState, useRef, useEffect } from "react";
import { 
  Utensils, 
  CalendarDays, 
  Receipt, 
  Package, 
  Users, 
  FileText, 
  Calendar, 
  BarChart3, 
  Printer, 
  Info, 
  Wallet, 
  Banknote,
  TrendingDown, 
  X,
  History,
  Search,
  Trash2,
  Undo2,
  AlertTriangle,
  Gift,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  ChevronDown,
  Check
} from "lucide-react";
import { Card } from "../Card";
import { AzDatePicker } from "../AzDatePicker";
import { Table, Reservation, InventoryItem, ExpenseItem, MenuItem, SaleMovementRecord, DefectRecord } from "../../types";
import { normalizeDateKey } from "../../App";
import { matchesDatePeriod, parseDateToYMD, getTodayStr, getActiveShiftBusinessDate, formatAzDate } from "../../utils/dateUtils";

export interface DashboardTabProps {
  tables: Table[];
  reservations: Reservation[];
  inventory: InventoryItem[];
  menuItems: MenuItem[];
  memoizedDashboardStats: any;
  dailySoldStats?: any;
  dashboardSoldTableFilter: string;
  setDashboardSoldTableFilter: (filter: string) => void;
  dashboardDate: string;
  setDashboardDate: (date: string) => void;
  dashboardPeriod: "daily" | "monthly" | "yearly" | "custom";
  setDashboardPeriod: (period: "daily" | "monthly" | "yearly" | "custom") => void;
  getLocale: () => string;
  t: any;
  tText: (key: string, defaultText?: string) => string;
  currencySymbol: string;
  currencyText: string;
  appLanguage: string;
  setActiveTab: (tab: any) => void;
  expenses: ExpenseItem[];
  appName: string;
  appNameWord1: string;
  appNameWord2: string;
  getPaymentMethodBadge: (method: string) => React.ReactNode;
  dashboardSelectedProductFilter: string;
  setDashboardSelectedProductFilter: (p: string) => void;
  showZReportModal: boolean;
  setShowZReportModal: (s: boolean) => void;
  zModalRef: React.RefObject<HTMLDivElement | null>;
  zReportPos: { x: number; y: number } | null;
  handleZReportMouseDown: (e: React.MouseEvent) => void;
  getZReportData: (date: string, shiftId?: string) => any;
  zReportDate: string;
  setZReportDate: (date: string) => void;
  handlePrintZReport: (data: any, date?: string) => void;
  saleMovements?: SaleMovementRecord[];
  closedShifts: Record<string, any>;
  handleCloseShift: (date: string) => void;
  activeShift?: any;
  dashboardShiftId?: string;
  setDashboardShiftId?: (id: string) => void;
  defectRecords?: DefectRecord[];
  setExpenseDate?: (date: string) => void;
  setExpensePeriod?: (period: "daily" | "monthly" | "yearly" | "custom") => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  tables,
  reservations,
  inventory,
  menuItems,
  memoizedDashboardStats,
  dailySoldStats,
  dashboardSoldTableFilter,
  setDashboardSoldTableFilter,
  dashboardDate,
  setDashboardDate,
  dashboardPeriod,
  setDashboardPeriod,
  getLocale,
  t,
  tText,
  currencySymbol,
  currencyText,
  appLanguage,
  setActiveTab,
  expenses,
  appName,
  appNameWord1,
  appNameWord2,
  getPaymentMethodBadge,
  dashboardSelectedProductFilter,
  setDashboardSelectedProductFilter,
  showZReportModal,
  setShowZReportModal,
  zModalRef,
  zReportPos,
  handleZReportMouseDown,
  getZReportData,
  zReportDate,
  setZReportDate,
  handlePrintZReport,
  saleMovements = [],
  closedShifts = {},
  handleCloseShift,
  activeShift,
  dashboardShiftId = 'auto',
  setDashboardShiftId,
  defectRecords = [],
  setExpenseDate,
  setExpensePeriod,
}) => {
  const [selectedZShiftId, setSelectedZShiftId] = useState<string>('auto');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'Silindi' | 'Geri alma' | 'Xarab' | 'Hədiyyə'>('all');
  const [movementSearch, setMovementSearch] = useState('');
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);
  const shiftDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shiftDropdownRef.current && !shiftDropdownRef.current.contains(event.target as Node)) {
        setIsShiftDropdownOpen(false);
      }
    };
    if (isShiftDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShiftDropdownOpen]);

  const targetYm = dashboardDate ? dashboardDate.substring(0, 7) : '';
  const targetYr = dashboardDate ? dashboardDate.substring(0, 4) : '';

  const normDashKey = normalizeDateKey(dashboardDate);
  const activeNormDashKey = normalizeDateKey(activeShift?.businessDate);

  // Extract all closed shifts for the selected dashboard date reliably and sort chronologically
  const closedShiftsForDate = React.useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    const direct = normDashKey ? closedShifts[normDashKey] : null;
    if (direct?.allShifts && Array.isArray(direct.allShifts) && direct.allShifts.length > 0) {
      direct.allShifts.forEach((s: any) => {
        const sid = s.shiftId || s.reportNo;
        if (sid && !seen.has(sid)) {
          seen.add(sid);
          list.push(s);
        } else if (!sid) {
          list.push(s);
        }
      });
    } else if (direct && (direct.shiftId || direct.summary || direct.reportNo)) {
      const sid = direct.shiftId || direct.reportNo;
      if (sid) seen.add(sid);
      list.push(direct);
    }

    if (normDashKey) {
      Object.values(closedShifts || {}).forEach((cs: any) => {
        if (!cs) return;
        const csNorm = normalizeDateKey(cs.date || cs.targetDateKey);
        if (csNorm === normDashKey) {
          if (cs.allShifts && Array.isArray(cs.allShifts) && cs.allShifts.length > 0) {
            cs.allShifts.forEach((s: any) => {
              const sid = s.shiftId || s.reportNo;
              if (sid && !seen.has(sid)) {
                seen.add(sid);
                list.push(s);
              }
            });
          } else if (cs.shiftId || cs.summary || cs.reportNo) {
            const sid = cs.shiftId || cs.reportNo;
            if (sid && !seen.has(sid)) {
              seen.add(sid);
              list.push(cs);
            }
          }
        }
      });
    }

    // Sort closed shifts chronologically
    list.sort((a, b) => {
      const idxA = a.shiftIndex || 0;
      const idxB = b.shiftIndex || 0;
      if (idxA !== idxB) return idxA - idxB;
      const timeA = a.closedAt ? new Date(a.closedAt).getTime() : 0;
      const timeB = b.closedAt ? new Date(b.closedAt).getTime() : 0;
      return timeA - timeB;
    });

    return list;
  }, [normDashKey, closedShifts]);

  // Build available shifts dropdown options
  const availableDashboardShifts = React.useMemo(() => {
    const list = closedShiftsForDate;
    const isToday = Boolean(normDashKey && activeNormDashKey && normDashKey === activeNormDashKey && !activeShift?.isClosed && list.length < 2);
    const shifts: { id: string; label: string; subLabel?: string; isClosed?: boolean; isActive?: boolean; disabled?: boolean; shiftIndex?: number }[] = [];

    if (isToday) {
      if (list.length === 0) {
        shifts.push({
          id: activeShift.id,
          label: 'Aktiv növbə',
          subLabel: 'Növbə #1 (Cari açıq)',
          isActive: true,
          shiftIndex: 1
        });
        shifts.push({
          id: `${normDashKey || 'today'}_empty_2`,
          label: 'Növbə #2',
          subLabel: 'Keçirilməyib',
          disabled: true
        });
      } else {
        shifts.push({
          id: activeShift.id,
          label: 'Aktiv növbə',
          subLabel: 'Növbə #2 (Cari açıq)',
          isActive: true,
          shiftIndex: 2
        });
        shifts.push({
          id: list[0].shiftId || `${normDashKey}_0`,
          label: 'Növbə #1',
          subLabel: list[0].closedAt ? new Date(list[0].closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : 'Bağlanmış',
          isClosed: true,
          shiftIndex: 1
        });
        shifts.push({
          id: 'all',
          label: 'Bütün gün (Cəmi)',
          subLabel: 'Cari günün cəmi'
        });
      }
    } else {
      if (list.length >= 2) {
        shifts.push({
          id: list[0].shiftId || `${normDashKey}_0`,
          label: 'Növbə #1',
          subLabel: list[0].closedAt ? new Date(list[0].closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : 'Bağlanmış',
          isClosed: true,
          shiftIndex: 1
        });
        shifts.push({
          id: list[1].shiftId || `${normDashKey}_1`,
          label: 'Növbə #2',
          subLabel: list[1].closedAt ? new Date(list[1].closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : 'Bağlanmış',
          isClosed: true,
          shiftIndex: 2
        });
        shifts.push({
          id: 'all',
          label: 'Bütün gün (Cəmi)',
          subLabel: 'Günün cəmi'
        });
      } else if (list.length === 1) {
        shifts.push({
          id: list[0].shiftId || `${normDashKey}_0`,
          label: 'Növbə #1',
          subLabel: list[0].closedAt ? new Date(list[0].closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : 'Bağlanmış',
          isClosed: true,
          shiftIndex: 1
        });
        shifts.push({
          id: `${normDashKey}_empty_2`,
          label: 'Növbə #2',
          subLabel: 'Keçirilməyib',
          disabled: true
        });
        shifts.push({
          id: 'all',
          label: 'Bütün gün (Cəmi)',
          subLabel: 'Günün cəmi'
        });
      } else {
        shifts.push({
          id: `${normDashKey}_empty_1`,
          label: 'Növbə #1',
          subLabel: 'Məlumat yoxdur',
          disabled: false,
          shiftIndex: 1
        });
        shifts.push({
          id: `${normDashKey}_empty_2`,
          label: 'Növbə #2',
          subLabel: 'Keçirilməyib',
          disabled: true
        });
        shifts.push({
          id: 'all',
          label: 'Bütün gün (Cəmi)',
          subLabel: 'Günün cəmi'
        });
      }
    }

    return shifts;
  }, [normDashKey, activeNormDashKey, closedShiftsForDate, activeShift]);

  const isTodaySelected = Boolean(normDashKey && activeNormDashKey && normDashKey === activeNormDashKey && !activeShift?.isClosed);

  const effectiveDashboardShiftId = (dashboardShiftId && dashboardShiftId !== 'auto' && availableDashboardShifts.some(s => s.id === dashboardShiftId && !s.disabled))
    ? dashboardShiftId
    : (isTodaySelected ? activeShift.id : (availableDashboardShifts.find(s => !s.disabled)?.id || availableDashboardShifts[0]?.id || ''));

  const selectedDashShift = availableDashboardShifts.find(s => s.id === effectiveDashboardShiftId) || availableDashboardShifts[0];
  const selectedDashLabel = selectedDashShift ? selectedDashShift.label : 'Növbələr';

  const filteredMovements = React.useMemo(() => {
    return saleMovements.filter(item => {
      // 1. Tarix / Dövr yoxlanışı
      if (dashboardPeriod === 'monthly' || dashboardPeriod === 'yearly') {
        if (!matchesDatePeriod(item.date, dashboardDate, dashboardPeriod)) {
          return false;
        }
      } else {
        // daily or custom
        const itemNormDate = normalizeDateKey(item.date);
        if (normDashKey) {
          if (itemNormDate !== normDashKey && !matchesDatePeriod(item.date, dashboardDate, 'daily')) {
            return false;
          }
        } else if (item.date && !matchesDatePeriod(item.date, dashboardDate, 'daily')) {
          return false;
        }

        // 2. Növbə (Shift) yoxlanışı
        const isItemActiveShift = !item.isClosed || (activeShift?.id && item.shiftId === activeShift.id);

        // Hal A: Bütün gün (Cəmi) seçilib ('all' və ya 'auto')
        if (effectiveDashboardShiftId === 'all' || effectiveDashboardShiftId === 'auto') {
          if (!isTodaySelected && isItemActiveShift) {
            // Keçmiş gün seçildikdə cari aktiv açıq məhsullar görünməməlidir
            return false;
          }
        }
        // Hal B: Aktiv növbə seçilib
        else if (
          effectiveDashboardShiftId === 'active' || 
          (activeShift?.id && effectiveDashboardShiftId === activeShift.id) ||
          selectedDashShift?.isActive
        ) {
          if (!isTodaySelected) return false;
          if (!isItemActiveShift) return false;
          // Bağlanmış növbələrin heç birinə aid olmamalıdır
          if (closedShiftsForDate.some(cs => cs.shiftId && cs.shiftId === item.shiftId)) {
            return false;
          }
        }
        // Hal C: Konkret Bağlanmış Növbə seçilib (məs: Növbə #1 və ya Növbə #2)
        else {
          // Cari aktiv açıq masalarda olan bağlanmamış məhsul bağlanmış növbəyə düşə bilməz
          if (!item.isClosed && (!item.shiftId || item.shiftId === activeShift?.id)) {
            return false;
          }

          // Seçilmiş bağlanmış növbəni dəqiq tapırıq
          const isShift1Selected = selectedDashShift?.label === 'Növbə #1' || 
            selectedDashShift?.shiftIndex === 1 || 
            effectiveDashboardShiftId === `${normDashKey}_0` || 
            effectiveDashboardShiftId === 'shift_1' ||
            (closedShiftsForDate[0] && (closedShiftsForDate[0].shiftId === effectiveDashboardShiftId || closedShiftsForDate[0].reportNo === effectiveDashboardShiftId));

          const isShift2Selected = selectedDashShift?.label === 'Növbə #2' || 
            selectedDashShift?.shiftIndex === 2 || 
            effectiveDashboardShiftId === `${normDashKey}_1` || 
            effectiveDashboardShiftId === 'shift_2' ||
            (closedShiftsForDate[1] && (closedShiftsForDate[1].shiftId === effectiveDashboardShiftId || closedShiftsForDate[1].reportNo === effectiveDashboardShiftId));

          const targetClosedShift = isShift1Selected 
            ? closedShiftsForDate[0] 
            : (isShift2Selected ? closedShiftsForDate[1] : closedShiftsForDate.find(cs => cs.shiftId === effectiveDashboardShiftId || cs.reportNo === effectiveDashboardShiftId));

          const otherClosedShift = isShift1Selected 
            ? closedShiftsForDate[1] 
            : (isShift2Selected ? closedShiftsForDate[0] : null);

          // Əgər item.shiftId varsa və shiftId ilə birbaşa müqayisə
          if (targetClosedShift && item.shiftId) {
            if (targetClosedShift.shiftId && item.shiftId === targetClosedShift.shiftId) {
              // Birbaşa bu növbəyə aiddir
            } else if (targetClosedShift.reportNo && item.shiftId === targetClosedShift.reportNo) {
              // Birbaşa bu növbəyə aiddir
            } else if (otherClosedShift && (item.shiftId === otherClosedShift.shiftId || item.shiftId === otherClosedShift.reportNo)) {
              // Digər bağlanmış növbəyə aiddir, buna aid deyil!
              return false;
            } else if (activeShift?.id && item.shiftId === activeShift.id) {
              // Aktiv növbəyə aiddir, buna aid deyil!
              return false;
            }
          }

          // Əgər targetClosedShift tapılıb və onun orders massivində bu sifariş varsa
          if (targetClosedShift?.orders && Array.isArray(targetClosedShift.orders)) {
            const inThisShiftOrders = targetClosedShift.orders.some((o: any) => 
              (item.orderId && o.id === item.orderId) ||
              (item.id && (String(item.id).startsWith(String(o.id)) || o.id === item.id))
            );
            if (inThisShiftOrders) {
              // Bu növbənin sifarişlərinə daxildir
            } else if (otherClosedShift?.orders && Array.isArray(otherClosedShift.orders)) {
              const inOtherShiftOrders = otherClosedShift.orders.some((o: any) => 
                (item.orderId && o.id === item.orderId) ||
                (item.id && (String(item.id).startsWith(String(o.id)) || o.id === item.id))
              );
              if (inOtherShiftOrders) {
                return false;
              }
            }
          }

          // İki növbəli gündə vaxt və timestamp üzrə dəqiq bölgü (Zaman damğası sərhədi)
          if (closedShiftsForDate.length >= 2 && closedShiftsForDate[0]?.closedAt) {
            const shift1CloseTime = new Date(closedShiftsForDate[0].closedAt).getTime();
            
            let itemTimeMs = item.timestamp || 0;
            if (!itemTimeMs && item.time && item.date) {
              const d = item.date;
              const t = item.time.length === 5 ? `${item.time}:00` : item.time;
              itemTimeMs = new Date(`${d}T${t}`).getTime();
            }

            if (shift1CloseTime > 0 && itemTimeMs > 0) {
              const isBeforeShift1Closed = itemTimeMs <= shift1CloseTime;
              if (isShift1Selected && !isBeforeShift1Closed) {
                return false;
              }
              if (isShift2Selected && isBeforeShift1Closed) {
                return false;
              }
            } else if (item.time && closedShiftsForDate[0].closedAt) {
              const shift1CloseTimeStr = new Date(closedShiftsForDate[0].closedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const itemTimeStr = item.time.length === 5 ? `${item.time}:00` : item.time;
              const isBefore = itemTimeStr <= shift1CloseTimeStr;
              if (isShift1Selected && !isBefore) return false;
              if (isShift2Selected && isBefore) return false;
            }
          }
        }
      }

      // 3. Tip Filtri (Silindi, Geri alma, Xarab, Hədiyyə)
      if (movementTypeFilter !== 'all' && item.type !== movementTypeFilter) {
        return false;
      }

      // 4. Axtarış Filtri
      if (movementSearch && movementSearch.trim()) {
        const q = movementSearch.toLowerCase();
        const matchName = (item.productName || '').toLowerCase().includes(q);
        const matchTable = (item.tableNumber || '').toLowerCase().includes(q);
        const matchWaiter = (item.waiterName || '').toLowerCase().includes(q);
        const matchReason = (item.reason || '').toLowerCase().includes(q);
        return matchName || matchTable || matchWaiter || matchReason;
      }

      return true;
    });
  }, [
    saleMovements,
    dashboardPeriod,
    dashboardDate,
    normDashKey,
    effectiveDashboardShiftId,
    selectedDashShift,
    isTodaySelected,
    activeShift,
    closedShiftsForDate,
    movementTypeFilter,
    movementSearch
  ]);
  const activeTablesCount = tables.filter(t => t.status === 'occupied').length;
  const activeReservationsCount = reservations.filter(r => r.status !== 'completed').length;
  const lowStockCount = inventory.filter(item => item.quantity <= item.minLevel).length;

  // Fetch filtered statistics based on selected period and date
  const dashboardStats = memoizedDashboardStats;

  const currentTodayDate = activeShift?.businessDate || getActiveShiftBusinessDate() || getTodayStr();

  // Növbə / Tarix filteri ilə dəqiq sinxronlaşdırma köməkçisi
  const matchesDashboardShift = React.useCallback((item: { date?: string; isClosed?: boolean; shiftId?: string; id?: any }) => {
    // 1. Tarix / Dövr yoxlanışı
    if (dashboardPeriod === 'monthly' || dashboardPeriod === 'yearly') {
      return matchesDatePeriod(item.date, dashboardDate || currentTodayDate, dashboardPeriod);
    }

    const itemNormDate = normalizeDateKey(item.date);
    if (normDashKey) {
      if (itemNormDate !== normDashKey && !matchesDatePeriod(item.date, dashboardDate || currentTodayDate, 'daily')) {
        return false;
      }
    } else if (item.date && !matchesDatePeriod(item.date, dashboardDate || currentTodayDate, 'daily')) {
      return false;
    }

    // 2. Növbə (Shift) yoxlanışı
    const isItemActiveShift = !item.isClosed || (activeShift?.id && item.shiftId === activeShift.id);

    // Hal A: Bütün gün (Cəmi) seçilib ('all' və ya 'auto')
    if (effectiveDashboardShiftId === 'all' || effectiveDashboardShiftId === 'auto') {
      if (!isTodaySelected && isItemActiveShift) {
        return false;
      }
      return true;
    }

    // Hal B: Aktiv növbə seçilib
    if (
      effectiveDashboardShiftId === 'active' || 
      (activeShift?.id && effectiveDashboardShiftId === activeShift.id) ||
      selectedDashShift?.isActive
    ) {
      if (!isTodaySelected) return false;
      if (!isItemActiveShift) return false;
      if (closedShiftsForDate.some(cs => cs.shiftId && cs.shiftId === item.shiftId)) {
        return false;
      }
      return true;
    }

    // Hal C: Konkret Bağlanmış Növbə seçilib (məs: Növbə #1 və ya Növbə #2)
    if (!item.isClosed && (!item.shiftId || item.shiftId === activeShift?.id)) {
      return false;
    }

    const isShift1Selected = selectedDashShift?.label === 'Növbə #1' || 
      selectedDashShift?.shiftIndex === 1 || 
      effectiveDashboardShiftId === `${normDashKey}_0` || 
      effectiveDashboardShiftId === 'shift_1' ||
      (closedShiftsForDate[0] && (closedShiftsForDate[0].shiftId === effectiveDashboardShiftId || closedShiftsForDate[0].reportNo === effectiveDashboardShiftId));

    const isShift2Selected = selectedDashShift?.label === 'Növbə #2' || 
      selectedDashShift?.shiftIndex === 2 || 
      effectiveDashboardShiftId === `${normDashKey}_1` || 
      effectiveDashboardShiftId === 'shift_2' ||
      (closedShiftsForDate[1] && (closedShiftsForDate[1].shiftId === effectiveDashboardShiftId || closedShiftsForDate[1].reportNo === effectiveDashboardShiftId));

    const targetClosedShift = isShift1Selected 
      ? closedShiftsForDate[0] 
      : (isShift2Selected ? closedShiftsForDate[1] : closedShiftsForDate.find(cs => cs.shiftId === effectiveDashboardShiftId || cs.reportNo === effectiveDashboardShiftId));

    const otherClosedShift = isShift1Selected 
      ? closedShiftsForDate[1] 
      : (isShift2Selected ? closedShiftsForDate[0] : null);

    if (targetClosedShift && item.shiftId) {
      if (targetClosedShift.shiftId && item.shiftId === targetClosedShift.shiftId) {
        return true;
      }
      if (targetClosedShift.reportNo && item.shiftId === targetClosedShift.reportNo) {
        return true;
      }
      if (otherClosedShift && (item.shiftId === otherClosedShift.shiftId || item.shiftId === otherClosedShift.reportNo)) {
        return false;
      }
      if (activeShift?.id && item.shiftId === activeShift.id) {
        return false;
      }
    }

    if (targetClosedShift?.expenses && Array.isArray(targetClosedShift.expenses)) {
      if (targetClosedShift.expenses.some((e: any) => e.id === item.id)) return true;
    }
    if (targetClosedShift?.defects && Array.isArray(targetClosedShift.defects)) {
      if (targetClosedShift.defects.some((d: any) => d.id === item.id)) return true;
    }

    if (targetClosedShift?.shiftId && item.shiftId === targetClosedShift.shiftId) {
      return true;
    }

    return false;
  }, [
    dashboardPeriod,
    dashboardDate,
    currentTodayDate,
    normDashKey,
    effectiveDashboardShiftId,
    selectedDashShift,
    isTodaySelected,
    activeShift,
    closedShiftsForDate
  ]);

  // 8-ci qutucuq üçün: Xərclər və əməliyyatlar çıxarları (seçilmiş növbə üzrə)
  const currentDateExpensesTotal = React.useMemo(() => {
    return Math.round((expenses || [])
      .filter(ex => matchesDashboardShift(ex))
      .reduce((sum, ex) => sum + Number(ex.amount || 0), 0) * 100) / 100;
  }, [expenses, matchesDashboardShift]);

  // 2-ci qutucuq üçün: Zərər (Seçilmiş növbə üzrə xarab və hədiyyə edilən məhsulların məbləği)
  const calculatedLoss = React.useMemo(() => {
    // 1. Xarab olan məhsulların dəyəri
    const defectLossFromRecords = (defectRecords || [])
      .filter(r => r.type === 'defective' && matchesDashboardShift(r))
      .reduce((sum, r) => sum + ((Number(r.price) || 0) * (Number(r.quantity) || 1)), 0);

    const defectLossFromExpenses = (expenses || [])
      .filter(ex => {
        if (!matchesDashboardShift(ex)) return false;
        const cat = (ex.category || '').toLowerCase();
        const title = (ex.title || '').toLowerCase();
        return (cat === 'xarab' || title.includes('xarab')) &&
          !(defectRecords || []).some(r => r.type === 'defective' && matchesDashboardShift(r) && (
            (ex.notes && r.dishName && ex.notes.includes(r.dishName)) ||
            (ex.title && r.dishName && ex.title.includes(r.dishName))
          ));
      })
      .reduce((sum, ex) => sum + Number(ex.amount || 0), 0);

    const totalDefectLoss = defectLossFromRecords + defectLossFromExpenses;

    // 2. Hədiyyə edilən məhsulların dəyəri:
    // Səbətdə fərdi və ya bütöv masa hədiyyə olunduqda dəyəri Xərclər (məxaric) kartında hesablandığı kimi
    // Zərər (zərər) kartında da yüksək dəqiqliklə hesablanır.
    const isGiftExp = (ex: any) => {
      const cat = (ex.category || '').toLowerCase();
      const title = (ex.title || '').toLowerCase();
      const notes = (ex.notes || '').toLowerCase();
      return cat.includes('hədiyyə') || cat.includes('hediyye') || cat.includes('gift') || cat.includes('ikram') ||
             title.includes('hədiyyə') || title.includes('hediyye') || title.includes('gift') || title.includes('ikram') ||
             notes.includes('hədiyyə') || notes.includes('hediyye') || notes.includes('gift') || notes.includes('ikram');
    };

    const giftLossFromExpenses = (expenses || [])
      .filter(ex => matchesDashboardShift(ex) && isGiftExp(ex))
      .reduce((sum, ex) => sum + Number(ex.amount || 0), 0);

    // Əgər sifarişdə hədiyyə olubsa, lakin xərclərdə hələ qeyd olunmayıbsa (fallback):
    const unrecordedGiftFromOrders = (dashboardStats?.filteredOrders || []).reduce((sum: number, tx: any) => {
      const hasMatchingExpense = (expenses || []).some(ex => 
        matchesDashboardShift(ex) && isGiftExp(ex) && (
          (ex.notes && (ex.notes.includes(tx.tableName) || ex.notes.includes(`Masa: ${tx.tableName}`))) ||
          (ex.title && ex.title.includes(tx.tableName))
        )
      );
      if (hasMatchingExpense) return sum;

      if (tx.paymentMethod === 'gift') {
        if (tx.amount && Number(tx.amount) > 0) {
          return sum + Number(tx.amount);
        }
        const itemsSum = (tx.items || []).reduce((iSum: number, item: any) => {
          const price = Number(item.price) || menuItems.find(m => m.name === item.name)?.price || 0;
          return iSum + (price * (Number(item.quantity) || 1));
        }, 0);
        return sum + itemsSum;
      }
      if (tx.items && Array.isArray(tx.items)) {
        const indGiftSum = tx.items
          .filter((item: any) => item.isGift)
          .reduce((iSum: number, item: any) => {
            const price = Number(item.price) || menuItems.find(m => m.name === item.name)?.price || 0;
            return iSum + (price * (Number(item.quantity) || 1));
          }, 0);
        return sum + indGiftSum;
      }
      return sum;
    }, 0);

    // 3. Hədiyyə edilən məhsulların dəyəri (qüsurlu/hədiyyə qeydlərindən)
    const giftLossFromDefectRecords = (defectRecords || [])
      .filter(r => ((r as any).type === 'gift' || (r as any).type === 'hədiyyə') && matchesDashboardShift(r))
      .reduce((sum, r) => sum + ((Number(r.price) || 0) * (Number(r.quantity) || 1)), 0);

    const totalGiftLoss = giftLossFromExpenses + unrecordedGiftFromOrders + giftLossFromDefectRecords;

    return Math.round((totalDefectLoss + totalGiftLoss) * 100) / 100;
  }, [defectRecords, matchesDashboardShift, expenses, dashboardStats?.filteredOrders, menuItems]);

  const soldSourceStats = dashboardStats || dailySoldStats;
  const rawSoldProductsList = soldSourceStats?.soldProductsList || [];
  const filteredSoldProductsList = (!dashboardSoldTableFilter || dashboardSoldTableFilter === 'all')
    ? rawSoldProductsList
    : rawSoldProductsList.filter((item: any) => {
        const t = (item.tableName || '').trim().toLowerCase();
        const f = (dashboardSoldTableFilter || '').trim().toLowerCase();
        const normT = t.startsWith('masa') ? t : `masa ${t}`;
        const normF = f.startsWith('masa') ? f : `masa ${f}`;
        return normT === normF;
      });

  const [soldProductsPage, setSoldProductsPage] = useState(1);
  const SOLD_PER_PAGE = 25;
  const totalSoldPages = Math.max(1, Math.ceil(filteredSoldProductsList.length / SOLD_PER_PAGE));
  const pagedSoldProductsList = filteredSoldProductsList.slice(
    (soldProductsPage - 1) * SOLD_PER_PAGE,
    soldProductsPage * SOLD_PER_PAGE
  );

  const [movementsPage, setMovementsPage] = useState(1);
  const MOVEMENTS_PER_PAGE = 25;
  const totalMovementsPages = Math.max(1, Math.ceil(filteredMovements.length / MOVEMENTS_PER_PAGE));
  const safeMovementsPage = Math.min(movementsPage, totalMovementsPages);
  const pagedMovements = filteredMovements.slice(
    (safeMovementsPage - 1) * MOVEMENTS_PER_PAGE,
    safeMovementsPage * MOVEMENTS_PER_PAGE
  );

  useEffect(() => {
    setMovementsPage(1);
  }, [effectiveDashboardShiftId, dashboardDate, dashboardPeriod, movementTypeFilter, movementSearch]);

  const getPeriodLabel = () => {
    const p = parseDateToYMD(dashboardDate);
    if (!p) return dashboardDate;
    const year = parseInt(p.year, 10);
    const monthNum = parseInt(p.month, 10);
    const day = parseInt(p.day, 10);

    const AZ_MONTHS = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    const mName = AZ_MONTHS[monthNum - 1] || p.month;

    if (dashboardPeriod === 'daily' || dashboardPeriod === 'custom') {
      return `${day} ${mName} ${year}`;
    } else if (dashboardPeriod === 'monthly') {
      return `${mName} ${year}`;
    } else if (dashboardPeriod === 'yearly') {
      if (appLanguage === 'AZ') return `${year}-ci İl`;
      if (appLanguage === 'TR') return `${year} Yılı`;
      if (appLanguage === 'RU') return `${year} год`;
      return `Year ${year}`;
    }
    return dashboardDate;
  };

        return (
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
              
              {/* Period selection deck */}
              <div className="bg-white px-5 py-4 rounded-[24px] border border-slate-100 shadow-xs flex items-center justify-between gap-3 overflow-visible relative z-20">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="shrink-0 flex flex-col justify-center leading-tight">
                    <span className="text-xs sm:text-sm font-black text-slate-800 tracking-wider whitespace-nowrap">
                      SİSTEM PANELİ &
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 tracking-wider whitespace-nowrap">
                      İDARƏETMƏ GÖSTƏRİCİLƏRİ
                    </span>
                    <p className="text-xs text-slate-400 mt-1 whitespace-nowrap flex items-center gap-1">
                      <span>{tText("Seçilmiş dövrün aktiv hesabatı:")}</span>
                      <span className="text-orange-500 font-extrabold whitespace-nowrap">{getPeriodLabel()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      const effectiveTarget = dashboardDate || activeShift?.businessDate || getActiveShiftBusinessDate();
                      setZReportDate(effectiveTarget);
                      setShowZReportModal(true);
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black rounded-xl shadow-md shadow-orange-200 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{tText("Z-Hesabat")}</span>
                  </button>

                  <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
                    {(['daily', 'monthly', 'yearly'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setDashboardPeriod(p);
                          if (p === 'daily') {
                            setDashboardDate(activeShift?.businessDate || getActiveShiftBusinessDate());
                            if (setDashboardShiftId) setDashboardShiftId('auto');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                          dashboardPeriod === p
                            ? 'bg-white text-slate-800 shadow-xs'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {p === 'daily' ? tText('Gün') : p === 'monthly' ? tText('Ay') : tText('İl')}
                      </button>
                    ))}
                  </div>

                  <div className="shrink-0">
                    <AzDatePicker 
                      value={dashboardDate}
                      onChange={(val) => {
                        if (val) {
                          setDashboardDate(val);
                          setDashboardPeriod('custom');
                          if (setDashboardShiftId) setDashboardShiftId('auto');
                        }
                      }}
                      placeholder="Tarix seçin"
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 text-xs font-bold text-slate-700 select-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      activeShiftBusinessDate={activeShift?.businessDate}
                    />
                  </div>

                  {/* Shift Selector Dropdown */}
                  {((dashboardPeriod === 'daily' || dashboardPeriod === 'custom') && availableDashboardShifts.length > 0) && (
                    <div className="relative shrink-0 z-30" ref={shiftDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsShiftDropdownOpen(prev => !prev)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer select-none shadow-xs ${
                          isShiftDropdownOpen
                            ? 'bg-orange-50 border-orange-300 text-orange-700 ring-2 ring-orange-200'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{tText("Növbələr:")}</span>
                        <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                          {selectedDashLabel}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isShiftDropdownOpen ? 'rotate-180 text-orange-600' : ''}`} />
                      </button>

                      {isShiftDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-50 flex flex-col gap-1 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                          <div className="px-2.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-0.5">
                            {tText("NÖVBƏ SEÇİMİ")}
                          </div>
                          {availableDashboardShifts.map((s, idx) => {
                            const isSelected = effectiveDashboardShiftId === s.id;
                            return (
                              <button
                                key={`${s.id}_${idx}`}
                                type="button"
                                disabled={s.disabled}
                                onClick={() => {
                                  if (s.disabled) return;
                                  setDashboardShiftId && setDashboardShiftId(s.id);
                                  setIsShiftDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                                  isSelected
                                    ? 'bg-orange-500 text-white shadow-xs font-black'
                                    : s.disabled
                                      ? 'text-slate-300 bg-slate-50/50 cursor-not-allowed font-medium'
                                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer font-bold'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs">{s.label}</span>
                                  {s.subLabel && (
                                    <span className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-slate-400 font-semibold'}`}>
                                      {s.subLabel}
                                    </span>
                                  )}
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Sale Card */}
                <div 
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:border-blue-100"
                  onClick={() => setActiveTab('staff')}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">{tText("MƏDAXİL")}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">{tText("Satış Dövriyyəsi")}</p>
                    <h3 className="text-lg font-black text-slate-850 truncate">{dashboardStats.totalSales.toFixed(2)} {currencyText}</h3>
                  </div>
                </div>

                {/* Loss (Zərər) Card - 2-ci qutucuq */}
                <div 
                  id="dashboard-loss-box"
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:border-rose-100"
                  onClick={() => setActiveTab('expenses')}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">{tText("ZƏRƏR")}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">{tText("Zərər")}</p>
                    <h3 className="text-lg font-black text-rose-600 truncate">{calculatedLoss.toFixed(2)} {currencyText}</h3>
                  </div>
                </div>

                {/* Net Profit (Xalis Mənfəət) Card */}
                <div 
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:border-emerald-100"
                  onClick={() => setActiveTab('expenses')}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${dashboardStats.netCash >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {dashboardStats.netCash >= 0 ? tText('MƏNFƏƏT') : tText('ZƏRƏR')}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">{tText("Xalis Mənfəət")}</p>
                    <h3 className={`text-lg font-black truncate ${dashboardStats.netCash >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {dashboardStats.netCash.toFixed(2)} {currencyText}
                    </h3>
                  </div>
                </div>

                {/* Cash in Drawer / Kassadakı Nağd Pul Card */}
                <div 
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:border-teal-100"
                  onClick={() => setActiveTab('expenses')}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black text-teal-600 bg-teal-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">{tText("KASSA")}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">{tText("Kassadakı Nağd Pul")}</p>
                    <h3 className="text-lg font-black text-teal-700 truncate">
                      {(dashboardStats.totalCashSales ?? 0).toFixed(2)} {currencyText}
                    </h3>
                  </div>
                </div>

                {/* New Inventory Inward cost value card */}
                <div 
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:border-amber-100"
                  onClick={() => setActiveTab('inventory')}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">{tText("MƏHSUL")}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">{tText("Anbar Mədaxili")}</p>
                    <h3 className="text-lg font-black text-slate-850 truncate">{dashboardStats.totalInventoryImportSum.toFixed(2)} {currencyText}</h3>
                  </div>
                </div>

                {/* Active Tables Card */}
                <div 
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:border-orange-100"
                  onClick={() => setActiveTab('tables')}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black text-orange-600 bg-orange-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">{tText("AKTİV")}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">{tText("Masalar")}</p>
                    <h3 className="text-lg font-black text-slate-850 truncate">{tText(`${activeTablesCount} Masa`)}</h3>
                  </div>
                </div>

                {/* Reservations Card */}
                <div 
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:border-purple-100"
                  onClick={() => setActiveTab('reservations')}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black text-purple-600 bg-purple-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">{tText("GÖRÜŞLƏR")}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">{tText("Rezervlər")}</p>
                    <h3 className="text-lg font-black text-slate-850 truncate">{tText(`${activeReservationsCount} Rezerv`)}</h3>
                  </div>
                </div>

                {/* Current Day Expenses Card - 8-ci qutucuq */}
                <div 
                  id="dashboard-expenses-box"
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:border-red-100"
                  onClick={() => {
                    if (setExpenseDate && setExpensePeriod) {
                      setExpenseDate(currentTodayDate);
                      setExpensePeriod('daily');
                    }
                    setActiveTab('expenses');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black text-red-600 bg-red-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider">{tText("MƏXARİC")}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">{tText("Xərclər")}</p>
                    <h3 className="text-lg font-black text-red-600 truncate">{currentDateExpensesTotal.toFixed(2)} {currencyText}</h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Popular Dishes Block */}
                <Card className="h-[420px] flex flex-col">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="font-bold text-slate-800">{tText("Məşhur Yeməklər")}</h3>
                    <button onClick={() => setActiveTab('menu')} className="text-orange-600 text-xs font-black uppercase tracking-widest hover:text-orange-700 transition-colors">
                      {tText("Hamısı")} &rarr;
                    </button>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                    {menuItems.slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-2xl hover:border-orange-150 hover:bg-orange-50/5 transition-all">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-xs">
                            <Utensils className="w-5 h-5 px-[1px]" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-sm leading-tight">{item.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</p>
                          </div>
                        </div>
                        <p className="font-black text-slate-700 text-sm whitespace-nowrap">{item.price.toFixed(2)} ₼</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent Reservations Block */}
                <Card className="h-[420px] flex flex-col">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="font-bold text-slate-800">{tText("Son Rezervasiyalar")}</h3>
                    <button onClick={() => setActiveTab('reservations')} className="text-orange-600 text-xs font-black uppercase tracking-widest hover:text-orange-700 transition-colors">
                      {tText("Hamısı")} &rarr;
                    </button>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                    {reservations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <CalendarDays className="w-8 h-8 text-slate-300" />
                        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{tText("Aktiv rezervasiya yoxdur")}</p>
                      </div>
                    ) : (
                      [...reservations].reverse().slice(0, 5).map(res => {
                        const tbl = tables.find(t => t.id === res.tableId);
                        
                        let statusColor = "bg-yellow-50 text-yellow-600 border-yellow-105";
                        let statusText = tText("Gözləyir");
                        if (res.status === 'confirmed') {
                          statusColor = "bg-green-50 text-green-600 border-green-105";
                          statusText = tText("Təsdiqli");
                        } else if (res.status === 'arrived') {
                          statusColor = "bg-blue-50 text-blue-600 border-blue-105";
                          statusText = tText("Gəlib");
                        } else if (res.status === 'completed') {
                          statusColor = "bg-slate-100 text-slate-500 border-slate-205";
                          statusText = tText("Bitib");
                        }

                        return (
                          <div key={res.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-2xl hover:border-orange-150 hover:bg-orange-50/5 transition-all">
                            <div className="flex items-center min-w-0">
                              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-xs shrink-0">
                                <Users className="w-5 h-5 px-[1px]" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-800 text-sm truncate">{res.customerName}</p>
                                <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">
                                  {tbl ? tText(tbl.number) : tText(`Masa ${res.tableId}`)} • {res.time} • {tText(`${res.guests} nəfər`)}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[8px] uppercase font-black px-2 py-0.5 border rounded-md whitespace-nowrap ml-2 shrink-0 ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                {/* Dynamic Inventory Transactions Block */}
                <Card className="h-[420px] flex flex-col border border-amber-100 shadow-sm shadow-amber-50">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-1.5 justify-start">
                        <Package className="w-4 h-4 text-amber-500" />
                        {tText("Anbar Mədaxili Siyahısı")}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{tText("Seçilmiş dövrdə daxil olan mallar.")}</p>
                    </div>
                    <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                      {tText("Cəmi")}: {dashboardStats.totalInventoryImportSum.toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                    {dashboardStats.filteredInventory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-10">
                        <Package className="w-8 h-8 text-amber-300 animate-pulse" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{tText("Mədaxil qeydə alınmayıb")}</p>
                      </div>
                    ) : (
                      dashboardStats.filteredInventory.map(tx => (
                        <div key={tx.id} className="p-3 bg-amber-50/10 hover:bg-amber-50/35 border border-amber-100/50 rounded-2xl transition-all">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 text-sm truncate">{tText(tx.itemName)}</p>
                              <p className="text-[10px] font-black text-slate-400 whitespace-nowrap">
                                {tx.quantity} {tText("kq/ədəd")} • {tx.costPrice.toFixed(2)} {currencySymbol}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-amber-600 text-sm">+{tx.totalCost.toFixed(2)} {currencySymbol}</p>
                              <p className="text-[9px] text-slate-400 font-bold">{tx.date}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Sold Products Table Block */}
              <Card className="p-6 border border-slate-100 shadow-sm rounded-3xl bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-orange-500" />
                      {tText("Gündəlik Satılan Məhsullar Siyahısı")}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      {tText("Seçilmiş dövrdə masalardan satılmış yemək və içkilərin təfərrüatlı statistikası.")} ({(() => {
                        const shiftSuffix = (availableDashboardShifts.length > 0 && selectedDashShift) ? ` • ${selectedDashShift.label}` : '';
                        return `${getPeriodLabel()}${shiftSuffix}`;
                      })()})
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Növbə filtri (əgər həmin gün üçün növbə seçimi varsa) */}
                    {availableDashboardShifts.length > 0 && (
                      <div className="flex items-center gap-1">
                        <select
                          value={effectiveDashboardShiftId}
                          onChange={(e) => setDashboardShiftId && setDashboardShiftId(e.target.value)}
                          className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl text-xs font-black text-orange-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          {availableDashboardShifts.map((s, idx) => (
                            <option key={`${s.id}_${idx}`} value={s.id} disabled={s.disabled}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Masa filtri */}
                    <div className="flex items-center gap-1">
                      <select
                        value={dashboardSoldTableFilter}
                        onChange={(e) => setDashboardSoldTableFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="all">{tText("Bütün Masalar")}</option>
                        {(Array.from(new Set(tables.map(t => String(t.number || '')))) as string[]).map(numStr => {
                          const isMasa = (numStr || '').toLowerCase().startsWith('masa');
                          return (
                            <option key={numStr} value={isMasa ? numStr : `Masa ${numStr}`}>
                              {isMasa ? numStr : `Masa ${numStr}`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Çap et düyməsi */}
                    <button
                      type="button"
                      onClick={() => {
                        const filteredList = filteredSoldProductsList;
                        const p = parseDateToYMD(dashboardDate) || parseDateToYMD(new Date());
                        const year = p ? parseInt(p.year, 10) : new Date().getFullYear();
                        const monthNum = p ? parseInt(p.month, 10) : new Date().getMonth() + 1;
                        const day = p ? parseInt(p.day, 10) : new Date().getDate();

                        const formattedDayDate = `${String(day).padStart(2, '0')}.${String(monthNum).padStart(2, '0')}.${year}`;

                        const AZ_MONTHS = [
                          'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
                          'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
                        ];
                        const mName = AZ_MONTHS[monthNum - 1] || String(monthNum).padStart(2, '0');

                        let printDateLabel = formattedDayDate;
                        if (dashboardPeriod === 'monthly') {
                          printDateLabel = `${mName} ${year}`;
                        } else if (dashboardPeriod === 'yearly') {
                          printDateLabel = `${year}-ci İl`;
                        } else if (dashboardPeriod === 'custom') {
                          printDateLabel = formattedDayDate;
                        }

                        const isMonthlyOrYearly = dashboardPeriod === 'monthly' || dashboardPeriod === 'yearly';
                        const shiftPrintLabel = (!isMonthlyOrYearly && availableDashboardShifts.length > 0 && selectedDashShift) ? ` • Növbə: ${selectedDashShift.label}` : '';

                        let headerSubtitle = '';
                        if (isMonthlyOrYearly) {
                          headerSubtitle = `Tarix: ${printDateLabel}`;
                        } else {
                          const tablePart = (dashboardSoldTableFilter && dashboardSoldTableFilter !== 'all')
                            ? `Masa: ${dashboardSoldTableFilter} • `
                            : 'Masa: Bütün Masalar • ';
                          headerSubtitle = `${tablePart}Tarix: ${printDateLabel}${shiftPrintLabel}`;
                        }

                        // Qruplaşdırma: Eyni məhsul adı siyahıda 1 dəfə olsun, sayları və məbləğləri kosmik həssaslıqla hesablansın
                        const groupedMap = new Map<string, {
                          name: string;
                          unitPrice: number;
                          totalQty: number;
                          totalRevenue: number;
                          tableNames: Set<string>;
                          paymentMethods: Set<string>;
                        }>();

                        for (const item of filteredList) {
                          const rawName = (item.name || '').trim();
                          if (!rawName) continue;
                          const key = rawName.toLowerCase();

                          const qty = Number(item.totalQty) || 0;
                          const rev = Number(item.totalRevenue) || 0;
                          const uPrice = Number(item.unitPrice) || (qty > 0 ? rev / qty : 0);

                          if (!groupedMap.has(key)) {
                            groupedMap.set(key, {
                              name: rawName,
                              unitPrice: uPrice,
                              totalQty: qty,
                              totalRevenue: rev,
                              tableNames: new Set(item.tableName ? [item.tableName] : []),
                              paymentMethods: new Set(item.paymentMethod ? [item.paymentMethod] : [])
                            });
                          } else {
                            const existing = groupedMap.get(key)!;
                            existing.totalQty += qty;
                            existing.totalRevenue += rev;
                            if (!existing.unitPrice && uPrice) {
                              existing.unitPrice = uPrice;
                            }
                            if (item.tableName) existing.tableNames.add(item.tableName);
                            if (item.paymentMethod) existing.paymentMethods.add(item.paymentMethod);
                          }
                        }

                        const printGroupedList = Array.from(groupedMap.values()).sort((a, b) => b.totalQty - a.totalQty);
                        const totalSum = printGroupedList.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);

                        const printWin = window.open('', '_blank');
                        if (!printWin) return;
                        printWin.document.write(`
                          <html>
                            <head>
                              <title>Gündəlik Satılan Məhsullar Siyahısı</title>
                              <style>
                                body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; }
                                h2 { text-align: center; margin-bottom: 4px; font-size: 20px; font-weight: 800; }
                                p { text-align: center; color: #64748b; font-size: 12px; margin-top: 0; font-weight: 700; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                                th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
                                th { background-color: #f8fafc; font-weight: 800; text-transform: uppercase; font-size: 10px; color: #475569; }
                                .text-right { text-align: right; }
                                .text-center { text-align: center; }
                                .total { margin-top: 20px; text-align: right; font-size: 15px; font-weight: 800; color: #ea580c; }
                              </style>
                            </head>
                            <body>
                              <h2>Gündəlik Satılan Məhsullar Siyahısı</h2>
                              <p>${headerSubtitle}</p>
                              <table>
                                <thead>
                                  <tr>
                                    <th class="text-center">#</th>
                                    <th>Məhsul / Yemək Adı</th>
                                    <th class="text-right">Qiyməti</th>
                                    <th class="text-center">Satış Miqdarı</th>
                                    <th class="text-right">Cəmi Məbləğ</th>
                                    <th class="text-center">Masa Nömrəsi</th>
                                    <th class="text-center">Tarix</th>
                                    <th class="text-center">Ödəniş Üsulu</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${printGroupedList.map((item, idx) => {
                                    const priceDisplay = item.unitPrice
                                      ? item.unitPrice.toFixed(2)
                                      : (item.totalQty > 0 ? (item.totalRevenue / item.totalQty).toFixed(2) : '0.00');

                                    const tableDisplay = isMonthlyOrYearly
                                      ? ''
                                      : (dashboardSoldTableFilter && dashboardSoldTableFilter !== 'all'
                                          ? dashboardSoldTableFilter
                                          : (item.tableNames.size > 0 ? Array.from(item.tableNames).join(', ') : ''));

                                    let dateDisplay = formattedDayDate;
                                    if (dashboardPeriod === 'monthly') {
                                      dateDisplay = `${mName} ${year}`;
                                    } else if (dashboardPeriod === 'yearly') {
                                      dateDisplay = `${year}`;
                                    }

                                    const paymentDisplay = item.paymentMethods.size === 0
                                      ? 'Nəğd'
                                      : Array.from(item.paymentMethods).map(m =>
                                          m === 'card' ? 'Kartla' : m === 'mixed' ? 'Qarışıq' : m === 'gift' ? 'Hədiyyə' : m === 'debt' ? 'Nisyə' : 'Nəğd'
                                        ).join(', ');

                                    return `
                                      <tr>
                                        <td class="text-center">${idx + 1}</td>
                                        <td><b>${item.name}</b></td>
                                        <td class="text-right">${priceDisplay} ₼</td>
                                        <td class="text-center">${item.totalQty} ədəd</td>
                                        <td class="text-right">${item.totalRevenue.toFixed(2)} ₼</td>
                                        <td class="text-center">${tableDisplay}</td>
                                        <td class="text-center">${dateDisplay}</td>
                                        <td class="text-center"><b>${paymentDisplay}</b></td>
                                      </tr>
                                    `;
                                  }).join('')}
                                </tbody>
                              </table>
                              <div class="total">Cəmi: ${totalSum.toFixed(2)} ₼</div>
                              <script>
                                window.onload = function() {
                                  window.focus();
                                  setTimeout(function() {
                                    window.print();
                                  }, 250);
                                };
                                window.addEventListener('afterprint', function() {
                                  setTimeout(function() {
                                    window.close();
                                  }, 300);
                                });
                              </script>
                            </body>
                          </html>
                        `);
                        printWin.document.close();
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>{tText("Çap et")}</span>
                    </button>

                    {/* Cəmi etiketi */}
                    <span className="text-xs font-black bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl border border-orange-100">
                      {tText("Cəmi")}: {filteredSoldProductsList.reduce((sum, item) => sum + (item.totalRevenue || 0), 0).toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                </div>

                {filteredSoldProductsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Utensils className="w-10 h-10 text-slate-300" />
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {tText("Seçilmiş dövrdə satılmış məhsul qeydə alınmayıb")}
                    </p>
                  </div>
                ) : (
                  <div className={`overflow-x-auto ${filteredSoldProductsList.length > 5 ? 'max-h-[300px] overflow-y-auto' : ''}`}>
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50">
                          <th className="py-3 px-4 rounded-l-xl">#</th>
                          <th className="py-3 px-4">{tText("Məhsul / Yemək Adı")}</th>
                          <th className="py-3 px-4 text-right">{tText("Qiyməti")}</th>
                          <th className="py-3 px-4 text-center">{tText("Satış Miqdarı")}</th>
                          <th className="py-3 px-4 text-right">{tText("Cəmi Məbləğ")}</th>
                          <th className="py-3 px-4 text-center">{tText("Masa Nömrəsi")}</th>
                          <th className="py-3 px-4 text-center">{tText("Tarix və Saat")}</th>
                          <th className="py-3 px-4 text-center rounded-r-xl">{tText("Ödəniş Üsulu")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {pagedSoldProductsList.map((item, idx) => (
                          <tr key={`sold_prod_${item.id || item.name || idx}_${idx}`} className="hover:bg-orange-50/30 transition-colors">
                            <td className="py-3 px-4 text-slate-400 text-[11px] font-black">
                              {(soldProductsPage - 1) * SOLD_PER_PAGE + idx + 1}
                            </td>
                            <td className="py-3 px-4 text-slate-800 font-extrabold">{tText(item.name)}</td>
                            <td className="py-3 px-4 text-right text-slate-700 font-bold">{item.unitPrice.toFixed(2)} {currencySymbol}</td>
                            <td className="py-3 px-4 text-center font-black text-slate-900">
                              <span className="bg-orange-100/80 text-orange-700 px-2.5 py-0.5 rounded-md">
                                {item.totalQty} {tText("ədəd")}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-orange-600">{item.totalRevenue.toFixed(2)} {currencySymbol}</td>
                            <td className="py-3 px-4 text-center font-extrabold text-slate-700">
                              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[11px]">
                                {item.tableName}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-slate-800 font-extrabold text-[11px]">{item.date}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{item.time}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getPaymentMethodBadge(item.paymentMethod)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls for Sold Products */}
                {filteredSoldProductsList.length > SOLD_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 font-bold">
                      Cəmi {filteredSoldProductsList.length} qeyd • Səhifə {soldProductsPage} / {totalSoldPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={soldProductsPage <= 1}
                        onClick={() => setSoldProductsPage(p => Math.max(1, p - 1))}
                        className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all ${
                          soldProductsPage <= 1
                            ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95 cursor-pointer'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Əvvəlki</span>
                      </button>
                      <button
                        type="button"
                        disabled={soldProductsPage >= totalSoldPages}
                        onClick={() => setSoldProductsPage(p => Math.min(totalSoldPages, p + 1))}
                        className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all ${
                          soldProductsPage >= totalSoldPages
                            ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95 cursor-pointer'
                        }`}
                      >
                        <span>Növbəti</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Product-Specific Sales Filter Combobox Block */}
              {(() => {
                const availableSoldProductNames = (Array.from(
                  new Set(filteredSoldProductsList.map(item => item.name).filter(Boolean))
                ) as string[]).sort((a, b) => a.localeCompare(b, 'az'));

                const matchingItems = dashboardSelectedProductFilter 
                  ? filteredSoldProductsList.filter(item => item.name === dashboardSelectedProductFilter)
                  : [];

                const totalProductQty = matchingItems.reduce((sum, item) => sum + (Number(item.totalQty) || 0), 0);
                const totalProductRevenue = Math.round(matchingItems.reduce((sum, item) => sum + (Number(item.totalRevenue) || 0), 0) * 100) / 100;
                const distinctPrices = (Array.from(new Set(matchingItems.map(i => Number(i.unitPrice) || 0).filter(p => p > 0))) as number[]);
                const minPrice = distinctPrices.length > 0 ? Math.min(...distinctPrices) : (matchingItems[0]?.unitPrice || 0);
                const maxPrice = distinctPrices.length > 0 ? Math.max(...distinctPrices) : (matchingItems[0]?.unitPrice || 0);
                const weightedAvgPrice = totalProductQty > 0 ? Math.round((totalProductRevenue / totalProductQty) * 100) / 100 : 0;
                const unitPrice = matchingItems[0]?.unitPrice || 0;
                const category = matchingItems[0]?.category || '';
                const uniqueTables = Array.from(new Set(matchingItems.map(i => i.tableName)));

                return (
                  <Card className="p-6 border border-slate-100 shadow-sm rounded-3xl bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-orange-500" />
                          {tText("Məhsul Üzrə Təfərrüatlı Satış və Total Dəyər Analizi")}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-1">
                          {tText("Gündəlik satılan məhsullar siyahısından məhsul seçərək ümumi sayını və total məbləğini dərhal hesablayın.")} ({getPeriodLabel()})
                        </p>
                      </div>

                      {/* Combobox Select Dropdown */}
                      <div className="flex items-center gap-2 min-w-[280px]">
                        <div className="relative w-full">
                          <select
                            value={dashboardSelectedProductFilter}
                            onChange={(e) => setDashboardSelectedProductFilter(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 hover:border-orange-300 focus:border-orange-500 rounded-2xl text-xs font-black text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                          >
                            <option value="">{tText("-- Məhsul seçin (Siyahıdan) --")}</option>
                            {availableSoldProductNames.map((pName) => (
                              <option key={pName} value={pName}>
                                {pName}
                              </option>
                            ))}
                          </select>
                          {dashboardSelectedProductFilter && (
                            <button
                              type="button"
                              onClick={() => setDashboardSelectedProductFilter('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Seçimi sıfırla"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Display stats only when a product is selected in the combobox */}
                    {dashboardSelectedProductFilter && matchingItems.length > 0 ? (
                      <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Product Name Card */}
                          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{tText("Seçilmiş Məhsul")}</span>
                              {category && (
                                <span className="text-[9px] font-extrabold text-orange-600 bg-orange-100/60 px-2 py-0.5 rounded-md uppercase">
                                  {category}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm sm:text-base font-black text-slate-800 mt-2 truncate">
                              {dashboardSelectedProductFilter}
                            </h4>
                            {distinctPrices.length <= 1 ? (
                              <p className="text-[11px] font-extrabold text-slate-500 mt-0.5">
                                Vahid Qiymət: {(distinctPrices[0] ?? unitPrice).toFixed(2)} {currencySymbol}
                              </p>
                            ) : (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-[11px] font-extrabold text-slate-700">
                                  Aralıq: {minPrice.toFixed(2)} - {maxPrice.toFixed(2)} {currencySymbol}
                                </p>
                                <p className="text-[10px] font-extrabold text-orange-600">
                                  Orta Çəkili: {weightedAvgPrice.toFixed(2)} {currencySymbol}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Total Sold Quantity */}
                          <div className="bg-orange-50/60 border border-orange-100 p-4 rounded-2xl">
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider block leading-none">
                              {tText("Cəmi Satış Sayı")}
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-2">
                              <span className="text-2xl font-black text-orange-600">
                                {totalProductQty}
                              </span>
                              <span className="text-xs font-black text-orange-700">
                                {tText("ədəd")}
                              </span>
                            </div>
                            <p className="text-[10px] font-extrabold text-orange-600/70 mt-1">
                              {matchingItems.length} dəfə qeydə alınıb
                            </p>
                          </div>

                          {/* Total Amount / Revenue */}
                          <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block leading-none">
                              {tText("Cəmi Total Məbləğ")}
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-2">
                              <span className="text-2xl font-black text-emerald-600">
                                {totalProductRevenue.toFixed(2)}
                              </span>
                              <span className="text-xs font-black text-emerald-700">
                                {currencySymbol}
                              </span>
                            </div>
                            <p className="text-[10px] font-extrabold text-emerald-600/70 mt-1">
                              Ümumi dövriyyə dəyəri
                            </p>
                          </div>

                          {/* Orders & Tables Summary */}
                          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block leading-none">
                              {tText("Sifariş Verilən Masalar")}
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-2">
                              <span className="text-2xl font-black text-blue-600">
                                {uniqueTables.length}
                              </span>
                              <span className="text-xs font-black text-blue-700">
                                {tText("fərqli masa")}
                              </span>
                            </div>
                            <p className="text-[10px] font-extrabold text-blue-600/70 mt-1 truncate">
                              {uniqueTables.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400">
                        <Info className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold">
                          {availableSoldProductNames.length > 0 
                            ? tText("Məhsulun ümumi satış sayını və total məbləğini görmək üçün yuxarıdakı seçim sahəsindən məhsul seçin.") 
                            : tText("Seçilmiş dövr üçün satılmış məhsul siyahısı boşdur.")}
                        </span>
                      </div>
                    )}
                  </Card>
                );
              })()}

              {/* Daily Expenses Block on Dashboard */}
              <Card className="p-6 border border-red-100 shadow-sm rounded-3xl bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                      {tText("Yeni Xərclər Siyahısı (Gündəlik Qeydiyyat)")}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      {tText("Seçilmiş dövrdə və ya gündəlik olaraq əlavə edilmiş xərclərin kosmik dəqiqliklə təfərrüatlı qeydiyyatı.")} ({getPeriodLabel()})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black bg-red-50 text-red-600 px-3 py-1.5 rounded-xl border border-red-100">
                      {tText("Cəmi Xərc")}: {dashboardStats.totalExpenses.toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                </div>

                {dashboardStats.filteredExpenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 bg-red-50/20 rounded-2xl border border-dashed border-red-200">
                    <TrendingDown className="w-10 h-10 text-red-300" />
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {tText("Seçilmiş dövrdə qeydə alınmış xərc yoxdur")}
                    </p>
                  </div>
                ) : (
                  <div className={`overflow-x-auto ${dashboardStats.filteredExpenses.length > 5 ? 'max-h-[300px] overflow-y-auto' : ''}`}>
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50">
                          <th className="py-3 px-4 rounded-l-xl">#</th>
                          <th className="py-3 px-4">{tText("Xərcin Təsviri / Adı")}</th>
                          <th className="py-3 px-4">{tText("Kateqoriya")}</th>
                          <th className="py-3 px-4">{tText("Tarix")}</th>
                          <th className="py-3 px-4">{tText("Məsul Şəxs")}</th>
                          <th className="py-3 px-4">{tText("Qeydlər")}</th>
                          <th className="py-3 px-4 text-right rounded-r-xl">{tText("Məbləğ")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                        {dashboardStats.filteredExpenses.map((ex, idx) => (
                          <tr key={ex.id || idx} className="hover:bg-red-50/20 transition-colors">
                            <td className="py-3 px-4 text-slate-400 text-[11px] font-black">{idx + 1}</td>
                            <td className="py-3 px-4 text-slate-900 font-extrabold">{ex.title}</td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] font-black bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100">
                                {tText(ex.category)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px]">{ex.date}</td>
                            <td className="py-3 px-4 text-slate-600">{ex.operator || 'Sistem Admini'}</td>
                            <td className="py-3 px-4 text-slate-400 text-[11px] italic max-w-xs truncate">{ex.notes || '-'}</td>
                            <td className="py-3 px-4 text-right font-black text-red-600 text-sm whitespace-nowrap">
                              -{ex.amount.toFixed(2)} {currencySymbol}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Satış Hərəkətləri Cədvəli */}
              <Card className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                          {tText("Satış Hərəkətləri", "SATIŞ HƏRƏKƏTLƏRİ")}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                          {selectedDashLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Silinən, geri alınan, xarab çıxan və hədiyyə vurulan məhsulların qeydiyyat jurnalı
                      </p>
                    </div>
                  </div>

                  {/* Filter Buttons & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      {(['all', 'Silindi', 'Geri alma', 'Xarab', 'Hədiyyə'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMovementTypeFilter(type)}
                          className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                            movementTypeFilter === type
                              ? 'bg-white text-slate-800 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {type === 'all' ? 'Hamısı' : type}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Məhsul, masa və ya ofisiant..."
                        value={movementSearch}
                        onChange={e => setMovementSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all w-56"
                      />
                    </div>
                  </div>
                </div>

                {filteredMovements.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                    <History className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Heç bir satış hərəkəti qeydə alınmayıb</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">Sifarişdən silinən, xarab çıxan, geri alınan və hədiyyə edilən məhsullar burada əks olunacaq.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                          <th className="py-3 px-4 w-12 text-center">№</th>
                          <th className="py-3 px-4">Məhsulun Adı</th>
                          <th className="py-3 px-4 text-center">Sayı</th>
                          <th className="py-3 px-4">Masa Nömrəsi</th>
                          <th className="py-3 px-4">Ofisiantın Adı</th>
                          <th className="py-3 px-4">Səbəbi / Əməliyyat</th>
                          <th className="py-3 px-4 text-right">Tarix və Saat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {pagedMovements.map((record, idx) => (
                          <tr key={record.id || idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 text-center text-slate-400 font-black text-[11px]">
                              {(movementsPage - 1) * MOVEMENTS_PER_PAGE + idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-slate-900 text-xs">{record.productName}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                {record.quantity} ədəd
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-700 bg-orange-50 border border-orange-100 text-orange-700 px-2 py-0.5 rounded-md text-[11px]">
                                {record.tableNumber}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-semibold">{record.waiterName || 'Ofisiant'}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                {record.type === 'Silindi' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200 shrink-0">
                                    Silindi
                                  </span>
                                )}
                                {record.type === 'Geri alma' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                                    Geri alma
                                  </span>
                                )}
                                {record.type === 'Xarab' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                                    Xarab
                                  </span>
                                )}
                                {record.type === 'Hədiyyə' && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                                    Hədiyyə
                                  </span>
                                )}
                                {record.reason && (
                                  <span className="text-xs text-slate-600 font-medium italic">
                                    ({record.reason})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex flex-col items-end text-xs font-semibold leading-tight">
                                <span className="font-bold text-slate-900">{formatAzDate(record.date)}</span>
                                <span className="text-[11px] text-slate-500 font-mono mt-0.5">{record.time}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls for Movements */}
                {filteredMovements.length > MOVEMENTS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 font-bold">
                      Cəmi {filteredMovements.length} hərəkət • Səhifə {movementsPage} / {totalMovementsPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={movementsPage <= 1}
                        onClick={() => setMovementsPage(p => Math.max(1, p - 1))}
                        className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all ${
                          movementsPage <= 1
                            ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95 cursor-pointer'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Əvvəlki</span>
                      </button>
                      <button
                        type="button"
                        disabled={movementsPage >= totalMovementsPages}
                        onClick={() => setMovementsPage(p => Math.min(totalMovementsPages, p + 1))}
                        className={`p-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs transition-all ${
                          movementsPage >= totalMovementsPages
                            ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                            : 'text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95 cursor-pointer'
                        }`}
                      >
                        <span>Növbəti</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>

            </div>

            {/* Draggable Z-Hesabat Modal / Window (Thermal Receipt View matching Image 2) */}
            {showZReportModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 pointer-events-auto">
                <div 
                  ref={zModalRef}
                  style={{ 
                    position: 'absolute', 
                    left: zReportPos ? `${zReportPos.x}px` : 'calc(50vw - 210px)', 
                    top: zReportPos ? `${zReportPos.y}px` : '40px',
                    width: 'min(94vw, 420px)'
                  }}
                  className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Header with Drag Handle */}
                  <div 
                    onMouseDown={handleZReportMouseDown}
                    className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-3 flex items-center justify-between cursor-move select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black tracking-widest uppercase text-white">
                          {tText("Z-HESABAT")}
                        </h3>
                        <p className="text-[10px] text-slate-300 font-medium">
                          {tText("GÜNLÜK BAĞLANIŞ QƏBZİ")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowZReportModal(false)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body: Date selection toolbar & authentic thermal receipt paper */}
                  {(() => {
                    const normZKey = normalizeDateKey(zReportDate);
                    const activeNormZKey = normalizeDateKey(activeShift?.businessDate);
                    const isSelectedDateActiveDate = Boolean(normZKey && activeNormZKey && normZKey === activeNormZKey);
                    const closedForZ = normZKey ? closedShifts[normZKey] : null;
                    const closedZList: any[] = (closedForZ?.allShifts && Array.isArray(closedForZ.allShifts))
                      ? closedForZ.allShifts
                      : (closedForZ && closedForZ.shiftId ? [closedForZ] : []);

                    const isMaxShiftsReached = closedZList.length >= 2;
                    const hasOpenActiveShift = isSelectedDateActiveDate && !activeShift?.isClosed && !isMaxShiftsReached;

                    const availableZShifts: Array<{ id: string; label: string; reportNo?: string; isClosed?: boolean }> = [];
                    closedZList.forEach((cs: any, idx: number) => {
                      const timeStr = cs.closedAt ? new Date(cs.closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : '';
                      availableZShifts.push({
                        id: cs.shiftId || `${normZKey}_${idx}`,
                        label: `Növbə #${idx + 1}${timeStr ? ` (${timeStr})` : ''}`,
                        reportNo: cs.reportNo,
                        isClosed: true
                      });
                    });

                    if (hasOpenActiveShift && activeShift?.id) {
                      availableZShifts.push({
                        id: activeShift.id,
                        label: tText('Aktiv Növbə'),
                        isClosed: false
                      });
                    }

                    if (availableZShifts.length === 0) {
                      availableZShifts.push({
                        id: 'default_shift',
                        label: tText('Aktiv Növbə'),
                        isClosed: false
                      });
                    }

                    let effectiveZShiftId = selectedZShiftId;
                    if (!effectiveZShiftId || effectiveZShiftId === 'auto' || !availableZShifts.some(s => s.id === effectiveZShiftId)) {
                      if (hasOpenActiveShift && activeShift?.id) {
                        effectiveZShiftId = activeShift.id;
                      } else if (availableZShifts.length > 0) {
                        effectiveZShiftId = availableZShifts[availableZShifts.length - 1].id;
                      } else {
                        effectiveZShiftId = 'auto';
                      }
                    }

                    const zData = getZReportData(zReportDate, effectiveZShiftId);
                    const isViewingClosedShift = availableZShifts.find(s => s.id === effectiveZShiftId)?.isClosed || 
                      (!hasOpenActiveShift);
                    const canCloseShift = !isMaxShiftsReached && hasOpenActiveShift && (effectiveZShiftId === activeShift?.id);

                    return (
                      <div className="flex flex-col flex-1 overflow-hidden bg-white">
                        {/* Control Bar */}
                        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                              {tText("Tarix")}:
                            </span>
                            <AzDatePicker 
                              value={zReportDate}
                              onChange={(val) => {
                                if (val) {
                                  setZReportDate(val);
                                  setSelectedZShiftId('auto');
                                }
                              }}
                              placeholder="Tarix seçin"
                              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold text-slate-800 shadow-xs cursor-pointer"
                              activeShiftBusinessDate={activeShift?.businessDate}
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (canCloseShift) {
                                  handleCloseShift(zReportDate);
                                }
                              }}
                              disabled={!canCloseShift}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all shrink-0 ${
                                !canCloseShift
                                  ? 'bg-emerald-600 text-white shadow-emerald-200 cursor-default opacity-90'
                                  : 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white shadow-slate-200 cursor-pointer'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>
                                {hasOpenActiveShift && (effectiveZShiftId === activeShift?.id)
                                  ? tText("Növbəni Bağla")
                                  : (isMaxShiftsReached
                                      ? tText("2 Növbə Bağlanıb")
                                      : (isViewingClosedShift 
                                          ? tText("Növbə Bağlanıb") 
                                          : tText("Növbəni Bağla")))}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePrintZReport(zData)}
                              title={tText("Çap Et")}
                              className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white rounded-xl shadow-md shadow-orange-200 transition-all cursor-pointer shrink-0 flex items-center justify-center"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Shift tabs if shifts exist for this date */}
                        {availableZShifts.length > 0 && (
                          <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
                            <span className="text-[11px] font-black text-slate-500 uppercase shrink-0">
                              {tText("NÖVBƏLƏR")}:
                            </span>
                            {availableZShifts.map((s, idx) => {
                              const isSelected = effectiveZShiftId === s.id;
                              return (
                                <button
                                  key={`${s.id}_${idx}`}
                                  type="button"
                                  onClick={() => setSelectedZShiftId(s.id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${
                                    isSelected
                                      ? 'bg-orange-500 text-white shadow-xs'
                                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Thermal POS Receipt Direct View without nested card */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 font-mono text-[13px] text-black leading-snug">
                          {/* Receipt Header */}
                          <div className="text-center space-y-1">
                            <h2 className="font-bold text-base tracking-wider uppercase">
                              {appNameWord1} {appNameWord2}
                            </h2>
                            <div className="font-bold text-xs tracking-wider">*** Z-HESABAT (GÜNLÜK BAĞLANIŞ) ***</div>
                            <div className="text-xs">Tarix: {zData.date}</div>
                            <div className="text-xs">Hesabat №: {zData.reportNo}</div>
                          </div>

                          {/* Dashed Line */}
                          <div className="border-b border-dashed border-black my-3"></div>

                          {/* Summary Rows */}
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>SATIŞ SAYI (ÇEK) :</span>
                              <span className="font-bold">{zData.totalOrdersCount} ədəd</span>
                            </div>
                            <div className="flex justify-between">
                              <span>NƏĞD SATIŞ :</span>
                              <span className="font-bold">{zData.cashSales.toFixed(2)} ₼</span>
                            </div>
                            <div className="flex justify-between">
                              <span>KARTLA SATIŞ :</span>
                              <span className="font-bold">{zData.cardSales.toFixed(2)} ₼</span>
                            </div>
                            <div className="flex justify-between">
                              <span>HƏDİYYƏ :</span>
                              <span className="font-bold">{zData.giftSales.toFixed(2)} ₼</span>
                            </div>
                            <div className="flex justify-between">
                              <span>XARAB MƏHSUL :</span>
                              <span className="font-bold">{zData.defectiveSales.toFixed(2)} ₼</span>
                            </div>
                            <div className="flex justify-between">
                              <span>GERİ QAYTARILAN :</span>
                              <span className="font-bold">{zData.returnedSales.toFixed(2)} ₼</span>
                            </div>
                            {zData.mixedSales > 0 && (
                              <div className="flex justify-between">
                                <span>QARIŞIQ SATIŞ :</span>
                                <span className="font-bold">{zData.mixedSales.toFixed(2)} ₼</span>
                              </div>
                            )}
                            {zData.debtSales > 0 && (
                              <div className="flex justify-between">
                                <span>NİSYƏ SATIŞ :</span>
                                <span className="font-bold">{zData.debtSales.toFixed(2)} ₼</span>
                              </div>
                            )}
                          </div>

                          {/* Dashed Line */}
                          <div className="border-b border-dashed border-black my-3"></div>

                          {/* Turnover & Expenses */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-bold text-sm">
                              <span>CƏMİ DÖVRİYYƏ :</span>
                              <span>{zData.totalSalesSum.toFixed(2)} ₼</span>
                            </div>
                            <div className="flex justify-between">
                              <span>CƏMİ XƏRCLƏR :</span>
                              <span>-{zData.totalExpensesSum.toFixed(2)} ₼</span>
                            </div>
                          </div>

                          {/* Solid Double Line */}
                          <div className="border-b-2 border-black my-3"></div>

                          {/* Net Income */}
                          <div className="flex justify-between font-bold text-sm">
                            <span>XALİS KASSA (QAZANC) :</span>
                            <span>{zData.netIncome.toFixed(2)} ₼</span>
                          </div>

                          {/* Double Solid Line */}
                          <div className="border-b-2 border-black my-3"></div>

                          {/* Receipt Footer */}
                          <div className="text-center text-[11px] space-y-2 mt-4">
                            <div>
                              Çap Olunma Tarixi: {(() => {
                                const d = new Date();
                                const day = String(d.getDate()).padStart(2, '0');
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const year = d.getFullYear();
                                const hours = String(d.getHours()).padStart(2, '0');
                                const minutes = String(d.getMinutes()).padStart(2, '0');
                                const seconds = String(d.getSeconds()).padStart(2, '0');
                                return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
                              })()}
                            </div>
                            <div className="pt-2">Məsul Şəxs İmzası: ___________________</div>
                            <div className="font-bold pt-1 uppercase">TƏŞƏKKÜR EDİRİK!</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>
        );
};
