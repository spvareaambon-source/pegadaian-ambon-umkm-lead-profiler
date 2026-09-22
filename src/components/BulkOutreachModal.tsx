import React, { useState } from 'react';
import { Send, CheckCircle2, Clock, Phone, AlertCircle, MessageSquare, ExternalLink, ChevronRight, Pause, Check } from 'lucide-react';
import { BusinessLead } from '../types';
import { getWhatsAppUrl, isMobilePhone } from '../utils/exporters';

interface BulkOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: BusinessLead[];
  onUpdateLeadStatus: (leadId: string, newStatus: 'Belum Dihubungi' | 'Terkirim' | 'Merespon' | 'Closing') => void;
  onCopyText: (text: string, label: string) => void;
}

export const BulkOutreachModal: React.FC<BulkOutreachModalProps> = ({
  isOpen,
  onClose,
  leads,
  onUpdateLeadStatus,
  onCopyText
}) => {
  // Filter only leads that have mobile numbers
  const validLeads = leads.filter(l => isMobilePhone(l.noWhatsApp));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentLeadIds, setSentLeadIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const currentLead = validLeads[currentIndex];

  const handleMarkSentAndNext = () => {
    if (!currentLead) return;
    setSentLeadIds(prev => new Set(prev).add(currentLead.id));
    onUpdateLeadStatus(currentLead.id, 'Terkirim');
    if (currentIndex < validLeads.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const currentWaUrl = currentLead
    ? getWhatsAppUrl(currentLead.noWhatsApp, currentLead.drafPesanWAPertama)
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Send className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Outreach Dispatcher
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {sentLeadIds.size} dari {validLeads.length} terkirim
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                Mode Kirim WhatsApp Semi-Otomatis (Aman dari Blokir Anti-Spam)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            ✕ Selesai
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 h-1.5">
          <div
            className="bg-emerald-600 h-1.5 transition-all duration-300"
            style={{ width: `${validLeads.length > 0 ? (sentLeadIds.size / validLeads.length) * 100 : 0}%` }}
          />
        </div>

        {/* Body */}
        {validLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada nomor WhatsApp seluler yang valid di filter saat ini.</p>
            <p className="text-xs text-slate-500 mt-1">Coba sesuaikan filter pencarian atau pilih kategori lain.</p>
          </div>
        ) : (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            
            {/* Step Counter & Business Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                    Lead #{currentIndex + 1} / {validLeads.length}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    Produk: {currentLead.rekomendasiProduk}
                  </span>
                  <span className="text-xs text-slate-500">
                    Skor: <strong>{currentLead.skorKelayakan}</strong>
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mt-1">
                  {currentLead.namaUsaha}
                </h4>
                <p className="text-xs text-slate-600">
                  {currentLead.wilayahKecamatan} • {currentLead.kategoriBisnis} • WA: <strong className="text-slate-900">{currentLead.noWhatsApp}</strong>
                </p>
              </div>

              {/* Status pill */}
              <div className="text-right shrink-0">
                {sentLeadIds.has(currentLead.id) ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Pesan Dikirim
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Siap Dikirim
                  </span>
                )}
              </div>
            </div>

            {/* Draf Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Pratinjau Pesan yang Akan Dikirim:
                </span>
                <button
                  type="button"
                  onClick={() => onCopyText(currentLead.drafPesanWAPertama, 'Pesan WhatsApp')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Salin Teks Saja
                </button>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                {currentLead.drafPesanWAPertama}
              </div>
            </div>

            {/* Anti-Spam Safety Advice */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
              <span className="font-bold text-amber-700">Safety Tip:</span>
              <span>
                Metode semi-otomatis ini membuka WhatsApp resmi per prospek sehingga nomor sales Anda tidak terdeteksi bot spam oleh algoritma Meta WhatsApp.
              </span>
            </div>

          </div>
        )}

        {/* Footer controls */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(validLeads.length - 1, prev + 1))}
              disabled={currentIndex >= validLeads.length - 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              Berikutnya →
            </button>
          </div>

          {currentLead && (
            <div className="flex items-center gap-2">
              <a
                href={currentWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleMarkSentAndNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                Buka WA & Lanjut ke Antrian Berikutnya ({currentIndex + 1}/{validLeads.length})
              </a>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
