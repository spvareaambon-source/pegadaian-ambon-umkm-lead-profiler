import React, { useState } from 'react';
import { Sparkles, MessageCircle, Copy, Check, Send, Bot, RefreshCw, ChevronRight } from 'lucide-react';
import { BusinessLead } from '../types';
import { getWhatsAppUrl } from '../utils/exporters';

interface AIScriptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: BusinessLead | null;
  onApplyDraftToLead: (leadId: string, updatedDraft: string) => void;
  onCopyText: (text: string, label: string) => void;
}

type ScriptTone = 'friendly' | 'formal' | 'consultative' | 'promo_urgent';

export const AIScriptGeneratorModal: React.FC<AIScriptGeneratorModalProps> = ({
  isOpen,
  onClose,
  lead,
  onApplyDraftToLead,
  onCopyText
}) => {
  const [tone, setTone] = useState<ScriptTone>('consultative');
  const [salesName, setSalesName] = useState('Tim Mikro Pegadaian Ambon');
  const [includeBonus, setIncludeBonus] = useState(true);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  if (!isOpen || !lead) return null;

  // Dynamic template generator mimicking intelligent LLM tailoring
  const generateScript = (selectedTone: ScriptTone): string => {
    const usaha = lead.namaUsaha;
    const kategori = lead.kategoriBisnis;
    const district = lead.wilayahKecamatan;
    const product = lead.rekomendasiProduk;

    const promoBonusText = includeBonus 
      ? "\n*Khusus pekan ini:* Ada benefit program diskon sewa modal & cashback transaksi mikro bagi pelaku usaha terverifikasi di " + district + "."
      : "";

    if (selectedTone === 'friendly') {
      if (product === 'Amanah') {
        return `Halo Kak! Salam hormat dari ${salesName} 😊\n\nWah keren banget perkembangan usaha ${usaha} di ${district}! Kami perhatikan armada operasional dan mobilitas usaha Kakak lagi padat ya.\n\nKebetulan Pegadaian Area Ambon sedang ada program *Pembiayaan Kendaraan Usaha Amanah* (bunga sangat ringan, tenor fleksibel, proses kilat tanpa ribet). Cocok banget buat tambah kendaraan operasional ${usaha}.${promoBonusText}\n\nKira-kira besok ada waktu luang sebentar untuk kami kirimkan simulasi tabel angsurannya via WA Kak? Terima kasih banyak ya Kak! 🙏`;
      } else if (product === 'Cicil Emas') {
        return `Halo Kak! Salam hangat dari ${salesName} ✨\n\nSenang sekali melihat kemajuan usaha ${usaha}! Sebagai pelaku usaha sukses di bidang ${kategori}, pasti penting banget mengamankan cadangan laba operasional dari inflasi.\n\nPegadaian Ambon punya program *Cicil Emas Batangan 24K* yang angsurannya bisa dicadangkan dari sebagian keuntungan harian/mingguan. Emasnya dijamin asli cetakan Antam/UBS.${promoBonusText}\n\nBoleh kami kirimkan brosur tabel cicilan mulai dari 1 gram Kak? Sukses terus untuk ${usaha}! 🌟`;
      } else {
        return `Halo Kak! Salam sukses dari ${salesName} 😊\n\nSemoga operasional ${usaha} di ${district} selalu ramai dan lancar ya! Kami melihat potensi usaha Kakak sangat prospektif untuk ekspansi atau nambah stok barang.\n\nPegadaian Area Ambon siap dukung melalui *Pinjaman Usaha Mikro* dengan proses cepat, plafon fleksibel, dan angsuran terjangkau.${promoBonusText}\n\nJika Kakak berkenan, tim kami siap bantu hitungkan simulasi pinjaman yang paling pas untuk perputaran kas ${usaha}. Terima kasih Kak! 🙏`;
      }
    }

    if (selectedTone === 'formal') {
      return `Selamat siang, Pimpinan / Pengelola ${usaha}.\n\nPerkenalkan kami dari ${salesName}, PT Pegadaian (Persero) Area Ambon. Berdasarkan data pemetaan unit usaha di ${district}, kami mengidentifikasi potensi perkembangan positif pada operasional ${usaha}.\n\nSehubungan dengan hal tersebut, kami menawarkan fasilitas pembiayaan resmi BUMN: *${product}* dengan skema sewa modal kompetitif dan pendampingan finansial terpercaya.${promoBonusText}\n\nApabila Bapak/Ibu membutuhkan informasi lebih rinci mengenai persyaratan administrasi dan simulasi pembiayaan, kami siap berkunjung atau berdiskusi via pesan ini.\n\nAtas perhatian dan kerja sama Bapak/Ibu, kami sampaikan terima kasih.`;
    }

    if (selectedTone === 'promo_urgent') {
      return `🚨 [KABAR BAIK UNTUK ${usaha.toUpperCase()}] 🚨\n\nSalam dari ${salesName}!\nKhusus bulan ini, Pegadaian Area Ambon menyalurkan kuota prioritas pembiayaan *${product}* bagi pelaku usaha kategori ${kategori} di ${district}.\n\n✨ *Keunggulan Kuota Terbatas:* \n• Proses persetujuan cepat (1-2 hari kerja)\n• Sewa modal spesial bagi UMKM lokal Ambon\n• Bebas biaya konsultasi permodalan usaha${promoBonusText}\n\nKuota terbatas hanya untuk 10 UMKM terpilih pekan ini. Balas pesan ini dengan "MAU SIMULASI" agar tim analis kami segera mengirimkan detail plafon untuk ${usaha}. Terima kasih! 🚀`;
    }

    // Default: 'consultative'
    return `Selamat pagi/siang rekan pengusaha di ${usaha}.\n\nPerkenalkan saya dari ${salesName}. Kami memantau perkembangan ${usaha} di ${district} dan mengapresiasi kontribusi Kakak dalam menggerakkan ekonomi lokal Ambon.\n\nDalam rangka mendukung pertumbuhan usaha skala ${kategori}, kami ingin menawarkan solusi permodalan strategis melalui produk *${product} Pegadaian*. Layanan ini dirancang khusus untuk mempermudah likuiditas kas usaha tanpa mengganggu margin laba bulanan.${promoBonusText}\n\nBolehkah kami mengirimkan ringkasan simulasi 1 lembar untuk dipelajari santai terlebih dahulu Kak? Salam sukses selalu untuk ${usaha}!`;
  };

  const [customText, setCustomText] = useState(generateScript(tone));

  const handleToneChange = (newTone: ScriptTone) => {
    setTone(newTone);
    setCustomText(generateScript(newTone));
  };

  const handleCopy = () => {
    onCopyText(customText, 'Draf Outreach WA AI');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyDraftToLead(lead.id, customText);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const waUrl = getWhatsAppUrl(lead.noWhatsApp, customText);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-amber-200">
                  {lead.id}
                </span>
                <span className="text-xs text-emerald-200 font-medium">
                  Rekomendasi: <strong>{lead.rekomendasiProduk}</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                AI Sales Pitch Generator: {lead.namaUsaha}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            ✕ Tutup
          </button>
        </div>

        {/* Form controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Gaya Bahasa / Tone:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'consultative', label: '🤝 Konsultatif' },
                { id: 'friendly', label: '😊 Ramah & Santai' },
                { id: 'formal', label: '👔 Formal & Resmi' },
                { id: 'promo_urgent', label: '⚡ Promo Khusus' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleToneChange(t.id as ScriptTone)}
                  className={`px-2.5 py-1.5 rounded-lg border font-medium text-left transition-all ${
                    tone === t.id
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Pengirim / Sales Officer:
              </label>
              <input
                type="text"
                value={salesName}
                onChange={(e) => setSalesName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 bg-white"
                placeholder="Contoh: Tim Mikro Pegadaian Ambon"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeBonus}
                onChange={(e) => {
                  setIncludeBonus(e.target.checked);
                  // Refresh prompt
                  setTimeout(() => setCustomText(generateScript(tone)), 10);
                }}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-700 font-medium">
                Sertakan hook promo & benefit khusus wilayah {lead.wilayahKecamatan}
              </span>
            </label>
          </div>
        </div>

        {/* Script Content Editor */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Naskah Pesan Siap Kirim (Bisa Diedit Manual):
            </span>
            <span className="text-[11px] text-slate-500">
              {customText.length} karakter
            </span>
          </div>

          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={8}
            className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 font-sans focus:outline-hidden focus:ring-2 focus:ring-emerald-600 leading-relaxed bg-white shadow-inner"
          />
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold shadow-2xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin' : 'Salin Naskah'}
            </button>

            <button
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 hover:bg-emerald-200 text-xs font-bold shadow-2xs transition-colors"
            >
              {applied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {applied ? 'Tersimpan ke Lead' : 'Terapkan ke Lead Ini'}
            </button>
          </div>

          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Buka WhatsApp Sekarang ({lead.noWhatsApp})
            </a>
          ) : (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              Nomor WA belum tersedia di entitas ini
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
