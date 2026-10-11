import React, { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Trash2, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  recoveryAttempted: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      recoveryAttempted: false
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("RestoMaster ErrorBoundary tutulan xəta:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempted: true
    });
  };

  private handleClearStorageQuota = () => {
    try {
      // Auto-prune oversized keys in localStorage
      const keysToPrune = [
        'resto_orderTransactions',
        'resto_inventoryTransactions',
        'resto_auditLogs',
        'resto_kitchenLog'
      ];
      keysToPrune.forEach(k => {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const arr = JSON.parse(val);
            if (Array.isArray(arr) && arr.length > 50) {
              localStorage.setItem(k, JSON.stringify(arr.slice(-50)));
            }
          }
        } catch (e) {
          // ignore
        }
      });
      alert("Yaddaş keşi uğurla optimallaşdırıldı. Tətbiq yenidən açılır.");
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isQuotaError = this.state.error?.name === 'QuotaExceededError' || 
                           (this.state.error?.message && this.state.error.message.includes('quota'));

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans select-none">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Header / Brand */}
            <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white uppercase tracking-wider">
                  Restomaster - Restoran İdarəetmə Sistemi
                </h1>
                <p className="text-xs font-semibold text-slate-400">
                  Təhlükəsizlik və Bərpa Mərkəzi
                </p>
              </div>
            </div>

            {/* Error Body */}
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
                <AlertOctagon className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {isQuotaError ? "Brauzer Yaddaş Limiti Doldu" : "Gözlənilməz Xəta Baş Verdi"}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-2 max-w-md leading-relaxed">
                {isQuotaError 
                  ? "Brauzerin lokal yaddaşı (localStorage) dolduğu üçün əməliyyat dayandırıldı. Məlumatlarınızı optimallaşdırıb dərhal davam edə bilərsiniz."
                  : "İnterfeysdə gözlənilməz bir xəta qeydə alındı. Məlumatlarınız bazada qorunub saxlanılır."}
              </p>

              {this.state.error && (
                <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-left w-full text-xs font-mono text-rose-400 overflow-x-auto">
                  <span className="font-bold text-slate-500 block mb-1">Xəta bildirişi:</span>
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tətbiqi Yenidən Yüklə</span>
              </button>

              {isQuotaError ? (
                <button
                  type="button"
                  onClick={this.handleClearStorageQuota}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4 text-orange-400" />
                  <span>Keşi Təmizlə və Aç</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  <span>Davam Et (Pəncərəni Sıfırla)</span>
                </button>
              )}
            </div>

            {/* Collapsible Tech Stack Trace */}
            {this.state.errorInfo && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-400 flex items-center justify-between w-full cursor-pointer py-1"
                >
                  <span>Texniki diaqnostika məlumatları</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 p-3 bg-slate-950 border border-slate-850 rounded-xl text-[10px] font-mono text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
