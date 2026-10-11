import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  Printer, 
  Tablet, 
  QrCode, 
  Undo2,
  Trash2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Table, MenuItem, OrderItem, StaffMember } from "../../types";

export interface TablesTabProps {
  isTabletMode: boolean;
  setSelectedTableId: (id: number | null) => void;
  t: any;
  tText: (key: string, defaultText?: string) => string;
  tables: Table[];
  activeOrders: Record<number, OrderItem[]>;
  selectedTableId: number | null;
  currencySymbol: string;
  menuFilter: string;
  menuSearch: string;
  setMenuSearch: (search: string) => void;
  setMenuFilter: (filter: string) => void;
  menuItems: MenuItem[];
  addToOrder: (item: MenuItem) => void;
  selectedTable: Table | undefined;
  isMoveTargetOpen: boolean;
  setIsMoveTargetOpen: (open: boolean) => void;
  cancelFullTable: () => void;
  transferTable: (targetTableId: number) => void;
  currentOrder: OrderItem[];
  updateQuantity: (itemId: number, delta: number) => void;
  deleteOrderItem?: (itemId: number, qtyToDelete?: number, reason?: string) => void;
  setItemActionModal: (modal: any) => void;
  setItemActionReason: (reason: string) => void;
  setItemActionSelectedChip: (chip: string) => void;
  toggleItemGift: (itemId: number, giftQty?: number) => void;
  showPaymentMethodSection: boolean;
  setShowPaymentMethodSection?: (show: boolean) => void;
  setPaymentMethod: (method: "cash" | "card" | "mixed" | "gift") => void;
  paymentMethod: "cash" | "card" | "mixed" | "gift";
  customMixedCash: string;
  setCustomMixedCash: (val: string) => void;
  setCustomMixedCard: (val: string) => void;
  sendToKitchen: () => void;
  handlePrintOrderReceipt: () => void;
  completeOrder: (forcedMethod?: "cash" | "card" | "mixed" | "gift") => void;
  waiterSelectionId: number | null;
  setWaiterSelectionId: (id: number | null) => void;
  assignWaiter: (waiterName: string) => void;
  staff: StaffMember[];
  formatPrice: (amount: number | string | undefined | null) => string;
}

export const TablesTab: React.FC<TablesTabProps> = ({
  isTabletMode,
  setSelectedTableId,
  t,
  tText,
  tables,
  activeOrders,
  selectedTableId,
  currencySymbol,
  menuFilter,
  setMenuFilter,
  menuSearch,
  setMenuSearch,
  menuItems,
  addToOrder,
  selectedTable,
  isMoveTargetOpen,
  setIsMoveTargetOpen,
  cancelFullTable,
  transferTable,
  currentOrder,
  updateQuantity,
  deleteOrderItem,
  setItemActionModal,
  setItemActionReason,
  setItemActionSelectedChip,
  toggleItemGift,
  showPaymentMethodSection,
  setPaymentMethod,
  paymentMethod,
  customMixedCash,
  setCustomMixedCash,
  setCustomMixedCard,
  sendToKitchen,
  handlePrintOrderReceipt,
  completeOrder,
  waiterSelectionId,
  setWaiterSelectionId,
  assignWaiter,
  staff,
  formatPrice
}) => {
  const [deleteSentItemModal, setDeleteSentItemModal] = useState<{
    item: OrderItem;
    qtyToDelete: number;
  } | null>(null);
  const [giftItemModal, setGiftItemModal] = useState<{
    item: OrderItem;
    qtyToGift: number;
  } | null>(null);
  const [deleteReasonSelectedChip, setDeleteReasonSelectedChip] = useState<string>('');
  const [deleteReasonText, setDeleteReasonText] = useState<string>('');

  const PRESET_DELETE_REASONS = [
    'Yanlış vurulub',
    'Müştəri imtina etdi',
    'Gecikmə oldu',
    'Tələb dəyişdirildi',
    'Digər səbəb'
  ];

  const getOrderItemTime = (item: OrderItem): string => {
    if (item.orderTime) return item.orderTime;
    if ((item as any).time) return (item as any).time;
    if ((item as any).timestamp) {
      const d = new Date((item as any).timestamp);
      if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    if (item.id && typeof item.id === 'number' && item.id > 1600000000000 && item.id < 2500000000000) {
      const d = new Date(item.id);
      if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    return '--:--';
  };

  const longPressTimerRef = React.useRef<any>(null);
  const isLongPressTriggeredRef = React.useRef(false);
  const touchStartPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const [activeTableHistoryMenu, setActiveTableHistoryMenu] = useState<{
    table: Table;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);

  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const startTableLongPress = (table: Table, el: HTMLElement, clientX?: number, clientY?: number) => {
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    if (clientX !== undefined && clientY !== undefined) {
      touchStartPosRef.current = { x: clientX, y: clientY };
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      const rect = el.getBoundingClientRect();
      setActiveTableHistoryMenu({
        table,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      });
    }, 1100); // 1-2 saniyə (1.1 san) basıb saxladıqda
  };

  const cancelTableLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const checkMoveAndCancelLongPress = (clientX: number, clientY: number) => {
    if (!touchStartPosRef.current) return;
    const dx = Math.abs(clientX - touchStartPosRef.current.x);
    const dy = Math.abs(clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancelTableLongPress();
    }
  };

  const getMenuPosition = (rect: { top: number; left: number; width: number; height: number }) => {
    const menuWidth = 280;
    const menuHeight = 320;
    const gap = 10;

    let left = rect.left + rect.width + gap;
    if (left + menuWidth > window.innerWidth - 12) {
      left = rect.left - menuWidth - gap;
      if (left < 12) {
        left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, rect.left));
      }
    }

    let top = rect.top;
    if (top + menuHeight > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - menuHeight - 12);
    }
    if (top < 12) top = 12;

    return { left, top };
  };

  const renderTableHistoryMenu = () => {
    if (!activeTableHistoryMenu) return null;

    const { left, top } = getMenuPosition(activeTableHistoryMenu.rect);
    const currentOrders = activeOrders[activeTableHistoryMenu.table.id] || [];
    const activeItems = currentOrders.filter(
      i => i.status !== 'cancelled' && i.status !== 'defective' && i.status !== 'returned'
    );

    return (
      <AnimatePresence>
        <div 
          className="fixed inset-0 z-[100] select-none"
          onClick={() => setActiveTableHistoryMenu(null)}
        >
          {/* Arxa fon bağlamaq üçün */}
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[0.5px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ top: `${top}px`, left: `${left}px` }}
            className="fixed z-[101] w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Başlıq */}
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
                  <Clock className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wide text-white">
                    {tText(activeTableHistoryMenu.table.number || `Masa ${activeTableHistoryMenu.table.id}`)}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {activeTableHistoryMenu.table.waiterName ? `Ofisiant: ${activeTableHistoryMenu.table.waiterName}` : 'Sifariş Vaxtları'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTableHistoryMenu(null)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sifarişlərin saatı və siyahısı */}
            <div className="p-3 max-h-72 overflow-y-auto space-y-1 divide-y divide-slate-100">
              {activeItems.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-bold">
                  {tText("Bu masada hələ aktiv sifariş yoxdur")}
                </div>
              ) : (
                activeItems.map((item, idx) => {
                  const itemTime = getOrderItemTime(item);

                  return (
                    <div key={item.id || idx} className="py-2 first:pt-1 last:pb-1 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">
                          {item.name}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] font-bold text-slate-400">{item.quantity} ədəd</p>
                        )}
                        {item.notes && (
                          <p className="text-[9px] text-slate-400 font-medium truncate">{item.notes}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg tracking-tight">
                          {itemTime}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Alt Məlumat */}
            {activeItems.length > 0 && (
              <div className="bg-slate-50 px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">
                  {activeItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} məhsul
                </span>
                <span className="text-xs font-black text-slate-800">
                  Cəmi: {activeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)} {currencySymbol}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  if (isTabletMode) {
          return (
            <div className="h-full flex gap-4 overflow-hidden p-4 font-sans" onClick={() => setSelectedTableId(null)}>
              {/* Left Column: Mini Table List (1/4 Width) */}
              <div 
                className="w-72 shrink-0 bg-white border border-slate-100 rounded-[28px] p-4 flex flex-col overflow-hidden shadow-xs" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 px-1 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.tables}</h4>
                  <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                    {tables.filter(ta => ta.status === 'occupied').length} / {tables.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {tables.map(table => {
                    const tableOrders = activeOrders[table.id] || [];
                    const hasPendingQR = tableOrders.some(o => o.status === 'pending' && o.isQR);

                    return (
                      <motion.div
                        key={table.id}
                        onPointerDown={(e) => {
                          if (e.button === 2) return;
                          startTableLongPress(table, e.currentTarget, e.clientX, e.clientY);
                        }}
                        onPointerUp={() => {
                          cancelTableLongPress();
                        }}
                        onPointerLeave={() => {
                          cancelTableLongPress();
                        }}
                        onPointerMove={(e) => {
                          checkMoveAndCancelLongPress(e.clientX, e.clientY);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          cancelTableLongPress();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveTableHistoryMenu({
                            table,
                            rect: {
                              top: rect.top,
                              left: rect.left,
                              width: rect.width,
                              height: rect.height
                            }
                          });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isLongPressTriggeredRef.current) {
                            isLongPressTriggeredRef.current = false;
                            return;
                          }
                          cancelTableLongPress();
                          if (table.status === 'available') {
                            setWaiterSelectionId(table.id);
                          } else {
                            setSelectedTableId(table.id);
                          }
                        }}
                        className={`p-3 rounded-2xl cursor-pointer transition-all border-2 flex items-center justify-between ${
                          table.id === selectedTableId 
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200 shadow-md shadow-orange-50/50' 
                            : hasPendingQR
                            ? 'bg-amber-500 border-amber-600 text-white shadow-sm ring-2 ring-amber-350 animate-pulse'
                            : table.status === 'occupied' 
                            ? 'bg-orange-500 border-orange-600 text-white shadow-sm' 
                            : table.status === 'reserved' 
                            ? 'bg-blue-500 border-blue-600 text-white shadow-sm' 
                            : 'bg-white border-dashed border-slate-200 hover:border-orange-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                            table.id === selectedTableId ? 'bg-orange-100 border border-orange-300 text-orange-850' :
                            hasPendingQR ? 'bg-white/20 text-white' :
                            (table.status === 'occupied' || table.status === 'reserved') ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-700 border border-slate-100'
                          }`}>
                            {table.number.split(' ')[1] || table.number}
                          </div>
                          <div>
                            <p className={`text-xs font-black truncate max-w-[100px] ${
                              table.id === selectedTableId ? 'text-orange-950' :
                              (table.status === 'occupied' || table.status === 'reserved') ? 'text-white' : 'text-slate-700'
                            }`}>{table.number}</p>
                            <p className={`text-[9px] font-bold ${
                              table.id === selectedTableId ? 'text-orange-600' :
                              (table.status === 'occupied' || table.status === 'reserved') ? 'text-white/80' : 'text-slate-400'
                            }`}>
                              {hasPendingQR ? '⚡ QR Sifariş (Təsdiqlə)' : table.waiterName || `${table.capacity} ${t.guests}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {table.orderTotal ? (
                            <span className={`text-[10px] font-black ${
                              (table.status === 'occupied' || table.status === 'reserved') ? 'text-white bg-black/15 shadow-inner' : 'text-slate-800 bg-slate-50'
                            } px-2 py-1 rounded-lg`}>
                              {table.orderTotal.toFixed(1)} ₼
                            </span>
                          ) : (
                            <span className={`text-[8px] font-extrabold uppercase tracking-tight py-0.5 px-1.5 rounded-md ${
                              table.status === 'reserved' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-150'
                            }`}>
                              {table.status === 'reserved' ? 'REZ' : 'BOŞ'}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Center & Right Column: Display Details */}
              {selectedTableId ? (
                <div className="flex-1 flex gap-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  {/* Middle Column: Dishes Grid */}
                  <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm h-full">
                    <div className="p-4 border-b border-slate-50 flex flex-col gap-3 shrink-0">
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
                        {['Hamısı', ...Array.from(new Set(menuItems.map(m => m.category)))].map(cat => {
                          const catTranslated = cat === 'Hamısı' ? t.allDishes : cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => setMenuFilter(cat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                                menuFilter === cat ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-10 border border-slate-100'
                              }`}
                            >
                              {catTranslated}
                            </button>
                          );
                        })}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder={t.dishSearch} 
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {menuItems
                          .filter(item => (menuFilter === 'Hamısı' || item.category === menuFilter) && (item.name || '').toLowerCase().includes((menuSearch || '').toLowerCase()))
                          .map(item => (
                          <motion.button
                            key={item.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addToOrder(item)}
                            className="bg-white border border-slate-100 rounded-2xl hover:border-orange-500 hover:shadow-lg hover:shadow-orange-50/40 transition-all text-left flex flex-col h-40 group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-8 h-8 bg-orange-500 text-white flex items-center justify-center translate-x-8 -translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform rounded-bl-xl shadow-md z-10">
                              <Plus className="w-4 h-4" />
                            </div>
                            
                            <div className="w-full h-24 bg-slate-50 relative overflow-hidden shrink-0">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-305"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full bg-orange-50 text-orange-400 flex items-center justify-center font-black text-xs uppercase">
                                  {item.name.substring(0, 2)}
                                </div>
                              )}
                              <span className="absolute bottom-2 left-2 text-[8px] font-black text-slate-500 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
                                {item.category}
                              </span>
                            </div>

                            <div className="p-2 flex flex-col justify-between flex-1 min-w-0 w-full">
                              <div className="flex justify-between items-start gap-1 w-full">
                                <p className="font-extrabold text-slate-800 text-xs leading-tight line-clamp-1 flex-1" title={item.name}>
                                  {item.name}
                                </p>
                                <p className="text-orange-600 font-extrabold text-xs shrink-0 whitespace-nowrap bg-orange-50 px-1.5 py-0.5 rounded-md">
                                  {item.price.toFixed(2)} ₼
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Mini Bill/Cart details */}
                  <div className="w-80 flex flex-col overflow-hidden h-full shrink-0">
                    <div className="flex-1 bg-white rounded-[28px] border border-slate-100 shadow-lg flex flex-col overflow-hidden">
                      <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/20 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-md shadow-orange-100">
                            {selectedTable?.number.split(' ')[1] || selectedTable?.number}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-xs leading-none mb-1">{selectedTable?.number}</p>
                            <p className="text-[9px] text-orange-600 font-black uppercase tracking-wider">
                              {selectedTable?.waiterName || t.waiterNotDefined}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={cancelFullTable}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Sifarişi Ləğv Et"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0 scrollbar-thin" id="tablet-cart-scroll">
                        {currentOrder.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
                            <Package className="w-10 h-10 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{t.emptyOrder}</p>
                          </div>
                        ) : (
                          <div className="space-y-3 pb-2">
                            {currentOrder.map(item => {
                              const isCancelled = item.status === 'cancelled';
                              const isDefective = item.status === 'defective';
                              const isReturned = item.status === 'returned';
                              const isVoided = isCancelled || isDefective || isReturned;

                              return (
                                <div key={item.id} className={`p-3 rounded-xl border transition-colors duration-150 ${
                                  isCancelled ? 'bg-red-50/80 border-red-200' :
                                  isDefective ? 'bg-rose-50 border-rose-100' :
                                  isReturned ? 'bg-amber-50 border-amber-100' :
                                  item.status === 'sent' ? 'bg-slate-50 border-slate-100' :
                                  'bg-orange-50/20 border-orange-100 shadow-xs'
                                }`}>
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="flex-1 pr-1">
                                      <p className={`font-bold text-xs leading-tight flex items-center flex-wrap gap-1 ${isVoided ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                        {item.quantity}x {item.name}
                                        {item.isGift && (
                                          <span className="text-[7.5px] font-black tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded leading-none">HƏDİYYƏ</span>
                                        )}
                                        {isCancelled && (
                                          <span className="text-[7.5px] font-black tracking-widest text-red-600 bg-red-100 border border-red-200 px-1 py-0.5 rounded leading-none not-italic no-underline">
                                            SİLİNDİ {item.deleteReason ? `(${item.deleteReason})` : ''}
                                          </span>
                                        )}
                                        {isDefective && (
                                          <span className="text-[7.5px] font-black tracking-widest text-rose-600 bg-rose-100 border border-rose-200 px-1 py-0.5 rounded leading-none not-italic no-underline">
                                            XARAB
                                          </span>
                                        )}
                                        {isReturned && (
                                          <span className="text-[7.5px] font-black tracking-widest text-amber-600 bg-amber-100 border border-amber-200 px-1 py-0.5 rounded leading-none not-italic no-underline">
                                            GERİ ALINDI
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[9px] font-black text-slate-400 tracking-tight mt-1">
                                        {isVoided ? (
                                          <span className="line-through text-slate-300">{(item.price * item.quantity).toFixed(2)} ₼</span>
                                        ) : item.isGift ? (
                                          <>
                                            <span className="line-through text-slate-300">{(item.price * item.quantity).toFixed(2)} ₼</span>{" "}
                                            <span className="text-amber-600 font-extrabold">0.00 ₼</span>
                                          </>
                                        ) : (
                                          <span>{(item.price * item.quantity).toFixed(2)} ₼</span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      {item.status === 'pending' ? (
                                        <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden select-none shrink-0 h-9">
                                          <button 
                                            type="button"
                                            onClick={() => updateQuantity(item.id, -1)} 
                                            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 text-sm font-black transition-colors active:scale-90"
                                          >
                                            -
                                          </button>
                                          <span className="w-8 text-center font-black text-xs text-slate-800">{item.quantity}</span>
                                          <button 
                                            type="button"
                                            onClick={() => updateQuantity(item.id, 1)} 
                                            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 text-sm font-black transition-colors active:scale-90"
                                          >
                                            +
                                          </button>
                                        </div>
                                      ) : item.status === 'sent' ? (
                                        <div className="flex items-center gap-1 shrink-0 h-9">
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              const tbl = tables.find(t => t.id === selectedTableId);
                                              setItemActionModal({
                                                itemId: item.id,
                                                actionType: 'defective',
                                                dishName: item.name,
                                                price: item.price,
                                                tableNumber: tbl?.number || `Masa ${selectedTableId}`
                                              });
                                              setItemActionReason('');
                                              setItemActionSelectedChip('');
                                            }}
                                            className="h-8 px-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg shadow-xs text-[8px] font-black uppercase border border-rose-200 flex items-center gap-0.5 cursor-pointer shrink-0 whitespace-nowrap"
                                            title="Xarab"
                                          >
                                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                            <span>Xarab</span>
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              const tbl = tables.find(t => t.id === selectedTableId);
                                              setItemActionModal({
                                                itemId: item.id,
                                                actionType: 'returned',
                                                dishName: item.name,
                                                price: item.price,
                                                tableNumber: tbl?.number || `Masa ${selectedTableId}`
                                              });
                                              setItemActionReason('');
                                              setItemActionSelectedChip('');
                                            }}
                                            className="h-8 px-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg shadow-xs text-[8px] font-black uppercase border border-amber-200 flex items-center gap-0.5 cursor-pointer shrink-0 whitespace-nowrap"
                                            title="Geri al"
                                          >
                                            <Undo2 className="w-2.5 h-2.5 shrink-0" />
                                            <span>Geri</span>
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setDeleteReasonSelectedChip('');
                                              setDeleteReasonText('');
                                              setDeleteSentItemModal({
                                                item,
                                                qtyToDelete: 1
                                              });
                                            }}
                                            className="h-8 px-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg shadow-xs text-[8px] font-black uppercase border border-red-200 flex items-center gap-0.5 cursor-pointer shrink-0 whitespace-nowrap"
                                            title="Sil"
                                          >
                                            <Trash2 className="w-2.5 h-2.5 shrink-0" />
                                            <span>Sil</span>
                                          </button>
                                        </div>
                                      ) : isCancelled ? (
                                        <span className="text-[8px] font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">Silindi</span>
                                      ) : isDefective ? (
                                        <span className="text-[8px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">Xarab</span>
                                      ) : isReturned ? (
                                        <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Geri</span>
                                      ) : (
                                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md text-red-500 bg-red-50">Ləğv</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Payment Bottom Section inside Right Column */}
                      {(() => {
                        const orderTotal = selectedTable?.orderTotal || 0;
                        const hasPendingItems = currentOrder.some(i => i.status === 'pending' || i.status === 'cancelled' || i.status === 'defective' || i.status === 'returned');
                        const hasAnyItems = currentOrder.length > 0;

                        return (
                          <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex flex-col gap-3">
                            <div className="flex justify-between items-center px-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t.totalAmount}</p>
                              <p className="text-lg font-black text-slate-800">
                                {orderTotal.toFixed(2)} <span className="text-xs font-medium opacity-60">₼</span>
                              </p>
                            </div>

                            {/* Ödəniş Üsulu Seçimi (Ctrl+G ilə açılır, Ctrl+B ilə gizlənir) */}
                            {showPaymentMethodSection && (
                              <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t.paymentMethod || "ÖDƏNİŞ ÜSULU"}</p>
                                  <span className="text-[8px] font-bold text-slate-400">Ctrl+B (gizlət)</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`py-1.5 px-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer ${
                                      paymentMethod === 'cash'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {t.cash || "NƏĞD"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`py-1.5 px-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer ${
                                      paymentMethod === 'card'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {t.card || "KARTLA"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPaymentMethod('mixed')}
                                    className={`py-1.5 px-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer ${
                                      paymentMethod === 'mixed'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {t.mixed || "NƏĞD/KART"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPaymentMethod('gift')}
                                    className={`py-1.5 px-1 rounded-xl text-[9px] font-black uppercase transition-all cursor-pointer ${
                                      paymentMethod === 'gift'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {t.gift || "HƏDİYYƏ"}
                                  </button>
                                </div>

                                {/* Nəğd/Kart Seçildikdə Nəğd hissə inputu və Kart qalıq hissəsi */}
                                {paymentMethod === 'mixed' && (
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col gap-2 animate-in fade-in">
                                    <div className="flex items-center justify-between text-[9px] font-black text-slate-600">
                                      <span>NƏĞD / KART BÖLGÜSÜ</span>
                                      <span className="text-orange-600 font-bold">{orderTotal.toFixed(2)} ₼</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[8px] font-bold text-slate-500 uppercase">Nəğd Hissə:</label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max={orderTotal}
                                          value={customMixedCash}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setCustomMixedCash(val);
                                            const nVal = parseFloat(val) || 0;
                                            const remaining = Math.max(0, Math.round((orderTotal - nVal) * 100) / 100);
                                            setCustomMixedCard(remaining.toString());
                                          }}
                                          placeholder="0.00"
                                          className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 outline-none"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[8px] font-bold text-slate-500 uppercase">Kart Hissəsi (Qalıq):</label>
                                        <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 flex items-center justify-between">
                                          <span>{((Math.max(0, Math.round((orderTotal - (parseFloat(customMixedCash) || 0)) * 100) / 100))).toFixed(2)}</span>
                                          <span className="text-[9px] text-slate-400">₼</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 block">
                              {hasPendingItems ? (
                                <button 
                                  onClick={sendToKitchen}
                                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-xl text-[9px] font-black tracking-widest text-slate-700 transition-all flex items-center justify-center uppercase cursor-pointer"
                                >
                                  {t.sendToKitchen || "MƏTBƏXƏ GÖNDƏR"}
                                </button>
                              ) : (
                                <button 
                                  onClick={handlePrintOrderReceipt}
                                  disabled={!hasAnyItems}
                                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 py-2.5 rounded-xl text-[9px] font-black tracking-widest text-slate-800 transition-all flex items-center justify-center gap-1 uppercase disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  {t.printCheck || "ÇEKİ ÇAP ET"}
                                </button>
                              )}
                              <button 
                                onClick={() => completeOrder(paymentMethod)}
                                disabled={!hasAnyItems}
                                className="bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-[9px] font-black tracking-widest shadow-md shadow-orange-100 transition-all flex items-center justify-center uppercase disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                              >
                                {t.payOrder || "ÖDƏNİŞƏ KEÇ"}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-white rounded-[28px] border border-slate-100 flex items-center justify-center text-slate-300 shadow-xs h-full">
                  <div className="text-center p-6 select-none">
                    <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-slate-100 animate-pulse">
                      <Tablet className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">{t.noTableSelected}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1.5">{t.selectToOrder}</p>
                  </div>
                </div>
              )}

              {/* Waiter Selection Modal */}
              <AnimatePresence>
                {waiterSelectionId && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
                    onClick={() => setWaiterSelectionId(null)}
                  >
                    <motion.div 
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-6 border-b border-slug text-center bg-slate-50/50">
                        <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <h4 className="text-md font-black text-slate-800">{tText("Ofisiant Təyin Et")}</h4>
                      </div>
                      <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                        {staff.filter(s => (s.role || '').toLowerCase().includes('ofisiant')).map(member => (
                          <button
                            key={member.id}
                            onClick={() => assignWaiter(member.name)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-xs">{member.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{tText(member.role)}</span>
                            </div>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                              member.status === 'on-shift' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-150 text-slate-500'
                            }`}>
                              {member.status === 'on-shift' ? tText('Növbədə') : tText('Deyil')}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="p-4 bg-slate-50">
                        <button 
                          onClick={() => setWaiterSelectionId(null)}
                          className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs"
                        >
                          {tText("Ləğv Et")}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Masa Sifariş Saatları Menyusu */}
              {renderTableHistoryMenu()}
            </div>
          );
        }

        return (
          <div className="h-full flex gap-4 overflow-hidden p-4" onClick={() => setSelectedTableId(null)}>
            {/* Left: Table List */}
            {!selectedTableId && (
              <div className="transition-all duration-300 overflow-y-auto shrink-0 w-full animate-fade-in">
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                  {tables.map(table => {
                    const tableOrders = activeOrders[table.id] || [];
                    const hasPendingQR = tableOrders.some(o => o.status === 'pending' && o.isQR);

                    return (
                      <motion.div
                        key={table.id}
                        onPointerDown={(e) => {
                          if (e.button === 2) return;
                          startTableLongPress(table, e.currentTarget, e.clientX, e.clientY);
                        }}
                        onPointerUp={() => {
                          cancelTableLongPress();
                        }}
                        onPointerLeave={() => {
                          cancelTableLongPress();
                        }}
                        onPointerMove={(e) => {
                          checkMoveAndCancelLongPress(e.clientX, e.clientY);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          cancelTableLongPress();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveTableHistoryMenu({
                            table,
                            rect: {
                              top: rect.top,
                              left: rect.left,
                              width: rect.width,
                              height: rect.height
                            }
                          });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isLongPressTriggeredRef.current) {
                            isLongPressTriggeredRef.current = false;
                            return;
                          }
                          cancelTableLongPress();
                          if (table.status === 'available') {
                            setWaiterSelectionId(table.id);
                          } else {
                            setSelectedTableId(table.id);
                          }
                        }}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border-2 relative h-28 flex flex-col justify-between ${
                          table.id === selectedTableId ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200' :
                          hasPendingQR ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-100 ring-2 ring-amber-300 animate-pulse' :
                          table.status === 'occupied' ? 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-100' :
                          table.status === 'reserved' ? 'bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-100' :
                          'bg-white border-dashed border-slate-200 hover:border-orange-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-sm font-black ${
                            table.id === selectedTableId ? 'text-orange-600' : 
                            (table.status === 'occupied' || table.status === 'reserved') ? 'text-white' : 'text-slate-600'
                          }`}>{tText(table.number)}</span>
                          {(table.status === 'occupied' && !hasPendingQR) && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          )}
                          {hasPendingQR && (
                            <div className="px-1.5 py-0.5 rounded-md bg-white/20 text-[8px] font-black tracking-widest text-white shrink-0 mt-0.5 animate-pulse uppercase">
                              {tText("YENİ QR")}
                            </div>
                          )}
                        </div>
                        <div>
                          {table.orderTotal ? (
                            <p className={`text-sm font-black ${table.status === 'occupied' ? 'text-white' : 'text-slate-800'}`}>{formatPrice(table.orderTotal)}</p>
                          ) : (
                            <p className={`text-[10px] font-bold uppercase tracking-tighter ${
                              (table.status === 'occupied' || table.status === 'reserved') ? 'text-white/70' : 'text-slate-400'
                            }`}>
                              {table.waiterName ? table.waiterName : tText(`${table.capacity} Nəfərlik`)}
                            </p>
                          )}
                          {(table.status === 'occupied' || table.status === 'reserved') && table.orderTotal && table.waiterName && (
                            <p className="text-[8px] font-black uppercase tracking-tighter text-white/70 mt-1">
                              {hasPendingQR ? tText('⚡ QR Sifariş var') : table.waiterName}
                            </p>
                          )}
                        </div>
                        {(table.status === 'occupied' || table.status === 'reserved') && (
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            {hasPendingQR ? (
                              <QrCode className="w-4 h-4 text-white animate-bounce" />
                            ) : table.status === 'reserved' ? (
                              <Clock className="w-3 h-3 text-white/80" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Waiter Selection Modal */}
            <AnimatePresence>
              {waiterSelectionId && !selectedTableId && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                  onClick={() => setWaiterSelectionId(null)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-8 border-b border-slate-100 text-center">
                      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800">{tText("Ofisiant Təyin Et")}</h3>
                      <p className="text-sm text-slate-400 font-medium mt-1">
                        {tText(tables.find(t => t.id === waiterSelectionId)?.number || '')} {tText("üçün xidmət edəcək işçini seçin")}
                      </p>
                    </div>
                    <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
                      {staff.filter(s => (s.role || '').toLowerCase().includes('ofisiant')).map(member => (
                        <button
                          key={member.id}
                          onClick={() => assignWaiter(member.name)}
                          className="w-full flex items-center p-4 rounded-2xl border border-slate-100 hover:border-orange-500 hover:bg-orange-50 transition-all group"
                        >
                          <div className="w-10 h-10 bg-slate-100 rounded-full mr-4 overflow-hidden border-2 border-white shadow-sm relative shrink-0">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} referrerPolicy="no-referrer" />
                             <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${
                               member.status === 'on-shift' ? 'bg-emerald-500' : 'bg-slate-300'
                             }`} />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-800 group-hover:text-orange-600 truncate">{member.name}</p>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                member.status === 'on-shift' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {member.status === 'on-shift' ? tText('Növbədə') : tText('Deyil')}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tText(member.role)}</p>
                          </div>
                          <Plus className="w-5 h-5 text-slate-300 group-hover:text-orange-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                    <div className="p-6 bg-slate-50">
                      <button 
                        onClick={() => setWaiterSelectionId(null)}
                        className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                      >
                        {tText("Ləğv Et")}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right: Order Interface */}
            {selectedTableId ? (
              <div className="flex-1 flex gap-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Menu Selection (Fast Access) */}
                <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-50 flex flex-col gap-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {['Hamısı', ...Array.from(new Set(menuItems.map(m => m.category)))].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setMenuFilter(cat)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                            menuFilter === cat ? 'bg-orange-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Məhsul axtar..." 
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
                      {menuItems
                        .filter(item => (menuFilter === 'Hamısı' || item.category === menuFilter) && (item.name || '').toLowerCase().includes((menuSearch || '').toLowerCase()))
                        .map(item => (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addToOrder(item)}
                          className="bg-white border border-slate-100 rounded-2xl hover:border-orange-500 hover:shadow-lg hover:shadow-orange-50 transition-all text-left flex flex-col h-48 group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-10 h-10 bg-orange-500 text-white flex items-center justify-center translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform rounded-bl-2xl shadow-lg z-10">
                            <Plus className="w-5 h-5" />
                          </div>
                          
                          {/* Full-width image at the top */}
                          <div className="w-full h-28 bg-slate-50 relative overflow-hidden shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-305"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-orange-50 text-orange-400 flex items-center justify-center font-black text-sm uppercase">
                                {item.name.substring(0, 2)}
                              </div>
                            )}
                            <span className="absolute bottom-2 left-2 text-[9px] font-bold text-slate-500 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                              {item.category}
                            </span>
                          </div>

                          {/* Details & Name at the bottom */}
                          <div className="p-3 flex flex-col justify-between flex-1 min-w-0 w-full">
                            <div className="flex justify-between items-start gap-2 w-full">
                              <p className="font-black text-slate-800 text-[13px] leading-tight line-clamp-2 flex-1" title={item.name}>
                                {item.name}
                              </p>
                              <p className="text-orange-600 font-black text-sm shrink-0 whitespace-nowrap">
                                {item.price.toFixed(2)} ₼
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bill Section */}
                <div className="w-96 flex flex-col overflow-hidden h-full">
                  <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-orange-100">
                          {selectedTable?.number.split(' ')[1]}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm leading-none mb-1">{selectedTable?.number}</p>
                          <p className="text-[10px] text-orange-600 font-black uppercase tracking-wider">
                            {selectedTable?.waiterName || t.waiterNotDefined}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => setSelectedTableId(null)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1 text-slate-600"
                          title="Masalar Siyahısına Geri Dön"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
                          <span>Geri</span>
                        </button>
                        <button 
                          onClick={() => setIsMoveTargetOpen(!isMoveTargetOpen)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Masayı Dəyişdir"
                        >
                          <LayoutDashboard className="w-4 h-4 rotate-90" />
                        </button>
                        <button 
                          onClick={cancelFullTable}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Sifarişi Ləğv Et"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isMoveTargetOpen && (
                      <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col gap-2 shrink-0">
                        <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Köçürüləcək Masa Seçin:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                          {tables.filter(t => t.status === 'available').map(t => (
                            <button 
                              key={t.id}
                              onClick={() => transferTable(t.id)}
                              className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-500 hover:text-white transition-all whitespace-nowrap"
                            >
                              {t.number}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 min-h-0" id="standard-cart-scroll">
                      {currentOrder.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
                          <Package className="w-12 h-12 mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest">Boş Sifariş</p>
                        </div>
                      ) : (
                        <div className="space-y-4 pb-4">
                          {currentOrder.map(item => {
                            const isCancelled = item.status === 'cancelled';
                            const isDefective = item.status === 'defective';
                            const isReturned = item.status === 'returned';
                            const isVoided = isCancelled || isDefective || isReturned;

                            return (
                              <div key={item.id} className={`p-4 rounded-2xl border transition-colors duration-150 ${
                                isCancelled ? 'bg-red-50/80 border-red-200' :
                                isDefective ? 'bg-rose-50 border-rose-100' :
                                isReturned ? 'bg-amber-50 border-amber-100' :
                                item.status === 'sent' ? 'bg-slate-50 border-slate-100' :
                                'bg-orange-50/30 border-orange-100 shadow-sm'
                              }`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1 pr-2">
                                    <p className={`font-bold text-sm leading-tight flex items-center flex-wrap gap-1 ${isVoided ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                      {item.quantity}x {item.name}
                                      {item.isGift && (
                                        <span className="text-[7.5px] font-black tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded leading-none">HƏDİYYƏ</span>
                                      )}
                                      {isCancelled && (
                                        <span className="text-[7.5px] font-black tracking-widest text-red-600 bg-red-100 border border-red-200 px-1 py-0.5 rounded leading-none not-italic no-underline">
                                          SİLİNDİ {item.deleteReason ? `(${item.deleteReason})` : ''}
                                        </span>
                                      )}
                                      {isDefective && (
                                        <span className="text-[7.5px] font-black tracking-widest text-rose-600 bg-rose-100 border border-rose-200 px-1 py-0.5 rounded leading-none not-italic no-underline">
                                          XARAB
                                        </span>
                                      )}
                                      {isReturned && (
                                        <span className="text-[7.5px] font-black tracking-widest text-amber-600 bg-amber-100 border border-amber-200 px-1 py-0.5 rounded leading-none not-italic no-underline">
                                          GERİ ALINDI
                                        </span>
                                      )}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                        {isVoided ? (
                                          <span className="line-through text-slate-300">{(item.price * item.quantity).toFixed(2)} ₼</span>
                                        ) : item.isGift ? (
                                          <>
                                            <span className="line-through text-slate-300">{(item.price * item.quantity).toFixed(2)} ₼</span>{" "}
                                            <span className="text-amber-600 font-extrabold">0.00 ₼</span>
                                          </>
                                        ) : (
                                          <span>{(item.price * item.quantity).toFixed(2)} ₼</span>
                                        )}
                                      </p>
                                      <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.2 rounded leading-tight">
                                        🕒 {getOrderItemTime(item)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    {item.status === 'pending' ? (
                                      <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden select-none shrink-0 h-9">
                                        <button 
                                          type="button"
                                          onClick={() => updateQuantity(item.id, -1)} 
                                          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 text-sm font-black transition-colors active:scale-90"
                                        >
                                          -
                                        </button>
                                        <span className="w-8 text-center font-black text-xs text-slate-800">{item.quantity}</span>
                                        <button 
                                          type="button"
                                          onClick={() => updateQuantity(item.id, 1)} 
                                          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 text-sm font-black transition-colors active:scale-90"
                                        >
                                          +
                                        </button>
                                      </div>
                                    ) : item.status === 'sent' ? (
                                      <div className="flex items-center gap-1 shrink-0 h-9">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            const tbl = tables.find(t => t.id === selectedTableId);
                                            setItemActionModal({
                                              itemId: item.id,
                                              actionType: 'defective',
                                              dishName: item.name,
                                              price: item.price,
                                              tableNumber: tbl?.number || `Masa ${selectedTableId}`
                                            });
                                            setItemActionReason('');
                                            setItemActionSelectedChip('');
                                          }}
                                          className="h-8 px-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg shadow-xs text-[8px] font-black uppercase border border-rose-200 flex items-center gap-0.5 cursor-pointer shrink-0 whitespace-nowrap"
                                          title="Xarab məhsul kimi qeyd et"
                                        >
                                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                          <span>Xarab</span>
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            const tbl = tables.find(t => t.id === selectedTableId);
                                            setItemActionModal({
                                              itemId: item.id,
                                              actionType: 'returned',
                                              dishName: item.name,
                                              price: item.price,
                                              tableNumber: tbl?.number || `Masa ${selectedTableId}`
                                            });
                                            setItemActionReason('');
                                            setItemActionSelectedChip('');
                                          }}
                                          className="h-8 px-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg shadow-xs text-[8px] font-black uppercase border border-amber-200 flex items-center gap-0.5 cursor-pointer shrink-0 whitespace-nowrap"
                                          title="Müştəri geri qaytardı"
                                        >
                                          <Undo2 className="w-2.5 h-2.5 shrink-0" />
                                          <span>Geri al</span>
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setDeleteReasonSelectedChip('');
                                            setDeleteReasonText('');
                                            setDeleteSentItemModal({
                                              item,
                                              qtyToDelete: 1
                                            });
                                          }}
                                          className="h-8 px-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg shadow-xs text-[8px] font-black uppercase border border-red-200 flex items-center gap-0.5 cursor-pointer shrink-0 whitespace-nowrap"
                                          title="Sifarişdən sil"
                                        >
                                          <Trash2 className="w-2.5 h-2.5 shrink-0" />
                                          <span>Sil</span>
                                        </button>
                                      </div>
                                    ) : isCancelled ? (
                                      <span className="text-[8px] font-black uppercase text-red-600 bg-red-100 px-2 py-1 rounded-lg border border-red-200">Silindi</span>
                                    ) : isDefective ? (
                                      <span className="text-[8px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">Xarab Çıxdı</span>
                                    ) : isReturned ? (
                                      <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">Geri Qaytarıldı</span>
                                    ) : (
                                      <span className="text-[8px] font-black uppercase text-red-500 bg-white px-2 py-1 rounded-lg border border-red-100">Ləğv Edildi</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/40 text-[9px] font-black uppercase tracking-wider gap-2">
                                  <span className={`${
                                    item.status === 'sent' ? 'text-green-600' :
                                    item.status === 'defective' ? 'text-red-500' :
                                    item.status === 'returned' ? 'text-amber-600' :
                                    item.status === 'cancelled' ? 'text-red-600' :
                                    'text-orange-500 animate-pulse'
                                  }`}>
                                    {item.status === 'sent' ? 'Hazırlanır' : item.status === 'defective' ? 'Xarab Çıxıb' : item.status === 'returned' ? 'Geri Qaytarılıb' : item.status === 'cancelled' ? 'Silinib (Ləğv)' : 'Təsdiq Gözləyir'}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {item.status !== 'defective' && item.status !== 'cancelled' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (item.isGift) {
                                            toggleItemGift(item.id);
                                          } else {
                                            setGiftItemModal({
                                              item,
                                              qtyToGift: 1
                                            });
                                          }
                                        }}
                                        className={`px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                          item.isGift
                                            ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600 shadow-xs'
                                            : 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300'
                                        }`}
                                        title={item.isGift ? 'Gifti sil' : 'Hədiyyə et'}
                                      >
                                        🎁 {item.isGift ? 'Hədiyyə sil' : 'Hədiyyə et'}
                                      </button>
                                    )}
                                    {item.status === 'defective' && (
                                      <button 
                                        onClick={() => {
                                          const menuItem = menuItems.find(m => m.id === item.menuId);
                                          if (menuItem) addToOrder(menuItem);
                                        }}
                                        className="text-blue-600 border border-blue-200 bg-white px-3 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                      >
                                        Yenilə
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {(() => {
                      const orderTotal = selectedTable?.orderTotal || 0;
                      const hasPendingItems = currentOrder.some(i => i.status === 'pending' || i.status === 'cancelled' || i.status === 'defective' || i.status === 'returned');
                      const hasAnyItems = currentOrder.length > 0;

                      return (
                        <div className="p-5 border-t border-slate-100 bg-white shrink-0 z-10 sticky bottom-0 flex flex-col gap-3.5">
                          {/* Payment Header & Total */}
                          <div className="flex justify-between items-center px-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.totalAmount || "CƏMİ MƏBLƏĞ"}</p>
                            <p className="text-2xl font-black text-slate-800">
                              {orderTotal.toFixed(2)} <span className="text-sm font-medium opacity-60">₼</span>
                            </p>
                          </div>

                          {/* Ödəniş Üsulu Seçimi (Ctrl+G ilə açılır, Ctrl+B ilə gizlənir) */}
                          {showPaymentMethodSection && (
                            <div className="flex flex-col gap-2.5 pt-1 border-t border-slate-100 animate-in fade-in">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t.paymentMethod || "ÖDƏNİŞ ÜSULU"}</p>
                                <span className="text-[9px] font-bold text-slate-400">Ctrl+B (gizlət)</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('cash')}
                                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    paymentMethod === 'cash'
                                      ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {t.cash || "NƏĞD"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('card')}
                                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    paymentMethod === 'card'
                                      ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {t.card || "KART"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('mixed')}
                                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    paymentMethod === 'mixed'
                                      ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {t.mixed || "QARIŞIQ"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPaymentMethod('gift')}
                                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    paymentMethod === 'gift'
                                      ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {t.gift || "HƏDİYYƏ"}
                                </button>
                              </div>

                              {/* Nəğd/Kart Seçildikdə Nəğd hissə inputu və Kart qalıq hissəsi */}
                              {paymentMethod === 'mixed' && (
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col gap-2.5 animate-in fade-in">
                                  <div className="flex items-center justify-between text-[10px] font-black text-slate-600">
                                    <span>NƏĞD / KART BÖLGÜSÜ</span>
                                    <span className="text-orange-600 font-bold">{orderTotal.toFixed(2)} ₼</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] font-bold text-slate-500 uppercase">Nəğd Hissə:</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max={orderTotal}
                                        value={customMixedCash}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setCustomMixedCash(val);
                                          const nVal = parseFloat(val) || 0;
                                          const remaining = Math.max(0, Math.round((orderTotal - nVal) * 100) / 100);
                                          setCustomMixedCard(remaining.toString());
                                        }}
                                        placeholder="0.00"
                                        className="w-full bg-white border border-slate-300 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[9px] font-bold text-slate-500 uppercase">Kart Hissəsi (Qalıq):</label>
                                      <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 flex items-center justify-between">
                                        <span>{((Math.max(0, Math.round((orderTotal - (parseFloat(customMixedCash) || 0)) * 100) / 100))).toFixed(2)}</span>
                                        <span className="text-[10px] text-slate-400">₼</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-3 animate-fade-in">
                            {hasPendingItems ? (
                              <button 
                                onClick={sendToKitchen}
                                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 py-3 rounded-2xl text-[10px] font-black tracking-widest text-slate-700 transition-all flex items-center justify-center uppercase cursor-pointer"
                              >
                                {t.sendToKitchen || "MƏTBƏXƏ GÖNDƏR"}
                              </button>
                            ) : (
                              <button 
                                onClick={handlePrintOrderReceipt}
                                disabled={!hasAnyItems}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 py-3 rounded-2xl text-[10px] font-black tracking-widest text-slate-800 transition-all flex items-center justify-center gap-1.5 uppercase disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                              >
                                <Printer className="w-4 h-4" />
                                {t.printCheck || "ÇEKİ ÇAP ET"}
                              </button>
                            )}
                            <button 
                              onClick={() => completeOrder(paymentMethod)}
                              disabled={!hasAnyItems}
                              className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl text-[10px] font-black tracking-widest shadow-md shadow-orange-100 transition-all flex items-center justify-center uppercase disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                            >
                              {t.payOrder || "ÖDƏNİŞƏ KEÇ"}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-300">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white shadow-xl rounded-[40px] flex items-center justify-center mx-auto mb-6">
                    <LayoutDashboard className="w-8 h-8 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Masa Seçilməyib</h3>
                  <p className="text-sm font-medium mt-2">Davam etmək üçün soldan bir masa seçin.</p>
                </div>
              </div>
            )}

            {/* Sifarişdən Məhsul Silinməsi Xəbərdarlıq Modalı */}
            <AnimatePresence>
              {deleteSentItemModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
                  onClick={() => setDeleteSentItemModal(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 10 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shadow-xs shrink-0">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Məhsulu sifarişdən sil</h3>
                          <p className="text-xs text-slate-500 font-semibold">
                            "{deleteSentItemModal.item.name}" məhsulunun ləğvi
                          </p>
                        </div>
                      </div>

                      {deleteSentItemModal.item.quantity > 1 && (
                        <div className="mt-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2.5">
                          <div className="flex justify-between items-center text-xs font-black text-slate-700">
                            <span>Silinəcək miqdar:</span>
                            <span className="text-orange-600 font-extrabold">{deleteSentItemModal.qtyToDelete} / {deleteSentItemModal.item.quantity} ədəd</span>
                          </div>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => setDeleteSentItemModal(prev => prev ? { ...prev, qtyToDelete: Math.max(1, prev.qtyToDelete - 1) } : null)}
                              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-12 text-center text-lg font-black text-slate-800">
                              {deleteSentItemModal.qtyToDelete}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDeleteSentItemModal(prev => prev ? { ...prev, qtyToDelete: Math.min(prev.item.quantity, prev.qtyToDelete + 1) } : null)}
                              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex gap-2 justify-center pt-0.5">
                            <button
                              type="button"
                              onClick={() => setDeleteSentItemModal(prev => prev ? { ...prev, qtyToDelete: 1 } : null)}
                              className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                                deleteSentItemModal.qtyToDelete === 1
                                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              1 ədəd
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteSentItemModal(prev => prev ? { ...prev, qtyToDelete: prev.item.quantity } : null)}
                              className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                                deleteSentItemModal.qtyToDelete === deleteSentItemModal.item.quantity
                                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Hamısı ({deleteSentItemModal.item.quantity} ədəd)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Səbəb seçimi və Əllə Qeyd */}
                      <div className="mt-3.5">
                        <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-1.5">
                          Silinmə Səbəbi
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {PRESET_DELETE_REASONS.map((reason) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => {
                                if (deleteReasonSelectedChip === reason) {
                                  setDeleteReasonSelectedChip('');
                                } else {
                                  setDeleteReasonSelectedChip(reason);
                                  setDeleteReasonText('');
                                }
                              }}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                deleteReasonSelectedChip === reason
                                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Əllə qeyd yazın (məs: Yanlış vurulub, müştəri dəyişdi)..."
                          value={deleteReasonText}
                          onChange={(e) => {
                            setDeleteReasonText(e.target.value);
                            if (e.target.value) setDeleteReasonSelectedChip('');
                          }}
                          className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteSentItemModal(null);
                          setDeleteReasonSelectedChip('');
                          setDeleteReasonText('');
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Ləğv Et
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const finalReason = deleteReasonText.trim() || deleteReasonSelectedChip || 'Yanlış vurulub';
                          if (deleteOrderItem) {
                            deleteOrderItem(deleteSentItemModal.item.id, deleteSentItemModal.qtyToDelete, finalReason);
                          }
                          setDeleteSentItemModal(null);
                          setDeleteReasonSelectedChip('');
                          setDeleteReasonText('');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-md shadow-red-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Bəli, Sil
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Hədiyyə Etmə Modalı (Yalnız Say Seçimi) */}
              {giftItemModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
                  onClick={() => setGiftItemModal(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-500 text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎁</span>
                        <div>
                          <h3 className="text-sm font-extrabold tracking-wide uppercase">Hədiyyə Et</h3>
                          <p className="text-[10px] text-amber-100 font-medium">Məhsulun sayını təyin edin</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGiftItemModal(null)}
                        className="p-1 rounded-lg hover:bg-amber-600 text-white transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-800">{giftItemModal.item.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">Cari say: {giftItemModal.item.quantity} ədəd</p>
                        </div>
                        <span className="text-xs font-black text-amber-600">{(giftItemModal.item.price * giftItemModal.qtyToGift).toFixed(2)} ₼</span>
                      </div>

                      {/* Say Seçimi */}
                      {giftItemModal.item.quantity > 1 ? (
                        <div>
                          <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-2">
                            Hədiyyə Ediləcək Say
                          </label>
                          <div className="flex items-center justify-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setGiftItemModal(prev => prev ? { ...prev, qtyToGift: Math.max(1, prev.qtyToGift - 1) } : null)}
                              disabled={giftItemModal.qtyToGift <= 1}
                              className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-base flex items-center justify-center disabled:opacity-40 hover:bg-slate-100 transition-all cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-lg font-black text-slate-800 w-12 text-center">
                              {giftItemModal.qtyToGift}
                            </span>
                            <button
                              type="button"
                              onClick={() => setGiftItemModal(prev => prev ? { ...prev, qtyToGift: Math.min(prev.item.quantity, prev.qtyToGift + 1) } : null)}
                              disabled={giftItemModal.qtyToGift >= giftItemModal.item.quantity}
                              className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-base flex items-center justify-center disabled:opacity-40 hover:bg-slate-100 transition-all cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setGiftItemModal(prev => prev ? { ...prev, qtyToGift: 1 } : null)}
                              className={`flex-1 py-1.5 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                                giftItemModal.qtyToGift === 1
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              1 ədəd
                            </button>
                            <button
                              type="button"
                              onClick={() => setGiftItemModal(prev => prev ? { ...prev, qtyToGift: prev.item.quantity } : null)}
                              className={`flex-1 py-1.5 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                                giftItemModal.qtyToGift === giftItemModal.item.quantity
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Hamısı ({giftItemModal.item.quantity} ədəd)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-center">
                          <p className="text-xs font-bold text-amber-800">1 ədəd məhsul hədiyyə ediləcək</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setGiftItemModal(null)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Ləğv Et
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleItemGift(giftItemModal.item.id, giftItemModal.qtyToGift);
                          setGiftItemModal(null);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-md shadow-amber-100 transition-all cursor-pointer"
                      >
                        <span>🎁</span>
                        Bəli, Hədiyyə Et
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Masa Sifariş Saatları Menyusu */}
            {renderTableHistoryMenu()}
          </div>
        );
};
