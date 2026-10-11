import React from "react";
import { Plus, Search, CheckCircle2, QrCode, Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../Card";
import { Table, MenuItem, OrderItem, KitchenItem, InventoryItem } from "../../types";

export interface QrTabProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  selectedQRTableId: number;
  setSelectedQRTableId: (id: number) => void;
  activeOrders: Record<number, OrderItem[]>;
  setActiveOrders: React.Dispatch<React.SetStateAction<Record<number, OrderItem[]>>>;
  menuItems: MenuItem[];
  qrCart: Record<number, number>;
  setQrCart: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  qrActiveCategory: string;
  setQrActiveCategory: (category: string) => void;
  qrSearch: string;
  setQrSearch: (search: string) => void;
  qrNotification: string | null;
  setQrNotification: (notif: string | null) => void;
  setKitchenLog: React.Dispatch<React.SetStateAction<KitchenItem[]>>;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  recipes: Record<number, { ingredientId: number; amount: number }[]>;
  currencySymbol: string;
  formatPrice: (amount: number | string | undefined | null) => string;
  appName: string;
  tText: (key: string, defaultText?: string) => string;
}

export const QrTab: React.FC<QrTabProps> = ({
  tables,
  setTables,
  selectedQRTableId,
  setSelectedQRTableId,
  activeOrders,
  setActiveOrders,
  menuItems,
  qrCart,
  setQrCart,
  qrActiveCategory,
  setQrActiveCategory,
  qrSearch,
  setQrSearch,
  qrNotification,
  setQrNotification,
  setKitchenLog,
  setInventory,
  recipes,
  currencySymbol,
  formatPrice,
  appName,
  tText
}) => {
const selectedTable = tables.find(t => t.id === selectedQRTableId) || tables[0];
        const isTableOccupied = selectedTable.status === 'occupied';

        return (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
              
              {/* Main title banner */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-[28px] p-6 text-white min-h-[140px] flex flex-col justify-between shadow-xl shadow-orange-100 relative overflow-hidden">
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                  <QrCode className="w-48 h-48" />
                </div>
                <span className="bg-white/20 uppercase tracking-widest text-[9px] font-black px-3 py-1 rounded-full w-fit">
                  SELF-SERVICE MASA AGENTİ SIMULATORU
                </span>
                <div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">QR Menyu və Masadan Sifariş</h2>
                  <p className="text-xs font-semibold opacity-90 mt-1 max-w-xl">
                    Masaların üzərindəki xüsusi QR kodları skan edərək müştərilərin masa başından öz telefonları ilə birbaşa mətbəxə sifariş göndərmə sisteminin interaktiv simulyasiyası.
                  </p>
                </div>
              </div>

              {/* Main row layout: Table list and iPhone simulation */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Visual tables collection in restaurant (left 7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  
                  {/* Banner notifications */}
                  {qrNotification && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 text-white rounded-xl">
                          <CheckCircle2 className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">Sifariş Muvəffəqiyyətlə Yerləşdirildi!</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">{qrNotification}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setQrNotification(null)}
                        className="text-xs font-black text-slate-400 hover:text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-150 transition-all cursor-pointer"
                      >
                        Təsdiqlə / Gizlə
                      </button>
                    </motion.div>
                  )}

                  <Card>
                    <div className="mb-4">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Restorandakı Masalar (QR Kodlar)</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Simulyasiya etmək üçün masanı seçin. Telefon ekranında həmin masanın QR Menyusu açılacaq.</p>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {tables.map(table => {
                        const isSelected = selectedQRTableId === table.id;
                        const hasOrders = (activeOrders[table.id] || []).length > 0;
                        return (
                          <div 
                            key={table.id}
                            onClick={() => {
                              setSelectedQRTableId(table.id);
                              setQrCart({}); // clear client cart of previous simulated scans
                            }}
                            className={`p-4 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-2 relative group ${
                              isSelected 
                                ? 'bg-orange-50/70 border-orange-500 shadow-md ring-1 ring-orange-500' 
                                : 'bg-white border-slate-150 hover:border-slate-350 hover:scale-[1.02]'
                            }`}
                          >
                            <span className="absolute top-2 right-2 text-[8px] font-black tracking-tight text-slate-400 border border-slate-200 px-1 rounded bg-slate-50 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                              QR
                            </span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                              table.status === 'occupied' 
                                ? 'bg-red-50 text-red-500' 
                                : 'bg-green-50 text-green-500'
                            }`}>
                              {table.number}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-700">{table.name}</p>
                              <span className={`text-[8px] font-black uppercase mt-0.5 inline-block ${
                                table.status === 'occupied' ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {table.status === 'occupied' ? 'Məşğul' : 'Boş'}
                              </span>
                            </div>

                            {/* Simulated physical layout */}
                            <QrCode className={`w-10 h-10 border p-1 rounded-lg mt-1 transition-colors ${
                              isSelected ? 'text-orange-500 border-orange-200' : 'text-slate-400 border-slate-150'
                            }`} />
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* QR System Explanations */}
                  <div className="bg-white rounded-3xl border border-slate-150 p-6 flex flex-col sm:flex-row items-center gap-5">
                    <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl shrink-0">
                      <Smartphone className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Ağıllı Müştəri QR- POS sistemi</h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Masa üzərindəki QR kod birbaşa həmin masa nömrəsinə bağlanır. Müştəri ofisiantı gözləmədən sifarişini verdikdə:
                      </p>
                      <ul className="list-disc pl-4 text-[10px] text-slate-500 font-semibold space-y-1 pt-1.5">
                        <li>Sifariş birbaşa sistemdəki <b className="text-orange-600">"Mətbəx" (Kitchen)</b> ekranına yollanır və akustik asılqan səsi verir.</li>
                        <li>Yemək reseptinə əsaslanan inqrediyentlər <b className="text-orange-600">avtomatik olaraq anbardan (Inventory)</b> çıxılır.</li>
                        <li>Sistemdə həmin masanın statusu dərhal onlayn "Məşğul" rejimə keçir və kassa küncündə ödəniş balansı yaranır.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* iPhone visual simulator panel on the right (right 5 cols) */}
                <div className="lg:col-span-5 flex justify-center">
                  
                  {/* Visually stunning physical smartphone bezel mock */}
                  <div className="w-[330px] h-[670px] max-h-[calc(100vh-140px)] min-h-[500px] bg-slate-900 rounded-[50px] shadow-2xl p-3 border-[4px] border-slate-700 flex flex-col relative overflow-hidden ring-4 ring-slate-100 shrink-0">
                    
                    {/* iPhone speaker notch & sensor */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-full z-30 flex items-center justify-center gap-1.5">
                      <div className="w-12 h-1 bg-slate-800 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
                    </div>

                    {/* iPhone screen internals */}
                    <div className="flex-1 bg-white rounded-[38px] overflow-hidden flex flex-col relative z-10 p-4 pt-6">
                      
                      {/* Visual top status bar */}
                      <div className="flex items-center justify-between text-[9px] font-black text-slate-900 px-3 py-1 mb-2">
                        <span>09:41</span>
                        <div className="flex items-center gap-1">
                          <span className="font-extrabold text-[8px] tracking-tighter">5G</span>
                          <div className="w-4 h-2 bg-slate-900 rounded-xs flex p-px">
                            <div className="flex-1 bg-white rounded-xs" />
                          </div>
                        </div>
                      </div>

                      {/* Web View customer custom application header */}
                      <div className="border-b border-slate-50 pb-3 flex flex-col gap-1 select-none">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-xs">
                            RM
                          </div>
                          <div>
                            <h5 className="text-[11px] font-black text-slate-800 tracking-tight leading-none">RestoMaster QR Menyu</h5>
                            <span className="text-[9px] text-emerald-500 font-extrabold flex items-center gap-1 mt-0.5 animate-pulse">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> MASAYA KOORDİNASİYA
                            </span>
                          </div>
                        </div>
                        <div className="bg-orange-500 text-white rounded-xl py-2 px-3 mt-2 flex items-center justify-between shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-wider">{selectedTable.name}</span>
                          <span className="text-[9px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">QR QR-S1</span>
                        </div>
                      </div>

                      {/* Categories filter layout */}
                      <div className="flex space-x-1.5 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-slate-100 select-none border-b border-slate-50">
                        {['Hamısı', ...Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)))].map(category => (
                          <button
                            key={category}
                            onClick={() => setQrActiveCategory(category)}
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight transition-all shrink-0 border cursor-pointer ${
                              qrActiveCategory === category
                                ? 'bg-orange-500 border-orange-505 text-white shadow-xs'
                                : 'bg-white border-slate-150 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>

                      {/* iPhone inner searchable menu items list */}
                      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 hover:pr-0.5 scrollbar-thin scrollbar-thumb-orange-500/80 scrollbar-track-slate-50 rounded-xl">
                        
                        {/* Search bar mini inside phone */}
                        <div className="relative mb-2">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-450" />
                          <input 
                            placeholder="Axtarış..." 
                            value={qrSearch}
                            onChange={(e) => setQrSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl border-none focus:outline-none focus:ring-1 focus:ring-orange-500 text-[10px] font-semibold"
                          />
                        </div>

                        {menuItems
                          .filter(item => (qrActiveCategory === 'Hamısı' || item.category === qrActiveCategory) && (item.name || '').toLowerCase().includes((qrSearch || '').toLowerCase()))
                          .map(item => {
                            const currentQty = qrCart[item.id] || 0;
                            return (
                              <div key={item.id} className="flex gap-2.5 items-center bg-white p-2 border border-slate-100 rounded-2xl hover:border-orange-200 transition-colors">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center font-black text-xs shrink-0 select-none">
                                    {item.name.charAt(0)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-extrabold text-slate-800 truncate leading-none mb-1">{item.name}</p>
                                  <span className="bg-slate-50 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded">
                                    {item.category}
                                  </span>
                                  <p className="text-[11px] font-black text-slate-900 mt-1.5">{item.price.toFixed(2)} ₼</p>
                                </div>
                                
                                {/* Plus/Minus button widget inside phone */}
                                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 select-none">
                                  {currentQty > 0 && (
                                    <>
                                      <button 
                                        onClick={() => {
                                          setQrCart(prev => {
                                            const updated = { ...prev };
                                            if (updated[item.id] > 1) updated[item.id]--;
                                            else delete updated[item.id];
                                            return updated;
                                          });
                                        }}
                                        className="w-5 h-5 bg-white text-slate-500 font-black rounded-lg border border-slate-150 flex items-center justify-center hover:bg-slate-100/50 cursor-pointer text-xs"
                                      >
                                        -
                                      </button>
                                      <span className="text-[10px] font-extrabold text-slate-700 min-w-[12px] text-center">
                                        {currentQty}
                                      </span>
                                    </>
                                  )}
                                  <button 
                                    onClick={() => {
                                      setQrCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
                                    }}
                                    className="w-5 h-5 bg-orange-500 text-white font-black rounded-lg flex items-center justify-center hover:bg-orange-600 cursor-pointer text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Simulated customer cart floating bar */}
                      {Object.keys(qrCart).length > 0 && (() => {
                        const totalQrCartSum = Object.entries(qrCart).reduce((acc, [id, qty]) => {
                          const item = menuItems.find(m => m.id === parseInt(id));
                          const qtyNum = Number(qty) || 0;
                          return acc + (item?.price || 0) * qtyNum;
                        }, 0);

                        return (
                          <motion.div 
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-slate-900 text-white rounded-[24px] p-3 shadow-xl flex flex-col gap-2 relative z-20 shrink-0"
                          >
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[9px] font-black text-slate-400 capitalize">Səbətdə: {Object.values(qrCart).reduce((a, b) => Number(a) + Number(b), 0)} ədəd</span>
                              <span className="text-xs font-black text-white">{totalQrCartSum.toFixed(2)} ₼</span>
                            </div>
                            <button
                              onClick={() => {
                                // Real-world action triggers:
                                const now = new Date();
                                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                const newOrderItems: OrderItem[] = Object.entries(qrCart).map(([id, qty]) => {
                                  const item = menuItems.find(m => m.id === parseInt(id))!;
                                  const qtyNum = Number(qty) || 0;
                                  return {
                                    id: Date.now() + Math.random(),
                                    menuId: item.id,
                                    name: item.name,
                                    price: item.price,
                                    quantity: qtyNum,
                                    status: 'pending', // sent to kitchen
                                    isQR: true,
                                    orderTime: timeStr
                                  };
                                });

                                // 1. Update the table status to busy and calculate orderTotal
                                setTables(prev => prev.map(t => {
                                  if (t.id === selectedQRTableId) {
                                    const currentOrders = activeOrders[selectedQRTableId] || [];
                                    const totalSumCombined = [...currentOrders, ...newOrderItems].reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                    return { 
                                      ...t, 
                                      status: 'occupied', 
                                      orderTotal: totalSumCombined,
                                      waiterName: t.waiterName || 'QR Sifariş'
                                    };
                                  }
                                  return t;
                                }));

                                // 2. Add orders to table's activeOrders
                                setActiveOrders(prev => {
                                  let currentOrders = prev[selectedQRTableId] || [];
                                  // Merging if same item is already added
                                  newOrderItems.forEach(newItem => {
                                    const matchIndex = currentOrders.findIndex(o => o.menuId === newItem.menuId && o.status === 'pending');
                                    if (matchIndex > -1) {
                                      currentOrders[matchIndex].quantity += newItem.quantity;
                                    } else {
                                      currentOrders.push(newItem);
                                    }
                                  });
                                  return { ...prev, [selectedQRTableId]: [...currentOrders] };
                                });

                                // 3. Build a kitchen log item and trigger ingredient deductions immediately!
                                setKitchenLog(prev => {
                                  const list: KitchenItem[] = newOrderItems.map(item => ({
                                    id: Date.now() + Math.random(),
                                    dishName: item.name,
                                    tableNumber: selectedTable.number,
                                    waiterName: 'Self-Service QR',
                                    timestamp: new Date(),
                                    status: 'preparing',
                                    quantity: item.quantity
                                  }));
                                  return [...list, ...prev];
                                });

                                // Deduct recipe items from inventory live in database!
                                setInventory(prevInv => {
                                  let updatedInv = [...prevInv];
                                  newOrderItems.forEach(newItem => {
                                    const itemRecipe = recipes[newItem.menuId];
                                    if (itemRecipe) {
                                      itemRecipe.forEach(recipeIngredient => {
                                        updatedInv = updatedInv.map(invItem => {
                                          if (invItem.id === recipeIngredient.ingredientId) {
                                            const deduction = recipeIngredient.amount * newItem.quantity;
                                            const newQty = Math.max(0, Number((invItem.quantity - deduction).toFixed(3)));
                                            return { ...invItem, quantity: newQty };
                                          }
                                          return invItem;
                                        });
                                      });
                                    }
                                  });
                                  return updatedInv;
                                });

                                // 4. Set persistent waiter UI alert banner
                                setQrNotification(`${selectedTable.name} üçün ${newOrderItems.length} yemək QR tərəfindən mətbəxə ötürüldü.`);
                                
                                // 5. Clear client visual code state
                                setQrCart({});
                              }}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] py-2.5 rounded-xl uppercase tracking-widest transition-colors cursor-pointer text-center"
                            >
                              SİFARİŞİ GÖNDƏR ₼
                            </button>
                          </motion.div>
                        );
                      })()}

                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        );
};
