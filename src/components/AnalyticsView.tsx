import React from 'react';
import { BarChart3, PieChart, TrendingUp, Users, MapPin, ShieldAlert, Award, FileSpreadsheet, Globe, Instagram, Facebook, Video } from 'lucide-react';
import { BusinessLead } from '../types';
import { exportToCSV } from '../utils/exporters';

interface AnalyticsViewProps {
  leads: BusinessLead[];
  onCopyText: (text: string, label: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  leads,
  onCopyText
}) => {
  const totalLeads = leads.length;

  // Breakdown by Platform
  const platformCounts = leads.reduce((acc, lead) => {
    const plat = lead.platformSumber || 'Google Maps';
    acc[plat] = (acc[plat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Breakdown by District
  const districtCounts = leads.reduce((acc, lead) => {
    acc[lead.wilayahKecamatan] = (acc[lead.wilayahKecamatan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Breakdown by Pegadaian Product
  const productCounts = leads.reduce((acc, lead) => {
    acc[lead.rekomendasiProduk] = (acc[lead.rekomendasiProduk] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Breakdown by Category
  const categoryCounts = leads.reduce((acc, lead) => {
    acc[lead.kategoriBisnis] = (acc[lead.kategoriBisnis] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highPriority = leads.filter(l => l.skorKelayakan >= 85).length;
  const mediumPriority = leads.filter(l => l.skorKelayakan >= 75 && l.skorKelayakan < 85).length;
  const standardPriority = leads.filter(l => l.skorKelayakan < 75).length;

  const handleCopyPhoneList = () => {
    const phoneList = leads.map(l => `${l.namaUsaha} [${l.platformSumber || 'Maps'}] (${l.wilayahKecamatan}): ${l.noWhatsApp}`).join('\n');
    onCopyText(phoneList, 'Daftar Kontak WhatsApp UMKM');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Insights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioritas Penetrasi</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {highPriority} <span className="text-xs font-semibold text-slate-500">UMKM ({totalLeads ? Math.round((highPriority/totalLeads)*100) : 0}%)</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Skor kelayakan &ge; 85 dengan arus kas stabil dan reputasi Google Maps terpercaya di Ambon.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Potensi Kredit Mikro</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {(productCounts['Pinjaman Usaha'] || 0)} <span className="text-xs font-semibold text-slate-500">Pipeline Modal Usaha</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Entitas sektor ritel, perdagangan sembako, apotek, dan bengkel siap penawaran KUR/Kupedes.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pembiayaan Armada</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-800 mt-2">
            {(productCounts['Amanah'] || 0)} <span className="text-xs font-semibold text-slate-500">Kendaraan Niaga</span>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Kebutuhan mobil pick up, mobil box catering, dan motor operasional UMKM Kota Ambon.
          </p>
        </div>

      </div>

      {/* Multi-Platform Distribution Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3.5">
          <Globe className="w-4 h-4 text-emerald-700" />
          Cakupan Multi-Platform (Google Maps, TikTok, Instagram & Facebook)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950">Google Maps</span>
              <MapPin className="w-4 h-4 text-teal-700" />
            </div>
            <div className="text-xl font-black text-teal-950 mt-1.5">
              {platformCounts['Google Maps'] || 0} <span className="text-[10px] text-teal-700 font-normal">entitas</span>
            </div>
            <span className="text-[10px] text-teal-700 mt-1">Toko fisik & rating publik</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950">Instagram</span>
              <Instagram className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-950 mt-1.5">
              {platformCounts['Instagram'] || 0} <span className="text-[10px] text-rose-700 font-normal">akun</span>
            </div>
            <span className="text-[10px] text-rose-700 mt-1">Online shop & cafe hits</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 text-white border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">TikTok</span>
              <Video className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-xl font-black text-white mt-1.5">
              {platformCounts['TikTok'] || 0} <span className="text-[10px] text-slate-400 font-normal">kreator/toko</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Viral marketing & live selling</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950">Facebook</span>
              <Facebook className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-blue-950 mt-1.5">
              {platformCounts['Facebook'] || 0} <span className="text-[10px] text-blue-700 font-normal">halaman</span>
            </div>
            <span className="text-[10px] text-blue-700 mt-1">Komunitas niaga & jasa Ambon</span>
          </div>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* District Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-emerald-700" />
            Distribusi UMKM Menurut Kecamatan Kota Ambon
          </h3>
          <div className="space-y-3">
            {Object.entries(districtCounts).sort((a, b) => b[1] - a[1]).map(([district, count]) => {
              const pct = totalLeads ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={district}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{district}</span>
                    <span className="font-bold text-slate-900">{count} usaha ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-700 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Recommendation Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-emerald-700" />
            Distribusi Kesesuaian Produk Pegadaian
          </h3>
          <div className="space-y-4">
            
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <div className="flex justify-between items-center text-xs font-bold text-blue-950">
                <span>Pegadaian Amanah (Kendaraan Operasional)</span>
                <span className="text-sm font-black text-blue-900">{productCounts['Amanah'] || 0} Leads</span>
              </div>
              <p className="text-[11px] text-blue-800 mt-1">
                Target: Bengkel, catering, kontraktor, distribusi perikanan Galala, dan logistik Halong.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <div className="flex justify-between items-center text-xs font-bold text-amber-950">
                <span>Pinjaman Usaha (Modal Kerja & Stok)</span>
                <span className="text-sm font-black text-amber-900">{productCounts['Pinjaman Usaha'] || 0} Leads</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Target: Toko sembako, kelontong, toko bangunan Waiheru, apotek, dan percetakan.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-950">
                <span>Cicil Emas Pegadaian (Hedging & Likuiditas)</span>
                <span className="text-sm font-black text-emerald-900">{productCounts['Cicil Emas'] || 0} Leads</span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1">
                Target: Cafe & resto hits, klinik dokter, dan usaha bermarjin laba tinggi di pusat kota.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Batch Operations Bar */}
      <div className="bg-gradient-to-r from-[#04281f] via-[#063b2e] to-[#04281f] text-white p-5 rounded-2xl border border-emerald-800/60 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">
            Peralatan Operasional Tim Sales & Mikro Pegadaian Ambon
          </h4>
          <p className="text-xs text-emerald-200/90 mt-0.5">
            Ekspor dataset lengkap ke spreadsheet atau salin nomor kontak untuk broadcast resmi Pegadaian.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyPhoneList}
            className="px-4 py-2 bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-600/50 rounded-xl text-xs font-bold text-white transition-all shadow-xs"
          >
            Salin Nomor WhatsApp ({totalLeads})
          </button>
          
          <button
            onClick={() => exportToCSV(leads)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

    </div>
  );
};
