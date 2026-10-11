export const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getActiveShiftBusinessDate = (): string => {
  try {
    const saved = localStorage.getItem('resto_activeShift');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.businessDate && typeof parsed.businessDate === 'string' && parsed.businessDate.trim() !== '') {
        const rawDate = parsed.businessDate.trim();
        let closedCount = 0;
        try {
          const savedClosed = localStorage.getItem('resto_closedShifts');
          if (savedClosed) {
            const parsedClosed = JSON.parse(savedClosed);
            const norm = normalizeDateKey(rawDate);
            const dayClosed = norm ? parsedClosed[norm] : null;
            if (dayClosed?.allShifts && Array.isArray(dayClosed.allShifts)) {
              closedCount = dayClosed.allShifts.length;
            } else if (dayClosed?.shiftId) {
              closedCount = 1;
            }
          }
        } catch (err) {
          console.error(err);
        }

        if (parsed.isClosed || closedCount >= 2) {
          const realToday = getTodayStr();
          return (realToday > rawDate) ? realToday : getNextDateStr(rawDate);
        }
        return rawDate;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return getTodayStr();
};

const MONTH_MAP: Record<string, string> = {
  yanvar: '01', yan: '01', january: '01', jan: '01', ocak: '01', январь: '01', янв: '01',
  fevral: '02', fev: '02', february: '02', feb: '02', şubat: '02', subat: '02', февраль: '02', фев: '02',
  mart: '03', mar: '03', march: '03', март: '03',
  aprel: '04', apr: '04', april: '04', nisan: '04', nis: '04', апрель: '04', апр: '04',
  may: '05', mayıs: '05', mayis: '05', май: '05',
  iyun: '06', iyn: '06', june: '06', jun: '06', haziran: '06', haz: '06', июнь: '06',
  iyul: '07', iyl: '07', july: '07', jul: '07', temmuz: '07', tem: '07', июль: '07',
  avqust: '08', avq: '08', august: '08', aug: '08', ağustos: '08', agustos: '08', ağu: '08', август: '08', авг: '08',
  sentyabr: '09', sen: '09', snt: '09', september: '09', sep: '09', eylül: '09', eyl: '09', сентябрь: '09', сен: '09',
  oktyabr: '10', okt: '10', october: '10', oct: '10', ekim: '10', eki: '10', октябрь: '10', окт: '10',
  noyabr: '11', noy: '11', november: '11', nov: '11', kasım: '11', kasim: '11', kas: '11', ноябрь: '11', ноя: '11',
  dekabr: '12', dek: '12', december: '12', dec: '12', aralık: '12', aralik: '12', ara: '12', декабрь: '12', дек: '12'
};

export interface ParsedDateInfo {
  year: string;
  month: string;
  day: string;
  ymd: string;
  ym: string;
  y: string;
}

export const parseDateToYMD = (val: any): ParsedDateInfo | null => {
  if (val === null || val === undefined || val === '') return null;
  
  if (typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const year = String(d.getFullYear());
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return { year, month, day, ymd: `${year}-${month}-${day}`, ym: `${year}-${month}`, y: year };
    }
  }

  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const year = String(val.getFullYear());
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      return { year, month, day, ymd: `${year}-${month}-${day}`, ym: `${year}-${month}`, y: year };
    }
  }

  let s = (val != null ? String(val) : '').trim();
  if (!s || s === 'null' || s === 'undefined' || s === '[object Object]') return null;

  // If ISO string with T or contains time part with space, separate date part
  let datePart = s;
  if (s.includes('T')) {
    datePart = s.split('T')[0].trim();
  } else if (s.includes(' ') && (s.includes('.') || s.includes('-') || s.includes('/'))) {
    const firstPart = s.split(' ')[0].trim();
    if (firstPart.includes('.') || firstPart.includes('-') || firstPart.includes('/')) {
      datePart = firstPart;
    }
  }

  // If contains dot: DD.MM.YYYY or YYYY.MM.DD
  if (datePart.includes('.')) {
    const parts = datePart.split('.');
    if (parts.length === 3) {
      if (parts[2].trim().length === 4) {
        const year = parts[2].trim().padStart(4, '0');
        const month = parts[1].trim().padStart(2, '0');
        const day = parts[0].trim().padStart(2, '0');
        return { year, month, day, ymd: `${year}-${month}-${day}`, ym: `${year}-${month}`, y: year };
      } else if (parts[0].trim().length === 4) {
        const year = parts[0].trim().padStart(4, '0');
        const month = parts[1].trim().padStart(2, '0');
        const day = parts[2].trim().padStart(2, '0');
        return { year, month, day, ymd: `${year}-${month}-${day}`, ym: `${year}-${month}`, y: year };
      }
    }
  }

  // If contains slash: DD/MM/YYYY or YYYY/MM/DD
  if (datePart.includes('/')) {
    const parts = datePart.split('/');
    if (parts.length === 3) {
      if (parts[2].trim().length === 4) {
        const year = parts[2].trim().padStart(4, '0');
        const month = parts[1].trim().padStart(2, '0');
        const day = parts[0].trim().padStart(2, '0');
        return { year, month, day, ymd: `${year}-${month}-${day}`, ym: `${year}-${month}`, y: year };
      } else if (parts[0].trim().length === 4) {
        const year = parts[0].trim().padStart(4, '0');
        const month = parts[1].trim().padStart(2, '0');
        const day = parts[2].trim().padStart(2, '0');
        return { year, month, day, ymd: `${year}-${month}-${day}`, ym: `${year}-${month}`, y: year };
      }
    }
  }

  // If contains dash: YYYY-MM-DD or DD-MM-YYYY or YYYY-MM
  if (datePart.includes('-')) {
    const parts = datePart.split('-');
    if (parts.length === 3) {
      if (parts[0].trim().length === 4) {
        const year = parts[0].trim().padStart(4, '0');
        const month = parts[1].trim().padStart(2, '0');
        const day = parts[2].trim().padStart(2, '0');
        return { year, month, day, ymd: `${year}-${month}-${day}`, ym: `${year}-${month}`, y: year };
      } else {
        const year = parts[2].trim().padStart(4, '0');
        const month = parts[1].trim().padStart(2, '0');
        const day = parts[0].trim().padStart(2, '0');
        return { year, month, day, ymd: `${year}-${month}-${day}`, ym: `${year}-${month}`, y: year };
      }
    } else if (parts.length === 2 && parts[0].trim().length === 4) {
      // e.g. 2026-09
      const year = parts[0].trim().padStart(4, '0');
      const month = parts[1].trim().padStart(2, '0');
      return { year, month, day: '01', ymd: `${year}-${month}-01`, ym: `${year}-${month}`, y: year };
    }
  }

  // Word-based dates like "2 Sentyabr 2026", "03 Sentyabr 2026", "Sentyabr 2026", "2026 M09", "2026-cı il"
  const cleanStr = s.toLowerCase().replace(/[,/.]/g, ' ');
  const tokens = cleanStr.split(/\s+/).filter(Boolean);

  let foundYear = '';
  let foundMonth = '';
  let foundDay = '';

  for (const token of tokens) {
    if (/^\d{4}$/.test(token)) {
      foundYear = token;
    } else if (/^\d{4}-/.test(token)) {
      foundYear = token.slice(0, 4);
    } else if (MONTH_MAP[token]) {
      foundMonth = MONTH_MAP[token];
    } else if (/^m\d{1,2}$/i.test(token)) {
      foundMonth = token.slice(1).padStart(2, '0');
    } else if (/^\d{1,2}$/.test(token)) {
      if (!foundDay) {
        foundDay = token.padStart(2, '0');
      }
    }
  }

  if (foundYear && foundMonth) {
    const day = foundDay || '01';
    return {
      year: foundYear,
      month: foundMonth,
      day,
      ymd: `${foundYear}-${foundMonth}-${day}`,
      ym: `${foundYear}-${foundMonth}`,
      y: foundYear
    };
  }

  if (foundYear) {
    return {
      year: foundYear,
      month: '01',
      day: '01',
      ymd: `${foundYear}-01-01`,
      ym: `${foundYear}-01`,
      y: foundYear
    };
  }

  return null;
};

export const normalizeDateKey = (val: any): string | null => {
  const parsed = parseDateToYMD(val);
  return parsed ? parsed.ymd : null;
};

export const matchesDatePeriod = (
  itemDateVal: any,
  targetDateVal: any,
  period: 'daily' | 'monthly' | 'yearly' | 'all' | 'custom' = 'daily'
): boolean => {
  if (period === 'all') return true;
  if (!itemDateVal) return false;
  if (!targetDateVal) return true;

  const itemObj = parseDateToYMD(itemDateVal);
  const targetObj = parseDateToYMD(targetDateVal);

  if (!itemObj || !targetObj) {
    const s1 = String(itemDateVal).trim();
    const s2 = String(targetDateVal).trim();
    return s1 === s2 || s1.includes(s2) || s2.includes(s1);
  }

  if (period === 'daily' || period === 'custom') {
    return itemObj.ymd === targetObj.ymd;
  } else if (period === 'monthly') {
    return itemObj.ym === targetObj.ym;
  } else if (period === 'yearly') {
    return itemObj.y === targetObj.y;
  }
  return false;
};

export interface ExpenseDeltaItem {
  dateKey: string;
  delta: number;
  csTotalExpenses: number;
  currentSum: number;
}

/**
 * Central single-source reconciliation helper for closed shifts expenses.
 * Shared by App.tsx (Dashboard stats) and ExpensesTab.tsx (visual list).
 */
export const calculateExpensesReconciliation = (
  closedShifts: Record<string, any> = {},
  targetDate: string,
  period: 'daily' | 'monthly' | 'yearly' | 'custom' | 'all',
  expensesByDate: Record<string, number>
): { totalExtraExpenses: number; deltasByDate: ExpenseDeltaItem[] } => {
  if (period !== 'monthly' && period !== 'yearly') {
    return { totalExtraExpenses: 0, deltasByDate: [] };
  }

  const processedDates = new Set<string>();
  const deltasByDate: ExpenseDeltaItem[] = [];
  let totalExtraExpenses = 0;

  Object.entries(closedShifts || {}).forEach(([csKey, cs]: [string, any]) => {
    if (!cs) return;
    const csDate = cs.date || cs.targetDateKey || csKey;
    if (!matchesDatePeriod(csDate, targetDate, period)) return;

    const normCsKey = normalizeDateKey(csDate) || String(csDate);
    if (processedDates.has(normCsKey)) return;
    processedDates.add(normCsKey);

    const shiftsForCs: any[] = (cs.allShifts && Array.isArray(cs.allShifts) && cs.allShifts.length > 0)
      ? cs.allShifts
      : [cs];

    let csTotalExpenses = 0;
    shiftsForCs.forEach(s => {
      csTotalExpenses += (s.stats?.totalExpenses ?? s.summary?.totalExpensesSum ?? 0);
    });

    const currentSum = expensesByDate[normCsKey] || 0;
    const delta = csTotalExpenses > currentSum ? Math.round((csTotalExpenses - currentSum) * 100) / 100 : 0;
    if (delta > 0) {
      totalExtraExpenses += delta;
      deltasByDate.push({
        dateKey: normCsKey,
        delta,
        csTotalExpenses,
        currentSum
      });
    }
  });

  return {
    totalExtraExpenses: Math.round(totalExtraExpenses * 100) / 100,
    deltasByDate
  };
};

export const formatAzDate = (dStr: string) => {
  if (!dStr) return '';
  if (dStr.includes('.')) return dStr;
  const parts = dStr.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
  }
  return dStr;
};

export const getNextDateStr = (val: string): string => {
  const p = parseDateToYMD(val);
  if (p) {
    const d = new Date(parseInt(p.year, 10), parseInt(p.month, 10) - 1, parseInt(p.day, 10));
    d.setDate(d.getDate() + 1);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    const nd = String(d.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

