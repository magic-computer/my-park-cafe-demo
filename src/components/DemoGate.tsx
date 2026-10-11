import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, ShieldAlert, Mail } from 'lucide-react';

interface DemoGateProps {
  children: React.ReactNode;
}

interface DemoCheckResult {
  active: boolean;
  reason: 'ok' | 'invalid_key' | 'expired' | 'error';
  daysLeft: number;
  label?: string;
}

export const DemoGate: React.FC<DemoGateProps> = ({ children }) => {
  const [status, setStatus] = useState<'loading' | 'active' | 'blocked'>('loading');
  const [result, setResult] = useState<DemoCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');

    if (!key) {
      setStatus('blocked');
      setResult({
        active: false,
        reason: 'invalid_key',
        daysLeft: 0
      });
      return;
    }

    fetch(`/api/check-demo?key=${encodeURIComponent(key)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Server cavab vermədi');
        }
        return res.json();
      })
      .then((data: DemoCheckResult) => {
        setResult(data);
        if (data.active) {
          setStatus('active');
        } else {
          setStatus('blocked');
        }
      })
      .catch((err) => {
        console.error('Demo check error:', err);
        setStatus('blocked');
        setResult({
          active: false,
          reason: 'error',
          daysLeft: 0
        });
        setErrorMessage('Şəbəkə xətası və ya serverə qoşulmaq mümkün olmadı.');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center select-none z-50">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Demo Girişi Yoxlanılır...</p>
      </div>
    );
  }

  if (status === 'blocked' || !result?.active) {
    let title = 'Giriş Qadağandır';
    let desc = 'Bu demo linkinə giriş üçün xüsusi açar tələb olunur.';

    if (result?.reason === 'invalid_key') {
      title = 'Etibarsız Açar';
      desc = 'Daxil etdiyiniz demo açarı yanlışdır və ya sistemdə mövcud deyil.';
    } else if (result?.reason === 'expired') {
      title = 'Demo Müddəti Bitmişdir';
      desc = `"${result.label || 'Bu demo'}" üçün təyin olunmuş sınaq müddəti başa çatmışdır.`;
    } else if (result?.reason === 'error') {
      title = 'Bağlantı Xətası';
      desc = errorMessage || 'Demo statusu yoxlanılarkən xəta baş verdi.';
    }

    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 select-none z-50 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500"></div>
          
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-black text-white tracking-tight uppercase">{title}</h1>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed px-4">{desc}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-left">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
              <Mail className="w-3.5 h-3.5 text-orange-500" />
              <span>Əlaqə və Lisenziya üçün:</span>
            </div>
            <a 
              href="mailto:programistilqar@gmail.com" 
              className="text-xs font-extrabold text-orange-400 hover:text-orange-300 block truncate"
            >
              programistilqar@gmail.com
            </a>
          </div>

          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-2">
            RESTOMASTER ENTERPRISE SYSTEM
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {result.daysLeft <= 3 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 z-50 relative shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Diqqət: Demo müddətinizin bitməsinə {result.daysLeft} gün qaldı! ({result.label})</span>
        </div>
      )}
      {children}
    </>
  );
};
