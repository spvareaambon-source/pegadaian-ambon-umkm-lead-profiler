import React from 'react';
import { Database, ShieldCheck, Sparkles, Building2, LogIn, LogOut, UserCheck, Cloud } from 'lucide-react';
import { BusinessLead } from '../types';
import { User } from 'firebase/auth';
import { DailyOutreachGoal } from './DailyOutreachGoal';

interface HeaderProps {
  leads: BusinessLead[];
  onTriggerFullScan: () => void;
  isExtracting: boolean;
  currentUser?: User | null;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
  isSyncingCloud?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  leads,
  onTriggerFullScan,
  isExtracting,
  currentUser,
  onSignInWithGoogle,
  onSignOut,
  isSyncingCloud
}) => {
  const countAmanah = leads.filter(l => l.rekomendasiProduk === 'Amanah').length;
  const countPinjamanUsaha = leads.filter(l => l.rekomendasiProduk === 'Pinjaman Usaha').length;
  const countCicilEmas = leads.filter(l => l.rekomendasiProduk === 'Cicil Emas').length;
  const avgScore = leads.length > 0
    ? Math.round(leads.reduce((acc, l) => acc + l.skorKelayakan, 0) / leads.length)
    : 0;

  return (
    <header className="bg-gradient-to-b from-[#04281f] via-[#063b2e] to-[#04281f] text-white border-b border-emerald-900/60 shadow-lg relative overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 left-10 w-80 h-28 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Corporate Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center shadow-md border border-emerald-400/30 shrink-0">
              <Building2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-[11px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                  PT Pegadaian (Persero)
                </span>
                <span className="text-xs text-emerald-100 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Area Maluku
                </span>
                {isSyncingCloud && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-950/90 text-teal-300 border border-teal-700/60 flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-teal-400 animate-pulse" />
                    Sinkronisasi Cloud
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-1">
                Direktori & Profiler Prospek UMKM
              </h1>
              <p className="text-xs text-emerald-200/80">
                Pemetaan Potensi Usaha & Rekomendasi Pembiayaan PT Pegadaian
              </p>
            </div>
          </div>

          {/* Supervisor & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Google Authentication Status / Button */}
            {currentUser ? (
              <div className="flex items-center gap-2.5 bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-800/60 backdrop-blur-xs">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'User'} 
                    className="w-7 h-7 rounded-full border border-emerald-400 shadow-2xs" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-xs">
                    {(currentUser.displayName || currentUser.email || 'P')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-bold text-white leading-tight">
                    {currentUser.displayName || 'Petugas Pegadaian'}
                  </div>
                  <div className="text-[10px] text-emerald-300/80 font-mono truncate max-w-[150px]">
                    {currentUser.email}
                  </div>
                </div>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-1 hover:bg-emerald-900/80 rounded-lg text-emerald-300 hover:text-rose-300 transition-colors ml-1"
                    title="Keluar / Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : onSignInWithGoogle ? (
              <button
                type="button"
                onClick={onSignInWithGoogle}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-900 font-bold text-xs shadow-sm transition-all active:scale-95 border border-slate-200"
                title="Masuk dengan Akun Google untuk sinkronisasi data"
              >
                <LogIn className="w-4 h-4 text-emerald-700" />
                <span>Masuk Akun</span>
              </button>
            ) : (
              <div className="text-left md:text-right hidden sm:block">
                <div className="text-[11px] text-emerald-200/70 font-medium">Supervisor:</div>
                <div className="text-xs text-white font-mono bg-emerald-950/70 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                  spvareaambon@gmail.com
                </div>
              </div>
            )}

            <button
              id="btn-full-scan"
              onClick={onTriggerFullScan}
              disabled={isExtracting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 border border-emerald-400/40"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isExtracting ? 'animate-spin' : ''}`} />
              <span>{isExtracting ? 'Memindai...' : 'Pindai Wilayah'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar & Daily Outreach Goal */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-emerald-900/50">
          
          {/* Daily Outreach Goal Progress Tracker */}
          <div className="lg:col-span-2">
            <DailyOutreachGoal leads={leads} currentUser={currentUser} />
          </div>

          {/* Quick Metrics Grid */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#031d16]/80 rounded-xl p-3 border border-emerald-900/60 flex flex-col justify-between shadow-2xs">
              <div className="text-xs text-emerald-200/80 font-medium flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Total UMKM
              </div>
              <div>
                <div className="text-xl font-black text-white mt-1">
                  {leads.length}
                </div>
                <div className="text-[10px] text-emerald-300/70 font-medium">Entitas Terdata</div>
              </div>
            </div>

            <div className="bg-[#031d16]/80 rounded-xl p-3 border border-emerald-900/60 flex flex-col justify-between shadow-2xs">
              <div className="text-xs text-emerald-200/80 font-medium">
                Amanah
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {countAmanah}
                </div>
                <div className="text-[10px] text-emerald-300/70 font-medium">Kendaraan / Pick Up</div>
              </div>
            </div>

            <div className="bg-[#031d16]/80 rounded-xl p-3 border border-emerald-900/60 flex flex-col justify-between shadow-2xs">
              <div className="text-xs text-emerald-200/80 font-medium">
                Pinjaman Usaha
              </div>
              <div>
                <div className="text-xl font-black text-amber-400 mt-1">
                  {countPinjamanUsaha}
                </div>
                <div className="text-[10px] text-emerald-300/70 font-medium">Modal Kerja / KUR</div>
              </div>
            </div>

            <div className="bg-[#031d16]/80 rounded-xl p-3 border border-emerald-900/60 flex flex-col justify-between shadow-2xs">
              <div className="text-xs text-emerald-200/80 font-medium">
                Cicil Emas
              </div>
              <div>
                <div className="text-xl font-black text-yellow-300 mt-1">
                  {countCicilEmas}
                </div>
                <div className="text-[10px] text-emerald-300/70 font-medium">Rata-rata: {avgScore} pts</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

