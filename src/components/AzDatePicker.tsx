import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, GripHorizontal } from 'lucide-react';
import { AzDatePickerProps } from '../types';
import { parseDateToYMD } from '../utils/dateUtils';

export const AzDatePicker: React.FC<AzDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Tarix seçin",
  className = "",
  clearable = true,
  format = 'text',
  prefix,
  activeShiftBusinessDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Window drag state for moveable calendar window
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const modalRect = modalRef.current?.getBoundingClientRect();
    const currentX = modalRect ? modalRect.left : (position ? position.x : Math.max(10, Math.min(window.innerWidth - 330, window.innerWidth / 2 - 160)));
    const currentY = modalRect ? modalRect.top : (position ? position.y : 120);
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, posX: currentX, posY: currentY };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    const modalRect = modalRef.current?.getBoundingClientRect();
    const currentX = modalRect ? modalRect.left : (position ? position.x : Math.max(10, Math.min(window.innerWidth - 330, window.innerWidth / 2 - 160)));
    const currentY = modalRect ? modalRect.top : (position ? position.y : 120);
    dragStartRef.current = { startX: touch.clientX, startY: touch.clientY, posX: currentX, posY: currentY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 330, dragStartRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 420, dragStartRef.current.posY + dy))
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.startX;
      const dy = touch.clientY - dragStartRef.current.startY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 330, dragStartRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 420, dragStartRef.current.posY + dy))
      });
    };
    const handleTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const initialDate = useMemo(() => {
    const parsed = parseDateToYMD(value);
    if (parsed) {
      const y = parseInt(parsed.year, 10);
      const m = parseInt(parsed.month, 10) - 1;
      const d = parseInt(parsed.day, 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return { year: y, month: m, day: d };
      }
    }
    if (activeShiftBusinessDate) {
      const parsedShift = parseDateToYMD(activeShiftBusinessDate);
      if (parsedShift) {
        const y = parseInt(parsedShift.year, 10);
        const m = parseInt(parsedShift.month, 10) - 1;
        const d = parseInt(parsedShift.day, 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return { year: y, month: m, day: d };
        }
      }
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  }, [value, activeShiftBusinessDate]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);

  useEffect(() => {
    if (isOpen) {
      setViewYear(initialDate.year);
      setViewMonth(initialDate.month);
    }
  }, [isOpen, initialDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const azMonths = useMemo(() => [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 
    'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ], []);

  const azWeekDays = ['B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.', 'B.'];

  const displayLabel = useMemo(() => {
    if (!value) return placeholder;
    const parsed = parseDateToYMD(value);
    if (!parsed) return value;
    const y = parsed.year;
    const m = parsed.month;
    const d = parsed.day;

    if (format === 'dd.mm.yyyy') {
      return `${d}.${m}.${y}`;
    }

    const mIndex = parseInt(m, 10) - 1;
    const dayNum = parseInt(d, 10);
    const monthName = azMonths[mIndex] || m;
    return `${dayNum} ${monthName} ${y}`;
  }, [value, placeholder, azMonths, format]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({ day: dayNum, isCurrentMonth: false, dateStr });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, isCurrentMonth: true, dateStr });
    }

    const totalNeeded = cells.length > 35 ? 42 : 35;
    const trailingCount = totalNeeded - cells.length;
    for (let i = 1; i <= trailingCount; i++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, isCurrentMonth: false, dateStr });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const todayStr = useMemo(() => {
    if (activeShiftBusinessDate) return activeShiftBusinessDate;
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [activeShiftBusinessDate]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 whitespace-nowrap cursor-pointer select-none transition-all ${className || "px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"}`}
      >
        <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
        {prefix && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{prefix}</span>}
        <span className={value ? "text-slate-800 font-extrabold" : "text-slate-400 font-medium"}>
          {displayLabel}
        </span>
      </button>

      {isOpen && (
        <div 
          ref={modalRef}
          className="fixed bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 z-[9999] w-80 text-slate-800 font-sans animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: position ? `${position.x}px` : 'calc(50vw - 160px)',
            top: position ? `${position.y}px` : '120px'
          }}
        >
          {/* Draggable Window Header */}
          <div 
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 cursor-move select-none bg-slate-50/90 -mx-4 -mt-4 p-3 rounded-t-3xl text-slate-700"
          >
            <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-700">
              <GripHorizontal className="w-4 h-4 text-slate-400" />
              <span>Təqvim (Tarix Seçimi)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-1">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
              >
                {azMonths.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 15 }, (_, i) => 2020 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 rounded-xl hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 rounded-xl hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
              >
                ▶
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center gap-1 mb-2">
            {azWeekDays.map(wd => (
              <span key={wd} className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                {wd}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((cell, idx) => {
              const isSelected = value === cell.dateStr;
              const isToday = todayStr === cell.dateStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(cell.dateStr);
                    setIsOpen(false);
                  }}
                  className={`h-8 w-8 rounded-xl text-xs font-black flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-400'
                      : isToday
                      ? 'border-2 border-blue-500 text-blue-600 font-black'
                      : cell.isCurrentMonth
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            {clearable ? (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Təmizlə
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={() => {
                let targetDateStr = activeShiftBusinessDate;
                if (!targetDateStr) {
                  const today = new Date();
                  targetDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                }
                onChange(targetDateStr);
                const parsed = parseDateToYMD(targetDateStr);
                if (parsed) {
                  setViewYear(parseInt(parsed.year, 10));
                  setViewMonth(parseInt(parsed.month, 10) - 1);
                } else {
                  const today = new Date();
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                }
                setIsOpen(false);
              }}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              {activeShiftBusinessDate ? 'Cari Növbə' : 'Bu gün'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
