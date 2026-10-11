import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  AlertTriangle, 
  Calendar, 
  BarChart3, 
  Printer, 
  DollarSign, 
  Undo2,
  Trash2,
  Lock,
  Layers,
  ChevronDown,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AzDatePicker } from './AzDatePicker';
import { getTodayStr, matchesDatePeriod, parseDateToYMD, normalizeDateKey, getActiveShiftBusinessDate } from '../utils/dateUtils';
import { DefectRecord, MenuItem, Table, DefectReturnsManagementTabProps } from '../types';

export const DefectReturnsManagementTab: React.FC<DefectReturnsManagementTabProps> = ({
  mode,
  defectRecords = [],
  records = [],
  onAddRecord,
  onDeleteRecord,
  menuItems = [],
  tables = [],
  appName = 'RESTO MASTER',
  closedShifts = {},
  activeShiftBusinessDate,
  activeShiftId,
  isShiftClosed,
  orderTransactions = [],
  activeOrders = {},
  auditLogs = []
}) => {
  const isDefective = mode === 'defective';
  const currentShiftDate = activeShiftBusinessDate || getActiveShiftBusinessDate();
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly' | 'all'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => activeShiftBusinessDate || currentShiftDate);
  const [selectedShiftId, setSelectedShiftId] = useState<string>('auto');
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);
  const shiftDropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  useEffect(() => {
    if (activeShiftBusinessDate && !isShiftClosed) {
      setSelectedDate(activeShiftBusinessDate);
      setFormDate(activeShiftBusinessDate);
      setSelectedShiftId('auto');
    }
  }, [activeShiftBusinessDate, isShiftClosed]);

  const normKey = normalizeDateKey(selectedDate);
  const activeNormKey = normalizeDateKey(activeShiftBusinessDate);

  // Closed shifts for selected date
  const closedShiftsList: any[] = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    Object.values(closedShifts || {}).forEach((cs: any) => {
      if (!cs) return;
      const csNorm = normalizeDateKey(cs.businessDate || cs.date);
      if (normKey && csNorm === normKey) {
        if (cs.allShifts && Array.isArray(cs.allShifts) && cs.allShifts.length > 0) {
          cs.allShifts.forEach((s: any) => {
            const sKey = s.shiftId || s.reportNo;
            if (sKey && !seen.has(sKey)) {
              seen.add(sKey);
              list.push(s);
            }
          });
        } else {
          const sKey = cs.shiftId || cs.reportNo || cs.date;
          if (sKey && !seen.has(sKey)) {
            seen.add(sKey);
            list.push(cs);
          }
        }
      }
      if (cs.allShifts && Array.isArray(cs.allShifts)) {
        cs.allShifts.forEach((s: any) => {
          const sNorm = normalizeDateKey(s.businessDate || s.date);
          if (normKey && sNorm === normKey) {
            const sKey = s.shiftId || s.reportNo;
            if (sKey && !seen.has(sKey)) {
              seen.add(sKey);
              list.push(s);
            }
          }
        });
      }
    });

    list.sort((a, b) => {
      const timeA = a.closedAt ? new Date(a.closedAt).getTime() : 0;
      const timeB = b.closedAt ? new Date(b.closedAt).getTime() : 0;
      return timeA - timeB;
    });

    return list;
  }, [normKey, closedShifts]);

  const isTodaySelected = Boolean(normKey && activeNormKey && normKey === activeNormKey && !isShiftClosed);

  interface ShiftMenuItem {
    id: string;
    label: string;
    subLabel?: string;
    isClosed?: boolean;
    isActive?: boolean;
    disabled?: boolean;
    shiftIndex?: number;
  }

  const shiftMenuItems: ShiftMenuItem[] = useMemo(() => {
    const items: ShiftMenuItem[] = [];

    if (closedShiftsList.length >= 2) {
      items.push({
        id: closedShiftsList[0].shiftId || `${normKey}_0`,
        label: 'Növbə #1',
        subLabel: closedShiftsList[0].closedAt ? new Date(closedShiftsList[0].closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : 'Bağlanmış',
        isClosed: true,
        shiftIndex: 1
      });
      items.push({
        id: closedShiftsList[1].shiftId || `${normKey}_1`,
        label: 'Növbə #2',
        subLabel: closedShiftsList[1].closedAt ? new Date(closedShiftsList[1].closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : 'Bağlanmış',
        isClosed: true,
        shiftIndex: 2
      });
      items.push({
        id: 'all',
        label: 'Bütün gün (Cəmi)',
        subLabel: 'Bütün növbələr birlikdə'
      });
    } else if (closedShiftsList.length === 1) {
      if (isTodaySelected) {
        items.push({
          id: activeShiftId || 'active',
          label: 'Aktiv növbə',
          subLabel: 'Növbə #2 (Cari açıq)',
          isActive: true,
          shiftIndex: 2
        });
        items.push({
          id: closedShiftsList[0].shiftId || `${normKey}_0`,
          label: 'Növbə #1',
          subLabel: closedShiftsList[0].closedAt ? new Date(closedShiftsList[0].closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : 'Bağlanmış',
          isClosed: true,
          shiftIndex: 1
        });
        items.push({
          id: 'all',
          label: 'Bütün gün (Cəmi)',
          subLabel: 'Bütün növbələr birlikdə'
        });
      } else {
        items.push({
          id: closedShiftsList[0].shiftId || `${normKey}_0`,
          label: 'Növbə #1',
          subLabel: closedShiftsList[0].closedAt ? new Date(closedShiftsList[0].closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : 'Bağlanmış',
          isClosed: true,
          shiftIndex: 1
        });
        items.push({
          id: `${normKey}_empty_2`,
          label: 'Növbə #2',
          subLabel: 'Keçirilməyib',
          disabled: true
        });
        items.push({
          id: 'all',
          label: 'Bütün gün (Cəmi)',
          subLabel: 'Bütün növbələr birlikdə'
        });
      }
    } else {
      // 0 shifts closed
      if (isTodaySelected) {
        items.push({
          id: activeShiftId || 'active',
          label: 'Aktiv növbə',
          subLabel: 'Növbə #1 (Cari açıq)',
          isActive: true,
          shiftIndex: 1
        });
        items.push({
          id: `${normKey || 'today'}_empty_2`,
          label: 'Növbə #2',
          subLabel: 'Keçirilməyib',
          disabled: true
        });
        items.push({
          id: 'all',
          label: 'Bütün gün (Cəmi)',
          subLabel: 'Bütün növbələr birlikdə'
        });
      } else {
        items.push({
          id: `${normKey}_empty_1`,
          label: 'Növbə #1',
          subLabel: 'Məlumat yoxdur',
          disabled: false
        });
        items.push({
          id: `${normKey}_empty_2`,
          label: 'Növbə #2',
          subLabel: 'Keçirilməyib',
          disabled: true
        });
        items.push({
          id: 'all',
          label: 'Bütün gün (Cəmi)',
          subLabel: 'Bütün növbələr birlikdə'
        });
      }
    }

    return items;
  }, [closedShiftsList, isTodaySelected, activeShiftId, normKey]);

  const effectiveShiftId = useMemo(() => {
    if (selectedShiftId && selectedShiftId !== 'auto' && shiftMenuItems.some(s => s.id === selectedShiftId && !s.disabled)) {
      return selectedShiftId;
    }
    if (isTodaySelected) {
      return activeShiftId || 'active';
    }
    const firstActive = shiftMenuItems.find(s => !s.disabled);
    return firstActive ? firstActive.id : 'all';
  }, [selectedShiftId, shiftMenuItems, isTodaySelected, activeShiftId]);

  const selectedShiftObj = shiftMenuItems.find(s => s.id === effectiveShiftId) || shiftMenuItems[0];
  const selectedLabel = selectedShiftObj ? selectedShiftObj.label : 'Növbələr';

  const isDateClosed = period === 'daily' && !!normKey && !!closedShifts[normKey] && normKey !== activeNormKey;

  // Form states for manual registration
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [customDishName, setCustomDishName] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<string>('1');
  const [formTable, setFormTable] = useState<string>('Masa 1');
  const [formDate, setFormDate] = useState<string>(() => currentShiftDate);
  const [formTime, setFormTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  });
  const [selectedReasonChip, setSelectedReasonChip] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState<string>('');

  const defectReasonOptions = [
    'Keyfiyyətsiz / Yanıb',
    'Xarab çıxıb / Qoxusu dəyişib',
    'Dadı standartlara uyğun deyil',
    'Soyuqdur / Çiy qalıb',
    'Tərkibi səhv hazırlanıb',
    'Xarici cisim aşkarlandı'
  ];

  const returnReasonOptions = [
    'Müştəri gecikməyə görə imtina etdi',
    'Səhv yemək gətirildi',
    'Müştəri yeməyi bəyənmədi',
    'Masa vaxtından əvvəl hesabı bağladı',
    'Ofisiant səhvi / Səhv masa',
    'Sifariş dəyişdirildi'
  ];

  const reasonChips = isDefective ? defectReasonOptions : returnReasonOptions;

  const parseDateParts = (str?: string) => {
    if (!str) return null;
    const s = String(str).trim();
    if (s.includes('-')) {
      const parts = s.split('-');
      if (parts.length === 3) {
        return {
          year: parts[0].padStart(4, '0'),
          month: parts[1].padStart(2, '0'),
          day: parts[2].padStart(2, '0')
        };
      }
    }
    if (s.includes('.')) {
      const parts = s.split('.');
      if (parts.length === 3) {
        return {
          year: parts[2].padStart(4, '0'),
          month: parts[1].padStart(2, '0'),
          day: parts[0].padStart(2, '0')
        };
      }
    }
    return null;
  };

  interface UnifiedDefectItem {
    id: number | string;
    originalId?: number;
    type: 'defective' | 'returned';
    dishName: string;
    price: number;
    quantity: number;
    tableNumber: string;
    date: string;
    normDate: string;
    time: string;
    timestamp: number;
    reason: string;
    waiterName: string;
    shiftId?: string;
    isClosed?: boolean;
    canDelete?: boolean;
  }

  // Unified defect & return records from all transactional sources
  const allIntegratedRecords = useMemo(() => {
    const list: UnifiedDefectItem[] = [];
    const seenKeys = new Set<string>();

    // 1. Primary defectRecords from state / localStorage
    (defectRecords || []).forEach(r => {
      if (!r) return;
      const uid = `def_${r.id}`;
      const recDate = r.date || currentShiftDate;
      const recNormDate = normalizeDateKey(recDate);
      const isClosedRec = Boolean(r.isClosed);
      const key = `${r.type}_${r.dishName}_${r.tableNumber}_${recNormDate}_${r.quantity}_${Number(r.price).toFixed(2)}`;
      
      seenKeys.add(uid);
      seenKeys.add(key);

      list.push({
        id: r.id,
        originalId: r.id,
        type: r.type,
        dishName: r.dishName,
        price: Number(r.price) || 0,
        quantity: r.quantity || 1,
        tableNumber: r.tableNumber || 'Masa 1',
        date: recDate,
        normDate: recNormDate,
        time: r.time || '12:00:00',
        timestamp: r.timestamp || (r.time ? new Date(`${recDate}T${r.time}`).getTime() : Date.now()),
        reason: r.reason || (r.type === 'defective' ? 'Xarab məhsul' : 'Müştəri imtinası'),
        waiterName: r.waiterName || 'Rəhbərlik',
        shiftId: r.shiftId,
        isClosed: isClosedRec,
        canDelete: !isClosedRec && (!r.shiftId || r.shiftId === activeShiftId)
      });
    });

    // 2. Archived defects in closedShifts
    Object.values(closedShifts || {}).forEach((cs: any) => {
      if (!cs) return;
      const csDefects = cs.defects || cs.stats?.defects;
      const csShiftId = cs.shiftId || cs.reportNo;
      const csDate = cs.businessDate || cs.date || currentShiftDate;
      const csNormDate = normalizeDateKey(csDate);

      if (Array.isArray(csDefects)) {
        csDefects.forEach((dr: any, idx: number) => {
          if (!dr) return;
          const uid = `csdef_${csShiftId}_${dr.id || idx}`;
          const key = `${dr.type}_${dr.dishName}_${dr.tableNumber}_${csNormDate}_${dr.quantity}_${Number(dr.price).toFixed(2)}`;
          if (seenKeys.has(uid) || (dr.id && seenKeys.has(`def_${dr.id}`)) || seenKeys.has(key)) {
            return;
          }
          seenKeys.add(uid);
          seenKeys.add(key);

          list.push({
            id: uid,
            type: dr.type || 'defective',
            dishName: dr.dishName,
            price: Number(dr.price) || 0,
            quantity: dr.quantity || 1,
            tableNumber: dr.tableNumber || 'Masa 1',
            date: dr.date || csDate,
            normDate: normalizeDateKey(dr.date || csDate),
            time: dr.time || (cs.closedAt ? new Date(cs.closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '12:00:00'),
            timestamp: dr.timestamp || (cs.closedAt ? new Date(cs.closedAt).getTime() : 0),
            reason: dr.reason || 'Arxiv qeydi',
            waiterName: dr.waiterName || cs.operator || 'Sistem',
            shiftId: csShiftId,
            isClosed: true,
            canDelete: false
          });
        });
      }
    });

    // 3. Active open table orders with status 'defective' or 'returned'
    if (activeOrders && typeof activeOrders === 'object') {
      Object.entries(activeOrders).forEach(([tableKey, items]) => {
        if (!Array.isArray(items)) return;
        const tableName = `Masa ${tableKey}`;
        items.forEach((item: any) => {
          if (!item) return;
          const st = String(item.status || '').toLowerCase();
          if (st === 'defective' || st === 'returned') {
            const itemType = st === 'defective' ? 'defective' : 'returned';
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 1;
            const normD = normalizeDateKey(currentShiftDate);
            const key = `${itemType}_${item.name}_${tableName}_${normD}_${quantity}_${price.toFixed(2)}`;
            const uid = `active_${item.id || item.name}_${tableKey}`;

            if (seenKeys.has(uid) || seenKeys.has(key)) return;
            seenKeys.add(uid);
            seenKeys.add(key);

            list.push({
              id: uid,
              type: itemType,
              dishName: item.name,
              price,
              quantity,
              tableNumber: tableName,
              date: currentShiftDate,
              normDate: normD,
              time: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              timestamp: Date.now(),
              reason: item.deleteReason || (itemType === 'defective' ? 'Məhsul xarab çıxıb' : 'Müştəri imtina etdi'),
              waiterName: item.waiterName || 'Ofisiant',
              shiftId: activeShiftId,
              isClosed: false,
              canDelete: false
            });
          }
        });
      });
    }

    // 4. Closed shift orders with defective or returned status
    Object.values(closedShifts || {}).forEach((cs: any) => {
      if (!cs || !Array.isArray(cs.orders)) return;
      const csShiftId = cs.shiftId || cs.reportNo;
      const csDate = cs.businessDate || cs.date || currentShiftDate;
      const csNormDate = normalizeDateKey(csDate);

      cs.orders.forEach((tx: any) => {
        if (!tx || !Array.isArray(tx.items)) return;
        const tbl = tx.tableName || 'Masa';
        tx.items.forEach((item: any) => {
          if (!item) return;
          const st = String(item.status || '').toLowerCase();
          if (st === 'defective' || st === 'returned' || st === 'cancelled') {
            const itemType = st === 'defective' ? 'defective' : 'returned';
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 1;
            const key = `${itemType}_${item.name}_${tbl}_${csNormDate}_${quantity}_${price.toFixed(2)}`;
            const uid = `cstx_${csShiftId}_${tx.id}_${item.id || item.name}`;

            if (seenKeys.has(uid) || seenKeys.has(key)) return;
            seenKeys.add(uid);
            seenKeys.add(key);

            list.push({
              id: uid,
              type: itemType,
              dishName: item.name,
              price,
              quantity,
              tableNumber: tbl,
              date: csDate,
              normDate: csNormDate,
              time: tx.time || (cs.closedAt ? new Date(cs.closedAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '12:00:00'),
              timestamp: tx.timestamp || (cs.closedAt ? new Date(cs.closedAt).getTime() : 0),
              reason: item.deleteReason || (itemType === 'defective' ? 'Xarab məhsul' : 'Müştəri imtinası'),
              waiterName: tx.waiterName || cs.operator || 'Ofisiant',
              shiftId: csShiftId,
              isClosed: true,
              canDelete: false
            });
          }
        });
      });
    });

    // 5. Audit logs ("Məhsul Qaytarıldı" / "Xarab Məhsul")
    if (Array.isArray(auditLogs)) {
      auditLogs.forEach((log: any, idx: number) => {
        if (!log || !log.action) return;
        const act = String(log.action).toLowerCase();
        const isDef = act.includes('xarab');
        const isRet = act.includes('qaytar') && !act.includes('silin');
        if (!isDef && !isRet) return;

        const logType = isDef ? 'defective' : 'returned';
        const logDate = log.date || currentShiftDate;
        const logNormDate = normalizeDateKey(logDate);
        const uid = `log_${log.id || idx}`;
        const key = `${logType}_${log.details || log.action}_${logNormDate}`;

        if (seenKeys.has(uid) || seenKeys.has(key)) return;
        const dishMatch = log.details?.match(/(.+?)\s*\((\d+)\s*ədəd/i) || log.details?.match(/(.+?)\s*-\s*(\d+)/i);
        const dishName = dishMatch ? dishMatch[1].trim() : (log.details || log.action);
        const qty = dishMatch ? parseInt(dishMatch[2], 10) : 1;

        seenKeys.add(uid);
        seenKeys.add(key);

        list.push({
          id: uid,
          type: logType,
          dishName: dishName,
          price: Number(log.amount || 0),
          quantity: qty,
          tableNumber: log.tableName || log.tableNumber || 'Masa',
          date: logDate,
          normDate: logNormDate,
          time: log.time || '12:00:00',
          timestamp: log.timestamp || Date.now(),
          reason: log.reason || log.details || (logType === 'defective' ? 'Xarab məhsul' : 'Geri qaytarıldı'),
          waiterName: log.user || log.waiterName || 'İstifadəçi',
          shiftId: log.shiftId || (logDate === currentShiftDate && !isShiftClosed ? activeShiftId : undefined),
          isClosed: Boolean(log.isClosed || (logDate !== currentShiftDate)),
          canDelete: false
        });
      });
    }

    return list;
  }, [defectRecords, closedShifts, activeOrders, auditLogs, currentShiftDate, activeShiftId, isShiftClosed]);

  // Filtered List calculation
  const filteredList = useMemo(() => {
    return allIntegratedRecords.filter(r => {
      // 1. Rejim yoxlanışı
      if (r.type !== mode) return false;

      // 2. Axtarış filtri
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        const match = (r.dishName && r.dishName.toLowerCase().includes(q)) ||
          (r.tableNumber && String(r.tableNumber).toLowerCase().includes(q)) ||
          (r.reason && r.reason.toLowerCase().includes(q)) ||
          (r.waiterName && r.waiterName.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 3. Dövr filtri (Monthly, Yearly, All)
      if (period === 'monthly' || period === 'yearly') {
        return matchesDatePeriod(r.date, selectedDate, period);
      }
      if (period === 'all') {
        return true;
      }

      // 4. Günlük (Daily) və Növbə filtri
      const isDateMatched = (r.normDate && normKey && r.normDate === normKey) || matchesDatePeriod(r.date, selectedDate, 'daily');
      if (!isDateMatched) return false;

      const isUnclosedActiveRecord = !r.isClosed || (activeShiftId && r.shiftId === activeShiftId);

      // Hal A: "Aktiv növbə" seçilibsə
      if (effectiveShiftId === activeShiftId || effectiveShiftId === 'active' || selectedShiftObj?.isActive) {
        if (!isTodaySelected) return false;
        if (!isUnclosedActiveRecord) return false;
        if (closedShiftsList.some(cs => cs.shiftId && cs.shiftId === r.shiftId)) return false;
        return true;
      }

      // Hal B: "Bütün gün (Cəmi)" seçilibsə
      if (effectiveShiftId === 'all') {
        if (!isTodaySelected && isUnclosedActiveRecord) return false;
        return true;
      }

      // Hal C: Konkret bağlanmış növbə (Növbə #1 və ya Növbə #2) seçilibsə
      if (isUnclosedActiveRecord && (!r.shiftId || r.shiftId === activeShiftId)) {
        return false;
      }

      const targetClosedShift = closedShiftsList.find(s => s.shiftId === effectiveShiftId) ||
        (selectedShiftObj?.shiftIndex ? closedShiftsList[selectedShiftObj.shiftIndex - 1] : closedShiftsList[0]);
      const otherClosedShift = closedShiftsList.find(s => s !== targetClosedShift);

      if (r.shiftId) {
        if (targetClosedShift?.shiftId && r.shiftId === targetClosedShift.shiftId) return true;
        if (targetClosedShift?.reportNo && r.shiftId === targetClosedShift.reportNo) return true;
        if (otherClosedShift?.shiftId && r.shiftId === otherClosedShift.shiftId) return false;
        if (otherClosedShift?.reportNo && r.shiftId === otherClosedShift.reportNo) return false;
        if (activeShiftId && r.shiftId === activeShiftId) return false;
      }

      // Əgər 2 bağlanmış növbə varsa və Növbə #1-in bağlanış saatı varsa
      if (closedShiftsList.length >= 2 && closedShiftsList[0]?.closedAt) {
        const shift1CloseTime = new Date(closedShiftsList[0].closedAt).getTime();
        const rTime = r.timestamp || 0;
        const isShift1 = targetClosedShift === closedShiftsList[0];
        if (isShift1) {
          if (rTime > shift1CloseTime) return false;
        } else {
          if (rTime <= shift1CloseTime) return false;
        }
      }

      return true;
    });
  }, [allIntegratedRecords, mode, search, period, selectedDate, normKey, effectiveShiftId, activeShiftId, isTodaySelected, selectedShiftObj, closedShiftsList]);

  // Statistics
  const totalCount = filteredList.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const totalAmount = filteredList.reduce((acc, curr) => acc + ((Number(curr.price) || 0) * (curr.quantity || 1)), 0);

  const todayRecords = allIntegratedRecords.filter(r => {
    if (r.type !== mode) return false;
    const isUnclosedActiveRecord = !r.isClosed || (activeShiftId && r.shiftId === activeShiftId);
    if (isUnclosedActiveRecord) return true;
    return (r.normDate && activeNormKey && r.normDate === activeNormKey) || matchesDatePeriod(r.date, currentShiftDate, 'daily');
  });
  const todayCount = todayRecords.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const todayAmount = todayRecords.reduce((acc, curr) => acc + ((Number(curr.price) || 0) * (curr.quantity || 1)), 0);

  // Format Helpers
  const formatTableDate = (dStr: string) => {
    if (!dStr) return '';
    if (dStr.includes('.')) return dStr;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
    }
    return dStr;
  };

  const formatTableTime = (tStr: string, timestamp?: number) => {
    if (tStr && tStr.includes(':')) return tStr;
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      }
    }
    return '12:00:00';
  };

  const formatPeriodLabel = (dStr: string, p: string) => {
    if (!dStr || p === 'all') return 'Bütün dövrlər';
    const parsed = parseDateToYMD(dStr);
    if (!parsed) return dStr;
    const year = parseInt(parsed.year, 10);
    const monthNum = parseInt(parsed.month, 10);
    const day = parseInt(parsed.day, 10);
    const azMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
    const mName = azMonths[monthNum - 1] || `${monthNum}`;

    if (p === 'monthly') return `${mName} ${year}`;
    if (p === 'yearly') return `${year}-ci İl`;
    return `${day} ${mName} ${year}`;
  };

  const handleMenuSelect = (menuIdStr: string) => {
    setSelectedMenuId(menuIdStr);
    if (!menuIdStr) {
      setCustomDishName('');
      setFormPrice('');
      return;
    }
    const item = menuItems.find(m => String(m.id) === menuIdStr);
    if (item) {
      setCustomDishName(item.name);
      setFormPrice(String(item.price));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customDishName.trim();
    if (!finalName) return;

    const targetDate = formDate || getTodayStr();
    const targetNorm = targetDate.replace(/[-.]/g, '');
    const activeNorm = (activeShiftBusinessDate || '').replace(/[-.]/g, '');
    if (targetNorm && closedShifts[targetNorm] && targetNorm !== activeNorm) {
      alert("Seçilmiş tarixin növbəsi bağlanıb və dondurulub. Bağlanmış növbəyə yeni qeyd əlavə edilə bilməz.");
      return;
    }

    const finalReason = customReasonText.trim() || selectedReasonChip || (isDefective ? 'Məhsul xarab çıxıb' : 'Müştəri geri qaytardı');

    onAddRecord({
      type: mode,
      dishName: finalName,
      price: parseFloat(formPrice) || 0,
      quantity: parseInt(formQuantity, 10) || 1,
      tableNumber: formTable || 'Masa 1',
      date: targetDate,
      time: formTime || '12:00:00',
      reason: finalReason,
      waiterName: 'Rəhbərlik'
    });

    // Reset Form
    setIsAddModalOpen(false);
    setSelectedMenuId('');
    setCustomDishName('');
    setFormPrice('');
    setFormQuantity('1');
    setFormTable('Masa 1');
    setSelectedReasonChip('');
    setCustomReasonText('');
  };

  const handlePrint = () => {
    const pageTitle = isDefective ? 'XARAB MƏHSULLAR HESABATI' : 'GERİ ALINAN MƏHSULLAR HESABATI';
    const periodText = formatPeriodLabel(selectedDate, period);
    const printTime = new Date().toLocaleString('az-AZ', { hour12: false });

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${pageTitle} - ${appName}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; background: #fff; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .restaurant-name { font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #0f172a; }
            .report-title { font-size: 16px; font-weight: 800; color: ${isDefective ? '#e11d48' : '#d97706'}; margin-top: 6px; }
            .meta-info { font-size: 12px; color: #64748b; margin-top: 8px; display: flex; justify-content: space-between; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background: #f1f5f9; padding: 10px 8px; border: 1px solid #cbd5e1; text-align: left; font-weight: 800; text-transform: uppercase; font-size: 10px; color: #334155; }
            td { padding: 9px 8px; border: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .summary-box { margin-top: 25px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 13px; font-weight: bold; display: flex; justify-content: space-between; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">${appName || 'RESTO MASTER'}</div>
            <div class="report-title">${pageTitle}</div>
            <div class="meta-info">
              <span><b>Dövr / Filtr:</b> ${periodText}</span>
              <span><b>Çap tarixi:</b> ${printTime}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px;" class="text-center">№</th>
                <th>Məhsulun Adı</th>
                <th class="text-center" style="width: 50px;">Say</th>
                <th class="text-right" style="width: 85px;">Qiymət (₼)</th>
                <th class="text-right" style="width: 95px;">Cəmi (₼)</th>
                <th class="text-center" style="width: 80px;">Masa №</th>
                <th class="text-center" style="width: 95px;">Tarix</th>
                <th class="text-center" style="width: 85px;">Saat (24s)</th>
                <th>Səbəbi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredList.length === 0 ? `
                <tr>
                  <td colspan="9" class="text-center" style="padding: 20px; color: #94a3b8;">Bu dövr üçün heç bir qeyd mövcud deyil.</td>
                </tr>
              ` : filteredList.map((item, idx) => `
                <tr>
                  <td class="text-center font-bold">${idx + 1}</td>
                  <td class="font-bold">${item.dishName}</td>
                  <td class="text-center font-bold">${item.quantity || 1}</td>
                  <td class="text-right">${Number(item.price || 0).toFixed(2)} ₼</td>
                  <td class="text-right font-bold">${(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)} ₼</td>
                  <td class="text-center">${item.tableNumber}</td>
                  <td class="text-center">${formatTableDate(item.date)}</td>
                  <td class="text-center font-bold">${formatTableTime(item.time, item.timestamp)}</td>
                  <td>${item.reason || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary-box">
            <span>Cəmi Qeydlər: ${filteredList.length} əməliyyat (${totalCount} ədəd)</span>
            <span>Ümumi Maliyyə Dəyəri: ${totalAmount.toFixed(2)} ₼</span>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    if ((window as any).electron?.print) {
      const printerName = localStorage.getItem('printerName') || '';
      (window as any).electron.print({ html: reportHtml, deviceName: printerName, copies: 1 });
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert("Brauzer çap pəncərəsinin açılmasını blokladı! Zəhmət olmasa, pop-up icazəsini aktiv edin.");
      return;
    }

    printWin.document.write(reportHtml);
    printWin.document.close();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
      <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
        
        {/* Main Banner */}
        <div className={`rounded-[28px] p-6 text-white min-h-[140px] flex flex-col justify-between shadow-xl relative overflow-hidden ${
          isDefective 
            ? 'bg-gradient-to-r from-rose-500 to-red-650 shadow-rose-100' 
            : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-100'
        }`}>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            {isDefective ? <AlertTriangle className="w-48 h-48" /> : <Undo2 className="w-48 h-48" />}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 z-10">
            <span className="bg-white/20 uppercase tracking-widest text-[9px] font-black px-3 py-1 rounded-full w-fit flex items-center gap-1.5 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {isDefective ? 'Xarab & Defekt Məhsulların Hesabat Mərkəzi' : 'Müştəri İmtinası və Geri Qaytarmalar'}
            </span>

            <div className="flex items-center gap-2">
              {isDateClosed && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-black/25 text-white rounded-xl text-xs font-black backdrop-blur-xs">
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Növbə Bağlanıb</span>
                </div>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black uppercase tracking-wider backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Çap Et (Hesabat)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isDateClosed) {
                    alert("Bu tarixin növbəsi bağlanıb və dondurulub. Bağlanmış günə yeni qeyd əlavə etmək mümkün deyil.");
                    return;
                  }
                  setSelectedDate(currentShiftDate);
                  setFormDate(currentShiftDate);
                  const d = new Date();
                  setFormTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`);
                  setIsAddModalOpen(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
                  isDateClosed
                    ? 'bg-white/40 text-white/70 cursor-not-allowed border-2 border-white/20'
                    : 'bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-2 border-red-500/30'
                }`}
              >
                {isDateClosed ? <Lock className="w-4 h-4 shrink-0" /> : <Plus className="w-4 h-4 stroke-[3] shrink-0" />}
                <span>YENİ QEYD ƏLAVƏ ET</span>
              </button>
            </div>
          </div>

          <div className="z-10 mt-3">
            <h2 className="text-xl md:text-2xl font-black tracking-tight select-none">
              {isDefective ? 'Xarab Məhsullar Portalı' : 'Geri Alınan Məhsullar Portalı'}
            </h2>
            <p className="text-xs font-semibold opacity-95 mt-1 max-w-2xl leading-relaxed">
              {isDefective 
                ? 'Mətbəxdə və ya xidmət zamanı xarab çıxan, standartlara cavab verməyən yeməklərin səbəbləri, masa nömrəsi və dəymiş maliyyə zərəri üzrə detallı jurnalı.' 
                : 'Müştərilər tərəfindən gecikmə, səhv sifariş və ya digər səbəblərdən geri qaytarılan yemək və içkilərin analitik qeydiyyatı.'}
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                Filtr Üzrə Sayı
              </span>
              <span className="text-xl font-black text-slate-800 leading-none mt-2 block">
                {totalCount} ədəd
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                {filteredList.length} əməliyyat qeydi
              </span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDefective ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                {isDefective ? 'Maliyyə Zərəri' : 'Cəmi Qaytarılan'}
              </span>
              <span className={`text-xl font-black leading-none mt-2 block ${isDefective ? 'text-rose-600' : 'text-amber-600'}`}>
                {totalAmount.toFixed(2)} ₼
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                {period === 'all' ? 'Bütün dövrlər' : formatPeriodLabel(selectedDate, period)}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDefective ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                Bugünkü Qeydlər
              </span>
              <span className="text-xl font-black text-slate-800 leading-none mt-2 block">
                {todayCount} ədəd
              </span>
              <span className={`text-[10px] font-extrabold mt-1 block ${isDefective ? 'text-rose-600' : 'text-amber-600'}`}>
                {todayAmount.toFixed(2)} ₼ məbləğində
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                Orta Vahid Dəyər
              </span>
              <span className="text-xl font-black text-slate-800 leading-none mt-2 block">
                {totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : '0.00'} ₼
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                Məhsul başına orta qiymət
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Period, DatePicker and Shift selector */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center shrink-0">
              {(['daily', 'monthly', 'yearly', 'all'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    period === p
                      ? 'bg-white text-slate-850 shadow-xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {p === 'daily' ? 'GÜNDƏLİK' : p === 'monthly' ? 'AYLIQ' : p === 'yearly' ? 'İLLİK' : 'HAMISI'}
                </button>
              ))}
            </div>

            {/* DatePicker & Shift Selector group */}
            {period !== 'all' && (
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-700 shrink-0">
                  <AzDatePicker
                    value={selectedDate}
                    onChange={(val) => {
                      if (val) {
                        setSelectedDate(val);
                        setSelectedShiftId('auto');
                      }
                    }}
                    format="dd.mm.yyyy"
                    className="bg-transparent border-none p-0 focus:outline-none cursor-pointer text-xs font-black text-slate-800 flex items-center gap-2"
                    activeShiftBusinessDate={currentShiftDate}
                  />
                </div>

                {/* Shift Selector Dropdown directly next to Calendar */}
                {period === 'daily' && shiftMenuItems.length > 0 && (
                  <div className="relative shrink-0" ref={shiftDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsShiftDropdownOpen(prev => !prev)}
                      className={`px-3 py-1.5 rounded-2xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer select-none shadow-xs ${
                        isShiftDropdownOpen
                          ? (isDefective ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-200' : 'bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-200')
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <Layers className={`w-3.5 h-3.5 shrink-0 ${isDefective ? 'text-rose-500' : 'text-amber-500'}`} />
                      <span>Növbələr:</span>
                      <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${
                        isDefective ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedLabel}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isShiftDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isShiftDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                        <div className="px-2.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-0.5">
                          NÖVBƏ SEÇİMİ
                        </div>
                        {shiftMenuItems.map((s, idx) => {
                          const isSelected = effectiveShiftId === s.id;
                          return (
                            <button
                              key={`${s.id}_${idx}`}
                              type="button"
                              disabled={s.disabled}
                              onClick={() => {
                                if (s.disabled) return;
                                setSelectedShiftId(s.id);
                                setIsShiftDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                                isSelected
                                  ? (isDefective ? 'bg-rose-500 text-white shadow-xs font-black' : 'bg-amber-500 text-white shadow-xs font-black')
                                  : s.disabled
                                    ? 'text-slate-300 bg-slate-50/50 cursor-not-allowed font-medium'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer font-bold'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-xs">{s.label}</span>
                                {s.subLabel && (
                                  <span className={`text-[10px] ${isSelected ? 'text-white/90' : 'text-slate-400 font-semibold'}`}>
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
            )}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-60 md:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Məhsul, masa və ya səbəb axtar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

        </div>

        {/* Table Content */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 w-12 text-center">№</th>
                  <th className="py-4 px-4">Məhsulun Adı</th>
                  <th className="py-4 px-4 text-center">Sayı</th>
                  <th className="py-4 px-4 text-right">Vahid Qiymət</th>
                  <th className="py-4 px-4 text-right">Cəmi Qiymət</th>
                  <th className="py-4 px-4 text-center">Masa Nömrəsi</th>
                  <th className="py-4 px-4 text-center">Tarix</th>
                  <th className="py-4 px-4 text-center">Saat (24s)</th>
                  <th className="py-4 px-4">Səbəbi</th>
                  <th className="py-4 px-4 text-center">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${isDefective ? 'bg-rose-50 text-rose-400' : 'bg-amber-50 text-amber-400'}`}>
                          {isDefective ? <AlertTriangle className="w-7 h-7" /> : <Undo2 className="w-7 h-7" />}
                        </div>
                        <h4 className="font-black text-sm text-slate-700">Qeyd Tapılmadı</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-1">
                          Seçilmiş dövr və filter üçün heç bir {isDefective ? 'xarab' : 'geri alınan'} məhsul qeydiyyatı yoxdur.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-800 flex items-center gap-2">
                          <span>{item.dishName}</span>
                          {item.quantity > 1 && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${isDefective ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                              {item.quantity} ədəd
                            </span>
                          )}
                        </div>
                        {item.waiterName && (
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                            Qeyd edən: {item.waiterName}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-700">
                        {item.quantity || 1}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-600">
                        {Number(item.price || 0).toFixed(2)} ₼
                      </td>
                      <td className={`py-3.5 px-4 text-right font-black text-sm ${isDefective ? 'text-rose-600' : 'text-amber-600'}`}>
                        {(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)} ₼
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                          {item.tableNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-700 whitespace-nowrap">
                        {formatTableDate(item.date)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600 whitespace-nowrap">
                        {formatTableTime(item.time, item.timestamp)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-3 py-1.5 rounded-xl text-[11px] font-bold leading-relaxed ${
                          isDefective 
                            ? 'bg-rose-50 text-rose-800 border border-rose-100' 
                            : 'bg-amber-50 text-amber-900 border border-amber-100'
                        }`}>
                          {item.reason || (isDefective ? 'Xarab məhsul' : 'Müştəri geri qaytardı')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isDateClosed || item.isClosed || !item.canDelete || (((item.date || '').replace(/[-.]/g, '')) in closedShifts && ((item.date || '').replace(/[-.]/g, '')) !== activeNormKey) ? (
                          <span className="inline-flex p-2 text-slate-300" title="Dondurulmuş qeyd (Silinə bilməz)">
                            <Lock className="w-4 h-4" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteRecord && window.confirm("Bu qeydi silməyə əminsiniz?")) {
                                const idToDel = typeof item.originalId === 'number' ? item.originalId : Number(item.id);
                                if (!isNaN(idToDel)) {
                                  onDeleteRecord(idToDel);
                                }
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Totals */}
          {filteredList.length > 0 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-500">
                Göstərilir: <span className="font-extrabold text-slate-800">{filteredList.length}</span> qeyd (cəmi <span className="font-extrabold text-slate-800">{totalCount}</span> ədəd)
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Cəmi Məbləğ:
                </span>
                <span className={`text-base font-black px-3 py-1 rounded-xl bg-white border shadow-2xs ${
                  isDefective ? 'text-rose-600 border-rose-100' : 'text-amber-600 border-amber-100'
                }`}>
                  {totalAmount.toFixed(2)} ₼
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Manual Add Defect/Return Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white w-full max-w-lg rounded-[28px] p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${isDefective ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                    {isDefective ? <AlertTriangle className="w-5 h-5" /> : <Undo2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider leading-tight">
                      {isDefective ? 'Yeni Xarab Məhsul Qeydiyyatı' : 'Yeni Geri Alınan Məhsul Qeydiyyatı'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      RƏHBƏRLİK JURNALINA ƏLAVƏ EDİLMƏSİ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
                {/* Menu Selection or Custom input */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                    Menyudan Seçin və ya Adını Yazın *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={selectedMenuId}
                      onChange={(e) => handleMenuSelect(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="">-- Menyudan Yemək Seçin --</option>
                      {menuItems.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.price.toFixed(2)} ₼) - {m.category}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Məhsulun dəqiq adını yazın..."
                      value={customDishName}
                      onChange={(e) => {
                        setCustomDishName(e.target.value);
                        setSelectedMenuId('');
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Price and Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                      Vahid Qiymət (₼) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                      Sayı (Ədəd) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Table Number & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                      Masa Nömrəsi *
                    </label>
                    <select
                      value={formTable}
                      onChange={(e) => setFormTable(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      {tables.map(t => (
                        <option key={t.id} value={t.number}>{t.number} ({t.name})</option>
                      ))}
                      <option value="Mətbəx">Mətbəx / Bar</option>
                      <option value="Çatdırılma">Çatdırılma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                      Tarix (dd.mm.yyyy)
                    </label>
                    <AzDatePicker
                      value={formDate}
                      onChange={(val) => {
                        if (val) setFormDate(val);
                      }}
                      format="dd.mm.yyyy"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 flex items-center gap-2"
                      activeShiftBusinessDate={currentShiftDate}
                    />
                  </div>
                </div>

                {/* Time (24h) */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                    Saat (24 Saatlıq Rejim)
                  </label>
                  <input
                    type="text"
                    placeholder="14:30:00"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Reason Selection Chips */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                    Səbəb Seçimi
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {reasonChips.map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setSelectedReasonChip(chip)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                          selectedReasonChip === chip
                            ? (isDefective ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white')
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="və ya fərdi səbəbi qeyd edin..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Ləğv Et
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer ${
                      isDefective ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    Qeydiyyata Al
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
