import React, { useState, useRef, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Trash2, 
  Edit, 
  Printer, 
  LayoutGrid,
  List,
  TrendingUp,
  X,
  Check
} from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../Card";
import { InventoryItem } from "../../types";

export interface InventoryTabProps {
  t: any;
  tText: (key: string, defaultText?: string) => string;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  inventorySearch: string;
  setInventorySearch: (search: string) => void;
  currencySymbol: string;
  formatPrice: (amount: number | string | undefined | null) => string;
  isAddingInventory: boolean;
  setIsAddingInventory: (val: boolean) => void;
  newInventory: { name: string; quantity: any; unit: string; minLevel: any; costPrice: any; salePrice?: any };
  setNewInventory: React.Dispatch<React.SetStateAction<any>>;
  newInventoryError: string | null;
  handleAddNewInventoryItem: (e: React.FormEvent) => void;
  editingInventoryId: number | null;
  setEditingInventoryId: (id: number | null) => void;
  editInventory: { name: string; quantity: any; unit: string; minLevel: any; costPrice: any; salePrice?: any };
  setEditInventory: React.Dispatch<React.SetStateAction<any>>;
  startEditingInventory: (item: InventoryItem) => void;
  handleSaveInventoryEdit: (id: number) => void;
  setConfirmDialog: (dialog: any) => void;
  updateInventoryStock: (id: number, delta: number, newCostPrice?: number) => void;
  handleDeleteInventoryItem: (id: number) => void;
  exportToExcel?: (data: any, filename: string, headers?: string[]) => void;
  setReportPrintPreview: (preview: any) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  t,
  tText,
  inventory,
  setInventory,
  inventorySearch,
  setInventorySearch,
  currencySymbol,
  formatPrice,
  isAddingInventory,
  setIsAddingInventory,
  newInventory,
  setNewInventory,
  newInventoryError,
  handleAddNewInventoryItem,
  editingInventoryId,
  setEditingInventoryId,
  editInventory,
  setEditInventory,
  startEditingInventory,
  handleSaveInventoryEdit,
  setConfirmDialog,
  updateInventoryStock,
  handleDeleteInventoryItem,
  setReportPrintPreview
}) => {
  const [criticalOnly, setCriticalOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const productNameInputRef = useRef<HTMLInputElement>(null);

  // Yeni məhsul daxil et açıldıqda avtomatik Məhsul adı xanasına fokuslan
  useEffect(() => {
    if (isAddingInventory) {
      setTimeout(() => {
        productNameInputRef.current?.focus();
      }, 50);
    }
  }, [isAddingInventory]);

  // Stok Artır modal vəziyyəti
  const [isIncreaseStockOpen, setIsIncreaseStockOpen] = useState<boolean>(false);
  const [selectedStockItemId, setSelectedStockItemId] = useState<number | null>(null);
  const [increaseAmount, setIncreaseAmount] = useState<string>('');
  const [increaseCostPrice, setIncreaseCostPrice] = useState<string>('');
  const [increaseStockError, setIncreaseStockError] = useState<string | null>(null);
  const [increaseSuccessMessage, setIncreaseSuccessMessage] = useState<string | null>(null);

  const selectedStockItem = inventory.find(i => i.id === selectedStockItemId) || null;

  // Seçilmiş məhsul dəyişdikdə anbardakı mövcud alış qiymətini avtomatik formaya doldur
  const handleSelectStockItem = (itemId: number) => {
    setSelectedStockItemId(itemId);
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      setIncreaseCostPrice(item.costPrice !== undefined && item.costPrice !== null ? String(item.costPrice) : '');
    } else {
      setIncreaseCostPrice('');
    }
  };

  const handleApplyIncreaseStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItemId) {
      setIncreaseStockError('Zəhmət olmasa artırmaq istədiyiniz məhsulu seçin!');
      return;
    }
    const amountNum = parseFloat(increaseAmount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      setIncreaseStockError('Zəhmət olmasa 0-dan böyük etibarlı miqdar daxil edin!');
      return;
    }

    let parsedCostPrice: number | undefined = undefined;
    if (increaseCostPrice !== '') {
      const priceNum = parseFloat(increaseCostPrice.replace(',', '.'));
      if (isNaN(priceNum) || priceNum < 0) {
        setIncreaseStockError('Alış qiyməti mənfi ola bilməz!');
        return;
      }
      parsedCostPrice = priceNum;
    }

    setIncreaseStockError(null);
    updateInventoryStock(selectedStockItemId, amountNum, parsedCostPrice);

    const updatedItem = inventory.find(i => i.id === selectedStockItemId);
    const itemName = updatedItem ? updatedItem.name : 'Məhsul';
    const unitName = updatedItem?.unit || 'vahid';
    setIncreaseSuccessMessage(`"${itemName}" stokuna +${amountNum} ${unitName} uğurla əlavə edildi!`);

    setIncreaseAmount('');
    setTimeout(() => {
      setIncreaseSuccessMessage(null);
      setIsIncreaseStockOpen(false);
    }, 1200);
  };

  const lowStockCount = inventory.filter(item => item.quantity <= item.minLevel).length;

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes((inventorySearch || '').toLowerCase());
    if (criticalOnly) {
      return matchesSearch && item.quantity <= item.minLevel;
    }
    return matchesSearch;
  });

  const handlePrint = (onlyCritical: boolean = false) => {
    const listToPrint = onlyCritical 
      ? inventory.filter(i => i.quantity <= i.minLevel) 
      : (criticalOnly ? filteredInventory : inventory);
    
    const pageTitle = onlyCritical || criticalOnly ? "Anbar Kritik Stok Hesabatı" : "Anbar Stok Hesabatı";
    const today = new Date();
    const formattedDayDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    const headerSubtitle = `Tarix: ${formattedDayDate} • Cəmi Məhsul Çeşidi: ${listToPrint.length}${criticalOnly || onlyCritical ? ' • Yalnız Kritik Limitdə Olanlar' : ''}`;

    const totalSum = listToPrint.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.costPrice) || 0;
      return sum + (qty * cost);
    }, 0);

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert("Çap pəncərəsinin açılması üçün brauzerdə pop-up icazəsi verilməlidir.");
      return;
    }

    printWin.document.write(`
      <html>
        <head>
          <title>${pageTitle}</title>
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
          <h2>${pageTitle}</h2>
          <p>${headerSubtitle}</p>
          <table>
            <thead>
              <tr>
                <th class="text-center">#</th>
                <th>Məhsul Adı</th>
                <th class="text-center">Mövcud Stok</th>
                <th class="text-center">Min. Səviyyə</th>
                <th class="text-center">Ölçü Vahidi</th>
                <th class="text-right">Alış Qiyməti</th>
                <th class="text-right">Satış Qiyməti</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${listToPrint.map((item, idx) => {
                const isCritical = Number(item.quantity || 0) <= Number(item.minLevel || 0);
                const cost = (item.costPrice !== undefined && (item.costPrice as any) !== '') ? Number(item.costPrice).toFixed(2) + ' ₼' : '0.00 ₼';
                const sale = (item.salePrice !== undefined && (item.salePrice as any) !== null && (item.salePrice as any) !== '') ? Number(item.salePrice).toFixed(2) + ' ₼' : '-';
                return `
                  <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td><b>${item.name}</b></td>
                    <td class="text-center" style="${isCritical ? 'color: #e11d48; font-weight: bold;' : ''}">${item.quantity} ${item.unit || ''}</td>
                    <td class="text-center">${item.minLevel} ${item.unit || ''}</td>
                    <td class="text-center">${item.unit || '-'}</td>
                    <td class="text-right">${cost}</td>
                    <td class="text-right" style="color: #10b981; font-weight: bold;">${sale}</td>
                    <td class="text-center" style="${isCritical ? 'color: #e11d48; font-weight: bold;' : 'color: #16a34a; font-weight: bold;'}">
                      <b>${isCritical ? 'KRİTİK STOK' : 'Normal'}</b>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="total">Ümumi Alış Dəyəri: ${totalSum.toFixed(2)} ₼ &nbsp;|&nbsp; Cəmi: ${listToPrint.length} çeşid</div>
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
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
      <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
        {/* Header control deck */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3.5 flex-1">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                ANBAR VƏ MƏHSUL STOKLARI
              </h3>
              <p className="text-xs text-slate-400 mt-1">Stok qalığı və minimum mövcudluq limitinə dair ətraflı məlumatlar.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 items-center">
            {/* Kritik Stok Butonu */}
            <button
              type="button"
              onClick={() => setCriticalOnly(prev => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                criticalOnly
                  ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200 ring-2 ring-red-400'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
              }`}
              title="Yalnız kritik stokları süzgəcdən keçir"
            >
              <AlertTriangle className={`w-4 h-4 ${criticalOnly ? 'text-white' : 'text-red-500'}`} />
              <span>Kritik Stok: {lowStockCount} məhsul</span>
              {criticalOnly && <span className="ml-1 text-[10px] bg-red-800/80 px-1.5 py-0.5 rounded-md font-bold">Aktiv</span>}
            </button>
            
            <button
              onClick={() => setIsAddingInventory(!isAddingInventory)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center whitespace-nowrap transition-all shadow-md shadow-orange-100 cursor-pointer"
            >
              <Plus className={`w-4 h-4 mr-2 transition-transform ${isAddingInventory ? 'rotate-45' : ''}`} />
              {isAddingInventory ? 'Ləğv Et' : 'Yeni Məhsul Daxil Et'}
            </button>

            {/* Stok artır butonu */}
            <button
              type="button"
              onClick={() => {
                setIsIncreaseStockOpen(true);
                setIncreaseStockError(null);
                setIncreaseSuccessMessage(null);
                const initialId = selectedStockItemId || (inventory.length > 0 ? inventory[0].id : null);
                if (initialId) {
                  handleSelectStockItem(initialId);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center whitespace-nowrap transition-all shadow-md shadow-emerald-100 cursor-pointer"
              title="Mövcud anbar məhsulunun stok sayını artır"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Stok artır
            </button>

            {/* Çap et butonu - A4 formatlı */}
            <button
              type="button"
              onClick={() => handlePrint(criticalOnly)}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center whitespace-nowrap transition-all shadow-xs cursor-pointer"
              title="A4 formatında çap et"
            >
              <Printer className="w-4 h-4 mr-2 text-slate-500" />
              Çap et
            </button>
          </div>
        </div>

        {isAddingInventory && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-orange-50/50 border border-orange-100 rounded-2xl flex flex-col gap-4 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4" />
                Yeni Anbar Məhsulunun Mədaxili
              </h4>
            </div>

            {newInventoryError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                {newInventoryError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="flex flex-col gap-1 md:col-span-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Məhsul adı</label>
                <input 
                  ref={productNameInputRef}
                  placeholder="Məs. Un, Mozzarella, Pendir" 
                  value={newInventory.name}
                  onChange={e => setNewInventory({...newInventory, name: e.target.value})}
                  className="px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white placeholder-slate-300 text-xs font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mövcud Stok</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  placeholder="Məs. 50" 
                  value={newInventory.quantity ?? ''}
                  onChange={e => {
                    const val = e.target.value.replace(',', '.');
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setNewInventory({ ...newInventory, quantity: val });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white placeholder-slate-300 text-xs font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Min. Səviyyə</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  placeholder="Məs. 10" 
                  value={newInventory.minLevel ?? ''}
                  onChange={e => {
                    const val = e.target.value.replace(',', '.');
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setNewInventory({ ...newInventory, minLevel: val });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white placeholder-slate-300 text-xs font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">
                  Ölçü Vahidi (seçin və ya silin)
                </label>
                <input 
                  list="existing-inventory-units"
                  placeholder="Məs. kq, litr, ədəd" 
                  value={newInventory.unit}
                  onChange={e => setNewInventory({...newInventory, unit: e.target.value})}
                  className="px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white placeholder-slate-300 text-xs font-semibold"
                />
                <datalist id="existing-inventory-units">
                  {Array.from(new Set(inventory.map(item => item.unit).filter(Boolean))).map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="flex flex-col gap-1 md:col-span-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Alış Qiyməti (₼ / Ölçü vahidi)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  placeholder="Məs. 0.8, 1.20, 14.50" 
                  value={newInventory.costPrice ?? ''}
                  onChange={e => {
                    const val = e.target.value.replace(',', '.');
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setNewInventory({ ...newInventory, costPrice: val });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white placeholder-slate-300 text-xs font-semibold font-mono"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Satış Qiyməti (₼ / Ölçü vahidi)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  placeholder="Məs. 1.50, 2.00, 25.00" 
                  value={newInventory.salePrice ?? ''}
                  onChange={e => {
                    const val = e.target.value.replace(',', '.');
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setNewInventory({ ...newInventory, salePrice: val });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white placeholder-slate-300 text-xs font-semibold font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleAddNewInventoryItem}
                className="bg-orange-500 text-white font-extrabold rounded-xl px-6 py-2.5 shadow-md shadow-orange-100 hover:bg-orange-600 transition-colors text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Mədaxili Tamamla
              </button>
            </div>
          </motion.div>
        )}

        {/* Axtarış və Filtreleme Paneli */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in animate-duration-300">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={criticalOnly ? "Kritik stok məhsulları arasında axtar..." : "Məhsul adı ilə axtar..."}
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-full text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {criticalOnly && (
              <span className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Yalnız Kritik Stoklar
              </span>
            )}
            {inventorySearch && (
              <button 
                onClick={() => setInventorySearch('')}
                className="text-[10px] font-black text-slate-400 hover:text-orange-500 uppercase tracking-widest px-2 cursor-pointer"
              >
                Təmizlə
              </button>
            )}

            {/* Görünüş rejimi: Cədvəl (Liste) və ya Kart */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center ml-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Cədvəl (Siyahı) görünüşü"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'cards' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Kart görünüşü"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Məhsulların Siyahısı / Cədvəl Forması */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">#</th>
                    <th className="px-5 py-3.5">Məhsul Adı</th>
                    <th className="px-5 py-3.5">Mövcud Stok</th>
                    <th className="px-5 py-3.5">Min. Səviyyə</th>
                    <th className="px-5 py-3.5">Ölçü Vahidi</th>
                    <th className="px-5 py-3.5">Alış Qiyməti</th>
                    <th className="px-5 py-3.5">Satış Qiyməti</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        {criticalOnly ? "Kritik stok səviyyəsində məhsul tapılmadı" : "Heç bir anbar məhsulu tapılmadı"}
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item, idx) => {
                      const isLow = item.quantity <= item.minLevel;
                      const isEditing = editingInventoryId === item.id;

                      if (isEditing) {
                        return (
                          <tr key={item.id} className="bg-orange-50/40">
                            <td className="px-5 py-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="px-5 py-3">
                              <input 
                                type="text"
                                value={editInventory.name}
                                onChange={e => setEditInventory({ ...editInventory, name: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="Məhsul adı"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input 
                                type="number"
                                value={editInventory.quantity}
                                onChange={e => setEditInventory({ ...editInventory, quantity: Number(e.target.value) })}
                                className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="Stok"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input 
                                type="number"
                                value={editInventory.minLevel}
                                onChange={e => setEditInventory({ ...editInventory, minLevel: Number(e.target.value) })}
                                className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="Limit"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input 
                                type="text"
                                list="existing-inventory-units"
                                value={editInventory.unit}
                                onChange={e => setEditInventory({ ...editInventory, unit: e.target.value })}
                                className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="Vahid"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input 
                                type="text"
                                inputMode="decimal"
                                value={editInventory.costPrice ?? ''}
                                onChange={e => {
                                  const val = e.target.value.replace(',', '.');
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    setEditInventory({ ...editInventory, costPrice: val });
                                  }
                                }}
                                className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input 
                                type="text"
                                inputMode="decimal"
                                value={editInventory.salePrice ?? ''}
                                onChange={e => {
                                  const val = e.target.value.replace(',', '.');
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    setEditInventory({ ...editInventory, salePrice: val });
                                  }
                                }}
                                className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Redaktə</span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveInventoryEdit(item.id)}
                                  className="px-3 py-1 bg-orange-500 text-white font-bold rounded-lg text-[11px] hover:bg-orange-600"
                                >
                                  Saxla
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingInventoryId(null)}
                                  className="px-2.5 py-1 bg-slate-100 text-slate-500 font-bold rounded-lg text-[11px] hover:bg-slate-200"
                                >
                                  Ləğv
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isLow ? 'bg-red-50/30' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5 font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="px-5 py-3.5 font-extrabold text-slate-800">
                            {item.name}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`font-black text-sm ${isLow ? 'text-red-600 font-black' : 'text-slate-800'}`}>
                              {item.quantity}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 ml-1">{item.unit}</span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-500">
                            {item.minLevel} <span className="text-xs text-slate-400">{item.unit}</span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">{item.unit}</span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-orange-600">
                            {item.costPrice !== undefined ? `${Number(item.costPrice).toFixed(2)} ₼` : '0.00 ₼'}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-emerald-600">
                            {item.salePrice !== undefined && item.salePrice !== null ? `${Number(item.salePrice).toFixed(2)} ₼` : '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isLow ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {isLow ? <AlertTriangle className="w-3 h-3 text-red-500" /> : null}
                              {isLow ? 'KRİTİK STOK' : 'Normal'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => startEditingInventory(item)}
                                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                title="Dəyişdir"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'MƏHSULU SİL',
                                    message: `"${item.name}" məhsulunu anbardan silmək istədiyinizə əminsiniz?`,
                                    confirmText: 'Bəli, Sil',
                                    cancelText: 'Ləğv Et',
                                    onConfirm: () => handleDeleteInventoryItem(item.id),
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Sürüşdürmə çubuqlu Grid Konteyner (Kartlar) */
          <div className="overflow-y-auto max-h-[66vh] pr-2 scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-slate-100 border border-slate-100/30 rounded-2xl bg-white/30 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInventory.map(item => {
                const isLow = item.quantity <= item.minLevel;
                const isEditing = editingInventoryId === item.id;
                
                return (
                  <Card key={item.id} className={isLow ? 'border-red-100 bg-red-50/20' : ''}>
                    {isEditing ? (
                      <div className="space-y-4 p-1">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Məhsul Adı</label>
                          <input 
                            type="text"
                            value={editInventory.name}
                            onChange={e => setEditInventory({ ...editInventory, name: e.target.value })}
                            className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-700"
                            placeholder="Məhsul adı"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mövcud Stok</label>
                            <input 
                              type="number"
                              value={editInventory.quantity}
                              onChange={e => setEditInventory({ ...editInventory, quantity: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-700"
                              placeholder="Stok"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Min. Səviyyə</label>
                            <input 
                              type="number"
                              value={editInventory.minLevel}
                              onChange={e => setEditInventory({ ...editInventory, minLevel: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-700"
                              placeholder="Limit"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vahid (Ölçü)</label>
                            <input 
                              type="text"
                              list="existing-inventory-units"
                              value={editInventory.unit}
                              onChange={e => setEditInventory({ ...editInventory, unit: e.target.value })}
                              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-700"
                              placeholder="kq, litr, ədəd"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alış (₼)</label>
                            <input 
                              type="text"
                              inputMode="decimal"
                              value={editInventory.costPrice ?? ''}
                              onChange={e => {
                                const val = e.target.value.replace(',', '.');
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  setEditInventory({ ...editInventory, costPrice: val });
                                }
                              }}
                              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-700 font-mono"
                              placeholder="Alış qiyməti"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Satış (₼)</label>
                            <input 
                              type="text"
                              inputMode="decimal"
                              value={editInventory.salePrice ?? ''}
                              onChange={e => {
                                const val = e.target.value.replace(',', '.');
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  setEditInventory({ ...editInventory, salePrice: val });
                                }
                              }}
                              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-700 font-mono"
                              placeholder="Satış qiyməti"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button 
                            type="button"
                            onClick={() => handleSaveInventoryEdit(item.id)} 
                            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-100 animate-in fade-in"
                          >
                            Yadda Saxla
                          </button>
                          <button 
                            type="button"
                            onClick={() => setEditingInventoryId(null)} 
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-xl transition-colors"
                          >
                            Ləğv Et
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${isLow ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                              <Package className="w-6 h-6" />
                            </div>
                            {isLow && (
                              <span className="flex items-center text-red-600 text-[10px] font-black uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full border border-red-150">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-500 shrink-0" /> Kritik Səviyyə
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEditingInventory(item)}
                              className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                              title="Dəyişdir"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'MƏHSULU SİL',
                                  message: `"${item.name}" məhsulunu anbardan silmək istədiyinizə əminsiniz?`,
                                  confirmText: 'Bəli, Sil',
                                  cancelText: 'Ləğv Et',
                                  onConfirm: () => handleDeleteInventoryItem(item.id),
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-lg mb-1 tracking-tight">{item.name}</h3>
                        <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 gap-2">
                          <span>Min. Səviyyə: {item.minLevel} {item.unit}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 flex items-center gap-1 font-mono normal-case">
                              Alış: {item.costPrice !== undefined ? `${Number(item.costPrice).toFixed(2)} ₼` : '0.00 ₼'}
                            </span>
                            {item.salePrice !== undefined && item.salePrice !== null && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1 font-mono normal-case">
                                Satış: {Number(item.salePrice).toFixed(2)} ₼
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-end justify-between mt-4">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Mövcud Stok</p>
                            <p className={`text-3xl font-black tracking-tight ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                              {item.quantity} <span className="text-sm font-bold opacity-80">{item.unit}</span>
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        {/* Stok Artır Modalı */}
        {isIncreaseStockOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden"
            >
              {/* Modal Başlığı */}
              <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Mövcud Məhsulun Stokunu Artır</h3>
                    <p className="text-[11px] text-emerald-100 font-medium">Anbardakı məhsula birbaşa yeni miqdar əlavə edin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIncreaseStockOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Məzmunu */}
              <form onSubmit={handleApplyIncreaseStock} className="p-6 space-y-4">
                {increaseStockError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{increaseStockError}</span>
                  </div>
                )}

                {increaseSuccessMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{increaseSuccessMessage}</span>
                  </div>
                )}

                {/* Məhsul Seçimi */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    Məhsulu Seçin
                  </label>
                  <select
                    value={selectedStockItemId || ''}
                    onChange={(e) => handleSelectStockItem(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-xs font-bold text-slate-800"
                  >
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} — Mövcud: {item.quantity} {item.unit || ''} (Min: {item.minLevel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seçilmiş Məhsul Məlumat Kartı */}
                {selectedStockItem && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hazırkı Mövcud Stok</span>
                      <span className="text-base font-black text-slate-800">{selectedStockItem.quantity} {selectedStockItem.unit || ''}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Anbardakı Əvvəlki Alış Qiyməti</span>
                      <span className="text-xs font-bold text-slate-600 font-mono">
                        {selectedStockItem.costPrice !== undefined ? `${Number(selectedStockItem.costPrice).toFixed(2)} ₼` : '0.00 ₼'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Əlavə Olunacaq Miqdar */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      Əlavə Ediləcək Miqdar ({selectedStockItem?.unit || 'vahid'})
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Məs. 10 və ya 2.5"
                        autoFocus
                        value={increaseAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setIncreaseAmount(val);
                          }
                        }}
                        className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm font-black text-slate-800 placeholder-slate-300 font-mono"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {selectedStockItem?.unit || ''}
                      </span>
                    </div>
                  </div>

                  {/* Alış Qiyməti (Eski qiymət avtomatik gəlir, dəyişilə bilər, 0.8 və s. yazıla bilər) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      Alış Qiyməti (₼ / vahid)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Məs. 0.8 və ya 1.50"
                        value={increaseCostPrice}
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setIncreaseCostPrice(val);
                          }
                        }}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm font-black text-slate-800 placeholder-slate-300 font-mono"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ₼
                      </span>
                    </div>
                  </div>
                </div>

                {/* Önizləmə: Yeni yekun stok */}
                {selectedStockItem && increaseAmount && !isNaN(parseFloat(increaseAmount)) && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-150 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">Hesablanmış Yeni Stok:</span>
                    <span className="font-black text-emerald-900 font-mono text-sm">
                      {Math.round((Number(selectedStockItem.quantity || 0) + parseFloat(increaseAmount)) * 1000) / 1000} {selectedStockItem.unit || ''}
                    </span>
                  </div>
                )}

                {/* Düymələr */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsIncreaseStockOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all cursor-pointer"
                  >
                    Ləğv Et
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-100 cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Stoku Təsdiqlə və Artır
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

