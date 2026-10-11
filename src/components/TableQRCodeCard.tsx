import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode, Info } from 'lucide-react';
import { Table, TableQRCodeCardProps } from '../types';

export const TableQRCodeCard: React.FC<TableQRCodeCardProps> = ({ table, appName, baseUrl }) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [generatedUrl, setGeneratedUrl] = useState<string>('');

  useEffect(() => {
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const separator = cleanBaseUrl.includes('?') ? '&' : '?';
    const url = `${cleanBaseUrl}${separator}fromQr=true&tableId=${table.id}`;
    setGeneratedUrl(url);

    QRCode.toDataURL(url, {
      width: 500,
      margin: 2,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff'
      }
    })
      .then(urlData => {
        setQrSrc(urlData);
      })
      .catch(err => {
        console.error("QR Code generation error:", err);
      });
  }, [table.id, baseUrl]);

  const handleDownload = () => {
    if (!qrSrc) return;
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `${appName.replace(/\s+/g, '_')}_Masa_${table.number}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-150 p-6 flex flex-col items-center text-center shadow-md hover:shadow-xl transition-all relative overflow-hidden group">
      {/* Decorative Table Tag */}
      <div className="flex justify-between items-center w-full mb-3">
        <span className="bg-orange-50 text-orange-600 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-orange-100">
          Masa #{table.number}
        </span>
        <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
          ID: {table.id}
        </span>
      </div>
      
      {/* Table details */}
      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{table.name}</p>
      <p className="text-[10px] text-slate-400 font-bold mb-4">Masa Tutumu: {table.capacity} nəfər</p>
      
      {/* QR Code Container */}
      <div className="relative p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4 group-hover:bg-white group-hover:border-orange-100 transition-all flex items-center justify-center w-48 h-48">
        {qrSrc ? (
          <img src={qrSrc} alt={`Masa ${table.number} QR`} className="w-full h-full object-contain rounded-lg" />
        ) : (
          <div className="animate-pulse w-full h-full bg-slate-200 rounded-lg flex items-center justify-center">
            <QrCode className="w-8 h-8 text-slate-300" />
          </div>
        )}
      </div>

      {/* Target URL Info */}
      <div className="w-full bg-slate-50 border border-slate-100 p-2 rounded-xl mb-4 text-left">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Skan olunan Link:</p>
        <p className="text-[10px] text-slate-600 font-mono break-all line-clamp-2 select-all leading-tight" title={generatedUrl}>
          {generatedUrl}
        </p>
      </div>

      {/* Download and Action Button */}
      <button
        onClick={handleDownload}
        disabled={!qrSrc}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[11px] uppercase tracking-wider py-3 px-4 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        QR Kodu Yüklə (PNG)
      </button>
    </div>
  );
};
