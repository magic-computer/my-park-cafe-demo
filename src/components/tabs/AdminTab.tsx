import React from "react";
import { 
  Utensils, 
  Receipt, 
  Plus, 
  Search, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Save, 
  FileText, 
  Printer, 
  Download, 
  Upload, 
  Database, 
  Globe, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Info, 
  Shield, 
  X, 
  Keyboard 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../Card";
import { ClockComponent } from "../ClockComponent";
import { safeLocalStorageSetItem } from "../../utils/storageUtils";
import { DraggableWindow } from "../DraggableWindow";
import { AdminSecurityTab } from "../AdminSecurityTab";
import { Table, MenuItem, OrderItem, Reservation, InventoryItem, StaffMember, KitchenItem } from "../../types";
import { verifyPasswordSecure, setPasswordSecure } from "../../utils/authUtils";
import { detectPortForPrinter, STANDARD_PRINTER_PORTS } from "../../utils/printerUtils";
import { compressImageFile } from "../../utils/imageUtils";
import { encryptBackupPayload, decryptBackupPayload } from "../../utils/cryptoBackupUtils";
import { z } from "zod";

const backupRestoreSchema = z.object({
  resto_tables: z.any().optional(),
  tables: z.any().optional(),
  resto_menuItems: z.any().optional(),
  menuItems: z.any().optional(),
  resto_reservations: z.any().optional(),
  reservations: z.any().optional(),
  resto_inventory: z.any().optional(),
  inventory: z.any().optional(),
  resto_inventoryTransactions: z.any().optional(),
  inventoryTransactions: z.any().optional(),
  resto_inventory_hash: z.any().optional(),
  resto_inventory_hash_customized: z.any().optional(),
  resto_orderTransactions: z.any().optional(),
  orderTransactions: z.any().optional(),
  resto_expenses: z.any().optional(),
  expenses: z.any().optional(),
  resto_defectRecords: z.any().optional(),
  defectRecords: z.any().optional(),
  resto_staff: z.any().optional(),
  staff: z.any().optional(),
  resto_kitchenLog: z.any().optional(),
  kitchenLog: z.any().optional(),
  resto_activeOrders: z.any().optional(),
  activeOrders: z.any().optional(),
  resto_auditLogs: z.any().optional(),
  auditLogs: z.any().optional(),
  resto_closedShifts: z.any().optional(),
  closedShifts: z.any().optional(),
  resto_activeShift: z.any().optional(),
  activeShift: z.any().optional(),
  printerType: z.any().optional(),
  printerFontSize: z.any().optional(),
  printerMargin: z.any().optional(),
  printerFooterText: z.any().optional(),
  printerRouteMode: z.any().optional(),
  networkPrinterIP: z.any().optional(),
  networkPrinterPort: z.any().optional(),
  resto_printerPresetType: z.any().optional(),
  resto_profileA_name: z.any().optional(),
  resto_profileA_type: z.any().optional(),
  resto_profileA_fontSize: z.any().optional(),
  resto_profileB_name: z.any().optional(),
  resto_profileB_type: z.any().optional(),
  resto_profileB_fontSize: z.any().optional(),
  resto_profileC_name: z.any().optional(),
  resto_profileC_type: z.any().optional(),
  resto_profileC_fontSize: z.any().optional(),
  resto_profileC_port: z.any().optional(),
  resto_appNameWord1: z.any().optional(),
  resto_appNameWord2: z.any().optional(),
  resto_appNameColor1: z.any().optional(),
  resto_appNameColor2: z.any().optional(),
  resto_appNameFontSize: z.any().optional(),
  resto_appNameFontFamily: z.any().optional(),
  resto_appNameFontWeight: z.any().optional(),
  resto_appNameFontStyle: z.any().optional(),
  resto_appLogoUrl: z.any().optional(),
  resto_devName: z.any().optional(),
  resto_devBio: z.any().optional(),
  resto_devEmail: z.any().optional(),
  resto_devPhone: z.any().optional(),
  resto_devWhatsapp: z.any().optional(),
  resto_devGithub: z.any().optional(),
  resto_devLinkedin: z.any().optional(),
  resto_devWebsite: z.any().optional(),
  resto_devLogoUrl: z.any().optional(),
  resto_devPrograms: z.any().optional(),
  backup_timestamp: z.any().optional(),
}).passthrough();

export interface AdminTabProps {
  [key: string]: any;
}

export const AdminTab: React.FC<AdminTabProps> = (props) => {
    const {
    t,
    tText,
    isAdminUnlocked,
    setIsAdminUnlocked,
    adminSubTab,
    setAdminSubTab,
    adminTypedPassword,
    setAdminTypedPassword,
    adminPasswordFeedback,
    setAdminPasswordFeedback,
    adminKbLanguage,
    setAdminKbLanguage,
    showAdminPasswordRaw,
    setShowAdminPasswordRaw,
    adminInputRef,
    tables,
    setTables,
    menuItems,
    setMenuItems,
    inventory,
    setInventory,
    staff,
    setStaff,
    reservations,
    setReservations,
    kitchenLog,
    setKitchenLog,
    activeOrders,
    setActiveOrders,
    expenses,
    setExpenses,
    defectRecords,
    setDefectRecords,
    auditLogs,
    setAuditLogs,
    appName,
    appNameWord1,
    setAppNameWord1,
    appNameWord2,
    setAppNameWord2,
    appLogoUrl,
    setAppLogoUrl,
    appNameColor1,
    setAppNameColor1,
    appNameColor2,
    setAppNameColor2,
    appNameFontFamily,
    setAppNameFontFamily,
    appNameFontSize,
    setAppNameFontSize,
    appNameFontStyle,
    setAppNameFontStyle,
    appNameFontWeight,
    setAppNameFontWeight,
    adminPassword,
    setAdminPassword,
    managementPassword,
    setManagementPassword,
    mgmtPasswordSaveSuccess,
    setMgmtPasswordSaveSuccess,
    newMgmtPasswordInput,
    setNewMgmtPasswordInput,
    isOnline,
    setIsOnline,
    isSyncing,
    setIsSyncing,
    setOfflineQueue,
    isPosMonitorMode,
    setIsPosMonitorMode,
    isVirtualKeyboardEnabled,
    setIsVirtualKeyboardEnabled,
    setIsVirtualKeyboardOpen,
    setIsKeyboardWideMode,
    devName,
    setDevName,
    devBio,
    setDevBio,
    devEmail,
    setDevEmail,
    devPhone,
    setDevPhone,
    devWhatsapp,
    setDevWhatsapp,
    devGithub,
    setDevGithub,
    devLinkedin,
    setDevLinkedin,
    devWebsite,
    setDevWebsite,
    devLogoUrl,
    setDevLogoUrl,
    devPrograms,
    setDevPrograms,
    newProgName,
    setNewProgName,
    newProgDesc,
    setNewProgDesc,
    newProgImage,
    setNewProgImage,
    newProgTech,
    setNewProgTech,
    newProgLink,
    setNewProgLink,
    aboutSettingsSaved,
    setAboutSettingsSaved,
    profileAName,
    setProfileAName,
    profileBName,
    setProfileBName,
    profileAType,
    setProfileAType,
    profileBType,
    setProfileBType,
    profileAFontSize,
    setProfileAFontSize,
    profileBFontSize,
    setProfileBFontSize,
    profileCName,
    setProfileCName,
    profileCType,
    setProfileCType,
    profileCFontSize,
    setProfileCFontSize,
    profileCPort,
    setProfileCPort,
    printerType,
    setPrinterType,
    printerPresetType,
    setPrinterPresetType,
    networkPrinterIP,
    setNetworkPrinterIP,
    networkPrinterPort,
    setNetworkPrinterPort,
    printerMargin,
    setPrinterMargin,
    printerFontSize,
    setPrinterFontSize,
    printerFooterText,
    setPrinterFooterText,
    printerRouteMode,
    setPrinterRouteMode,
    printerSavedMessage,
    savePrinterSettings,
    discoveredPrinters,
    setSearchPrinterModal,
    triggerPrinterTestPrint,
    inventoryTransactions,
    setInventoryTransactions,
    orderTransactions,
    setOrderTransactions,
    recipeSearch,
    setRecipeSearch,
    isDatabasePurged,
    restoreMockData,
    purgeAllData,
    addAuditLog,
    setConfirmDialog,
    printCustomerTicket,
    setActiveTab
  } = props as any;

  const [newStartupPasswordInput, setNewStartupPasswordInput] = React.useState('');
  const [startupPasswordSaveSuccess, setStartupPasswordSaveSuccess] = React.useState(false);
  const [newInventoryPasswordInput, setNewInventoryPasswordInput] = React.useState('');
  const [inventoryPasswordSaveSuccess, setInventoryPasswordSaveSuccess] = React.useState(false);

// Admin password security gate
      if (!isAdminUnlocked) {
        const adminKbLayouts = {
          AZ: [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['Q', 'Ü', 'E', 'R', 'T', 'Y', 'U', 'İ', 'O', 'P', 'Ö', 'Ğ'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'I', 'Ə'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ç', 'Ş']
          ],
          EN: [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
          ],
          TR: [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç']
          ],
          RU: [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
            ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
            ['Я', 'Ч', 'С', 'М', 'И', 'T', 'Ь', 'Б', 'Ю']
          ]
        };

        const handleVerifyAdmin = () => {
          verifyPasswordSecure(adminTypedPassword, 'admin').then(isValid => {
            if (isValid) {
              setAdminPasswordFeedback('success');
              addAuditLog("Admin Girişi", "Təhlükəsizlik", "Admin idarəetmə panelinə uğurlu giriş edildi.", "info");
              setTimeout(() => {
                setIsAdminUnlocked(true);
                setAdminTypedPassword('');
                setAdminPasswordFeedback('idle');
              }, 500);
            } else {
              setAdminPasswordFeedback('error');
              setAdminTypedPassword('');
              setTimeout(() => adminInputRef.current?.focus(), 50);
              addAuditLog("Səhv Admin Girişi", "Təhlükəsizlik", "Yalnış admin şifrəsi daxil edilmə cəhdi", "warning");
            }
          }).catch(() => {
            setAdminPasswordFeedback('error');
            setAdminTypedPassword('');
          });
        };

        const currentRows = adminKbLayouts[adminKbLanguage];

        return (
          <DraggableWindow title="Admin Giriş Portalı" onClose={() => setActiveTab('tables')} widthClass="w-full max-w-md">
            <div className="space-y-4 text-center">
              <div className="space-y-1">
                <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center justify-center gap-1.5">
                  <Lock className={`w-4 h-4 shrink-0 transition-all ${
                    adminPasswordFeedback === 'success' ? 'text-green-600 scale-110' :
                    adminPasswordFeedback === 'error' ? 'text-red-650 animate-bounce' : 'text-orange-500'
                  }`} />
                  Admin Giriş Portalı
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
                  <span className="block mt-0.5 font-bold text-orange-500">Standart şifrə: admin</span>
                </p>
              </div>

              <div className="relative max-w-sm mx-auto">
                <input 
                  ref={adminInputRef}
                  type={showAdminPasswordRaw ? "text" : "password"}
                  value={adminTypedPassword}
                  onChange={e => {
                    setAdminPasswordFeedback('idle');
                    setAdminTypedPassword(e.target.value);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleVerifyAdmin();
                  }}
                  placeholder="Admin şifrəsini yazın..."
                  className={`w-full px-3 py-2 bg-slate-50 border-2 rounded-xl focus:outline-none font-extrabold text-sm text-slate-700 tracking-widest text-center transition-colors ${
                    adminPasswordFeedback === 'error' ? 'border-red-500 bg-red-50/35 focus:border-red-500' :
                    adminPasswordFeedback === 'success' ? 'border-green-500 bg-green-50/25 focus:border-green-500' : 'border-slate-150 focus:border-orange-500'
                  }`}
                  autoFocus
                />
                
                <button
                  type="button"
                  onClick={() => setShowAdminPasswordRaw(!showAdminPasswordRaw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showAdminPasswordRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {adminPasswordFeedback === 'error' && (
                <p className="text-[10px] font-black text-red-650 animate-pulse tracking-wide uppercase">
                  YALNIŞ ŞİFRƏ! YENİDƏN DAXİL EDİN.
                </p>
              )}
              {adminPasswordFeedback === 'success' && (
                <p className="text-[10px] font-black text-green-600 animate-pulse tracking-wide uppercase">
                  UĞURLU GİRİŞ! PANEL AÇILIR...
                </p>
              )}

              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-150 relative max-w-sm mx-auto space-y-2">
                <div className="flex justify-between items-center bg-white p-1 rounded-xl border border-slate-200 select-none">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1.5 flex items-center gap-0.5">
                    <Globe className="w-3 h-3 text-slate-400" />
                    KLAVİATURA DİLİ:
                  </span>
                  <div className="flex gap-1 p-0.5 bg-slate-100/60 rounded-xl">
                    {(['AZ', 'EN', 'TR', 'RU'] as const).map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setAdminKbLanguage(lang)}
                        className={`px-1.5 py-1 rounded text-[8px] font-black uppercase transition-all tracking-wider cursor-pointer ${
                          adminKbLanguage === lang 
                            ? 'bg-orange-500 text-white' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 select-none font-sans">
                  {currentRows.map((row, rIdx) => (
                    <div key={`admin_kb_row_${rIdx}`} className="flex justify-center gap-0.5 flex-wrap">
                      {row.map((char, cIdx) => (
                        <button
                          key={`admin_kb_char_${rIdx}_${cIdx}_${char}`}
                          type="button"
                          onClick={() => {
                            setAdminPasswordFeedback('idle');
                            setAdminTypedPassword(prev => prev + (char ? char.toLowerCase() : ''));
                          }}
                          className="h-8 min-w-[26px] px-1 bg-white hover:bg-orange-50 active:scale-95 text-slate-700 hover:text-orange-600 border border-slate-200 rounded-lg font-bold text-[10px] shadow-3xs flex items-center justify-center cursor-pointer shrink-0"
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-1 select-none flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPasswordFeedback('idle');
                      setAdminTypedPassword(prev => prev.slice(0, -1));
                    }}
                    className="h-8 px-2 bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center justify-center"
                  >
                    ← Sil
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdminPasswordFeedback('idle');
                      setAdminTypedPassword('');
                    }}
                    className="h-8 px-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all select-none cursor-pointer border border-red-100 shrink-0"
                  >
                    Təmizlə
                  </button>

                  <button
                    type="button"
                    onClick={handleVerifyAdmin}
                    className="h-8 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all select-none shadow-md flex-1 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Unlock className="w-3 h-3" />
                    TƏSDİQLƏ (ENTER)
                  </button>
                </div>
              </div>
            </div>
          </DraggableWindow>
        );
      }


      // Filter audit logs based on search query
      const filteredAuditLogs = auditLogs.filter(log => 
        (log.action || '').toLowerCase().includes((recipeSearch || '').toLowerCase()) || 
        (log.operator || '').toLowerCase().includes((recipeSearch || '').toLowerCase()) || 
        (log.details || '').toLowerCase().includes((recipeSearch || '').toLowerCase())
      );

      return (
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent animate-in fade-in duration-300">
          <div className={`${adminSubTab === 'printer' ? 'max-w-7xl' : 'max-w-4xl'} mx-auto space-y-6 pb-16`}>
            
            {/* Page Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">RESTOMASTER ERP ADMIN</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    isPosMonitorMode 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isPosMonitorMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                    {isPosMonitorMode ? 'POS Monitor Rejimi (10 Barmaq): Aktivdir' : 'Klassik Rejim'}
                  </span>
                </div>
                <h3 className="font-extrabold text-2xl lg:text-3xl tracking-tight font-sans">Sistem İdarəetmə Paneli</h3>
                <p className="text-slate-400 text-xs font-semibold">Sistemin brending, kassa sıfırlanması, printer tənzimləmələri və ERP təhlükəsizlik audit jurnallarını bu paneldən idarə edə bilərsiniz.</p>
              </div>

              {/* POS Monitor / 10-Barmaq Mode Switch Button */}
              <div className="flex flex-col sm:flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                <button
                  type="button"
                  id="pos-monitor-mode-toggle-btn"
                  onClick={() => {
                    const next = !isPosMonitorMode;
                    setIsPosMonitorMode(next);
                    if (next) {
                      setIsVirtualKeyboardEnabled(true);
                      setIsKeyboardWideMode(true);
                      safeLocalStorageSetItem('resto_virtual_keyboard_enabled', 'true');
                      safeLocalStorageSetItem('resto_keyboard_wide_mode', 'true');
                    }
                    
                    // Custom notification popup
                    const notif = document.createElement('div');
                    notif.className = `fixed bottom-5 right-5 z-50 ${next ? 'bg-emerald-600 border-emerald-400' : 'bg-slate-800 border-slate-600'} text-white font-extrabold text-[11px] tracking-wide uppercase px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-2 animate-bounce`;
                    notif.innerHTML = `
                      <svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                      ${next ? 'POS MONİTOR VƏ 10 BARMAQ TOXUNUŞ REJİMİ AKTİV EDİLDİ!' : 'STANDART REJİMƏ KEÇİLDİ'}
                    `;
                    document.body.appendChild(notif);
                    setTimeout(() => {
                      notif.style.opacity = '0';
                      notif.style.transition = 'opacity 0.5s ease';
                      setTimeout(() => notif.remove(), 500);
                    }, 3000);
                  }}
                  className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-lg active:scale-95 cursor-pointer border select-none ${
                    isPosMonitorMode
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-emerald-900/40 hover:from-emerald-600 hover:to-teal-700'
                      : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-400 shadow-orange-950/40 hover:from-orange-600 hover:to-amber-700'
                  }`}
                  title="POS Monitor və 10 Barmaq toxunuş rejiminə keçid"
                >
                  <Keyboard className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-[11px] font-black leading-tight">
                      {isPosMonitorMode ? '10 BARMAQ REJİMİ (AKTİVDİR)' : 'POS MONİTOR REJİMİNƏ KEÇİD'}
                    </div>
                    <div className="text-[9px] font-bold opacity-80 leading-tight">
                      {isPosMonitorMode ? 'Toxunaraq Deaktiv Et' : '10 Barmaq Sensor Rejimini Aktiv Et'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Categorization Tabs Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 select-none shrink-0 font-sans">
              <button
                onClick={() => { setAdminSubTab('branding'); setRecipeSearch(''); }}
                className={`flex flex-col items-start justify-between p-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-20 w-full text-left border ${
                  adminSubTab === 'branding'
                    ? 'bg-white text-orange-600 border-slate-200 shadow-xs'
                    : 'bg-white/40 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-150'
                }`}
              >
                <Settings className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-[9px] leading-tight block w-full mt-1">1. Brending & Loqo</span>
              </button>
              
              <button
                onClick={() => { setAdminSubTab('printer'); setRecipeSearch(''); }}
                className={`flex flex-col items-start justify-between p-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-20 w-full text-left border ${
                  adminSubTab === 'printer'
                    ? 'bg-white text-orange-600 border-slate-200 shadow-xs'
                    : 'bg-white/40 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-150'
                }`}
              >
                <Printer className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-[9px] leading-tight block w-full mt-1">2. Printer & Çap</span>
              </button>

              <button
                onClick={() => { setAdminSubTab('audit'); setRecipeSearch(''); }}
                className={`flex flex-col items-start justify-between p-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-20 w-full text-left border ${
                  adminSubTab === 'audit'
                    ? 'bg-white text-orange-600 border-slate-200 shadow-xs'
                    : 'bg-white/40 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-150'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-[9px] leading-tight block w-full mt-1">3. Audit Təhlükəsizlik</span>
              </button>

              <button
                onClick={() => { setAdminSubTab('backup'); setRecipeSearch(''); }}
                className={`flex flex-col items-start justify-between p-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-20 w-full text-left border ${
                  adminSubTab === 'backup'
                    ? 'bg-white text-orange-600 border-slate-200 shadow-xs'
                    : 'bg-white/40 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-150'
                }`}
              >
                <Database className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-[9px] leading-tight block w-full mt-1">4. Yedəklə & Bərpa Et</span>
              </button>

              <button
                onClick={() => { setAdminSubTab('about_settings'); setRecipeSearch(''); }}
                className={`flex flex-col items-start justify-between p-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-20 w-full text-left border ${
                  adminSubTab === 'about_settings'
                    ? 'bg-white text-orange-600 border-slate-200 shadow-xs'
                    : 'bg-white/40 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-150'
                }`}
              >
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-[9px] leading-tight block w-full mt-1">5. Haqqımızda</span>
              </button>

              <button
                onClick={() => { setAdminSubTab('purge'); setRecipeSearch(''); }}
                className={`flex flex-col items-start justify-between p-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-20 w-full text-left border ${
                  adminSubTab === 'purge'
                    ? 'bg-red-50 text-red-650 border-red-200 shadow-xs'
                    : 'bg-white/40 border-transparent text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-100'
                }`}
              >
                <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-[9px] leading-tight block w-full mt-1">6. Purge (Sıfırla)</span>
              </button>

              <button
                onClick={() => { setAdminSubTab('security'); setRecipeSearch(''); }}
                className={`flex flex-col items-start justify-between p-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-20 w-full text-left border ${
                  adminSubTab === 'security'
                    ? 'bg-white text-orange-600 border-slate-200 shadow-xs'
                    : 'bg-white/40 border-transparent text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-150'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[9px] leading-tight block w-full mt-1">7. Şifrə & Mühafizə</span>
              </button>
            </div>

            {/* TAB CONTENT 1: BRANDING */}
            {adminSubTab === 'branding' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-4 bg-orange-500 rounded-full" />
                      Proqramın Adı və Yazı Tənzimləmələri
                    </h4>
                    <p className="text-xs text-slate-400">Slidebar naviqasiyasında görünəcək restoran adını hər iki söz üçün ayrıca rəng, şrift fontu, ölçüsü, qalınlığı və ya kursiv tərzdə təyin edə bilərsiniz:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">1-ci Söz</label>
                        <input 
                          type="text"
                          value={appNameWord1}
                          onChange={e => setAppNameWord1(e.target.value)}
                          placeholder="Məs. RESTO"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 text-sm"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <label className="text-[10px] font-bold text-slate-400">Yazı Rəngi:</label>
                          <input 
                            type="color"
                            value={appNameColor1}
                            onChange={e => setAppNameColor1(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-white p-0.5"
                          />
                          <span className="text-xs text-slate-500 font-mono font-bold uppercase">{appNameColor1}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">2-ci Söz (İstəyə bağlı)</label>
                        <input 
                          type="text"
                          value={appNameWord2}
                          onChange={e => setAppNameWord2(e.target.value)}
                          placeholder="Məs. MASTER"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 text-sm"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <label className="text-[10px] font-bold text-slate-400">Yazı Rəngi:</label>
                          <input 
                            type="color"
                            value={appNameColor2}
                            onChange={e => setAppNameColor2(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-white p-0.5"
                          />
                          <span className="text-xs text-slate-500 font-mono font-bold uppercase">{appNameColor2}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Şrift Fontu</label>
                        <select
                          value={appNameFontFamily}
                          onChange={e => setAppNameFontFamily(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold text-slate-600"
                        >
                          <option value="font-sans">Sans-Serif (Müasir)</option>
                          <option value="font-serif">Serif (Zərif)</option>
                          <option value="font-mono">Monospace (Kod stili)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Yazı Ölçüsü</label>
                        <select
                          value={appNameFontSize}
                          onChange={e => setAppNameFontSize(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold text-slate-600"
                        >
                          <option value="text-sm">Kiçik</option>
                          <option value="text-base">Normal</option>
                          <option value="text-lg">Orta</option>
                          <option value="text-xl">Böyük (xl)</option>
                          <option value="text-2xl">Əlavə Böyük (2xl)</option>
                          <option value="text-3xl">Nəhəng (3xl)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Qalınlığı</label>
                        <select
                          value={appNameFontWeight}
                          onChange={e => setAppNameFontWeight(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold text-slate-600"
                        >
                          <option value="font-normal">İncə/Normal</option>
                          <option value="font-semibold">Yarım Qalın</option>
                          <option value="font-bold">Qalın</option>
                          <option value="font-black">Çox Qalın (Black)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kursiv (Əyri)</label>
                        <select
                          value={appNameFontStyle}
                          onChange={e => setAppNameFontStyle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold text-slate-600"
                        >
                          <option value="not-italic">Normal Düz</option>
                          <option value="italic">İtalik (Kursiv əyri)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-4 bg-orange-500 rounded-full" />
                      Proqram Loqosu
                    </h4>
                    <p className="text-xs text-slate-400">Şəklin birbaşa keçid linkini daxil edə bilərsiniz və ya cihazınızdan yeni loqo faylı yükləyə bilərsiniz.</p>
                    
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Loqo Linki (URL) ilə:</span>
                      <input 
                        type="text"
                        value={appLogoUrl}
                        onChange={e => setAppLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-semibold text-slate-600"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Şəkil Faylı Yüklə (Cihazınızdan):</span>
                      <div className="relative border-2 border-dashed border-slate-200 hover:border-orange-500 bg-slate-50/50 hover:bg-slate-50 p-6 rounded-2xl text-center group cursor-pointer transition-all">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressImageFile(file, 280, 280, 0.8).then(compressed => {
                                if (compressed) {
                                  setAppLogoUrl(compressed);
                                }
                              });
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Plus className="w-6 h-6 text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition-all" />
                          <span className="text-xs font-bold text-slate-600">Loqo Şəklini Seçin və ya bura dartın</span>
                          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">PNG, JPG, SVG dəstəklənir (Maks. 2MB)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {appLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setAppLogoUrl('')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          Varsayılana Sıfırla
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Proqramın Giriş Şifrəsi Parametrləri */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-4 bg-orange-500 rounded-full" />
                      Proqramın Giriş Şifrəsi
                    </h4>
                    <p className="text-xs text-slate-400">
                      Proqram ilk açılarkən (Sistem Giriş Qapısı) tələb olunan təhlükəsizlik şifrəsini buradan dəyişdirin:
                    </p>
                    
                    <div className="space-y-4 max-w-md">
                      {/* Current Password Badge */}
                      <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100 select-none">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cari Şifrə:</span>
                        <span className="font-mono text-sm font-black text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-3xs tracking-widest">
                          ***
                        </span>
                      </div>

                      {/* New Password Input Field */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Yeni Giriş Şifrəsi</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                              type="text"
                              value={newStartupPasswordInput}
                              onChange={e => {
                                setNewStartupPasswordInput(e.target.value.trim());
                                if (startupPasswordSaveSuccess) setStartupPasswordSaveSuccess(false);
                              }}
                              placeholder="Yeni şifrə yazın (məs: 1234)"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-extrabold text-slate-700 text-sm tracking-widest"
                            />
                            {newStartupPasswordInput && (
                              <button
                                type="button"
                                onClick={() => setNewStartupPasswordInput('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase pr-1 cursor-pointer select-none"
                              >
                                Sil
                              </button>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (!newStartupPasswordInput) return;
                              setPasswordSecure(newStartupPasswordInput, 'startup').then(() => {
                                setNewStartupPasswordInput('');
                                setStartupPasswordSaveSuccess(true);
                                setTimeout(() => {
                                  setStartupPasswordSaveSuccess(false);
                                }, 5000);
                              });
                            }}
                            disabled={!newStartupPasswordInput}
                            className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all select-none shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 ${
                              newStartupPasswordInput 
                                ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <Save className="w-4 h-4" />
                            YENİLƏ
                          </button>
                        </div>
                      </div>

                      {/* Success Alert Banner */}
                      {startupPasswordSaveSuccess && (
                        <div className="bg-green-50 border border-green-150 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-green-800 uppercase tracking-wider">ŞİFRƏ UĞURLA YENİLƏNDİ!</h5>
                            <p className="text-[11px] text-green-700 font-semibold leading-relaxed">
                              Proqramın giriş şifrəsi uğurla dəyişdirildi. Artıq proqram açılarkən yeni təyin etdiyiniz şifrədən istifadə edə bilərsiniz.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rəhbərlik Şifrə Parametrləri */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-4 bg-orange-500 rounded-full" />
                      Rəhbərlik Portalı Giriş Şifrəsi
                    </h4>
                    <p className="text-xs text-slate-400">
                      Rəhbərlik bölməsinə (Menyu, Stok/anbar, İşçilər, AI Analitika, Hesabatlar) daxil olmaq üçün təyin edilən təhlükəsizlik şifrəsini buradan dəyişdirin:
                    </p>
                    
                    <div className="space-y-4 max-w-md">
                      {/* Current Password Badge */}
                      <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100 select-none">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cari Şifrə:</span>
                        <span className="font-mono text-sm font-black text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-3xs tracking-widest">
                          ***
                        </span>
                      </div>

                      {/* New Password Input Field */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Yeni Giriş Şifrəsi</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                              type="text"
                              value={newMgmtPasswordInput}
                              onChange={e => {
                                setNewMgmtPasswordInput(e.target.value.trim());
                                if (mgmtPasswordSaveSuccess) setMgmtPasswordSaveSuccess(false);
                              }}
                              placeholder="Yeni şifrə yazın (məs: 0000)"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-extrabold text-slate-700 text-sm tracking-widest"
                            />
                            {newMgmtPasswordInput && (
                              <button
                                type="button"
                                onClick={() => setNewMgmtPasswordInput('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase pr-1 cursor-pointer select-none"
                              >
                                Sil
                              </button>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (!newMgmtPasswordInput) return;
                              setPasswordSecure(newMgmtPasswordInput, 'management').then(() => {
                                localStorage.removeItem('management_password');
                                setManagementPassword('***');
                                setNewMgmtPasswordInput('');
                                setMgmtPasswordSaveSuccess(true);
                                setTimeout(() => {
                                  setMgmtPasswordSaveSuccess(false);
                                }, 5000);
                              });
                            }}
                            disabled={!newMgmtPasswordInput}
                            className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all select-none shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 ${
                              newMgmtPasswordInput 
                                ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <Save className="w-4 h-4" />
                            YENİLƏ
                          </button>
                        </div>
                      </div>

                      {/* Success Alert Banner */}
                      {mgmtPasswordSaveSuccess && (
                        <div className="bg-green-50 border border-green-150 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-green-800 uppercase tracking-wider">ŞİFRƏ UĞURLA YENİLƏNDİ!</h5>
                            <p className="text-[11px] text-green-700 font-semibold leading-relaxed">
                              Rəhbərlik giriş şifrəsi uğurla dəyişdirildi. Artıq daxili portala daxil olarkən yeni təyin etdiyiniz şifrədən istifadə edə bilərsiniz.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Anbar Deposu Şifrə Parametrləri */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-4 bg-orange-500 rounded-full" />
                      Anbar Deposu Giriş Şifrəsi
                    </h4>
                    <p className="text-xs text-slate-400">
                      Anbar stok deposu bölməsinə daxil olmaq üçün təyin edilən təhlükəsizlik şifrəsini buradan dəyişdirin:
                    </p>
                    
                    <div className="space-y-4 max-w-md">
                      {/* Current Password Badge */}
                      <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100 select-none">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cari Şifrə:</span>
                        <span className="font-mono text-sm font-black text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-3xs tracking-widest">
                          ***
                        </span>
                      </div>

                      {/* New Password Input Field */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Yeni Giriş Şifrəsi</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                              type="text"
                              value={newInventoryPasswordInput}
                              onChange={e => {
                                setNewInventoryPasswordInput(e.target.value.trim());
                                if (inventoryPasswordSaveSuccess) setInventoryPasswordSaveSuccess(false);
                              }}
                              placeholder="Yeni şifrə yazın (standart: anbar)"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-extrabold text-slate-700 text-sm tracking-widest"
                            />
                            {newInventoryPasswordInput && (
                              <button
                                type="button"
                                onClick={() => setNewInventoryPasswordInput('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase pr-1 cursor-pointer select-none"
                              >
                                Sil
                              </button>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (!newInventoryPasswordInput) return;
                              setPasswordSecure(newInventoryPasswordInput, 'inventory').then(() => {
                                setNewInventoryPasswordInput('');
                                setInventoryPasswordSaveSuccess(true);
                                if (addAuditLog) {
                                  addAuditLog("Anbar Şifrəsi Yeniləndi", "Təhlükəsizlik", "Anbar stok deposu giriş şifrəsi uğurla dəyişdirildi.", "info");
                                }
                                setTimeout(() => {
                                  setInventoryPasswordSaveSuccess(false);
                                }, 5000);
                              });
                            }}
                            disabled={!newInventoryPasswordInput}
                            className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all select-none shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 ${
                              newInventoryPasswordInput 
                                ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <Save className="w-4 h-4" />
                            YENİLƏ
                          </button>
                        </div>
                      </div>

                      {/* Success Alert Banner */}
                      {inventoryPasswordSaveSuccess && (
                        <div className="bg-green-50 border border-green-150 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-green-800 uppercase tracking-wider">ŞİFRƏ UĞURLA YENİLƏNDİ!</h5>
                            <p className="text-[11px] text-green-700 font-semibold leading-relaxed">
                              Anbar deposu giriş şifrəsi uğurla dəyişdirildi. Artıq anbar bölməsinə daxil olarkən yeni təyin etdiyiniz şifrədən istifadə edə bilərsiniz.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sistem İş Rejimi Seçimi (Server vs Lokal Kompüter) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in duration-300">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-4 bg-orange-500 rounded-full" />
                      Sistem İş Rejimi Seçimi (Server vs Lokal Kompüter)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Proqramı həm onlayn (bulud serverlə sinxron) həm də sırf bilgisayarda (lokal yaddaş - LocalStorage) çalışan rejimdə işlədə bilərsiniz:
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Onlayn (Server) Rejimi Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSyncing(true);
                          setTimeout(() => {
                            setIsOnline(true);
                            setIsSyncing(false);
                            setOfflineQueue([]);
                            
                            // Custom elegant notification
                            const notif = document.createElement('div');
                            notif.className = 'fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-extrabold text-[11px] tracking-wide uppercase px-6 py-4 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-bounce';
                            notif.innerHTML = `
                              <svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                              </svg>
                              ONLAYN BULUD SERVER REJİMİNƏ KEÇİLDİ!
                            `;
                            document.body.appendChild(notif);
                            setTimeout(() => {
                              notif.style.opacity = '0';
                              notif.style.transition = 'opacity 0.5s ease';
                              setTimeout(() => notif.remove(), 500);
                            }, 3000);
                          }, 1200);
                        }}
                        disabled={isSyncing}
                        className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-36 cursor-pointer ${
                          isOnline && !isSyncing
                            ? 'border-emerald-500 bg-emerald-50/20 shadow-md shadow-emerald-100'
                            : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                            isOnline && !isSyncing ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            Onlayn Server Rejimi
                          </span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isOnline && !isSyncing ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                            {isOnline && !isSyncing && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs mt-3">Bulud ilə Sinxron</h5>
                          <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed mt-0.5">Məlumatlar bulud verilənlər bazasına yazılır və digər kassa terminal cihazları ilə anlıq sinxronlaşır.</p>
                        </div>
                      </button>

                      {/* Oflayn (Sırf Bilgisayarda) Rejimi Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOnline(false);
                          
                          // Custom elegant notification
                          const notif = document.createElement('div');
                          notif.className = 'fixed bottom-5 right-5 z-50 bg-amber-600 text-white font-extrabold text-[11px] tracking-wide uppercase px-6 py-4 rounded-2xl shadow-2xl border border-amber-400 flex items-center gap-2 animate-bounce';
                          notif.innerHTML = `
                            <svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            OFLAYN LOKAL REJİMƏ KEÇİLDİ (SİRF BİLGİSAYARDA YADDAŞ)!
                          `;
                          document.body.appendChild(notif);
                          setTimeout(() => {
                            notif.style.opacity = '0';
                            notif.style.transition = 'opacity 0.5s ease';
                            setTimeout(() => notif.remove(), 500);
                          }, 3000);
                        }}
                        disabled={isSyncing}
                        className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-36 cursor-pointer ${
                          !isOnline && !isSyncing
                            ? 'border-amber-500 bg-amber-50/20 shadow-md shadow-amber-100'
                            : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                            !isOnline && !isSyncing ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            Oflayn Lokal Rejim
                          </span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${!isOnline && !isSyncing ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300 bg-white'}`}>
                            {!isOnline && !isSyncing && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs mt-3">Sırf Kompüterdə Çalışır</h5>
                          <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed mt-0.5">Yaddaş tamamilə bilgisayarınızda (LocalStorage) saxlanılır. İnternet kəsilsə belə kassa problemsiz işləyir.</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="space-y-6">
                  <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                    <div>
                      <span className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Brend Ön-İzləmə</span>
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-4">Slidebar real ön izləməsi</h4>
                    </div>
                    
                    <div className="border border-slate-805 bg-slate-950/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                          {appLogoUrl ? (
                            <img src={appLogoUrl} alt={appName} className="w-full h-full object-cover" />
                          ) : (
                            <Utensils className="text-white w-6 h-6" />
                          )}
                        </div>
                        <h1 className={`${appNameFontSize} ${appNameFontFamily} ${appNameFontWeight} ${appNameFontStyle} tracking-tight truncate`} style={{ maxWidth: '140px' }} title={appName}>
                          <span style={{ color: appNameColor1 }}>{appNameWord1}</span>
                          {appNameWord2 && <span style={{ color: appNameColor2 }} className="ml-1">{appNameWord2}</span>}
                        </h1>
                      </div>
                      <ClockComponent mode="brand" />
                    </div>

                    <div className="pt-2 text-xs text-slate-400 leading-relaxed font-semibold">
                      Brend tənzimləmələri dərhal sol tərəfdəki və bütün xarici brauzer pəncərələrində eyni saniyədə tətbiq olunur.
                    </div>
                  </div>

                  {/* Ekran Klaviaturası (Sensor POS Monitor Rejimi) Card */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-xs">
                          <Keyboard className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Ekran Klaviaturası</h4>
                          <span className="text-[10px] font-bold text-slate-400">Sensorlu POS Monitorlar Üçün</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        id="virtual-keyboard-toggle-btn"
                        onClick={() => {
                          const next = !isVirtualKeyboardEnabled;
                          setIsVirtualKeyboardEnabled(next);
                          safeLocalStorageSetItem('resto_virtual_keyboard_enabled', String(next));
                          if (!next) setIsVirtualKeyboardOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          isVirtualKeyboardEnabled 
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isVirtualKeyboardEnabled ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                        <span>{isVirtualKeyboardEnabled ? 'Aktiv' : 'Deaktiv'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      Sensorlu POS monitorlarında istifadə üçün nəzərdə tutulub. Aktiv edildikdə istənilən mətn və rəqəm giriş xanasına (input/textarea) toxunduqda ekranda avtomatik hərəkət etdirilə bilən müasir virtual klaviatura açılır.
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        Dillər: AZ / EN / TR / RU
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isVirtualKeyboardEnabled) setIsVirtualKeyboardEnabled(true);
                          setIsVirtualKeyboardOpen(true);
                        }}
                        className="text-orange-600 hover:text-orange-700 font-extrabold uppercase tracking-wider cursor-pointer underline"
                      >
                        Klaviaturanı Aç
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* TAB CONTENT 2: PRINTER */}
            {adminSubTab === 'printer' && (() => {
              const sampleItems = [
                { name: "Dana Bastırma Kabab", quantity: 2, price: 16.50 },
                { name: "Süzmə Qatıq (Xüsusi)", quantity: 1, price: 3.50 },
                { name: "Ev Limonadı (Narımlı)", quantity: 1, price: 5.50 }
              ];
              const sampleTotal = 42.0;

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Header banner */}
                  <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-[24px] p-6 text-white min-h-[120px] flex flex-col justify-between shadow-xl shadow-cyan-100 relative overflow-hidden">
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
                      <Printer className="w-48 h-48" />
                    </div>
                    <span className="bg-white/20 uppercase tracking-widest text-[9px] font-black px-3 py-1 rounded-full w-fit">
                      PRINTER & ÇAP SİSTEMİ İNTEQRASİYASI (ADMİN)
                    </span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black tracking-tight font-sans">Kassa və Mətbəx Printerlərinin Tənzimlənməsi</h2>
                      <p className="text-xs font-semibold opacity-90 mt-1 max-w-2xl font-sans">
                        Bu bölmədən həm brauzerin rəsmi sistem printerlərini, həm də brauzer printerləri tapa bilmədikdə işləyə biləcək alternativ sənəd/şəkil formatlarını təyin edə bilərsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Settings and Guides (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Dual Printer Profiles Section */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-cyan-100 text-cyan-600 rounded-lg">
                              <Printer className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Printer Profilləri Sazlamaları (Profil A, B & C - Z-Hesabatı)</h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Bu proqram eyni anda 3 müxtəlif printer profili (Profil A - Masa Ödəniş Çek Printeri, Profil B - Mətbəx Sifariş Printeri və Profil C - Z-Hesabatı Printeri) ilə çalışır.</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          
                          {/* Profil A Card */}
                          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-150 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="bg-cyan-100 text-cyan-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">PROFİL A - HESAB VƏ QƏBZ PRİNTERİ</span>
                              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></div>
                            </div>

                            <div className="space-y-1.5 font-sans">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Aktiv Printer Cihazı</label>
                              <div className="flex gap-2">
                                <select
                                  value={profileAName}
                                  onChange={e => {
                                    setProfileAName(e.target.value);
                                  }}
                                  className="flex-1 min-w-0 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs truncate pr-8"
                                >
                                  {!discoveredPrinters.includes(profileAName) && (
                                    <option value={profileAName}>{profileAName}</option>
                                  )}
                                  {discoveredPrinters.map((p, idx) => (
                                    <option key={idx} value={p}>{p}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchPrinterModal({ isOpen: true, targetProfile: 'A' });
                                    triggerPrinterTestPrint('A');
                                  }}
                                  className="px-3 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-all font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <Search className="w-3.5 h-3.5" />
                                  Axtar
                                </button>
                              </div>
                              <p className="text-[9px] text-slate-450 font-medium px-0.5 mt-1">Cari Seçilmiş: <strong className="text-slate-700">{profileAName}</strong></p>
                            </div>

                            <div className="space-y-1.5 font-sans">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Kağız Ölçüsü</label>
                              <select
                                value={profileAType}
                                onChange={e => {
                                  setProfileAType(e.target.value as any);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs"
                              >
                                <option value="thermal_80mm">Termal 80mm Standart Kassa Printeri</option>
                                <option value="thermal_58mm">Termal 58mm Portativ Çek Printeri</option>
                                <option value="a4_standard">A4 Formatlı Ofis Printeri</option>
                              </select>
                            </div>

                            <div className="space-y-1.5 font-sans">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Yazı Şrifti Ölçüsü</label>
                              <select
                                value={profileAFontSize}
                                onChange={e => {
                                  setProfileAFontSize(e.target.value as any);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs"
                              >
                                <option value="small">Kiçik Şrift</option>
                                <option value="normal">Standart Ölçü</option>
                                <option value="large">Böyük Yazı</option>
                              </select>
                            </div>
                          </div>

                          {/* Profil B Card */}
                          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-150 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">PROFİL B - MƏTBƏX (SİFARİŞ) PRİNTERİ</span>
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                            </div>

                            <div className="space-y-1.5 font-sans">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Aktiv Printer Cihazı</label>
                              <div className="flex gap-2">
                                <select
                                  value={profileBName}
                                  onChange={e => {
                                    setProfileBName(e.target.value);
                                  }}
                                  className="flex-1 min-w-0 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 text-xs truncate pr-8"
                                >
                                  {!discoveredPrinters.includes(profileBName) && (
                                    <option value={profileBName}>{profileBName}</option>
                                  )}
                                  {discoveredPrinters.map((p, idx) => (
                                    <option key={idx} value={p}>{p}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchPrinterModal({ isOpen: true, targetProfile: 'B' });
                                    triggerPrinterTestPrint('B');
                                  }}
                                  className="px-3 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <Search className="w-3.5 h-3.5" />
                                  Axtar
                                </button>
                              </div>
                              <p className="text-[9px] text-slate-450 font-medium px-0.5 mt-1">Cari Seçilmiş: <strong className="text-slate-700">{profileBName}</strong></p>
                            </div>

                            <div className="space-y-1.5 font-sans">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Kağız Ölçüsü</label>
                              <select
                                value={profileBType}
                                onChange={e => {
                                  setProfileBType(e.target.value as any);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 text-xs"
                              >
                                <option value="thermal_80mm">Termal 80mm Standart Kassa Printeri</option>
                                <option value="thermal_58mm">Termal 58mm Portativ Çek Printeri</option>
                                <option value="a4_standard">A4 Formatlı Ofis Printeri</option>
                              </select>
                            </div>

                            <div className="space-y-1.5 font-sans">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Yazı Şrifti Ölçüsü</label>
                              <select
                                value={profileBFontSize}
                                onChange={e => {
                                  setProfileBFontSize(e.target.value as any);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700 text-xs"
                              >
                                <option value="small">Kiçik Şrift</option>
                                <option value="normal">Standart Ölçü</option>
                                <option value="large">Böyük Yazı</option>
                              </select>
                            </div>
                          </div>

                        </div>

                        {/* Profil C Card - Z-Hesabatı Printeri (Ayrı olaraq alt sırada, 2 sütunlu tor şəbəkəsində - gələcəkdə əlavə profil üçün hazır) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-150 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">PROFİL C - Z-HESABATI PRİNTERİ</span>
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></div>
                            </div>

                            <div className="space-y-1.5 font-sans">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Aktiv Printer Cihazı</label>
                              <div className="flex gap-2">
                                <select
                                  value={profileCName}
                                  onChange={e => {
                                    const selected = e.target.value;
                                    setProfileCName(selected);
                                    // Avtomatik olaraq hemin printerin qoşulma portunu özü seçsin
                                    const detectedPort = detectPortForPrinter(selected);
                                    setProfileCPort(detectedPort);
                                    safeLocalStorageSetItem('resto_profileC_port', detectedPort);
                                  }}
                                  className="flex-1 min-w-0 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 text-xs truncate pr-8"
                                >
                                  {!discoveredPrinters.includes(profileCName) && (
                                    <option value={profileCName}>{profileCName}</option>
                                  )}
                                  {discoveredPrinters.map((p, idx) => (
                                    <option key={idx} value={p}>{p}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchPrinterModal({ isOpen: true, targetProfile: 'C' });
                                    triggerPrinterTestPrint('C');
                                  }}
                                  className="px-3 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <Search className="w-3.5 h-3.5" />
                                  Axtar
                                </button>
                              </div>
                              <p className="text-[9px] text-slate-450 font-medium px-0.5 mt-1">Cari Seçilmiş: <strong className="text-slate-700">{profileCName}</strong></p>
                            </div>

                            {/* USB / Cihaz Portu Tanıtımı Sahəsi */}
                            <div className="space-y-1.5 font-sans">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">USB Qoşulma Portu (Port Tanıtımı)</label>
                                <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                  {profileCPort || 'USB001'}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <select
                                  value={profileCPort}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setProfileCPort(val);
                                    safeLocalStorageSetItem('resto_profileC_port', val);
                                  }}
                                  className="flex-1 min-w-0 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 text-xs"
                                >
                                  {STANDARD_PRINTER_PORTS.map(port => (
                                    <option key={port.value} value={port.value}>{port.label}</option>
                                  ))}
                                  {!STANDARD_PRINTER_PORTS.some(p => p.value === profileCPort) && profileCPort && (
                                    <option value={profileCPort}>{profileCPort} (Aşkar edilən port)</option>
                                  )}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const autoPort = detectPortForPrinter(profileCName);
                                    setProfileCPort(autoPort);
                                    safeLocalStorageSetItem('resto_profileC_port', autoPort);
                                  }}
                                  title="Printerin qoşulma portunu kompüterdən yenidən avtomatik təyin et"
                                  className="px-2.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl transition-all font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Portu Tanı
                                </button>
                              </div>
                              <p className="text-[9px] text-purple-600/90 font-semibold px-0.5 mt-0.5">
                                ✓ Printer adından seçildikdə qoşulma portu avtomatik olaraq təyin edilir.
                              </p>
                            </div>

                            <div className="space-y-1.5 font-sans">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Kağız Ölçüsü</label>
                              <select
                                value={profileCType}
                                onChange={e => {
                                  setProfileCType(e.target.value as any);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 text-xs"
                              >
                                <option value="thermal_80mm">Termal 80mm Standart Kassa Printeri</option>
                                <option value="thermal_58mm">Termal 58mm Portativ Çek Printeri</option>
                                <option value="a4_standard">A4 Formatlı Ofis Printeri</option>
                              </select>
                            </div>

                            <div className="space-y-1.5 font-sans">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Yazı Şrifti Ölçüsü</label>
                              <select
                                value={profileCFontSize}
                                onChange={e => {
                                  setProfileCFontSize(e.target.value as any);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 text-xs"
                              >
                                <option value="small">Kiçik Şrift</option>
                                <option value="normal">Standart Ölçü</option>
                                <option value="large">Böyük Yazı</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Common configuration (Margin & Footer message) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                          <div className="space-y-1.5 font-sans">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Kağız Kənar Boşluğu (Margin, mm)</label>
                            <input
                              type="number"
                              min="0"
                              max="24"
                              value={printerMargin}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                setPrinterMargin(val);
                                safeLocalStorageSetItem('printerMargin', val.toString());
                              }}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs"
                            />
                          </div>

                          <div className="space-y-1.5 font-sans">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Çek Altı Reklam/Brend Mesajı</label>
                            <input
                              type="text"
                              value={printerFooterText}
                              onChange={e => {
                                const val = e.target.value;
                                setPrinterFooterText(val);
                                safeLocalStorageSetItem('printerFooterText', val);
                              }}
                              placeholder="Bizi seçdiyiniz üçün təşəkkür edirik! Yolunuzu yenə gözləyirik."
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs"
                            />
                          </div>
                        </div>

                        {/* Save Button for permanent storage */}
                        <div className="pt-2 flex justify-end gap-3 items-center">
                          <button
                            type="button"
                            onClick={savePrinterSettings}
                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:from-cyan-700 hover:to-teal-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Yadda Saxla
                          </button>
                        </div>
                        {printerSavedMessage && (
                          <div className="text-[11px] font-bold text-teal-600 text-right animate-pulse">
                            ✓ Printer sazlamaları brauzer yaddaşına daimi olaraq yazıldı!
                          </div>
                        )}
                      </div>

                      {/* 2. Alternative Route Selection */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                            <RefreshCw className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Əgər Brauzer Printerləri Tapa Bilmirsə - Alternativ "Başqa Yol" Seçimləri</h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              Brauzer təhlükəsizlik səbəbi ilə bəzən fiziki printerləri birbaşa görə bilmir. Aşağıdakı yollardan birini seçib daimi tənzimləyə bilərsiniz:
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setPrinterRouteMode('browser');
                              safeLocalStorageSetItem('printerRouteMode', 'browser');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28 cursor-pointer ${
                              printerRouteMode === 'browser'
                                ? 'border-cyan-500 bg-cyan-550/10 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-55/40'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-black text-slate-750 uppercase">YOL A (ƏSAS)</span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${printerRouteMode === 'browser' ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white'}`}>
                                {printerRouteMode === 'browser' && <div className="w-1.5 h-1.5 bg-white rounded-full font-sans"></div>}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-[11px] font-extrabold text-slate-850">Sistem Çap Dialoqu</h5>
                              <p className="text-[9px] text-slate-450 font-medium leading-tight mt-0.5">Birbaşa brauzerin öz pəncərəsi üzərindən rəsmi və standart çap vərəqi açır.</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPrinterRouteMode('svg');
                              safeLocalStorageSetItem('printerRouteMode', 'svg');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28 cursor-pointer ${
                              printerRouteMode === 'svg'
                                ? 'border-cyan-500 bg-cyan-550/10 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-55/40'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-black text-slate-750 uppercase">YOL B (ŞƏKİL/SVG)</span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${printerRouteMode === 'svg' ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white'}`}>
                                {printerRouteMode === 'svg' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-[11px] font-extrabold text-slate-850">Vektor Şəkil (SVG format)</h5>
                              <p className="text-[9px] text-slate-450 font-medium leading-tight mt-0.5">Çeki dərhal yüksək keyfiyyətli vektor şəkli kimi yükləyir (RawBT üçün ən idealdır).</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPrinterRouteMode('txt');
                              safeLocalStorageSetItem('printerRouteMode', 'txt');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28 cursor-pointer ${
                              printerRouteMode === 'txt'
                                ? 'border-cyan-500 bg-cyan-550/10 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-55/40'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-black text-slate-750 uppercase">YOL C (MƏTN FORMAT)</span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${printerRouteMode === 'txt' ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white'}`}>
                                {printerRouteMode === 'txt' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-[11px] font-extrabold text-slate-850">Düz Sətir ESC/POS Mətni</h5>
                              <p className="text-[9px] text-slate-450 font-medium leading-tight mt-0.5">Minimalist mətni təmiz .txt ilə ötürür, köhnə nəsil Bluetooth printerlərə uyğundur.</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPrinterRouteMode('network');
                              safeLocalStorageSetItem('printerRouteMode', 'network');
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28 cursor-pointer ${
                              printerRouteMode === 'network'
                                ? 'border-cyan-500 bg-cyan-550/10 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-55/40'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-black text-slate-750 uppercase">YOL D (LƏĞV/BƏRPA)</span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${printerRouteMode === 'network' ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white'}`}>
                                {printerRouteMode === 'network' && <div className="w-1.5 h-1.5 bg-white rounded-full font-sans"></div>}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-[11px] font-extrabold text-slate-850">Daxili IP Printer (WLAN)</h5>
                              <p className="text-[9px] text-slate-450 font-medium leading-tight mt-0.5">Lokal şəbəkədəki TCP/IP printerə birbaşa port 9100 ilə paket göndərmək cəhdi.</p>
                            </div>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Virtual Receipt Mock (5 cols) */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-4 font-sans">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle2 className="text-cyan-500 w-4 h-4" />
                          Çekin Kağız Önizləməsi
                        </h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">VIRTUAL TICKET</span>
                      </div>

                      {/* Simulated Paper Roll Receipt */}
                      <div className="bg-slate-100 p-6 rounded-2xl flex justify-center">
                        <div className="bg-white p-5 shadow-md border-t-8 border-cyan-500 rounded-b-md w-full max-w-[280px] font-mono select-none" style={{ fontSize: printerFontSize === 'small' ? '10px' : printerFontSize === 'large' ? '14px' : '11px', outline: '1px solid #e2e8f0' }}>
                          <div className="text-center font-bold text-slate-800 uppercase text-xs tracking-tight">{appNameWord1} {appNameWord2}</div>
                          <div className="text-center text-[10px] text-slate-500 mt-0.5">Sınaq Çek Önizləməsi</div>
                          <div className="border-b border-dashed border-slate-300 my-2"></div>
                          
                          <div className="flex justify-between text-[10px] text-slate-600">
                            <span>MASA:</span>
                            <span className="font-bold text-slate-800">Masa #07</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-600">
                            <span>OFİSİANT:</span>
                            <span className="text-slate-700">Rəhbər Yoxlama</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-600">
                            <span>TARİX:</span>
                            <span className="text-slate-700 font-bold">10.06.2026 15:45</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-600">
                            <span>METOD:</span>
                            <span className="font-bold text-slate-800">Qarışıq (Nağd/Kart)</span>
                          </div>

                          <div className="border-b border-dashed border-slate-300 my-2"></div>
                          <div className="text-[10px] font-bold text-slate-800 uppercase mb-1 font-mono">MƏHSULLAR:</div>

                          {sampleItems.map((item, idx) => (
                            <div key={idx} className="mb-1 text-slate-705" style={{ fontSize: printerFontSize === 'small' ? '9px' : printerFontSize === 'large' ? '12px' : '10.5px' }}>
                              <div className="flex justify-between">
                                <span>{item.name} x{item.quantity}</span>
                                <span className="font-bold text-slate-800">{(item.price * item.quantity).toFixed(2)} ₼</span>
                              </div>
                              <div className="text-[9px] text-slate-800 font-semibold font-sans">qiyməti: {item.price.toFixed(2)} ₼</div>
                            </div>
                          ))}

                          <div className="border-b border-dashed border-slate-300 my-2"></div>
                          
                          <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1.5" style={{ fontSize: printerFontSize === 'small' ? '11px' : printerFontSize === 'large' ? '15px' : '12.5px' }}>
                            <span>CƏMİ MƏBLƏĞ:</span>
                            <span>{sampleTotal.toFixed(2)} ₼</span>
                          </div>

                          <div className="border-b border-dashed border-slate-300 my-2"></div>
                          
                          <div className="text-center text-[10px] text-slate-500 leading-tight italic pt-1 whitespace-pre-line">
                            {printerFooterText || "Bizi seçdiyiniz üçün təşəkkür edirik!\nYolunuzu yenə gözləyirik."}
                          </div>
                        </div>
                      </div>

                      {/* SINAQ ÇAPI / TEST PRINT button using chosen route */}
                      <button
                        type="button"
                        onClick={() => {
                          const testItems = [
                            { name: "Dana Bastırma Kabab", quantity: 2, price: 16.50 },
                            { name: "Süzmə Qatıq (Xüsusi)", quantity: 1, price: 3.50 },
                            { name: "Ev Limonadı (Narımlı)", quantity: 1, price: 5.50 }
                          ];
                          printCustomerTicket("Masa #07 (Sınaq)", "Rəhbər Sınaq Çapı", testItems, 42.0, "mixed", appNameWord1, appNameWord2);
                        }}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-black tracking-widest text-[9px] uppercase py-3.5 rounded-2xl shadow-lg shadow-cyan-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer transform active:scale-95 animate-pulse"
                      >
                        <Printer className="w-4 h-4" />
                        SƏNƏDİ SEÇİLMİŞ YOL İLƏ SINAQ ÇAP ET
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* TAB CONTENT 3: TABLES MANAGEMENT */}
            {adminSubTab === 'tables' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-4 bg-orange-500 rounded-full" />
                      Masa və Kabinetlərin Qr-Era Tənzimləmələri
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Sistemdəki mövcud masaların və ya VİP kabinetlərin sayını, adlarını və maksimal tutumlarını dərhal idarə edə bilərsiniz:</p>
                  </div>
                </div>
                
                <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {tables.map(table => (
                    <div key={table.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl hover:border-orange-200 hover:bg-orange-50/5 transition-all">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-[11px] font-black text-slate-700 shrink-0 select-none shadow-xs">
                        #{table.id}
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none pl-1">Masasının / Kabinetin Adı</label>
                        <input 
                          type="text"
                          value={table.number}
                          onChange={e => {
                            const updatedVal = e.target.value;
                            setTables(prev => prev.map(t => t.id === table.id ? { ...t, number: updatedVal } : t));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-extrabold text-slate-700 text-xs shadow-xs"
                          placeholder="Məs. Kabinet 1"
                        />
                      </div>

                      <div className="w-full sm:w-32 flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none pl-1">Tutum (Nəfər Sayı)</label>
                        <input 
                          type="number"
                          min="1"
                          max="50"
                          value={table.capacity}
                          onChange={e => {
                            const updatedVal = parseInt(e.target.value) || 1;
                            setTables(prev => prev.map(t => t.id === table.id ? { ...t, capacity: updatedVal } : t));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-extrabold text-slate-700 text-xs shadow-xs"
                        />
                      </div>

                      <div className="flex flex-col gap-1 shrink-0 justify-center min-w-[70px]">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none pl-1 mb-1.5 text-center sm:text-left">Status</label>
                        <span className={`px-2 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase text-center border ${
                          table.status === 'occupied' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          table.status === 'reserved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {table.status === 'occupied' ? 'MƏŞĞUL' :
                           table.status === 'reserved' ? 'REZERV' :
                           'BOŞ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
                      const newTable: Table = {
                        id: newId,
                        number: `Masa ${newId}`,
                        capacity: 4,
                        status: 'available'
                      };
                      setTables(prev => [...prev, newTable]);
                    }}
                    className="px-4 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-orange-50 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> YENİ MASA / KABİNET ƏLAVƏ ET
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: AUDIT SECURITY TRAIL */}
            {adminSubTab === 'audit' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-500" />
                      ERP Sistem Əməliyyat Audit Jurnalı (Secure Trail)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Sistem daxilində silinmiş sifarişlər, tətbiq olunmuş endirimlər və kassa əməliyyatları geri-dönməz qaydada buraya qeyd olunur.</p>
                  </div>
                </div>

                {/* Audit Search bar */}
                <div className="relative shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="Audit jurnalında axtarış (Əməliyyat, istifadəçi və ya detallar...)"
                    value={recipeSearch}
                    onChange={e => setRecipeSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 text-xs"
                  />
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[360px] scrollbar-thin">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-3 text-[10px] font-black text-slate-450 uppercase tracking-wider">Tarix & Saat</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-450 uppercase tracking-wider">Əməliyyat</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-450 uppercase tracking-wider">Cavabdeh Şəxs</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-450 uppercase tracking-wider">Ucalıq/Şiddət</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-450 uppercase tracking-wider">Detallı Açıqlama</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center p-8 text-xs font-bold text-slate-400">Heç bir audit qeydi tapılmadı.</td>
                          </tr>
                        ) : (
                          filteredAuditLogs.map(log => (
                            <tr key={log.id} className="border-b border-slate-105 hover:bg-slate-50/50 transition-all font-sans text-xs">
                              <td className="px-4 py-3 text-[10px] font-mono text-slate-450 font-bold whitespace-nowrap">{log.timestamp}</td>
                              <td className="px-4 py-3 font-extrabold text-slate-800 whitespace-nowrap">{tText(log.action)}</td>
                              <td className="px-4 py-3 font-bold text-slate-600 whitespace-nowrap">{tText(log.operator)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  log.severity === 'danger' ? 'bg-red-50 text-red-650 font-bold' :
                                  log.severity === 'warning' ? 'bg-orange-50 text-orange-650 font-bold' :
                                  'bg-emerald-50 text-emerald-650 font-bold'
                                }`}>
                                  {log.severity === 'danger' ? tText('Kritik') : log.severity === 'warning' ? tText('Xəbərdarlıq') : tText('Məlumat')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-semibold max-w-[280px] break-words">{tText(log.details)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: BACKUP & IMPORT */}
            {adminSubTab === 'backup' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Save className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800 uppercase tracking-widest leading-none">Yedəkləmə və Bərpa Etmə (Backup & Restore)</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Sistemə daxil edilən bütün masaları, menyunu, anbarı, işçiləri və satış dövriyyələrini yedəkləyin (baza backup faylı yaradın) və istənilən an geri bərpa edin.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Box: Export Backup */}
                  <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-indigo-800 font-black text-sm uppercase tracking-wide">
                        <Download className="w-5 h-5 text-indigo-600" />
                        Aşağı Yükla və Saxla (Export Backup)
                      </div>
                      <p className="text-xs text-indigo-900 leading-relaxed font-semibold">
                        Bu funksiyya basdıqda proqramın hal-hazırda istifadə etdiyi bütün verilənlər standard `.json` formatlı fayl kimi kompyuterinizə yüklənəcəkdir. Brauzerin "Faylı fərqli saxla" pəncərəsi açılacaq və saxlanılacaq yeri mən təyin edə biləcəksiniz.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const backupData = {
                            resto_tables: tables,
                            resto_menuItems: menuItems,
                            resto_reservations: reservations,
                            resto_inventory: inventory,
                            resto_inventoryTransactions: inventoryTransactions,
                            resto_inventory_hash: localStorage.getItem('resto_inventory_hash') || '',
                            resto_inventory_hash_customized: localStorage.getItem('resto_inventory_hash_customized') || '',
                            resto_orderTransactions: orderTransactions,
                            resto_expenses: expenses || JSON.parse(localStorage.getItem('resto_expenses') || '[]'),
                            resto_defectRecords: defectRecords || JSON.parse(localStorage.getItem('resto_defectRecords') || '[]'),
                            resto_staff: staff,
                            resto_kitchenLog: kitchenLog,
                            resto_activeOrders: activeOrders,
                            resto_auditLogs: auditLogs,
                            resto_closedShifts: props.closedShifts || JSON.parse(localStorage.getItem('resto_closedShifts') || '{}'),
                            resto_activeShift: props.activeShift || JSON.parse(localStorage.getItem('resto_activeShift') || '{}'),
                            // Printer settings
                            printerType,
                            printerFontSize,
                            printerMargin,
                            printerFooterText,
                            printerRouteMode,
                            networkPrinterIP,
                            networkPrinterPort,
                            resto_printerPresetType: printerPresetType,
                            resto_profileA_name: profileAName,
                            resto_profileA_type: profileAType,
                            resto_profileA_fontSize: profileAFontSize,
                            resto_profileB_name: profileBName,
                            resto_profileB_type: profileBType,
                            resto_profileB_fontSize: profileBFontSize,
                            resto_profileC_name: profileCName,
                            resto_profileC_type: profileCType,
                            resto_profileC_fontSize: profileCFontSize,
                            resto_profileC_port: profileCPort,
                            // Branding settings
                            resto_appNameWord1: appNameWord1,
                            resto_appNameWord2: appNameWord2,
                            resto_appNameColor1: appNameColor1,
                            resto_appNameColor2: appNameColor2,
                            resto_appNameFontSize: appNameFontSize,
                            resto_appNameFontFamily: appNameFontFamily,
                            resto_appNameFontWeight: appNameFontWeight,
                            resto_appNameFontStyle: appNameFontStyle,
                            resto_appLogoUrl: appLogoUrl,
                            // Developer portfolio & about settings
                            resto_devName: devName,
                            resto_devBio: devBio,
                            resto_devEmail: devEmail,
                            resto_devPhone: devPhone,
                            resto_devWhatsapp: devWhatsapp,
                            resto_devGithub: devGithub,
                            resto_devLinkedin: devLinkedin,
                            resto_devWebsite: devWebsite,
                            resto_devLogoUrl: devLogoUrl,
                            resto_devPrograms: devPrograms,
                            backup_timestamp: new Date().toISOString()
                          };
                          const encryptedString = await encryptBackupPayload(backupData);
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(encryptedString);
                          const downloadAnchor = document.createElement('a');
                          downloadAnchor.setAttribute("href", dataStr);
                          const formattedDate = new Date().toISOString().slice(0, 10);
                          downloadAnchor.setAttribute("download", `restomaster_backup_${formattedDate}.json`);
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();

                          // Log audit
                          addAuditLog("Yedəkləmə (Şifrəli Backup)", "Administrator", "Sistem verilənlərinin AES-256 hərbi dərəcəli şifrələnmiş backup JSON faylı uğurla yükləndi.", "info");
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-wider text-xs uppercase py-3.5 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        PROQRAMI YEDƏKLƏ (BAZA BACKUP ENDİR)
                      </button>
                    </div>
                  </div>

                  {/* Right Box: Import Backup */}
                  <div className="bg-emerald-50/20 p-6 rounded-3xl border border-emerald-100 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-black text-sm uppercase tracking-wide">
                        <Upload className="w-5 h-5 text-emerald-600" />
                        Əvvəlki Yedəkdən Geri Yüklə (Import & Restore)
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed font-semibold">
                        Əgər kompyuterinizdə əvvəlcədən endirdiyiniz yedəkləmə (.json) faylı varsa, onu bura yükləyərək restorandakı bütün masaları, menyunu, anbarı və keçmiş hesabatları dərhal bərpa edə bilərsiniz.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="relative border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-white rounded-2xl p-4 transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-2">
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              try {
                                const fileContent = event.target?.result as string;
                                let rawParsed: any;
                                try {
                                  rawParsed = await decryptBackupPayload(fileContent);
                                  if (typeof rawParsed === 'string') {
                                    rawParsed = JSON.parse(rawParsed);
                                  }
                                } catch (decErr) {
                                  console.warn("Şifrə açma xətası, adi JSON kimi yoxlanılır:", decErr);
                                  rawParsed = JSON.parse(fileContent);
                                }

                                if (!rawParsed || typeof rawParsed !== 'object') {
                                  alert("Xəta: Seçilən fayl düzgün backup formatında deyil və ya şifrəsi açıla bilmədi!");
                                  return;
                                }

                                // Resilient schema check: if validation warnings occur, fallback to rawParsed so no user backup is ever rejected
                                let parsed: any = rawParsed;
                                const validationResult = backupRestoreSchema.safeParse(rawParsed);
                                if (validationResult.success) {
                                  parsed = validationResult.data;
                                } else {
                                  console.warn("Backup schema validation warning (using raw parsed data):", validationResult.error);
                                }

                                // Support both prefixed (resto_tables) and non-prefixed (tables) keys for 100% backwards compatibility
                                const tablesData = parsed.resto_tables || parsed.tables;
                                const menuItemsData = parsed.resto_menuItems || parsed.menuItems;
                                const reservationsData = parsed.resto_reservations || parsed.reservations;
                                const inventoryData = parsed.resto_inventory || parsed.inventory;
                                const inventoryTransactionsData = parsed.resto_inventoryTransactions || parsed.inventoryTransactions;
                                const orderTransactionsData = parsed.resto_orderTransactions || parsed.orderTransactions;
                                const expensesData = parsed.resto_expenses || parsed.expenses;
                                const defectRecordsData = parsed.resto_defectRecords || parsed.defectRecords;
                                const staffData = parsed.resto_staff || parsed.staff;
                                const kitchenLogData = parsed.resto_kitchenLog || parsed.kitchenLog;
                                const activeOrdersData = parsed.resto_activeOrders || parsed.activeOrders;
                                const auditLogsData = parsed.resto_auditLogs || parsed.auditLogs;
                                const closedShiftsData = parsed.resto_closedShifts || parsed.closedShifts;
                                const activeShiftData = parsed.resto_activeShift || parsed.activeShift;

                                // Apply states & persist safely!
                                if (tablesData && Array.isArray(tablesData)) {
                                  setTables(tablesData);
                                  safeLocalStorageSetItem('resto_tables', JSON.stringify(tablesData));
                                }
                                if (menuItemsData && Array.isArray(menuItemsData)) {
                                  setMenuItems(menuItemsData);
                                  safeLocalStorageSetItem('resto_menuItems', JSON.stringify(menuItemsData));
                                }
                                if (reservationsData && Array.isArray(reservationsData)) {
                                  setReservations(reservationsData);
                                  safeLocalStorageSetItem('resto_reservations', JSON.stringify(reservationsData));
                                }
                                if (inventoryData && Array.isArray(inventoryData)) {
                                  setInventory(inventoryData);
                                  safeLocalStorageSetItem('resto_inventory', JSON.stringify(inventoryData));
                                }
                                if (inventoryTransactionsData && Array.isArray(inventoryTransactionsData)) {
                                  setInventoryTransactions(inventoryTransactionsData);
                                  safeLocalStorageSetItem('resto_inventoryTransactions', JSON.stringify(inventoryTransactionsData));
                                }
                                if (parsed.resto_inventory_hash) {
                                  safeLocalStorageSetItem('resto_inventory_hash', parsed.resto_inventory_hash);
                                  if (parsed.resto_inventory_hash_customized) {
                                    safeLocalStorageSetItem('resto_inventory_hash_customized', parsed.resto_inventory_hash_customized);
                                  }
                                }
                                if (orderTransactionsData && Array.isArray(orderTransactionsData)) {
                                  setOrderTransactions(orderTransactionsData);
                                  safeLocalStorageSetItem('resto_orderTransactions', JSON.stringify(orderTransactionsData));
                                }
                                if (expensesData && Array.isArray(expensesData)) {
                                  setExpenses(expensesData);
                                  safeLocalStorageSetItem('resto_expenses', JSON.stringify(expensesData));
                                }
                                if (defectRecordsData && Array.isArray(defectRecordsData)) {
                                  setDefectRecords(defectRecordsData);
                                  safeLocalStorageSetItem('resto_defectRecords', JSON.stringify(defectRecordsData));
                                }
                                if (staffData && Array.isArray(staffData)) {
                                  setStaff(staffData);
                                  safeLocalStorageSetItem('resto_staff', JSON.stringify(staffData));
                                }
                                if (kitchenLogData && Array.isArray(kitchenLogData)) {
                                  setKitchenLog(kitchenLogData);
                                  safeLocalStorageSetItem('resto_kitchenLog', JSON.stringify(kitchenLogData));
                                }
                                if (activeOrdersData && typeof activeOrdersData === 'object') {
                                  setActiveOrders(activeOrdersData);
                                  safeLocalStorageSetItem('resto_activeOrders', JSON.stringify(activeOrdersData));
                                }
                                if (auditLogsData && Array.isArray(auditLogsData)) {
                                  setAuditLogs(auditLogsData);
                                  safeLocalStorageSetItem('resto_auditLogs', JSON.stringify(auditLogsData));
                                }
                                if (closedShiftsData && typeof closedShiftsData === 'object') {
                                  if (props.setClosedShifts) props.setClosedShifts(closedShiftsData);
                                  safeLocalStorageSetItem('resto_closedShifts', JSON.stringify(closedShiftsData));
                                }
                                if (activeShiftData && typeof activeShiftData === 'object') {
                                  if (props.setActiveShift) props.setActiveShift(activeShiftData);
                                  safeLocalStorageSetItem('resto_activeShift', JSON.stringify(activeShiftData));
                                }

                                // Printer Settings load
                                if (parsed.printerType) {
                                  setPrinterType(parsed.printerType);
                                  safeLocalStorageSetItem('printerType', parsed.printerType);
                                }
                                if (parsed.printerFontSize) {
                                  setPrinterFontSize(parsed.printerFontSize);
                                  safeLocalStorageSetItem('printerFontSize', parsed.printerFontSize);
                                }
                                if (parsed.printerMargin !== undefined && parsed.printerMargin !== null) {
                                  setPrinterMargin(parseInt(String(parsed.printerMargin)));
                                  safeLocalStorageSetItem('printerMargin', String(parsed.printerMargin));
                                }
                                if (parsed.printerFooterText) {
                                  setPrinterFooterText(parsed.printerFooterText);
                                  safeLocalStorageSetItem('printerFooterText', parsed.printerFooterText);
                                }
                                if (parsed.printerRouteMode) {
                                  setPrinterRouteMode(parsed.printerRouteMode);
                                  safeLocalStorageSetItem('printerRouteMode', parsed.printerRouteMode);
                                }
                                if (parsed.networkPrinterIP) {
                                  setNetworkPrinterIP(parsed.networkPrinterIP);
                                  safeLocalStorageSetItem('networkPrinterIP', parsed.networkPrinterIP);
                                }
                                if (parsed.networkPrinterPort) {
                                  setNetworkPrinterPort(parsed.networkPrinterPort);
                                  safeLocalStorageSetItem('networkPrinterPort', parsed.networkPrinterPort);
                                }
                                if (parsed.resto_printerPresetType) {
                                  setPrinterPresetType(parsed.resto_printerPresetType);
                                  safeLocalStorageSetItem('resto_printerPresetType', parsed.resto_printerPresetType);
                                }
                                if (parsed.resto_profileA_name && setProfileAName) {
                                  setProfileAName(parsed.resto_profileA_name);
                                  safeLocalStorageSetItem('resto_profileA_name', parsed.resto_profileA_name);
                                }
                                if (parsed.resto_profileA_type && setProfileAType) {
                                  setProfileAType(parsed.resto_profileA_type);
                                  safeLocalStorageSetItem('resto_profileA_type', parsed.resto_profileA_type);
                                }
                                if (parsed.resto_profileA_fontSize && setProfileAFontSize) {
                                  setProfileAFontSize(parsed.resto_profileA_fontSize);
                                  safeLocalStorageSetItem('resto_profileA_fontSize', parsed.resto_profileA_fontSize);
                                }
                                if (parsed.resto_profileB_name && setProfileBName) {
                                  setProfileBName(parsed.resto_profileB_name);
                                  safeLocalStorageSetItem('resto_profileB_name', parsed.resto_profileB_name);
                                }
                                if (parsed.resto_profileB_type && setProfileBType) {
                                  setProfileBType(parsed.resto_profileB_type);
                                  safeLocalStorageSetItem('resto_profileB_type', parsed.resto_profileB_type);
                                }
                                if (parsed.resto_profileB_fontSize && setProfileBFontSize) {
                                  setProfileBFontSize(parsed.resto_profileB_fontSize);
                                  safeLocalStorageSetItem('resto_profileB_fontSize', parsed.resto_profileB_fontSize);
                                }
                                if (parsed.resto_profileC_name && setProfileCName) {
                                  setProfileCName(parsed.resto_profileC_name);
                                  safeLocalStorageSetItem('resto_profileC_name', parsed.resto_profileC_name);
                                }
                                if (parsed.resto_profileC_type && setProfileCType) {
                                  setProfileCType(parsed.resto_profileC_type);
                                  safeLocalStorageSetItem('resto_profileC_type', parsed.resto_profileC_type);
                                }
                                if (parsed.resto_profileC_fontSize && setProfileCFontSize) {
                                  setProfileCFontSize(parsed.resto_profileC_fontSize);
                                  safeLocalStorageSetItem('resto_profileC_fontSize', parsed.resto_profileC_fontSize);
                                }
                                if (parsed.resto_profileC_port && setProfileCPort) {
                                  setProfileCPort(parsed.resto_profileC_port);
                                  safeLocalStorageSetItem('resto_profileC_port', parsed.resto_profileC_port);
                                }

                                // Branding load
                                if (parsed.resto_appNameWord1) setAppNameWord1(parsed.resto_appNameWord1);
                                if (parsed.resto_appNameWord2) setAppNameWord2(parsed.resto_appNameWord2);
                                if (parsed.resto_appNameColor1) setAppNameColor1(parsed.resto_appNameColor1);
                                if (parsed.resto_appNameColor2) setAppNameColor2(parsed.resto_appNameColor2);
                                if (parsed.resto_appNameFontSize) setAppNameFontSize(parsed.resto_appNameFontSize);
                                if (parsed.resto_appNameFontFamily) setAppNameFontFamily(parsed.resto_appNameFontFamily);
                                if (parsed.resto_appNameFontWeight) setAppNameFontWeight(parsed.resto_appNameFontWeight);
                                if (parsed.resto_appNameFontStyle) setAppNameFontStyle(parsed.resto_appNameFontStyle);
                                if (parsed.resto_appLogoUrl) setAppLogoUrl(parsed.resto_appLogoUrl);

                                // Developer Profile & Portfolio load
                                if (parsed.resto_devName) {
                                  setDevName(parsed.resto_devName);
                                  safeLocalStorageSetItem('resto_devName', parsed.resto_devName);
                                }
                                if (parsed.resto_devBio) {
                                  setDevBio(parsed.resto_devBio);
                                  safeLocalStorageSetItem('resto_devBio', parsed.resto_devBio);
                                }
                                if (parsed.resto_devEmail) {
                                  setDevEmail(parsed.resto_devEmail);
                                  safeLocalStorageSetItem('resto_devEmail', parsed.resto_devEmail);
                                }
                                if (parsed.resto_devPhone) {
                                  setDevPhone(parsed.resto_devPhone);
                                  safeLocalStorageSetItem('resto_devPhone', parsed.resto_devPhone);
                                }
                                if (parsed.resto_devWhatsapp) {
                                  setDevWhatsapp(parsed.resto_devWhatsapp);
                                  safeLocalStorageSetItem('resto_devWhatsapp', parsed.resto_devWhatsapp);
                                }
                                if (parsed.resto_devGithub) {
                                  setDevGithub(parsed.resto_devGithub);
                                  safeLocalStorageSetItem('resto_devGithub', parsed.resto_devGithub);
                                }
                                if (parsed.resto_devLinkedin) {
                                  setDevLinkedin(parsed.resto_devLinkedin);
                                  safeLocalStorageSetItem('resto_devLinkedin', parsed.resto_devLinkedin);
                                }
                                if (parsed.resto_devWebsite) {
                                  setDevWebsite(parsed.resto_devWebsite);
                                  safeLocalStorageSetItem('resto_devWebsite', parsed.resto_devWebsite);
                                }
                                if (parsed.resto_devLogoUrl) {
                                  setDevLogoUrl(parsed.resto_devLogoUrl);
                                  safeLocalStorageSetItem('resto_devLogoUrl', parsed.resto_devLogoUrl);
                                }
                                if (parsed.resto_devPrograms && Array.isArray(parsed.resto_devPrograms)) {
                                  setDevPrograms(parsed.resto_devPrograms);
                                  safeLocalStorageSetItem('resto_devPrograms', JSON.stringify(parsed.resto_devPrograms));
                                }

                                // Synchronize immediately to SQLite Database (resto.db) if running in Desktop mode
                                if ((window as any).electron && (window as any).electron.sqliteImportAll) {
                                  const normalizedBackup = {
                                    ...parsed,
                                    resto_tables: tablesData || parsed.resto_tables,
                                    resto_menuItems: menuItemsData || parsed.resto_menuItems,
                                    resto_reservations: reservationsData || parsed.resto_reservations,
                                    resto_inventory: inventoryData || parsed.resto_inventory,
                                    resto_inventoryTransactions: inventoryTransactionsData || parsed.resto_inventoryTransactions,
                                    resto_orderTransactions: orderTransactionsData || parsed.resto_orderTransactions,
                                    resto_expenses: expensesData || parsed.resto_expenses,
                                    resto_defectRecords: defectRecordsData || parsed.resto_defectRecords,
                                    resto_staff: staffData || parsed.resto_staff,
                                    resto_kitchenLog: kitchenLogData || parsed.resto_kitchenLog,
                                    resto_activeOrders: activeOrdersData || parsed.resto_activeOrders,
                                    resto_auditLogs: auditLogsData || parsed.resto_auditLogs,
                                    resto_closedShifts: closedShiftsData || parsed.resto_closedShifts,
                                    resto_activeShift: activeShiftData || parsed.resto_activeShift,
                                  };
                                  (window as any).electron.sqliteImportAll(normalizedBackup).then((res: any) => {
                                    console.log("SQLite backup import status:", res);
                                  }).catch((e: any) => console.warn("SQLite backup import err:", e));
                                }

                                addAuditLog("Yedəkləmə (Restore)", "Administrator", "Sistem verilənləri backup faylından uğurla bərpa olundu və SQLite bazasına yazıldı.", "warning");
                                alert("Baza yedəkləməsi uğurla geri yükləndi! Bütün məlumatlar SQLite bazasına və proqrama dərhal köçürüldü.");
                              } catch (err) {
                                console.error("Backup import error:", err);
                                alert("Xəta: Backup faylını oxuyarkən xəta baş verdi. Fayl formatının düzgünlüyünə əmin olun.");
                              }
                            };
                            reader.readAsText(file);
                          }}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                        <Upload className="w-10 h-10 text-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-widest mt-1">BACKUP FAYLI YÜKLƏ (.JSON)</span>
                        <span className="text-[10px] text-slate-400 font-bold leading-normal">Seçmək üçün klikləyin və ya faylı bura sürükləyin</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SQLite Database Engine Status Banner */}
                <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Daxili Verilənlər Bazasının Vəziyyəti (SQLite 3)</span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">Aktiv və Sinxron</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Masaüstü rejimdə bütün məlumatlar birbaşa kompyuterin yaddaşında <code className="text-emerald-300 font-mono">D:\Restomaster\resto.db</code> faylında saxlanılır.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if ((window as any).electron?.sqliteGetDbInfo) {
                          (window as any).electron.sqliteGetDbInfo().then((info: any) => {
                            alert(`SQLite Baza Məlumatı:\n\nMühərrik: ${info.engine || 'SQLite 3'}\nFayl yolu: ${info.path || 'D:\\Restomaster\\resto.db'}\nHəcm: ${info.sizeKb || '0'} KB\nÜmumi Çeklər: ${info.orderCount || 0}\nMasalar: ${info.tableCount || 0}`);
                          }).catch(() => {
                            alert("SQLite statusu: Baza saz vəziyyətdədir.");
                          });
                        } else {
                          alert("Hal-hazırda brauzer mühitindəsiniz. Masaüstü tətbiqdə (Desktop) SQLite birbaşa D:\\Restomaster\\resto.db faylına yazır.");
                        }
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      Bazanın Vəziyyətini Yoxla
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 6: HAQQIMIZDA/PORTFOLİO SAZLAMALARI */}
            {adminSubTab === 'about_settings' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Profile settings */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-4 bg-indigo-500 rounded-full" />
                      Tərtibatçı Profil Məlumatları
                    </h4>
                    <p className="text-xs text-slate-400">Restoranın sidebar menyusunun altındakı "Haqqımızda" səhifəsində görünəcək təbrik və şəxsi məlumatların tənzimlənməsi:</p>
                    
                    <div className="space-y-4 font-sans text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider">Ad / Marka</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
                            value={devName} 
                            onChange={(e) => setDevName(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider block">Profil Şəkli / Loqo (Yüklə)</label>
                          <div className="flex items-center gap-3">
                            {devLogoUrl && (
                              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-150">
                                <img src={devLogoUrl} alt="Gizli" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-slate-50 rounded-xl cursor-pointer transition-all text-indigo-600 font-bold text-center">
                              <Upload className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                              <span className="truncate">SEÇ</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    compressImageFile(file, 240, 240, 0.8).then(compressed => {
                                      if (compressed) {
                                        setDevLogoUrl(compressed);
                                      }
                                    });
                                  }
                                }} 
                              />
                            </label>
                            {devLogoUrl && (
                              <button
                                type="button"
                                onClick={() => setDevLogoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80')}
                                className="text-[10px] text-slate-400 hover:text-red-500 font-extrabold uppercase tracking-tight py-1 bg-slate-50 px-2 rounded-lg border border-slate-200 transition-colors shrink-0"
                                title="İlkin şəkilə sıfırla"
                              >
                                SI FIR LA
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-500 uppercase tracking-wider">Qısa Bio / Haqqında Məlumat</label>
                        <textarea 
                          className="w-full h-16 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
                          value={devBio} 
                          onChange={(e) => setDevBio(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider">Elektron Poçt / Email</label>
                          <input 
                            type="email" 
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
                            value={devEmail} 
                            onChange={(e) => setDevEmail(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider">Əlaqə Telefonu</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
                            value={devPhone} 
                            onChange={(e) => setDevPhone(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider">WhatsApp (Yalnız Rəqəm)</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold"
                            value={devWhatsapp} 
                            onChange={(e) => setDevWhatsapp(e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider">GitHub Linki</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[10px]"
                            value={devGithub} 
                            onChange={(e) => setDevGithub(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider">LinkedIn Linki</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[10px]"
                            value={devLinkedin} 
                            onChange={(e) => setDevLinkedin(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-extrabold text-slate-500 uppercase tracking-wider">Şəxsi Vebsayt / Instagram</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[10px]"
                            value={devWebsite} 
                            onChange={(e) => setDevWebsite(e.target.value)} 
                          />
                        </div>
                      </div>

                      {/* Explicit Save button for Profile Details with Success state */}
                      <div className="pt-2 flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            safeLocalStorageSetItem('resto_devName', devName);
                            safeLocalStorageSetItem('resto_devBio', devBio);
                            safeLocalStorageSetItem('resto_devEmail', devEmail);
                            safeLocalStorageSetItem('resto_devPhone', devPhone);
                            safeLocalStorageSetItem('resto_devWhatsapp', devWhatsapp);
                            safeLocalStorageSetItem('resto_devGithub', devGithub);
                            safeLocalStorageSetItem('resto_devLinkedin', devLinkedin);
                            safeLocalStorageSetItem('resto_devWebsite', devWebsite);
                            safeLocalStorageSetItem('resto_devLogoUrl', devLogoUrl);
                            if ((window as any).electron && (window as any).electron.saveDesktopData) {
                              (window as any).electron.saveDesktopData({
                                resto_devName: devName,
                                resto_devBio: devBio,
                                resto_devEmail: devEmail,
                                resto_devPhone: devPhone,
                                resto_devWhatsapp: devWhatsapp,
                                resto_devGithub: devGithub,
                                resto_devLinkedin: devLinkedin,
                                resto_devWebsite: devWebsite,
                                resto_devLogoUrl: devLogoUrl,
                                resto_devPrograms: devPrograms
                              });
                            }
                            setAboutSettingsSaved(true);
                            setTimeout(() => setAboutSettingsSaved(false), 5000);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black tracking-widest text-[10px] uppercase py-3.5 rounded-2xl shadow-md hover:shadow-indigo-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-500"
                        >
                          <Save className="w-4 h-4 text-indigo-200" />
                          Profil Məlumatlarını Yadda Saxla
                        </button>

                        {aboutSettingsSaved && (
                          <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                            <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <h5 className="text-[10px] font-black text-indigo-900 uppercase tracking-wider">DƏYİŞİKLİKLƏR YADDA SAXLANILDI!</h5>
                              <p className="text-[9.5px] text-indigo-700 font-semibold leading-relaxed">
                                Tərtibatçı profil məlumatları brauzerin daimi yaddaşına yazıldı və "Haqqımızda" səhifəsində dərhal yeniləndi!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Add portfolio programs */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-4 bg-indigo-500 rounded-full" />
                        Yeni Proqram / Layihə Əlavə Et
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setNewProgName('Resto Master VIP Cloud');
                          setNewProgDesc('Restoran şbələri üçün fərdiləşdirilmiş VIP sifariş gedişatı, müştəri loyallığı idarəetməsi, QR menyu vasitəsilə masadan sürətli ödəniş, və mətbəx üçün canlı smart sifariş monitoru.');
                          setNewProgImage('https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&q=80');
                          setNewProgTech('React 18, Next.js, Tailwind CSS, PostgreSQL, WebSockets');
                          setNewProgLink('https://ais-pre-yseik3aigjbelyk3o5vucc-708050271650.europe-west2.run.app');
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold text-[10px] uppercase py-1 px-2.5 rounded-lg border border-indigo-100 transition-all shrink-0"
                        title="Nümunə məlumatları dərhal doldurub yoxlayın"
                      >
                        NÜMUNƏ DOLDUR
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">Tərtib etdiyiniz digər maraqlı və satıla bilən proqramları portfolionuza dərhal daxil edin:</p>
                    
                    <div className="space-y-3 font-sans text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase">Proqramın Adı</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-slate-705 bg-slate-50/50"
                            placeholder="Məsələn: CargoFlow"
                            value={newProgName} 
                            onChange={(e) => setNewProgName(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase block">Görüntü Şəkli / Logo (Yüklə)</label>
                          <div className="flex items-center gap-2">
                            {newProgImage && (
                              <div className="w-10 h-7 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                                <img src={newProgImage} alt="Önizləmə" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <label className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-slate-50 rounded-lg cursor-pointer transition-all text-indigo-600 font-bold text-center text-[10px]">
                              <Upload className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                              <span className="truncate">YÜKLƏ</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    compressImageFile(file, 400, 300, 0.8).then(compressed => {
                                      if (compressed) {
                                        setNewProgImage(compressed);
                                      }
                                    });
                                  }
                                }} 
                              />
                            </label>
                            {newProgImage && (
                              <button
                                type="button"
                                onClick={() => setNewProgImage('')}
                                className="text-[10px] text-slate-400 hover:text-red-500 font-extrabold uppercase tracking-tight py-1.5 bg-slate-50 px-2 rounded-lg border border-slate-200 transition-colors shrink-0"
                                title="Şəkli təmizlə"
                              >
                                SİL
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
 
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 uppercase">Ətraflı İzahı / Funksiyalar</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-slate-705 bg-slate-50/50"
                          placeholder="Məsələn: Sürətli kuryer çatdırılması üçün canlı xəritə və marşrut..."
                          value={newProgDesc} 
                          onChange={(e) => setNewProgDesc(e.target.value)} 
                        />
                      </div>
 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase">Texnologiyalar (Vergüllə ayırın)</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-slate-705 bg-slate-50/50"
                            placeholder="React, Next.js, Node.js"
                            value={newProgTech} 
                            onChange={(e) => setNewProgTech(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 uppercase">Demo Keçid Linki (Yoxdursa #)</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-slate-705 bg-slate-50/50"
                            placeholder="https://demo.example.com"
                            value={newProgLink} 
                            onChange={(e) => setNewProgLink(e.target.value)} 
                          />
                        </div>
                      </div>
 
                      <button
                        type="button"
                        onClick={() => {
                          // Dynamic fallback auto-populations so it is NEVER inactive/blocked
                          const finalName = newProgName.trim() || `Sifarişli Proqram V${devPrograms.length + 1}`;
                          const finalDesc = newProgDesc.trim() || "Müştərinin istəkləri və xidmət sahəsinin tələblərinə mükəmməl uyğunlaşdırılmış, müasir idarəetmə və yüksək performanslı bulud platforması.";
                          const finalTech = newProgTech.trim() || "React, TypeScript, Tailwind CSS, Local Storage";
                          const finalLink = newProgLink.trim() || "#";
                          const finalImage = newProgImage || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80';

                          const newProg = {
                            id: String(Date.now()),
                            name: finalName,
                            description: finalDesc,
                            image: finalImage,
                            tech: finalTech,
                            link: finalLink
                          };

                          setDevPrograms(prev => {
                            const updated = [...prev, newProg];
                            safeLocalStorageSetItem('resto_devPrograms', JSON.stringify(updated));
                            return updated;
                          });

                          // Reset states
                          setNewProgName('');
                          setNewProgDesc('');
                          setNewProgImage('');
                          setNewProgTech('');
                          setNewProgLink('');
                          
                          // Custom elegant UI-only non-blocking notification
                          const notif = document.createElement('div');
                          notif.className = 'fixed bottom-5 right-5 z-50 bg-indigo-600 text-white font-extrabold text-[11px] tracking-wide uppercase px-6 py-4 rounded-2xl shadow-2xl border border-indigo-400 flex items-center gap-2 animate-bounce';
                          notif.innerHTML = `
                            <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                            PORTFOLİO UĞURLA YENİLƏNDİ VƏ "HAQQIMIZDA" SƏHİFƏSİNƏ ƏLAVƏ EDİLDİ!
                          `;
                          document.body.appendChild(notif);
                          setTimeout(() => {
                            notif.style.opacity = '0';
                            notif.style.transition = 'opacity 0.5s ease';
                            setTimeout(() => notif.remove(), 500);
                          }, 3000);

                          // Redirect dynamically to About Us (Haqqımızda) to display the loaded portfolio items
                          setActiveTab('about_us');
                        }}
                        className="w-full bg-indigo-650 hover:bg-indigo-700 active:scale-[0.98] text-white font-black tracking-widest text-[10px] uppercase py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-600 mt-2"
                      >
                        <Plus className="w-4 h-4" /> Portfolioya Əlavə Et
                      </button>
                    </div>
                  </div>

                </div>

                {/* Sub row: Portfolio items lists with delete button */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Portfolioda Mövcud Proqramların Siyahısı ({devPrograms.length})</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 font-black uppercase text-[9px] tracking-wider">
                          <th className="px-4 py-3">Miniatür</th>
                          <th className="px-4 py-3">Proqramın Adı</th>
                          <th className="px-4 py-3">Texnologiyalar</th>
                          <th className="px-4 py-3">Açıqlama</th>
                          <th className="px-4 py-3 text-right">Əməliyyat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devPrograms.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Layihə əlavə edilməyib</td>
                          </tr>
                        ) : (
                          devPrograms.map(prog => (
                            <tr key={prog.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-700">
                              <td className="px-4 py-3">
                                <div className="w-12 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-150">
                                  <img src={prog.image} alt={prog.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                              </td>
                              <td className="px-4 py-3 font-extrabold text-slate-800">{prog.name}</td>
                              <td className="px-4 py-3 font-bold text-indigo-600">{prog.tech}</td>
                              <td className="px-4 py-3 text-slate-400 text-[10px] line-clamp-1 max-w-[240px] mt-2.5">{prog.description}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDevPrograms(prev => {
                                      const updated = prev.filter(p => p.id !== prog.id);
                                      safeLocalStorageSetItem('resto_devPrograms', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-650 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
                                >
                                  SİL
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT 7: DB PURGE & RESET FOR PRODUCTION */}
            {adminSubTab === 'purge' && (
              <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-md space-y-6 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <div className="inline-flex p-3 bg-red-50 rounded-2xl border border-red-100">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <h4 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    Bütün Verilənləri Tamamən Sıfırla (Purge All)
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bu düymə restorana tətbiqi satarkən və ya yeni bir iş gününə təmiz başlarkən istifadə olunur. Düymə sıxıldıqda əllə daxil edilmiş, sınaq edilən bütün aktiv satış dövriyyələri, masadakı gözləyən yeməklər, sifariş jurnal tarixi və mətbəx loqu tamamən sıfırlanaraq **tətbiqi real satışa hazır vəziyyətə gətirir**.
                  </p>
                </div>

                {isDatabasePurged && (
                  <div className="bg-emerald-50 border border-emerald-150 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                        ✓
                      </div>
                      <div>
                        <h5 className="text-emerald-800 font-black text-sm uppercase tracking-wider">{tText("MƏLUMATLAR SIFIRLANDI & PROQRAM SATIŞA HAZIRDIR!")}</h5>
                        <p className="text-emerald-700/80 text-[11px] font-semibold mt-1">
                          {tText("Əvvəlki bütün sınaq sifarişləri, kassa dövriyyə məlumatları və mətbəx qeydləri birdəfəlik təmizləndi. Sistem təmiz kassa hesabatı ilə 100% aktivləşdirildi.")}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        restoreMockData();
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black tracking-widest uppercase px-4 py-2.5 rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer"
                    >
                      {tText("Sınaq Məlumatlarını Yüklə")}
                    </button>
                  </div>
                )}

                <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 space-y-4">
                  <div className="flex gap-2 text-xs font-bold text-red-850">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 animate-pulse" />
                    <span>{tText("Xəbərdarlıq: Bu əməliyyatın geri qaytarılması yoxdur! Bütün lokal dövriyyələr silinəcəkdir. İndiki vəziyyətdən asılı olmayaraq, istədiyiniz an sistemi sıfırlaya bilərsiniz.")}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: tText('SİSTEMİ TAM SIFIRLA (PURGE ALL)'),
                        message: tText('DİQQƏT! Bütün aktiv masalar (sifarişlər daxil), menyu məhsulları, rezervasiyalar, anbar malları, işçi siyahısı və növbələri, keçmiş sifariş / satış dövriyyəsi qeydləri, çap tənzimləmələri və brending loqoları tamamilə təmizlənəcək və tətbiq yeni müştəriyə satılmaq üçün təmiz, hazır vəziyyətə gətiriləcəkdir. Bu əməliyyatı tamamlamaq istədiyinizə əminsiniz?'),
                        confirmText: tText('Bəli, Tamamilə Sıfırla'),
                        cancelText: tText('Xeyr, Ləğv Et'),
                        onConfirm: () => {
                          purgeAllData();
                        }
                      });
                    }}
                    className="bg-red-500 hover:bg-red-650 text-white text-[10px] font-black tracking-widest uppercase px-6 py-3 rounded-xl shadow-md shadow-red-100 transition-all flex items-center gap-1.5 cursor-pointer max-w-xs justify-center font-sans"
                  >
                    <Trash2 className="w-4 h-4" /> {tText("BÜTÜN DATANI TAMAMƏN SIFIRLA (PURGE ALL)")}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 8: SECURITY & PASSWORD CONTROLS */}
            {adminSubTab === 'security' && (
              <AdminSecurityTab 
                adminPassword={adminPassword}
                setAdminPassword={setAdminPassword}
                setIsAdminUnlocked={setIsAdminUnlocked}
                addAuditLog={addAuditLog}
              />
            )}

          </div>
        </div>
      );
};
