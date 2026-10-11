import React, { useState } from 'react';
import { Search, Printer, Globe, QrCode, Sparkles } from 'lucide-react';
import { TableQRCodeCard } from './TableQRCodeCard';
import { Table, QRManagementTabProps } from '../types';
import { safeLocalStorageSetItem } from '../utils/storageUtils';

export const QRManagementTab: React.FC<QRManagementTabProps> = ({ tables, appName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(() => {
    return localStorage.getItem('resto_qr_use_custom') === 'true';
  });
  const [customUrl, setCustomUrl] = useState(() => {
    return localStorage.getItem('resto_qr_custom_url') || '';
  });

  const systemUrl = `${window.location.origin}${window.location.pathname}`;
  const activeBaseUrl = useCustomUrl && customUrl ? customUrl : systemUrl;

  const handleToggleCustom = (val: boolean) => {
    setUseCustomUrl(val);
    safeLocalStorageSetItem('resto_qr_use_custom', String(val));
  };

  const handleCustomUrlChange = (val: string) => {
    setCustomUrl(val);
    safeLocalStorageSetItem('resto_qr_custom_url', val);
  };

  const filteredTables = tables.filter(t => 
    (t.number || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (t.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
      <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
        
        {/* Main title banner */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-650 rounded-[28px] p-6 text-white min-h-[140px] flex flex-col justify-between shadow-xl shadow-cyan-100 relative overflow-hidden">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <QrCode className="w-48 h-48" />
          </div>
          <span className="bg-white/20 uppercase tracking-widest text-[9px] font-black px-3 py-1 rounded-full w-fit">
            Masaüstü Sifariş və QR Menyu İnteqrasiyası
          </span>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Rəhbərlik QR Kod Portalı</h2>
            <p className="text-xs font-semibold opacity-90 mt-1 max-w-xl">
              Müştərilərin masa başından öz smartfonları ilə QR menyunu açması və birbaşa sifariş verməsi üçün hər masanın xüsusi QR kodunu buradan endirib çap edə bilərsiniz.
            </p>
          </div>
        </div>

        {/* Dynamic Domain/URL Configuration Panel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-cyan-500" />
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">QR Kodların Hədəf Linki Sazlaması</h3>
          </div>
          
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Telefonla QR kodu skan edəndə açılacaq internet ünvanını aşağıdan idarə edin. Əgər proqramı öz fərdi domeninizdə (məsələn: <code className="bg-slate-100 text-cyan-600 px-1.5 py-0.5 rounded font-bold">https://menyu.az</code>) işlədirsinizsə, "Fərdi Link" seçimini aktivləşdirib həmin saytın linkini yazın.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* System URL option */}
            <div 
              onClick={() => handleToggleCustom(false)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                !useCustomUrl 
                  ? 'bg-cyan-50/40 border-cyan-300 shadow-xs' 
                  : 'bg-white border-slate-150 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!useCustomUrl ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300'}`}>
                  {!useCustomUrl && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Cari Sistem Linki (Avtomatik)</h4>
              </div>
              <p className="text-[10px] font-mono text-slate-500 break-all select-all">{systemUrl}</p>
            </div>

            {/* Custom URL option */}
            <div 
              onClick={() => handleToggleCustom(true)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                useCustomUrl 
                  ? 'bg-cyan-50/40 border-cyan-300 shadow-xs' 
                  : 'bg-white border-slate-150 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${useCustomUrl ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300'}`}>
                  {useCustomUrl && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Fərdi Menyu / Vebsayt Linki</h4>
              </div>
              
              <div className="relative mt-2" onClick={e => e.stopPropagation()}>
                <input
                  type="url"
                  placeholder="Məsələn: https://menyu.az/restaurant"
                  value={customUrl}
                  onChange={e => handleCustomUrlChange(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-cyan-500 bg-white"
                />
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5">
                Yazdıqdan sonra aşağıdakı masaların bütün QR kodları avtomatik olaraq bu linkə uyğun yenilənəcəkdir.
              </p>
            </div>
          </div>
        </div>

        {/* QR Printing Guideline Deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-3xs">
            <div className="p-3 bg-cyan-50 text-cyan-500 rounded-xl shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Çap Ölçüsü Tövsiyəsi</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                QR kodları stend və ya masaüstü stikerləri üçün optimal olaraq <b className="text-cyan-600 font-bold">8x8 sm</b> və ya <b className="text-cyan-600 font-bold">10x10 sm</b> ölçüdə çap etməyiniz məsləhətdir.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-3xs">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Daimi Canlı Link</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Hər masanın QR kodu birbaşa həmin masa nömrəsini daxili POS və mətbəx terminalı ilə avtomatik sinxronlaşdırır.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-3xs">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Dizayn və Brendinq</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Yüklənən PNG formatındakı yüksək dəqiqlikli şəkilləri istənilən dizayn proqramına əlavə edib öz loqonuzla bəzəyə bilərsiniz.
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Action bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Masaları axtar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-500 bg-slate-50/50"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
            Cəmi: {filteredTables.length} masa tapıldı
          </p>
        </div>

        {/* QR Code Cards Grid */}
        {filteredTables.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-150 p-12 text-center">
            <p className="text-xs font-bold text-slate-400">Heç bir masa tapılmadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTables.map(table => (
              <TableQRCodeCard key={table.id} table={table} appName={appName} baseUrl={activeBaseUrl} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
