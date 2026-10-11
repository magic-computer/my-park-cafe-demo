import React from "react";
import { 
  Receipt, 
  Settings, 
  CheckCircle2, 
  Save, 
  Printer, 
  Tablet, 
  RefreshCw, 
  HelpCircle 
} from "lucide-react";
import { Card } from "../Card";

export interface PrinterTabProps {
  printerType: string;
  setPrinterType: (t: any) => void;
  tText: (key: string, defaultText?: string) => string;
  printerFontSize: "small" | "normal" | "large";
  setPrinterFontSize: (size: "small" | "normal" | "large") => void;
  printerMargin: number | string;
  setPrinterMargin: (margin: any) => void;
  printerFooterText: string;
  setPrinterFooterText: (text: string) => void;
  printerRouteMode: "browser" | "pdf" | "svg" | "txt" | "network";
  setPrinterRouteMode: (mode: "browser" | "pdf" | "svg" | "txt" | "network") => void;
  networkPrinterIP: string;
  setNetworkPrinterIP: (ip: string) => void;
  networkPrinterPort: string;
  setNetworkPrinterPort: (port: string) => void;
  savePrinterSettings: () => void;
  printerSavedMessage: boolean;
  appNameWord1: string;
  appNameWord2: string;
  printCustomerTicket: (
    tableNumber: any,
    waiterName: any,
    items: any,
    orderTotal: any,
    paymentMethod: any,
    appName1stWord?: string,
    appName2ndWord?: string
  ) => void;
}

export const PrinterTab: React.FC<PrinterTabProps> = ({
  printerType,
  setPrinterType,
  tText,
  printerFontSize,
  setPrinterFontSize,
  printerMargin,
  setPrinterMargin,
  printerFooterText,
  setPrinterFooterText,
  printerRouteMode,
  setPrinterRouteMode,
  networkPrinterIP,
  setNetworkPrinterIP,
  networkPrinterPort,
  setNetworkPrinterPort,
  savePrinterSettings,
  printerSavedMessage,
  appNameWord1,
  appNameWord2,
  printCustomerTicket
}) => {
const sampleItems = [
        { name: "Dana Bastırma Kabab", quantity: 2, price: 16.50 },
        { name: "Süzmə Qatıq (Xüsusi)", quantity: 1, price: 3.50 },
        { name: "Ev Limonadı (Narımlı)", quantity: 1, price: 5.50 }
      ];
      const sampleTotal = 42.0;

      return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
            
            {/* Header banner */}
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-[24px] p-6 text-white min-h-[120px] flex flex-col justify-between shadow-xl shadow-cyan-100 relative overflow-hidden">
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
                <Printer className="w-48 h-48" />
              </div>
              <span className="bg-white/20 uppercase tracking-widest text-[9px] font-black px-3 py-1 rounded-full w-fit">
                PRINTER & ÇAP SİSTEMİ İNTEQRASİYASI
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">Kassa və Mətbəx Printerlərinin Tənzimlənməsi</h2>
                <p className="text-xs font-semibold opacity-90 mt-1 max-w-2xl">
                  Bu bölmədən həm brauzerin rəsmi sistem printerlərini, həm də brauzer printerləri tapa bilmədikdə işləyə biləcək alternativ sənəd/şəkil formatlarını təyin edə bilərsiniz. Sazlamaları yadda saxlamaq üçün aşağıdakı xüsusi düymədən istifadə edin.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Settings and Guides (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Printer Parameters */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-100 text-cyan-600 rounded-lg">
                      <Settings className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Çap Parametrləri və Kağız Ölçüsü</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Printer Cihazı / Kağız Formatı</label>
                      <select
                        value={printerType}
                        onChange={e => {
                          const val = e.target.value as any;
                          setPrinterType(val);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs text-left"
                      >
                        <option value="thermal_80mm">Termal 80mm Standart Kassa Printeri</option>
                        <option value="thermal_58mm">Termal 58mm Portativ Çek Printeri</option>
                        <option value="a4_standard">A4 Formatlı Ofis Printeri</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Yazı Şrifti Ölçüsü (Size)</label>
                      <select
                        value={printerFontSize}
                        onChange={e => {
                          const val = e.target.value as any;
                          setPrinterFontSize(val);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs text-left"
                      >
                        <option value="small">Kiçik Şrift (Maksimum detal sığışdırma)</option>
                        <option value="normal">Standart Ölçü (Tövsiyə olunan)</option>
                        <option value="large">Böyük Yazı (Görməsi zəif olanlar üçün)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Kağız Kənar Boşluğu (Margin, mm)</label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={printerMargin}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setPrinterMargin(val);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Çek Altı Reklam/Brend Mesajı</label>
                      <input
                        type="text"
                        value={printerFooterText}
                        onChange={e => {
                          const val = e.target.value;
                          setPrinterFooterText(val);
                        }}
                        placeholder="Bizi seçdiyiniz üçün təşəkkür edirik! Yolunuzu yenə gözləyirik."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs"
                      />
                    </div>
                  </div>
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
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[120px] transition-all cursor-pointer ${
                        printerRouteMode === 'browser'
                          ? 'border-cyan-500 bg-cyan-50/20 text-cyan-900 shadow-sm'
                          : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="p-1 px-2.5 bg-white border border-slate-200 rounded-md text-[9px] font-black uppercase text-slate-500">Yol A</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${printerRouteMode === 'browser' ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {printerRouteMode === 'browser' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-800">Brauzer Nativ Çapı</h5>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">Yüksək uyğunluqlu sistem dialoqunu (window.print) rəsmən açır.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrinterRouteMode('svg');
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[120px] transition-all cursor-pointer ${
                        printerRouteMode === 'svg'
                          ? 'border-cyan-500 bg-cyan-50/20 text-cyan-900 shadow-sm'
                          : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="p-1 px-2.5 bg-white border border-slate-200 rounded-md text-[9px] font-black uppercase text-slate-500">Yol B (Tövsiyə)</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${printerRouteMode === 'svg' ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {printerRouteMode === 'svg' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-800">Vektor SVG Fayl Yükləmə</h5>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">Çapkənarlardan kənara çıxmayan, net və sıxılmayan peşəkar SVG-ni endirir.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrinterRouteMode('txt');
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[120px] transition-all cursor-pointer ${
                        printerRouteMode === 'txt'
                          ? 'border-cyan-500 bg-cyan-50/20 text-cyan-900 shadow-sm'
                          : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="p-1 px-2.5 bg-white border border-slate-200 rounded-md text-[9px] font-black uppercase text-slate-500">Yol C</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${printerRouteMode === 'txt' ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {printerRouteMode === 'txt' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-800">Çek Mətn (TXT) Yükləmə</h5>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">Termal sətir eni (32/40 simvol) ilə düzülmüş UTF-8 mətn faylı kimi saxlayır.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrinterRouteMode('network');
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[120px] transition-all cursor-pointer ${
                        printerRouteMode === 'network'
                          ? 'border-cyan-500 bg-cyan-50/20 text-cyan-900 shadow-sm'
                          : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="p-1 px-2.5 bg-white border border-slate-200 rounded-md text-[9px] font-black uppercase text-slate-500">Yol D (Sürətli TCP)</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${printerRouteMode === 'network' ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {printerRouteMode === 'network' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-800">Lokal Şəbəkə (TCP/RAW)</h5>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">Şəbəkə IP və Portundan RAW kassa əmrlərini birbaşa göndərmək üçündür.</p>
                      </div>
                    </button>
                  </div>

                  {printerRouteMode === 'network' && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3 animate-in fade-in duration-200 font-sans">
                      <p className="text-[10px] text-cyan-600 font-black uppercase tracking-widest">Lokal Şəbəkə IP & Port Hazırlığı:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-0.5">Printer Lokal IP Ünvanı</label>
                          <input
                            type="text"
                            value={networkPrinterIP}
                            onChange={e => {
                              setNetworkPrinterIP(e.target.value);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                            placeholder="192.168.1.100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-0.5">TCP RAW Portu</label>
                          <input
                            type="text"
                            value={networkPrinterPort}
                            onChange={e => {
                              setNetworkPrinterPort(e.target.value);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                            placeholder="9100"
                          />
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                        Qeyd: Brauzer sanboks təhlükəsizliyinə görə nümayiş üçün bu ssenari kassa serveri simulyasiyası edərək bütün printer RAW əmrlərini jurnallara ötürür.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Explicit SAVE Settings Button */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-teal-100 text-teal-600 rounded-lg">
                      <Save className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Çap Parametrlərini Yadda Saxla</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Tənzimlədiyiniz printerin daimi yaddaşda qalması və hər dəfə proqram açıldıqda sıfırlanmaması üçün yadda saxlayın.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={savePrinterSettings}
                      className="w-full bg-emerald-650 hover:bg-emerald-700 bg-emerald-600 text-white font-black tracking-wider text-xs uppercase py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-95 duration-150 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      SAZLAMALARI DAİMİ YADDA SAXLA (SAVE)
                    </button>
                  </div>

                  {printerSavedMessage && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex items-start gap-2.5 text-[10px] font-sans animate-in fade-in zoom-in duration-300">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5 font-bold" />
                      <div>
                        <p className="font-extrabold text-emerald-950 uppercase tracking-wider text-[11px] leading-none mb-0.5">SAZLAMALAR DAİMİ QEYD EDİLDİ!</p>
                        <p className="font-semibold text-emerald-700 leading-tight">Bu printer sazlamaları və çap yolu proqram yenidən başladıqda avtomatik tətbiq olunacaqdır.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Guide step by step manual */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">POS Monitor, Kompüter və Tablet Sazlama Bələdçisi</h4>
                  </div>

                  <div className="space-y-3 font-sans text-xs font-bold text-slate-600 leading-relaxed">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                      <p>
                        <strong className="text-slate-800">Printer drayverini quraşdırın:</strong> Sizin USB, Bluetooth və ya Wi-Fi termal qəbz printerini POS monitora, kompüterinizə və ya smart planşetinizə daxil edin və drayverini əməliyyat sisteminə tanıdın.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                      <p>
                        <strong className="text-slate-800">Defolt Printer təyin edin:</strong> Əməliyyat sisteminin "Printerlər və Skanerlər" (Printers & Scanners) bölməsinə daxil olaraq bu printeri avtomatik əsas kassa printeri seçin.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                      <p>
                        <strong className="text-slate-800">Brauzerdə kənar boşluqları bağlayın:</strong> İlk çap pəncərəsi (window.print) açıldıqda, brauzer çap pəncərəsində "Kənar başlıqları və altlıqları göstər" (Headers and footers) quşunu söndürün ki, çekin üstündə tarix və saytın linkləri çıxmasın.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">4</span>
                      <p>
                        <strong className="text-slate-800 text-teal-600">Alternativ Köməkçi Yollar:</strong> Əgər brauzeriniz əməliyyat sisteminin printerlərini təhlükəsizlik baryerinə görə tam oxuya bilmirsə, dərhal <strong className="text-teal-600">Yol B (SVG)</strong> və ya <strong className="text-teal-600">Yol C (Mətn TXT)</strong> seçin. Bu yollarla çapa verilən hər bir çek anında peşəkar termal formatda yüklənəcək və istənilən Bluetooth/USB kassa köməkçisi proqramı (RawBT və s.) ilə çapa gedəcəkdir.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Virtual Receipt Mock (5 cols) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-4">
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
                      <div key={idx} className="mb-1 text-slate-700" style={{ fontSize: printerFontSize === 'small' ? '9px' : printerFontSize === 'large' ? '12px' : '10.5px' }}>
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
        </div>
      );
};
