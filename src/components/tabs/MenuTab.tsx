import React, { useState, useEffect, useRef } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Settings, 
  CheckCircle2, 
  Trash2, 
  Upload, 
  FolderMinus,
  Camera,
  X,
  Utensils,
  BookOpen
} from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../Card";
import { MenuItem, InventoryItem } from "../../types";
import { compressImageFile } from "../../utils/imageUtils";

export interface MenuTabProps {
  t: any;
  tText: (key: string, defaultText?: string) => string;
  recipes: Record<number, Array<{ ingredientId: number; amount: number; unit?: string }>>;
  setRecipes: React.Dispatch<React.SetStateAction<Record<number, Array<{ ingredientId: number; amount: number; unit?: string }>>>>;
  inventory: InventoryItem[];
  menuSubTab: "dishes" | "recipes";
  setMenuSubTab: (tab: "dishes" | "recipes") => void;
  menuFilter: string;
  setMenuFilter: (filter: string) => void;
  menuSearch: string;
  setMenuSearch: (search: string) => void;
  recipeActiveCategory: string;
  setRecipeActiveCategory: (cat: string) => void;
  recipeSearch: string;
  setRecipeSearch: (search: string) => void;
  selectedRecipeDishId: number | null;
  setSelectedRecipeDishId: (id: number | null) => void;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  currencySymbol: string;
  formatPrice: (amount: number | string | undefined | null) => string;
  isAddingDish: boolean;
  setIsAddingDish: (val: boolean) => void;
  newDish: { name: string; price: string; category: string; image?: string };
  setNewDish: React.Dispatch<React.SetStateAction<any>>;
  newDishError: string;
  handleAddNewDish: (e: React.FormEvent) => void;
  editingMenuItemId: number | null;
  setEditingMenuItemId: (id: number | null) => void;
  editDish: { name: string; price: string; category: string; image?: string };
  setEditDish: React.Dispatch<React.SetStateAction<{ name: string; price: string; category: string; image?: string }>>;
  startEditing: (item: MenuItem) => void;
  handleSaveEdit: (id: number) => void;
  setConfirmDialog: (dialog: any) => void;
  handleDeleteMenuItem: (id: number) => void;
}

export const MenuTab: React.FC<MenuTabProps> = ({
  t,
  tText,
  recipes,
  setRecipes,
  inventory,
  menuSubTab,
  setMenuSubTab,
  menuFilter,
  setMenuFilter,
  menuSearch,
  setMenuSearch,
  recipeActiveCategory,
  setRecipeActiveCategory,
  recipeSearch,
  setRecipeSearch,
  selectedRecipeDishId,
  setSelectedRecipeDishId,
  menuItems,
  setMenuItems,
  currencySymbol,
  formatPrice,
  isAddingDish,
  setIsAddingDish,
  newDish,
  setNewDish,
  newDishError,
  handleAddNewDish,
  editingMenuItemId,
  setEditingMenuItemId,
  editDish,
  setEditDish,
  startEditing,
  handleSaveEdit,
  setConfirmDialog,
  handleDeleteMenuItem
}) => {
  const dishNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMenuFilter('Hamısı');
  }, []);

  useEffect(() => {
    if (isAddingDish) {
      setTimeout(() => {
        dishNameInputRef.current?.focus();
      }, 50);
    }
  }, [isAddingDish]);

  const getItemCostAndMargin = (itemId: number, price: number) => {
          const itemRecipe = recipes[itemId] || [];
          let totalCost = 0;
          itemRecipe.forEach(recipeIngredient => {
            const invItem = inventory.find(i => i.id === recipeIngredient.ingredientId);
            if (invItem && invItem.costPrice) {
              totalCost += recipeIngredient.amount * invItem.costPrice;
            }
          });
          const margin = price - totalCost;
          const marginPercent = price > 0 ? (margin / price) * 100 : 0;
          return { totalCost, margin, marginPercent };
        };

        return (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
              {/* Sub-tab Navigation */}
              <div className="flex space-x-2 border-b border-slate-150 pb-px">
              <button
                onClick={() => setMenuSubTab('dishes')}
                className={`pt-2.5 pb-3 px-4 font-black text-xs uppercase tracking-wider relative transition-all flex items-center gap-2 ${
                  menuSubTab === 'dishes' 
                    ? 'text-orange-500 font-extrabold' 
                    : 'text-slate-400 hover:text-slate-600 font-semibold'
                }`}
              >
                <Utensils className="w-4 h-4 shrink-0" />
                Yeməklər & Qiymətlər
                {menuSubTab === 'dishes' && (
                  <motion.div layoutId="menuActiveIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setMenuSubTab('recipes')}
                className={`pt-2.5 pb-3 px-4 font-black text-xs uppercase tracking-wider relative transition-all flex items-center gap-2 ${
                  menuSubTab === 'recipes' 
                    ? 'text-orange-500 font-extrabold' 
                    : 'text-slate-400 hover:text-slate-600 font-semibold'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                Reseptura & Maya Dəyəri
                {menuSubTab === 'recipes' && (
                  <motion.div layoutId="menuActiveIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            </div>

            {menuSubTab === 'dishes' ? (
              <div className="overflow-y-auto max-h-[72vh] pr-2 scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-slate-100 p-1 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Yemək axtar..." 
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-64 text-xs font-semibold"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const nextState = !isAddingDish;
                      setIsAddingDish(nextState);
                      if (nextState) {
                        setTimeout(() => {
                          dishNameInputRef.current?.focus();
                        }, 50);
                      }
                    }}
                    className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all flex items-center"
                  >
                    <Plus className={`w-4 h-4 mr-2 transition-transform ${isAddingDish ? 'rotate-45' : ''}`} /> 
                    {isAddingDish ? 'Ləğv Et' : 'Yeni Yemək'}
                  </button>
                </div>

                {/* Kateqoriyaların İdarəolunması və Silinməsi paneli */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-xs">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-orange-600">
                      <FolderMinus className="w-4 h-4" /> Kateqoriya İdarə Paneli
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Kateqoriya seçin - aşağıdakı cədvəldə həmin kateqoriyanın məhsulları dərhal listlənəcək və ya silə bilərsiniz.</p>
                  </div>
                  <div className="flex flex-row items-center gap-2 shrink-0">
                    <select
                      id="category-to-delete"
                      value={menuFilter === 'Hamısı' ? '' : menuFilter}
                      onChange={(e) => setMenuFilter(e.target.value || 'Hamısı')}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 h-[38px] w-52 shrink-0"
                    >
                      <option value="">Bütün Kateqoriyalar (Hamısı)</option>
                      {Array.from(new Set(menuItems.map(m => m.category).filter(Boolean))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const selectEl = document.getElementById('category-to-delete') as HTMLSelectElement;
                        const cat = menuFilter !== 'Hamısı' ? menuFilter : selectEl?.value;
                        if (!cat || cat === 'Hamısı') {
                          alert('Zəhmət olmasa silmək istədiyiniz kateqoriyanı seçin.');
                          return;
                        }
                        setConfirmDialog({
                          isOpen: true,
                          title: 'KATEQORİYANI SİL',
                          message: `"${cat}" kateqoriyasını və bu kateqoriyaya aid BÜTÜN yeməkləri proqramdan birdəfəlik silmək istəyirsiniz? Bu əməliyyat geri qaytarıla bilməz!`,
                          confirmText: 'Bəli, Sil',
                          cancelText: 'Ləğv Et',
                          onConfirm: () => {
                            setMenuItems(prev => prev.filter(item => item.category !== cat));
                            setMenuFilter('Hamısı');
                            if (recipeActiveCategory === cat) setRecipeActiveCategory('Hamısı');
                            if (selectEl) selectEl.value = '';
                          }
                        });
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl h-[38px] flex items-center justify-center gap-1.5 shadow-md shadow-red-100 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" /> Seçilmiş Kateqoriyanı Sil
                    </button>
                  </div>
                </div>

                {isAddingDish && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-orange-50/50 border border-orange-100 rounded-2xl flex flex-col gap-4"
                  >
                    {newDishError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        {newDishError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Yemək adı</label>
                        <input 
                          ref={dishNameInputRef}
                          placeholder="Məs. Mərci Şorbası" 
                          value={newDish.name}
                          onChange={e => setNewDish({...newDish, name: e.target.value})}
                          className="px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white placeholder-slate-300 text-xs font-semibold"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kateqoriya (Seçin və ya yazın)</label>
                        <input 
                          list="existing-categories-combobox"
                          placeholder="Kateqoriya seçin və ya mövcud yazın..." 
                          value={newDish.category}
                          onChange={e => setNewDish({...newDish, category: e.target.value})}
                          className="px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white placeholder-slate-300 text-xs font-semibold"
                        />
                        <datalist id="existing-categories-combobox">
                          {Array.from(new Set(menuItems.map(item => item.category).filter(Boolean))).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </datalist>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Qiymət (₼)</label>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          placeholder="Qiymət (Məs: 5.6)" 
                          value={newDish.price}
                          onChange={e => setNewDish({...newDish, price: e.target.value})}
                          className="px-4 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white placeholder-slate-300 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    {/* File Upload Zone */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Şəkil yükləyin (Seçin və ya sürükləyin)</label>
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('border-orange-500', 'bg-orange-100/50');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-orange-500', 'bg-orange-100/50');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-orange-500', 'bg-orange-100/50');
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            compressImageFile(file).then(compressed => {
                              if (compressed) {
                                setNewDish(prev => ({ ...prev, image: compressed }));
                              }
                            });
                          }
                        }}
                        className="border-2 border-dashed border-orange-200 rounded-xl p-4 bg-white/50 text-center cursor-pointer hover:bg-orange-100/20 transition-all flex items-center justify-center gap-4 min-h-[95px] relative"
                      >
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressImageFile(file).then(compressed => {
                                if (compressed) {
                                  setNewDish(prev => ({ ...prev, image: compressed }));
                                }
                              });
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {newDish.image ? (
                          <div className="flex items-center gap-3 w-full justify-between" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                              <img 
                                src={newDish.image} 
                                alt="Yemək şəkli" 
                                className="w-16 h-16 rounded-lg object-cover border border-orange-200" 
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-xs text-green-600 font-bold">Şəkil yükləndi!</span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                setNewDish(prev => ({ ...prev, image: '' }));
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg z-10 transition-colors"
                            >
                              Şəkli Sil
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                            <p className="text-xs font-semibold text-slate-600">Klikləyin və ya şəkli bura sürükləyin</p>
                            <p className="text-[10px] text-slate-400 font-medium">PNG, JPG, JPEG (Max. 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={handleAddNewDish}
                        className="bg-orange-500 text-white font-extrabold rounded-xl px-6 py-2.5 shadow-md shadow-orange-100 hover:bg-orange-600 transition-colors text-xs uppercase tracking-wider"
                      >
                        Əlavə Et
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto max-h-[840px] scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-slate-100">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white z-10 shadow-2xs">
                        <tr className="text-left border-b border-slate-150 text-slate-400 text-xs font-black uppercase tracking-widest bg-slate-50/95 backdrop-blur-xs">
                          <th className="py-3 px-4">Ad</th>
                          <th className="py-3 px-4">Kateqoriya</th>
                          <th className="py-3 px-4">Satış Qiyməti</th>
                          <th className="py-3 px-4">Maya Dəyəri</th>
                          <th className="py-3 px-4">Gəlir Marjası</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {menuItems
                          .filter(item => (menuFilter === 'Hamısı' || item.category === menuFilter) && (item.name || '').toLowerCase().includes((menuSearch || '').toLowerCase()))
                          .map(item => {
                            const { totalCost, margin, marginPercent } = getItemCostAndMargin(item.id, item.price);
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="py-3 px-4">
                                  {editingMenuItemId === item.id ? (
                                    <div className="flex items-center gap-2.5">
                                      <div className="relative group shrink-0">
                                        <label 
                                          className="relative flex items-center justify-center w-11 h-11 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/60 hover:bg-orange-100/60 hover:border-orange-500 transition-all cursor-pointer overflow-hidden shadow-xs"
                                          title="Kompüterin yaddaşından şəkil seçin"
                                        >
                                          {editDish.image ? (
                                            <img 
                                              src={editDish.image} 
                                              alt={editDish.name || "Məhsul şəkli"} 
                                              className="w-full h-full object-cover" 
                                              referrerPolicy="no-referrer" 
                                            />
                                          ) : (
                                            <div className="flex flex-col items-center justify-center text-orange-500">
                                              <Camera className="w-4 h-4" />
                                              <span className="text-[8px] font-black leading-none mt-0.5 uppercase tracking-tighter">Şəkil</span>
                                            </div>
                                          )}
                                          <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                compressImageFile(file).then(compressed => {
                                                  if (compressed) {
                                                    setEditDish(prev => ({ ...prev, image: compressed }));
                                                  }
                                                });
                                              }
                                            }}
                                            className="hidden" 
                                          />
                                        </label>
                                        {editDish.image && (
                                          <button 
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setEditDish(prev => ({ ...prev, image: '' }));
                                            }}
                                            className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-xs text-[10px] cursor-pointer transition-colors z-10"
                                            title="Şəkli sil"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-[140px]">
                                        <input 
                                          value={editDish.name}
                                          onChange={e => setEditDish({...editDish, name: e.target.value})}
                                          placeholder="Yemək adı"
                                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 w-full focus:ring-2 focus:ring-orange-500 text-xs font-semibold"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-150 shadow-xs" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center font-black text-xs select-none">
                                          {item.name.charAt(0)}
                                        </div>
                                      )}
                                      <span className="font-extrabold text-slate-700 text-xs">{item.name}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {editingMenuItemId === item.id ? (
                                    <input 
                                      value={editDish.category}
                                      onChange={e => setEditDish({...editDish, category: e.target.value})}
                                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-500 text-xs font-semibold"
                                    />
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                      {item.category}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {editingMenuItemId === item.id ? (
                                    <input 
                                      type="text"
                                      inputMode="decimal"
                                      value={editDish.price}
                                      onChange={e => setEditDish({...editDish, price: e.target.value})}
                                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 w-24 focus:ring-2 focus:ring-orange-500 text-xs font-semibold"
                                    />
                                  ) : (
                                    <span className="font-extrabold text-slate-800 text-xs">{item.price.toFixed(2)} ₼</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-bold text-xs text-slate-500">
                                  {totalCost > 0 ? `${totalCost.toFixed(2)} ₼` : 'Təyin edilməyib'}
                                </td>
                                <td className="py-3 px-4">
                                  {totalCost > 0 ? (
                                    <div className="flex flex-col">
                                      <span className="font-black text-xs text-emerald-600">+{margin.toFixed(2)} ₼</span>
                                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{marginPercent.toFixed(1)}% MARJA</span>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Reset yoxdur</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${item.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    <span className="text-xs text-slate-600 font-bold">{item.status === 'active' ? 'Aktiv' : 'Gizli'}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {editingMenuItemId === item.id ? (
                                    <div className="flex justify-end gap-2">
                                       <button 
                                          onClick={() => handleSaveEdit(item.id)}
                                          className="px-3 py-1 bg-green-500 text-white text-xs font-extrabold rounded-lg shadow-sm uppercase tracking-wide cursor-pointer hover:bg-green-600 transition-colors"
                                       >
                                         Yadda Saxla
                                       </button>
                                       <button 
                                          onClick={() => setEditingMenuItemId(null)}
                                          className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-black rounded-lg uppercase tracking-wide cursor-pointer hover:bg-slate-300 transition-colors"
                                       >
                                         Ləğv Et
                                       </button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end items-center gap-2">
                                      <button 
                                        onClick={() => startEditing(item)}
                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center"
                                        title="Düzəliş et"
                                      >
                                        <Settings className="w-4 h-4 text-red-600" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteMenuItem(item.id)}
                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center"
                                        title="Yeməyi Sil"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              // --- Reseptura və Maya Dəyəri Analyzer tab content ---
              <div className="overflow-y-auto max-h-[72vh] pr-2 scrollbar-thin scrollbar-thumb-orange-500/50 scrollbar-track-slate-100 p-1 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: statistics and Dish selection list */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {/* Stats panel cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Milli Menyu Marjası</p>
                      <h4 className="text-xl font-black text-emerald-600">82.4%</h4>
                      <p className="text-[8px] font-bold text-slate-400 mt-1">İdeal göstəricidir (norma &gt;70%)</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ən Gəlirli Yemək</p>
                      <h4 className="text-md font-black text-slate-800 uppercase tracking-tight truncate">Mərci Şorbası</h4>
                      <p className="text-[8px] font-black text-emerald-500 mt-1">94.4% MƏNFƏƏT</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-xs">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Anbar Avtomatika</p>
                      <h4 className="text-md font-black text-orange-600 flex items-center gap-1.5 uppercase">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 animate-pulse" />
                        Aktivdir
                      </h4>
                      <p className="text-[8px] font-bold text-slate-400 mt-1">Hər sifarişdə anbardan dərhal silinmə</p>
                    </div>
                  </div>

                  {/* Search and Category filters for Recipes */}
                  <div className="bg-white rounded-[24px] border border-slate-100 p-4 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Yemək adı ilə axtar..." 
                          value={recipeSearch}
                          onChange={(e) => setRecipeSearch(e.target.value)}
                          className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-full text-xs font-semibold"
                        />
                      </div>
                      {recipeSearch && (
                        <button 
                          onClick={() => setRecipeSearch('')}
                          className="text-[10px] font-black text-slate-400 hover:text-orange-550 uppercase tracking-widest px-2"
                        >
                          Təmizlə
                        </button>
                      )}
                    </div>

                    {/* Category Selector Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 max-h-[120px] overflow-y-auto scrollbar-thin">
                      {['Hamısı', ...Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)))].map(cat => {
                        const isActive = recipeActiveCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setRecipeActiveCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all ${
                              isActive 
                                ? 'bg-orange-500 text-white shadow-xs border border-orange-600'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recipe selection table */}
                  <Card>
                    <div className="mb-4">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Menyu Yeməklərinin Resept Kitabı</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Maya dəyərini analiz etmək və resept əlavə etmək üçün yemək seçin.</p>
                    </div>
                    
                    <div className="overflow-y-auto max-h-[460px] pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-slate-50 border border-slate-100 rounded-xl">
                      <table className="w-full relative border-collapse">
                        <thead className="sticky top-0 bg-white z-10 shadow-xs">
                          <tr className="text-left border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-white">
                            <th className="pb-3 pt-3 pl-3">Yemək</th>
                            <th className="pb-3 pt-3 text-center hidden sm:table-cell">İnqrediyent sayı</th>
                            <th className="pb-3 pt-3">Hesablanmış Maya Dəyəri</th>
                            <th className="pb-3 pt-3">Satış Qiyməti</th>
                            <th className="pb-3 pt-3 hidden md:table-cell">Məfəət Marjası</th>
                            <th className="pb-3 pt-3 pr-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(() => {
                            const filteredRecipeMenuItems = menuItems.filter(item => {
                              const matchesName = (item.name || '').toLowerCase().includes((recipeSearch || '').toLowerCase());
                              const matchesCategory = recipeActiveCategory === 'Hamısı' || item.category === recipeActiveCategory;
                              return matchesName && matchesCategory;
                            });

                            if (filteredRecipeMenuItems.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="text-center py-8 text-xs font-semibold text-slate-400">
                                    Axtarışa uyğun yemək tapılmadı.
                                  </td>
                                </tr>
                              );
                            }

                            return filteredRecipeMenuItems.map(item => {
                              const { totalCost, margin, marginPercent } = getItemCostAndMargin(item.id, item.price);
                              const ingredientCount = (recipes[item.id] || []).length;
                              const isSelected = selectedRecipeDishId === item.id;
                              return (
                                <tr 
                                  key={item.id} 
                                  onClick={() => setSelectedRecipeDishId(item.id)}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected ? 'bg-orange-50/50' : 'hover:bg-slate-50/30'
                                  }`}
                                >
                                  <td className="py-3 pl-3 font-extrabold text-xs text-slate-800">{item.name}</td>
                                  <td className="py-3 text-center font-bold text-xs text-slate-500 hidden sm:table-cell">{ingredientCount} ədəd</td>
                                  <td className="py-3 font-bold text-xs text-slate-600">
                                    {totalCost > 0 ? `${totalCost.toFixed(2)} ₼` : '0.00 ₼ (Təyin edilməyib)'}
                                  </td>
                                  <td className="py-3 font-extrabold text-xs text-slate-900">{item.price.toFixed(2)} ₼</td>
                                  <td className="py-3 hidden md:table-cell">
                                    {totalCost > 0 ? (
                                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                        {marginPercent.toFixed(1)}% Marja (+{margin.toFixed(2)} ₼)
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-black text-slate-300 uppercase">Resept yoxdur</span>
                                    )}
                                  </td>
                                  <td className="py-3 text-right pr-3">
                                    <button className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border transition-all ${
                                      isSelected ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-slate-250 text-slate-600 hover:border-orange-500 hover:text-orange-600'
                                    }`}>
                                      Seç
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                {/* Right side: selected Recipe Editor console */}
                <div className="flex flex-col bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 h-fit">
                  {selectedRecipeDishId ? (() => {
                    const dish = menuItems.find(m => m.id === selectedRecipeDishId);
                    const list = recipes[selectedRecipeDishId] || [];
                    const { totalCost, margin, marginPercent } = getItemCostAndMargin(selectedRecipeDishId, dish?.price || 0);

                    return (
                      <div className="space-y-4">
                        <div className="border-b border-slate-50 pb-3">
                          <span className="bg-orange-50 text-orange-600 font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                            {tText("Rezsept Koordinatoru")}
                          </span>
                          <h4 className="text-sm font-black text-slate-800 mt-1">{dish ? tText(dish.name) : ""}</h4>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-1">
                            <span>{tText("Menyu qiyməti:")} <b className="text-slate-700">{dish ? formatPrice(dish.price) : ""}</b></span>
                            <span>{tText("Maya Dəyəri:")} <b className="text-slate-700">{formatPrice(totalCost)}</b></span>
                          </div>
                        </div>

                        {/* List of current recipe ingredients */}
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{tText("İstifadə olunan inqrediyentlər")}</p>
                          {list.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{tText("Resept Boşdur")}</p>
                              <p className="text-[9px] text-slate-400 font-semibold">{tText("Aşağıdan anbardan ilk maddəni əlavə edin.")}</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {list.map(ingredient => {
                                const inv = inventory.find(i => i.id === ingredient.ingredientId);
                                const costFraction = (inv?.costPrice || 0) * ingredient.amount;
                                return (
                                  <div key={ingredient.ingredientId} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <div>
                                      <p className="text-xs font-extrabold text-slate-700 leading-none mb-1">{inv ? tText(inv.name) : ""}</p>
                                      <p className="text-[9px] text-slate-400 font-extrabold tracking-tight">
                                        {tText("Pors:")} {ingredient.amount} {inv ? tText(inv.unit) : ""} ({inv ? formatPrice(inv.costPrice) : ""}/{inv ? tText(inv.unit) : ""})
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-slate-700">+{formatPrice(costFraction)}</span>
                                      <button 
                                        onClick={() => {
                                          setRecipes(prev => {
                                            const updated = { ...prev };
                                            updated[selectedRecipeDishId] = (updated[selectedRecipeDishId] || [])
                                              .filter(i => i.ingredientId !== ingredient.ingredientId);
                                            return updated;
                                          });
                                        }}
                                        className="text-red-400 hover:text-red-600 transition-colors shrink-0 text-xs font-black p-1 hover:bg-red-50 rounded"
                                        title={tText("Sil")}
                                      >
                                        &times;
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Interactive Add Ingredient Form */}
                        <div className="border-t border-slate-50 pt-3 bg-slate-50/55 p-3 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{tText("Anbardan İnqrediyent Əlavə Et")}</p>
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const ingId = parseInt(formData.get('ingId') as string);
                              const ingAmt = parseFloat(formData.get('ingAmt') as string);
                              if (isNaN(ingId) || isNaN(ingAmt) || ingAmt <= 0) return;

                              setRecipes(prev => {
                                const updated = { ...prev };
                                const existing = updated[selectedRecipeDishId] || [];
                                const existIndex = existing.findIndex(i => i.ingredientId === ingId);
                                if (existIndex > -1) {
                                  existing[existIndex] = { ...existing[existIndex], amount: ingAmt };
                                } else {
                                  existing.push({ ingredientId: ingId, amount: ingAmt });
                                }
                                updated[selectedRecipeDishId] = [...existing];
                                return updated;
                              });
                              e.currentTarget.reset();
                            }}
                            className="space-y-3"
                          >
                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">{tText("Maddə Seç")}</label>
                              <select name="ingId" required className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-orange-500">
                                {inventory.map(inv => (
                                  <option key={inv.id} value={inv.id}>{tText(inv.name)} ({tText(inv.unit)})</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase">{tText("Məbləğ / Sərfiyyat (kq, l, ədəd..)")}</label>
                              <input 
                                name="ingAmt" 
                                type="number" 
                                step="0.001" 
                                placeholder={tText("Məs. 0.150")} 
                                required 
                                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-orange-500" 
                              />
                            </div>
                            <button type="submit" className="w-full bg-orange-500 text-white font-black text-[9px] py-2 rounded-xl hover:bg-orange-600 uppercase tracking-wider shadow-inner transition-all">
                              {tText("Maddəni Reseptə Yaz")}
                            </button>
                          </form>
                        </div>

                        {/* Costing Summary details */}
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl pt-2.5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black text-emerald-700 uppercase">{tText("Mərfəət Marjası (%)")}</span>
                            <span className="text-sm font-black text-emerald-800">{marginPercent.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-emerald-700 uppercase">{tText("Yemək Başına Qazanc (Net)")}</span>
                            <span className="text-xs font-black text-emerald-900">+{formatPrice(margin)}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })() : (
                    <div className="text-center py-16 text-slate-300">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mx-auto mb-3">
                        <Package className="w-5 h-5 text-slate-400 animate-pulse" />
                      </div>
                      <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">{tText("Yemək seçilməyib")}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">{tText("Soldakı resept siyahısından istədiyiniz reseptə toxunub düzəldin.")}</p>
                    </div>
                  )}
                </div>

              </div>
              </div>
            )}
          </div>
          </div>
        );
};
