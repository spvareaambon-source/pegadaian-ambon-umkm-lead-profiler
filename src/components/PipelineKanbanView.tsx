import React from 'react';
import { Kanban, MessageSquare, Phone, CheckCircle, Check, ArrowRight, UserCheck, Calendar, Sparkles } from 'lucide-react';
import { BusinessLead } from '../types';
import { getWhatsAppUrl } from '../utils/exporters';
import { buildProfessionalWhatsAppMessage } from '../data/pegadaianBrochures';

interface PipelineKanbanViewProps {
  leads: BusinessLead[];
  onSelectLead: (lead: BusinessLead) => void;
  onUpdateStatus: (leadId: string, status: 'Belum Dihubungi' | 'Terkirim' | 'Merespon' | 'Closing') => void;
  onOpenAIScript: (lead: BusinessLead) => void;
}

const COLUMNS: Array<{
  id: 'Belum Dihubungi' | 'Terkirim' | 'Merespon' | 'Closing';
  title: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  description: string;
}> = [
  {
    id: 'Belum Dihubungi',
    title: 'Prospek Baru (Cold)',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    accentBorder: 'border-slate-300',
    description: 'Hasil ekstraksi belum dikontak'
  },
  {
    id: 'Terkirim',
    title: 'Pesan Terkirim (Outreach)',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    accentBorder: 'border-sky-300',
    description: 'Sudah diapproach via WA'
  },
  {
    id: 'Merespon',
    title: 'Merespon / Minat (Warm)',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    accentBorder: 'border-amber-300',
    description: 'Diskusi tabel angsuran/syarat'
  },
  {
    id: 'Closing',
    title: 'Deal / Pengajuan (Won)',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    accentBorder: 'border-emerald-400',
    description: 'Siap akad atau cair di Pegadaian'
  }
];

export const PipelineKanbanView: React.FC<PipelineKanbanViewProps> = ({
  leads,
  onSelectLead,
  onUpdateStatus,
  onOpenAIScript
}) => {
  return (
    <div className="space-y-4">
      
      {/* Subheader info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0">
            <Kanban className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Pipeline CRM & Siklus Interaksi Wilayah Ambon
            </h3>
            <p className="text-xs text-slate-500">
              Pantau alur konversi prospek UMKM dari kontak awal hingga realisasi produk Pegadaian.
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-700 font-semibold bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shrink-0">
          Total Prospek: <strong className="text-emerald-950 text-sm font-bold">{leads.length}</strong> entitas
        </div>
      </div>

      {/* 4 Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const columnLeads = leads.filter(l => (l.statusKontak || 'Belum Dihubungi') === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-50/90 rounded-2xl border border-slate-200/80 flex flex-col min-h-[520px] overflow-hidden shadow-2xs"
            >
              {/* Column Header */}
              <div className={`p-3.5 bg-white border-b ${col.accentBorder} flex items-center justify-between`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{col.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${col.badgeBg} ${col.badgeText} border border-slate-200/50`}>
                      {columnLeads.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{col.description}</p>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {columnLeads.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center p-4 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                    <span className="text-xs font-medium">Belum ada prospek</span>
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const profData = buildProfessionalWhatsAppMessage({
                      businessName: lead.namaUsaha,
                      product: lead.rekomendasiProduk,
                      district: lead.wilayahKecamatan,
                      category: lead.kategoriBisnis,
                      rating: lead.ratingMaps
                    });
                    const waUrl = getWhatsAppUrl(lead.noWhatsApp, profData.messageText);

                    return (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200/90 hover:border-emerald-500 hover:shadow-sm transition-all flex flex-col justify-between gap-3 group"
                      >
                        {/* Top: ID & Product Tag */}
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
                              {lead.id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              lead.rekomendasiProduk === 'Amanah' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              lead.rekomendasiProduk === 'Pinjaman Usaha' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                              'bg-yellow-50 text-yellow-900 border border-yellow-200'
                            }`}>
                              {lead.rekomendasiProduk}
                            </span>
                          </div>

                          <h4
                            onClick={() => onSelectLead(lead)}
                            className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 cursor-pointer line-clamp-2 leading-snug transition-colors"
                          >
                            {lead.namaUsaha}
                          </h4>
                          
                          <p className="text-[11px] text-slate-500 mt-1 truncate">
                            {lead.wilayahKecamatan} • {lead.kategoriBisnis}
                          </p>

                          {/* Contact snippet */}
                          <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                            <span className="text-slate-600 font-mono text-[10px]">
                              {lead.noWhatsApp || lead.noTeleponMaps || 'No telp (-) '}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Skor: {lead.skorKelayakan}
                            </span>
                          </div>

                          {/* Custom sales notes if present */}
                          {lead.catatanSales && (
                            <div className="mt-2 bg-amber-50/80 border border-amber-200/90 rounded-lg p-2 text-[10px] text-amber-900 leading-relaxed">
                              <strong>Catatan:</strong> {lead.catatanSales}
                            </div>
                          )}
                        </div>

                        {/* Card Action Toolbar */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                          
                          <div className="flex items-center gap-1">
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat WhatsApp Langsung"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenAIScript(lead)}
                              title="Buat Naskah AI Khusus"
                              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectLead(lead)}
                              title="Buka Detail Lengkap"
                              className="text-[10px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                              Detail
                            </button>
                          </div>

                          {/* Move to next stage quick button */}
                          <div className="flex items-center gap-0.5">
                            {col.id === 'Belum Dihubungi' && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(lead.id, 'Terkirim')}
                                className="text-[10px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg border border-sky-200/80 flex items-center gap-0.5 transition-colors"
                                title="Tandai Sudah Terkirim"
                              >
                                Terkirim →
                              </button>
                            )}
                            {col.id === 'Terkirim' && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(lead.id, 'Merespon')}
                                className="text-[10px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200/80 flex items-center gap-0.5 transition-colors"
                                title="Tandai Merespon"
                              >
                                Merespon →
                              </button>
                            )}
                            {col.id === 'Merespon' && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(lead.id, 'Closing')}
                                className="text-[10px] font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200/80 flex items-center gap-0.5 transition-colors"
                                title="Tandai Closing"
                              >
                                Deal 🎉
                              </button>
                            )}
                            {col.id === 'Closing' && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg flex items-center gap-1">
                                <Check className="w-3 h-3" /> Won
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
