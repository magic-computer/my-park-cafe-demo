import React, { useState } from 'react';
import { Save, Lock, Shield, Package } from 'lucide-react';
import { AdminSecurityTabProps } from '../types';
import { setPasswordSecure, clearSessionToken } from '../utils/authUtils';

export const AdminSecurityTab: React.FC<AdminSecurityTabProps> = ({
  adminPassword,
  setAdminPassword,
  setIsAdminUnlocked,
  addAuditLog
}) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errMessage, setErrMessage] = useState('');
  const [sucMessage, setSucMessage] = useState('');

  const [newInvPass, setNewInvPass] = useState('');
  const [confirmInvPass, setConfirmInvPass] = useState('');
  const [invErrMessage, setInvErrMessage] = useState('');
  const [invSucMessage, setInvSucMessage] = useState('');

  const handleUpdateAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage('');
    setSucMessage('');

    if (!newPass) {
      setErrMessage('Şifrə boş ola bilməz!');
      return;
    }
    if (newPass.length < 3) {
      setErrMessage('Şifrə ən azı 3 simvoldan ibarət olmalıdır!');
      return;
    }
    if (newPass !== confirmPass) {
      setErrMessage('Yeni şifrə və təkrarı uyğun gəlmir!');
      return;
    }

    // Update securely via IPC hash vault
    setPasswordSecure(newPass, 'admin').then(() => {
      localStorage.removeItem('resto_adminPassword');
      setAdminPassword('***');
      setSucMessage('Təbriklər! Admin şifrəsi təhlükəsiz şəkildə dəyişdirildi.');
      addAuditLog("Admin Şifrəsi Yeniləndi", "Təhlükəsizlik", "Sistem admin idarəçi giriş şifrəsi müvəffəqiyyətlə dəyişdirildi.", "info");
      setNewPass('');
      setConfirmPass('');
    }).catch(err => {
      setErrMessage('Şifrə yenilənərkən xəta baş verdi: ' + (err?.message || err));
    });
  };

  const handleUpdateInventoryPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setInvErrMessage('');
    setInvSucMessage('');

    if (!newInvPass) {
      setInvErrMessage('Şifrə boş ola bilməz!');
      return;
    }
    if (newInvPass.length < 3) {
      setInvErrMessage('Şifrə ən azı 3 simvoldan ibarət olmalıdır!');
      return;
    }
    if (newInvPass !== confirmInvPass) {
      setInvErrMessage('Yeni şifrə və təkrarı uyğun gəlmir!');
      return;
    }

    setPasswordSecure(newInvPass, 'inventory').then(() => {
      setInvSucMessage('Təbriklər! Anbar deposu şifrəsi təhlükəsiz şəkildə dəyişdirildi.');
      addAuditLog("Anbar Şifrəsi Yeniləndi", "Təhlükəsizlik", "Anbar stok deposu giriş şifrəsi müvəffəqiyyətlə dəyişdirildi.", "info");
      setNewInvPass('');
      setConfirmInvPass('');
    }).catch(err => {
      setInvErrMessage('Şifrə yenilənərkən xəta baş verdi: ' + (err?.message || err));
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200 font-sans">
      <div className="md:col-span-2 space-y-6">
        <form onSubmit={handleUpdateAdminPassword} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">
                Admin Şifrəsini Yenilə
              </h4>
              <p className="text-xs text-slate-400">
                Sistem İdarəetmə Panelinin giriş parolu. Varsayılan parol <strong className="text-orange-500">admin</strong> rəmzidir.
              </p>
            </div>
          </div>

          {errMessage && (
            <div className="p-3.5 bg-red-50 text-red-600 border border-red-150 rounded-2xl text-xs font-bold leading-relaxed animate-in zoom-in-95 duration-155 font-sans">
              ⚠ {errMessage}
            </div>
          )}

          {sucMessage && (
            <div className="p-3.5 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-2xl text-xs font-bold leading-relaxed animate-in zoom-in-95 duration-155 font-sans">
              ✓ {sucMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                YENİ ADMİN ŞİFRƏSİ
              </label>
              <input 
                type="text"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Yeni şifrənizi yazın..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                ŞİFRƏNİN TƏKRARI
              </label>
              <input 
                type="text"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Yeni şifrəni təkrar yazın..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black tracking-widest uppercase px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            ŞİFRƏNİ YADDA SAXLA
          </button>
        </form>

        {/* Anbar Deposu Şifrəsini Yenilə Form */}
        <form onSubmit={handleUpdateInventoryPassword} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-800 uppercase tracking-wider">
                Anbar Deposu Şifrəsini Yenilə
              </h4>
              <p className="text-xs text-slate-400">
                Anbar Stok Deposu bölməsinin giriş parolu. Varsayılan standart parol <strong className="text-amber-500">anbar</strong> rəmzidir.
              </p>
            </div>
          </div>

          {invErrMessage && (
            <div className="p-3.5 bg-red-50 text-red-600 border border-red-150 rounded-2xl text-xs font-bold leading-relaxed animate-in zoom-in-95 duration-155 font-sans">
              ⚠ {invErrMessage}
            </div>
          )}

          {invSucMessage && (
            <div className="p-3.5 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-2xl text-xs font-bold leading-relaxed animate-in zoom-in-95 duration-155 font-sans">
              ✓ {invSucMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                YENİ ANBAR ŞİFRƏSİ
              </label>
              <input 
                type="text"
                value={newInvPass}
                onChange={e => setNewInvPass(e.target.value)}
                placeholder="Yeni şifrənizi yazın (məs: anbar)..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                ŞİFRƏNİN TƏKRARI
              </label>
              <input 
                type="text"
                value={confirmInvPass}
                onChange={e => setConfirmInvPass(e.target.value)}
                placeholder="Yeni şifrəni təkrar yazın..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black tracking-widest uppercase px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
          >
            <Save className="w-4 h-4 text-amber-400" />
            ANBAR ŞİFRƏSİNİ YADDA SAXLA
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white space-y-4 shadow-md flex flex-col justify-between font-sans">
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4 shrink-0 animate-pulse text-orange-400" />
              Sessiyanı dərhal kilidlə
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              Ekranda işinizi bitirdikdən sonra təhlükəsizlik məqsədilə admin panelini dərhal kilidləyə bilərsiniz. Giriş etmək üçün yenidən parol daxil edilməsi tələb olunacaqdır.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              clearSessionToken('admin');
              setIsAdminUnlocked(false);
              addAuditLog("Admin Kilidləndi", "Kassa", "İdarəçi admin paneli sessiyadan çıxış edərək dərhal kilidləndi.", "info");
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-black tracking-widest uppercase py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4 font-sans"
          >
            <Lock className="w-4 h-4 shrink-0" />
            PANELİ KİLİDLƏ
          </button>
        </div>
      </div>
    </div>
  );
};
