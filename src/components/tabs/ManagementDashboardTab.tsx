import React from "react";
import { 
  Utensils, 
  Receipt, 
  Package, 
  Users, 
  AlertTriangle, 
  ChevronRight, 
  BarChart3, 
  QrCode, 
  Brain, 
  Lock, 
  Undo2,
  TrendingDown 
} from "lucide-react";
import { Table, MenuItem, InventoryItem, StaffMember } from "../../types";

export interface ManagementDashboardTabProps {
  setManagementSubTab: (tab: any) => void;
  setIsManagementUnlocked: (unlocked: boolean) => void;
  menuItems: MenuItem[];
  inventory: InventoryItem[];
  staff: StaffMember[];
  tables: Table[];
  appName: string;
  tText: (key: string, defaultText?: string) => string;
  expensesTotal?: number;
  currencyText?: string;
  onOpenExpenses?: () => void;
}

export const ManagementDashboardTab: React.FC<ManagementDashboardTabProps> = ({
  setManagementSubTab,
  setIsManagementUnlocked,
  menuItems,
  inventory,
  staff,
  tables,
  appName,
  tText,
  expensesTotal = 0,
  currencyText = 'AZN',
  onOpenExpenses
}) => {
const cards = [
      {
        id: 'expenses' as const,
        title: 'Xərclər və Məxaric Portalı',
        desc: 'Restoranın cari gün, ay və il üzrə bütün xərclərinin dəqiq qeydiyyatı, əməliyyat çıxarları və xərc maddələri jurnalı.',
        icon: TrendingDown,
        btnColor: 'from-rose-500 to-red-600 bg-rose-500',
        textColor: 'text-rose-600',
        accentBg: 'bg-rose-50'
      },
      {
        id: 'menu' as const,
        title: 'Menyu Portalı',
        desc: 'Restoran yeməklərinin, içkilərin, reseptlərin daxili idarə edilməsi, qiymətləndirmə, kateqoriyalar və yeni yemək əlavələri.',
        icon: Receipt,
        btnColor: 'from-orange-500 to-amber-500 bg-orange-500',
        textColor: 'text-orange-600',
        accentBg: 'bg-orange-50'
      },
      {
        id: 'inventory' as const,
        title: 'Anbar & Stok Deposu',
        desc: 'Kritik minimum xammal limitləri, malın anbara mədaxili, satıcılar/təchizatçılar, xammal jurnalları və real vaxt stok idarə etməsi.',
        icon: Package,
        btnColor: 'from-amber-500 to-yellow-500 bg-amber-500',
        textColor: 'text-amber-600',
        accentBg: 'bg-amber-50'
      },
      {
        id: 'staff' as const,
        title: 'İşçilər & Növbələr',
        desc: 'Xidmət heyətinin (ofisiant, kuryer) siyahısı, telefon nömrələri, aktiv iş günləri növbəsi qeydiyyatı, rol təyinatı və şəxsi dövriyyə.',
        icon: Users,
        btnColor: 'from-blue-500 to-indigo-500 bg-blue-500',
        textColor: 'text-blue-600',
        accentBg: 'bg-blue-50 font-sans'
      },
      {
        id: 'ai' as const,
        title: 'Ağıllı AI Analitika',
        desc: 'Süni İntellekt (Gemini Pro) dəstəkli satış analitik proqnozları, kritik günlər, sıx sıx sifariş edilənlər və rəhbərlik tövsiyələri.',
        icon: Brain,
        btnColor: 'from-purple-500 to-violet-500 bg-purple-500',
        textColor: 'text-purple-600',
        accentBg: 'bg-purple-50'
      },
      {
        id: 'reports' as const,
        title: 'Sistem Hesabatları',
        desc: 'Tarixə görə kassa dövriyyəsi, satışlar, ofisiantların fərdi gəlir payları, masa dinamikası, jurnalların Excel və Print formatında çıxarılması.',
        icon: BarChart3,
        btnColor: 'from-emerald-500 to-teal-500 bg-emerald-500',
        textColor: 'text-emerald-600',
        accentBg: 'bg-emerald-50'
      },
      {
        id: 'qrcodes' as const,
        title: 'Masa QR Kodları',
        desc: 'Müştərilərin smartfondan menyunu izləməsi və birbaşa canlı sifariş verməsi üçün masaya özəl QR kodlar və çap şablonları.',
        icon: QrCode,
        btnColor: 'from-cyan-500 to-blue-500 bg-cyan-500',
        textColor: 'text-cyan-600',
        accentBg: 'bg-cyan-50'
      },
      {
        id: 'defective' as const,
        title: 'Xarab Məhsullar',
        desc: 'Mətbəx və ya servisdə keyfiyyətsiz çıxan, xarab olan yeməklərin səbəbi, masa nömrəsi, saat və tarixlə hesabat jurnalı.',
        icon: AlertTriangle,
        btnColor: 'from-rose-500 to-red-600 bg-rose-500',
        textColor: 'text-rose-600',
        accentBg: 'bg-rose-50'
      },
      {
        id: 'returned' as const,
        title: 'Geri Alınan Məhsullar',
        desc: 'Müştərilər tərəfindən geri qaytarılan məhsulların səbəbi, dəyəri, masa nömrəsi və vaxt üzrə təqvimli analitik qeydiyyatı.',
        icon: Undo2,
        btnColor: 'from-amber-500 to-orange-600 bg-amber-500',
        textColor: 'text-amber-600',
        accentBg: 'bg-amber-50'
      },
      {
        id: 'tables' as const,
        title: 'Masa / Kabinetlər',
        desc: 'Sistemdəki masaların və ya VIP kabinetlərin sayını, adlarını və maksimal tutumlarını dərhal idarə edə bilərsiniz.',
        icon: Utensils,
        btnColor: 'from-emerald-500 to-green-600 bg-emerald-500',
        textColor: 'text-emerald-600',
        accentBg: 'bg-emerald-50'
      }
    ];

    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="max-w-7xl mx-auto pb-16 space-y-8 animate-in fade-in duration-300">
          
          {/* Header Card Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 md:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
            {/* Ambient Background Glows */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-orange-500/10 to-transparent pointer-events-none" />
            <div className="absolute left-1/4 -top-12 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-2 max-w-xl z-20">
              <span className="bg-orange-500 text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full w-fit flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                RƏHBƏRLİK STRATEGİK MƏRKƏZİ
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight select-none mt-2">Xoş Gəldiniz, Hörmətli Rəhbər</h2>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Bu bölmədə restoranın daxili tənzimləmələrinə, stok və xammal deposuna, xidmət jurnallarına, süni intellekt analitika hesabatlarına təsir edən bütün sistemləri bir mərkəzdən nəzarət edə bilərsiniz.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 z-20">
              <button
                type="button"
                onClick={() => {
                  setIsManagementUnlocked(false);
                  setManagementSubTab(null);
                }}
                className="flex items-center justify-center gap-2 text-white bg-red-650 hover:bg-red-600 active:scale-95 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-red-500/10 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Sessiyanı Kilidlə (Çıxış)
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Menyu çeşidi</span>
                <span className="text-lg font-black text-slate-700 leading-none mt-1.5 block">{menuItems.length} yemək</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Anbardakı xammal</span>
                <span className="text-lg font-black text-slate-700 leading-none mt-1.5 block">{inventory.length} məhsul</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Ştat siyahısı</span>
                <span className="text-lg font-black text-slate-700 leading-none mt-1.5 block">{staff.length} aktiv heyət</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Cəmi Masalar</span>
                <span className="text-lg font-black text-slate-700 leading-none mt-1.5 block">{tables.length} masa</span>
              </div>
            </div>

            <div 
              id="management-quick-expenses-card"
              onClick={onOpenExpenses}
              className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-red-200 shadow-3xs flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">{tText("Cari Xərclər", "Cari Xərclər")}</span>
                <span className="text-lg font-black text-red-600 leading-none mt-1.5 block">{(expensesTotal || 0).toFixed(2)} {currencyText || 'AZN'}</span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(card => {
              const CardIcon = card.icon;
              return (
                <div 
                  key={card.id}
                  className="bg-white hover:bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-orange-100 shadow-xs hover:shadow-lg transition-all p-6 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${card.accentBg} ${card.textColor} flex items-center justify-center shadow-3xs group-hover:scale-110 transition-transform`}>
                        <CardIcon className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-black text-slate-350 tracking-widest uppercase">ID: {card.id.toUpperCase()}</span>
                    </div>

                    <h3 className="text-base font-black text-slate-800 tracking-tight">{card.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed leading-relaxed">{card.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (card.id === 'expenses') {
                        if (onOpenExpenses) onOpenExpenses();
                        else setManagementSubTab('expenses');
                      } else {
                        setManagementSubTab(card.id);
                      }
                    }}
                    className={`w-full py-3 bg-gradient-to-r ${card.btnColor} hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm transform active:scale-98 flex items-center justify-center gap-1`}
                  >
                    Mədaxil Et və Giriş Yap
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
};
