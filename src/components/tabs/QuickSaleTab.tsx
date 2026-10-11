import React, { useState, useMemo, useRef } from 'react';
import { 
  Receipt, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Check, 
  Printer, 
  X, 
  Sparkles, 
  Package, 
  Utensils, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  RotateCcw,
  CheckCircle2,
  User,
  Percent,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { 
  MenuItem, 
  InventoryItem, 
  InventoryTransaction, 
  OrderTransaction, 
  StaffMember 
} from '../../types';
import { getTodayStr } from '../../utils/dateUtils';
import { safeLocalStorageSetItem } from '../../utils/storageUtils';

export interface QuickSaleCartItem {
  id: string; // unique cart key (e.g., 'menu-1' or 'inv-3')
  originalId: number;
  source: 'menu' | 'inventory';
  name: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  isGift?: boolean;
}

export interface QuickSaleTabProps {
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  currencySymbol: string;
  formatPrice: (amount: number | string | undefined | null) => string;
  tText: (key: string, defaultText?: string) => string;
  activeShift: any;
  recipes: Record<number, { ingredientId: number; amount: number }[]>;
  setOrderTransactions: React.Dispatch<React.SetStateAction<OrderTransaction[]>>;
  setInventoryTransactions: React.Dispatch<React.SetStateAction<InventoryTransaction[]>>;
  addAuditLog: (action: string, operator: string, details: string, type?: 'info' | 'warning' | 'danger') => void;
  onPrintReceipt: (data: {
    tableName: string;
    waiterName: string;
    items: Array<{ name: string; quantity: number; price: number; isGift?: boolean }>;
    orderTotal: number;
    paymentMethod: string;
  }) => void;
  staff: StaffMember[];
  onSwitchToTables?: () => void;
  setIsSidebarCollapsed?: (collapsed: boolean) => void;
}

// Kosmik hassaslıqla və yüksək dəqiqliklə hesablanma köməkçisi
const cosmicRound = (val: number | string | undefined | null): number => {
  const num = Number(val) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const QuickSaleTab: React.FC<QuickSaleTabProps> = ({
  menuItems,
  inventory,
  setInventory,
  currencySymbol,
  formatPrice,
  tText,
  activeShift,
  recipes,
  setOrderTransactions,
  setInventoryTransactions,
  addAuditLog,
  onPrintReceipt,
  staff,
  onSwitchToTables,
  setIsSidebarCollapsed
}) => {
  // --- States ---
  const [cart, setCart] = useState<QuickSaleCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Hamısı');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed'>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [customMixedCash, setCustomMixedCash] = useState<string>('');
  const [customMixedCard, setCustomMixedCard] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountAmount, setCustomDiscountAmount] = useState<string>('');
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState<boolean>(true);
  const [selectedStaffName, setSelectedStaffName] = useState<string>('Kassa Operatoru');
  // Standart olaraq gizli saxlanılır. Ctrl+G ilə açılır, Ctrl+B ilə gizlənir.
  const [showExtendedDetails, setShowExtendedDetails] = useState<boolean>(false);

  // Satış səhifəsi açıldıqda slidebar yığılsın
  React.useEffect(() => {
    setIsSidebarCollapsed?.(true);
  }, [setIsSidebarCollapsed]);

  // Ctrl+G və Ctrl+B qısa yolları ilə ödəniş sahələrini göstər/gizlət
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = (e.key || '').toLowerCase();
        if (key === 'g' || e.code === 'KeyG') {
          e.preventDefault();
          e.stopPropagation();
          setShowExtendedDetails(true);
        } else if (key === 'b' || e.code === 'KeyB') {
          e.preventDefault();
          e.stopPropagation();
          setShowExtendedDetails(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Success Modal
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    orderId: number;
    total: number;
    change: number;
    paymentMethod: string;
    items: QuickSaleCartItem[];
  } | null>(null);

  // Pencere 1-2 saniye qaldıqdan sonra pencere kapansın ve sebet boşalsın
  React.useEffect(() => {
    if (successModal?.show) {
      const timer = setTimeout(() => {
        setSuccessModal(null);
        clearCart();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [successModal?.show]);

  // Available categories: "Hamısı", "Anbar Malları", and distinct menu categories
  const menuCategories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.filter(m => m.status !== 'hidden').map(m => m.category)));
    return cats.filter(Boolean);
  }, [menuItems]);

  const allCategories = useMemo(() => {
    return ['Hamısı', 'Anbar Malları', ...menuCategories];
  }, [menuCategories]);

  // Unified items list
  const allSellableItems = useMemo(() => {
    const list: Array<{
      key: string;
      originalId: number;
      source: 'menu' | 'inventory';
      name: string;
      price: number;
      category: string;
      unit: string;
      stockQuantity?: number;
      minLevel?: number;
      image?: string;
    }> = [];

    // 1. Inventory items (Anbardakı məhsullar)
    inventory.forEach(inv => {
      // Satış edərkən satış qiyməti ilə əməliyyat aparılsın
      const rawSalePrice = (inv.salePrice !== undefined && inv.salePrice !== null && Number(inv.salePrice) > 0)
        ? Number(inv.salePrice)
        : (Number(inv.costPrice) > 0 ? Number(inv.costPrice) : 1.0);
      const roundedPrice = Math.round((Number(rawSalePrice) + Number.EPSILON) * 100) / 100;

      list.push({
        key: `inv-${inv.id}`,
        originalId: inv.id,
        source: 'inventory',
        name: inv.name,
        price: roundedPrice,
        category: 'Anbar Malları',
        unit: inv.unit || 'ədəd',
        stockQuantity: Number(inv.quantity) || 0,
        minLevel: Number(inv.minLevel) || 0
      });
    });

    // 2. Menu items
    menuItems.filter(m => m.status !== 'hidden').forEach(m => {
      list.push({
        key: `menu-${m.id}`,
        originalId: m.id,
        source: 'menu',
        name: m.name,
        price: Number(m.price) || 0,
        category: m.category || 'Menyu',
        unit: 'ədəd',
        image: m.image
      });
    });

    return list;
  }, [inventory, menuItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allSellableItems.filter(item => {
      // Category filter
      if (selectedCategory === 'Anbar Malları' && item.source !== 'inventory') {
        return false;
      }
      if (selectedCategory !== 'Hamısı' && selectedCategory !== 'Anbar Malları' && item.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        return matchesName || matchesCat;
      }
      return true;
    });
  }, [allSellableItems, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (item: typeof allSellableItems[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.key);
      if (existing) {
        return prev.map(i => i.id === item.key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [
        ...prev,
        {
          id: item.key,
          originalId: item.originalId,
          source: item.source,
          name: item.name,
          price: item.price,
          quantity: 1,
          unit: item.unit,
          category: item.category
        }
      ];
    });
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => {
          if (i.id === key) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as QuickSaleCartItem[];
    });
  };

  const removeFromCart = (key: string) => {
    setCart(prev => prev.filter(i => i.id !== key));
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven('');
    setCustomMixedCash('');
    setCustomMixedCard('');
    setDiscountPercent(0);
    setCustomDiscountAmount('');
  };

  // Kosmik dəqiqliklə hesablamalar
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => cosmicRound(sum + cosmicRound(item.price * item.quantity)), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (customDiscountAmount && !isNaN(parseFloat(customDiscountAmount))) {
      return Math.min(subtotal, Math.max(0, cosmicRound(parseFloat(customDiscountAmount))));
    }
    if (discountPercent > 0) {
      return cosmicRound(subtotal * (discountPercent / 100));
    }
    return 0;
  }, [subtotal, discountPercent, customDiscountAmount]);

  const finalTotal = useMemo(() => {
    return Math.max(0, cosmicRound(subtotal - discountAmount));
  }, [subtotal, discountAmount]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    const given = parseFloat(cashGiven) || 0;
    return Math.max(0, cosmicRound(given - finalTotal));
  }, [paymentMethod, cashGiven, finalTotal]);

  // Complete Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'mixed') {
      const cashVal = parseFloat(customMixedCash) || 0;
      const cardVal = parseFloat(customMixedCard) || 0;
      if (cosmicRound(cashVal + cardVal) !== finalTotal) {
        alert(`Qarışıq ödənişin cəmi (${(cashVal + cardVal).toFixed(2)} ₼) yekun məbləğlə (${finalTotal.toFixed(2)} ₼) bərabər olmalıdır!`);
        return;
      }
    }

    const todayStr = getTodayStr();
    const effectiveShiftDate = activeShift?.businessDate || todayStr;
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const cashPart = paymentMethod === 'mixed'
      ? (parseFloat(customMixedCash) || 0)
      : (paymentMethod === 'cash' ? finalTotal : undefined);
    const cardPart = paymentMethod === 'mixed'
      ? (parseFloat(customMixedCard) || 0)
      : (paymentMethod === 'card' ? finalTotal : undefined);

    const txId = Date.now() + Math.random();

    // 1. Record Order Transaction
    const orderTx: OrderTransaction = {
      id: txId,
      tableId: 0,
      tableName: 'Birbaşa Satış (Kassa)',
      amount: finalTotal,
      waiterName: selectedStaffName,
      paymentMethod: paymentMethod,
      cashAmount: cashPart,
      cardAmount: cardPart,
      date: effectiveShiftDate,
      time: currentTimeStr,
      shiftId: activeShift?.id,
      isClosed: false,
      timestamp: Date.now(),
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
        isGift: Boolean(item.isGift)
      }))
    };

    setOrderTransactions(prev => {
      const updated = [orderTx, ...prev];
      safeLocalStorageSetItem('resto_orderTransactions', JSON.stringify(updated));
      return updated;
    });

    // 2. Deduct Inventory Stock
    const newInvTxList: InventoryTransaction[] = [];

    setInventory(prevInv => {
      let updatedInv = [...prevInv];

      cart.forEach(cartItem => {
        // A) Direct Inventory Item sale
        if (cartItem.source === 'inventory') {
          updatedInv = updatedInv.map(inv => {
            if (inv.id === cartItem.originalId) {
              const currentQ = Number(inv.quantity) || 0;
              const newQ = Math.max(0, Math.round((currentQ - cartItem.quantity) * 100) / 100);
              return { ...inv, quantity: newQ };
            }
            return inv;
          });

          newInvTxList.push({
            id: Date.now() + Math.random(),
            itemId: cartItem.originalId,
            itemName: cartItem.name,
            quantity: -cartItem.quantity,
            costPrice: cartItem.price,
            totalCost: -(cartItem.quantity * cartItem.price),
            date: todayStr
          });
        }

        // B) Menu Item sale with Recipe
        if (cartItem.source === 'menu') {
          const itemRecipe = recipes[cartItem.originalId];
          if (itemRecipe && Array.isArray(itemRecipe) && itemRecipe.length > 0) {
            itemRecipe.forEach(recipeIng => {
              const deductAmount = Math.round((recipeIng.amount * cartItem.quantity) * 1000) / 1000;
              updatedInv = updatedInv.map(inv => {
                if (inv.id === recipeIng.ingredientId) {
                  const currentQ = Number(inv.quantity) || 0;
                  const newQ = Math.max(0, Math.round((currentQ - deductAmount) * 100) / 100);
                  return { ...inv, quantity: newQ };
                }
                return inv;
              });

              const ingItem = prevInv.find(i => i.id === recipeIng.ingredientId);
              if (ingItem) {
                newInvTxList.push({
                  id: Date.now() + Math.random(),
                  itemId: ingItem.id,
                  itemName: `${ingItem.name} (${cartItem.name})`,
                  quantity: -deductAmount,
                  costPrice: ingItem.costPrice || 0,
                  totalCost: -(deductAmount * (ingItem.costPrice || 0)),
                  date: todayStr
                });
              }
            });
          }
        }
      });

      safeLocalStorageSetItem('resto_inventory', JSON.stringify(updatedInv));
      return updatedInv;
    });

    if (newInvTxList.length > 0) {
      setInventoryTransactions(prev => {
        const updated = [...newInvTxList, ...prev];
        safeLocalStorageSetItem('resto_inventoryTransactions', JSON.stringify(updated));
        return updated;
      });
    }

    // 3. Add Audit Log
    const methodLabel = paymentMethod === 'cash' ? 'Nağd' : paymentMethod === 'card' ? 'Kartla' : 'Qarışıq';
    addAuditLog(
      "Birbaşa Satış",
      selectedStaffName,
      `Birbaşa kassa satışı (#${Math.floor(txId % 10000)}) tamamlandı. Məbləğ: ${finalTotal.toFixed(2)} ₼ (${methodLabel}). Məhsullar: ${cart.map(c => `${c.name} x${c.quantity}`).join(', ')}`,
      "info"
    );

    // 4. Avtomatik Çap: Satışı tamamla dedikdə Profil A parametrləri ilə avtomatik 2 nüsxə qəbz çap edilir
    try {
      onPrintReceipt({
        tableName: "Birbaşa Satış",
        waiterName: "Kassa Operatoru",
        items: cart.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          isGift: i.isGift
        })),
        orderTotal: finalTotal,
        paymentMethod: paymentMethod
      });
    } catch (err) {
      console.error("Print receipt error:", err);
    }

    // 5. Open Success Modal (1-2 saniyə qalacaq, sonra avtomatik bağlanıb səbət boşalacaq)
    setSuccessModal({
      show: true,
      orderId: Math.floor(txId % 100000),
      total: finalTotal,
      change: changeDue,
      paymentMethod: methodLabel,
      items: [...cart]
    });
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden p-4 font-sans bg-slate-50/50">
      {/* ========================================================================= */}
      {/* ORTA BÖLMƏ: Slide bar ilə Səbət arasında Anbardakı və Menyu Məhsulları */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Yuxarı filter və axtarış paneli */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {/* Canlı Axtarış Inputu */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Məhsul adı və ya anbar malı axtarın..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl pl-10 pr-10 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Məhsul sayı indikatoru */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0">
              <Layers className="w-3.5 h-3.5 text-orange-500" />
              <span>{filteredItems.length} Məhsul</span>
            </div>
          </div>

          {/* Kateqoriya düymələri (Sürüşdürülə bilən) */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
            {allCategories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/20 scale-[1.02]'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {cat === 'Anbar Malları' ? '📦 Anbar Malları' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Məhsullar Grid-i (Satış proqramı üslubunda) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/40">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Package className="w-16 h-16 stroke-1 text-slate-300 mb-3" />
              <p className="text-sm font-black text-slate-600 uppercase tracking-wider">Axtarışa uyğun məhsul tapılmadı</p>
              <p className="text-xs text-slate-400 mt-1">Axtarış sözünü dəyişin və ya başqa kateqoriya seçin</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filteredItems.map(item => {
                const cartItem = cart.find(i => i.id === item.key);
                const inCartQty = cartItem?.quantity || 0;
                const isOutOfStock = item.source === 'inventory' && (item.stockQuantity ?? 0) <= 0;

                return (
                  <motion.div
                    key={item.key}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (isOutOfStock) return;
                      addToCart(item);
                    }}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'bg-slate-100 border-dashed border-slate-300 opacity-60 cursor-not-allowed'
                        : inCartQty > 0
                        ? 'bg-orange-50/60 border-orange-500 shadow-md shadow-orange-100 ring-2 ring-orange-200/60'
                        : 'bg-white border-slate-100 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    {/* Səbətdəki miqdar nişanı */}
                    {inCartQty > 0 && (
                      <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white animate-in zoom-in duration-150">
                        {inCartQty}
                      </div>
                    )}

                    <div>
                      {/* Kateqoriya və Mənbə tagı */}
                      <div className="flex items-center justify-between mb-2 gap-1">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md truncate ${
                          item.source === 'inventory'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.source === 'inventory' ? 'Anbar' : item.category}
                        </span>

                        {item.source === 'inventory' && (
                          <span className={`text-[8px] font-bold ${
                            (item.stockQuantity ?? 0) <= (item.minLevel ?? 0)
                              ? 'text-red-600'
                              : 'text-emerald-600'
                          }`}>
                            {(item.stockQuantity ?? 0)} {item.unit}
                          </span>
                        )}
                      </div>

                      {/* Məhsul Adı */}
                      <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-tight min-h-[28px]">
                        {item.name}
                      </h4>
                    </div>

                    {/* Qiymət və Tez Əlavə Et */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900 tracking-tight">
                        {formatPrice(item.price)}
                      </span>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                        inCartQty > 0
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-orange-500 hover:text-white'
                      }`}>
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SAĞ BÖLMƏ: Səbət Yeri (Kompakt POS Səbəti) */}
      {/* ========================================================================= */}
      <div className="w-80 lg:w-[350px] xl:w-[370px] shrink-0 bg-white rounded-3xl border border-slate-200/80 shadow-md flex flex-col overflow-hidden">
        {/* Səbət Başlığı */}
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Səbət</h3>
              <p className="text-xs text-slate-400 font-bold">
                {cart.length > 0 ? `${cart.reduce((sum, i) => sum + i.quantity, 0)} ədəd məhsul` : 'Məhsul seçilməyib'}
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              title="Səbəti tam təmizlə"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Təmizlə</span>
            </button>
          )}
        </div>

        {/* Səbətdəki məhsullar siyahısı */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
                <Receipt className="w-7 h-7 stroke-1" />
              </div>
              <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Səbət boşdur</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Satış etmək üçün soldan anbardakı və ya menyudakı məhsulları seçin
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {formatPrice(item.price)} × {item.quantity} {item.unit}
                  </p>
                </div>

                {/* Miqdar Dəyişmə Düymələri */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black cursor-pointer shadow-xs transition-colors"
                  >
                    <Minus className="w-3 h-3 stroke-[3]" />
                  </button>
                  <span className="w-6 text-center text-xs font-black text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </button>
                </div>

                {/* Məhsul Cəmi və Sil Düyməsi */}
                <div className="text-right shrink-0 min-w-[55px]">
                  <p className="text-xs font-black text-slate-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="w-6 h-6 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* ========================================================================= */}
        {/* SƏBƏTİN AŞAĞI ÖDƏNİŞ VƏ HESABLAMA BÖLMƏSİ */}
        {/* ========================================================================= */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex flex-col gap-3">
          {/* Ara Cəm və Endirim - Yalnız Ctrl+G ilə aktiv olduqda görünür (Standart gizli) */}
          {showExtendedDetails && (
            <div className="space-y-1 text-xs animate-in fade-in duration-150">
              <div className="flex justify-between items-center text-slate-500 font-bold">
                <span>Ara Cəm:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Endirim Düymələri / Bölməsi */}
              {cart.length > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400">Endirim:</span>
                  <div className="flex items-center gap-1">
                    {[0, 5, 10, 15].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setDiscountPercent(pct);
                          setCustomDiscountAmount('');
                        }}
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase cursor-pointer transition-colors ${
                          discountPercent === pct && !customDiscountAmount
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {pct === 0 ? 'Yoxdur' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-red-500 font-bold text-xs">
                  <span>Endirim Məbləği:</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
            </div>
          )}

          {/* YEKUN CƏMİ MƏBLƏĞ - Həmişə görünür */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">Yekun Cəm:</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatPrice(finalTotal)}
            </span>
          </div>

          {/* Ödəniş Üsulu Seçimi (Nağd, Kart, Qarışıq), Qalıq Pul və Çek Çapı - Yalnız Ctrl+G ilə görünür (Standart gizli) */}
          {showExtendedDetails && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              {/* Ödəniş Üsulu Seçimi (Nağd, Kart, Qarışıq) */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Nağd</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Kartla</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('mixed');
                    const half = Math.round((finalTotal / 2) * 100) / 100;
                    setCustomMixedCash(half.toString());
                    setCustomMixedCard(Math.max(0, Math.round((finalTotal - half) * 100) / 100).toString());
                  }}
                  className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    paymentMethod === 'mixed'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Qarışıq</span>
                </button>
              </div>

              {/* NAĞD ÖDƏNİŞ ÜÇÜN SÜRƏTLİ PUL DÜYMƏLƏRİ VƏ QALIQ PUL */}
              {paymentMethod === 'cash' && cart.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-600">
                    <span>VERİLƏN PUL:</span>
                    <span className="text-emerald-600 font-extrabold">Qalıq: {formatPrice(changeDue)}</span>
                  </div>

                  {/* Sürətli Pul Düymələri */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: 'Dəqiq', val: finalTotal },
                      { label: '10 ₼', val: 10 },
                      { label: '20 ₼', val: 20 },
                      { label: '50 ₼', val: 50 },
                    ].map(b => (
                      <button
                        key={b.label}
                        type="button"
                        onClick={() => setCashGiven(b.val.toString())}
                        className="py-1 px-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black text-slate-700 cursor-pointer transition-colors"
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  {/* Verilən pul inputu */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder={`Məs: ${finalTotal}`}
                      className="w-full bg-white border border-slate-300 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-800 outline-none shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* QARIŞIQ ÖDƏNİŞ BÖLGÜSÜ */}
              {paymentMethod === 'mixed' && cart.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-600">
                    <span>QARIŞIQ ÖDƏNİŞ BÖLGÜSÜ</span>
                    <span className="text-purple-600 font-extrabold">{formatPrice(finalTotal)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Nağd Hissə:</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={finalTotal}
                        value={customMixedCash}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomMixedCash(val);
                          const nVal = parseFloat(val) || 0;
                          const remaining = Math.max(0, Math.round((finalTotal - nVal) * 100) / 100);
                          setCustomMixedCard(remaining.toString());
                        }}
                        className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl px-2 py-1 text-xs font-black text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Kart Hissəsi:</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={finalTotal}
                        value={customMixedCard}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomMixedCard(val);
                          const nVal = parseFloat(val) || 0;
                          const remaining = Math.max(0, Math.round((finalTotal - nVal) * 100) / 100);
                          setCustomMixedCash(remaining.toString());
                        }}
                        className="w-full bg-white border border-slate-300 focus:border-purple-500 rounded-xl px-2 py-1 text-xs font-black text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Qəbz (Çek) Çap Et Seçimi */}
              <label className="flex items-center gap-2 cursor-pointer select-none px-1">
                <input
                  type="checkbox"
                  checked={shouldPrintReceipt}
                  onChange={(e) => setShouldPrintReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer accent-orange-500"
                />
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Satış çekini avtomatik çap et</span>
                </span>
              </label>
            </div>
          )}

          {/* ƏSAS SATIŞI TƏSDİQLƏ DÜYMƏSİ */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleCompleteSale}
            className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98 cursor-pointer ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:shadow-emerald-600/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>SATIŞI TAMAMLA • {formatPrice(finalTotal)}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SATIŞIN UĞURLA TAMAMLANMASI MODALI */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {successModal?.show && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none"
            onClick={() => {
              setSuccessModal(null);
              clearCart();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Satış Uğurla Tamamlandı!</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Çek №: #{successModal.orderId} • {successModal.paymentMethod}
              </p>

              <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>Ödənilən Məbləğ:</span>
                  <span className="text-sm font-black text-slate-900">{formatPrice(successModal.total)}</span>
                </div>
                {successModal.change > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600 pt-2 border-t border-slate-200">
                    <span>Qaytarılacaq Qalıq:</span>
                    <span className="text-base font-black">{formatPrice(successModal.change)}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 font-bold pt-1">
                  Məhsul sayı: {successModal.items.reduce((s, i) => s + i.quantity, 0)} ədəd
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
