import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  Info,
  Building2,
  Send,
  HelpCircle,
  X
} from 'lucide-react';
import { BusinessLead } from '../types';
import {
  getMasterTemplates,
  saveMasterTemplates,
  resetMasterTemplates,
  renderMasterTemplateText,
  AVAILABLE_PLACEHOLDERS,
  MasterTemplatesMap,
  DEFAULT_MASTER_TEMPLATES,
  MASTER_TEMPLATES_EVENT
} from '../data/masterTemplates';
import { User } from 'firebase/auth';

interface MasterMessageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: BusinessLead[];
  onApplyToAllLeads?: (updatedLeads: BusinessLead[]) => void;
  onCopyNotice: (text: string, label: string) => void;
  currentUser?: User | null;
  initialProduct?: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah';
}

export const MasterMessageManagerModal: React.FC<MasterMessageManagerModalProps> = ({
  isOpen,
  onClose,
  leads,
  onApplyToAllLeads,
  onCopyNotice,
  currentUser,
  initialProduct = 'Cicil Emas'
}) => {
  const [selectedProduct, setSelectedProduct] = useState<'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah'>(initialProduct);
  const [templates, setTemplates] = useState<MasterTemplatesMap>(getMasterTemplates());
  const [activeText, setActiveText] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [autoSaveBadge, setAutoSaveBadge] = useState<boolean>(false);
  const [previewLeadId, setPreviewLeadId] = useState<string>('');

  // Sync templates only when modal opens
  useEffect(() => {
    if (isOpen) {
      const current = getMasterTemplates();
      setTemplates(current);
      setActiveText(current[selectedProduct] || DEFAULT_MASTER_TEMPLATES[selectedProduct]);
      
      // Default preview lead matching the selected product if possible
      const match = leads.find(l => l.rekomendasiProduk === selectedProduct) || leads[0];
      if (match) {
        setPreviewLeadId(match.id);
      }
    }
  }, [isOpen]);

  // Handle text edit with instant auto-persistence so changes are never lost even if modal closes
  const handleTextChange = (newVal: string) => {
    setActiveText(newVal);
    // Persist immediately as default master template
    const updated = saveMasterTemplates({
      [selectedProduct]: newVal
    });
    setTemplates(updated);
    setAutoSaveBadge(true);
  };

  // When changing product tab, persist current product first
  const handleProductChange = (prod: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah') => {
    if (activeText && activeText.trim()) {
      saveMasterTemplates({
        [selectedProduct]: activeText
      });
    }
    setSelectedProduct(prod);
    const current = getMasterTemplates();
    setTemplates(current);
    setActiveText(current[prod] || DEFAULT_MASTER_TEMPLATES[prod]);
    const match = leads.find(l => l.rekomendasiProduk === prod) || leads[0];
    if (match) {
      setPreviewLeadId(match.id);
    }
    setSavedSuccess(false);
  };

  // Safe close ensuring latest edits are committed
  const handleCloseModal = () => {
    if (activeText && activeText.trim()) {
      const updated = saveMasterTemplates({
        [selectedProduct]: activeText
      });
      setTemplates(updated);

      // Also propagate to leads with this product if callback exists
      if (onApplyToAllLeads && leads.length > 0) {
        const officerName = currentUser?.displayName || 'Relationship Officer PT Pegadaian Area Maluku';
        const newLeads = leads.map(lead => {
          if (lead.rekomendasiProduk === selectedProduct) {
            const newDraft = renderMasterTemplateText(activeText, {
              businessName: lead.namaUsaha,
              product: lead.rekomendasiProduk,
              district: lead.wilayahKecamatan,
              category: lead.kategoriBisnis,
              rating: lead.ratingMaps,
              phone: lead.noWhatsApp,
              salesOfficerName: officerName
            });
            return { ...lead, drafPesanWAPertama: newDraft };
          }
          return lead;
        });
        onApplyToAllLeads(newLeads);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentPreviewLead = leads.find(l => l.id === previewLeadId) || leads[0];

  const handleSaveCurrent = () => {
    const updated = saveMasterTemplates({
      [selectedProduct]: activeText
    });
    setTemplates(updated);
    setSavedSuccess(true);
    setAutoSaveBadge(true);
    onCopyNotice(`Master Pesan ${selectedProduct}`, 'Tersimpan Permanen sebagai Default');
    setTimeout(() => setSavedSuccess(false), 4000);

    // If onApplyToAllLeads is provided, update all leads' draft
    if (onApplyToAllLeads && leads.length > 0) {
      const officerName = currentUser?.displayName || 'Relationship Officer PT Pegadaian Area Maluku';
      const newLeads = leads.map(lead => {
        if (lead.rekomendasiProduk === selectedProduct) {
          const newDraft = renderMasterTemplateText(activeText, {
            businessName: lead.namaUsaha,
            product: lead.rekomendasiProduk,
            district: lead.wilayahKecamatan,
            category: lead.kategoriBisnis,
            rating: lead.ratingMaps,
            phone: lead.noWhatsApp,
            salesOfficerName: officerName
          });
          return { ...lead, drafPesanWAPertama: newDraft };
        }
        return lead;
      });
      onApplyToAllLeads(newLeads);
    }
  };

  const handleResetCurrent = () => {
    if (confirm(`Kembalikan Master Pesan untuk produk "${selectedProduct}" ke format resmi Pegadaian default?`)) {
      const updated = resetMasterTemplates(selectedProduct);
      setTemplates(updated);
      setActiveText(updated[selectedProduct]);
      setSavedSuccess(true);
      onCopyNotice(`Master Pesan ${selectedProduct}`, 'Dikembalikan ke Standar Resmi');
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleInsertTag = (tag: string) => {
    setActiveText(prev => prev + ' ' + tag);
  };

  // Render live preview
  const livePreviewText = currentPreviewLead
    ? renderMasterTemplateText(activeText, {
        businessName: currentPreviewLead.namaUsaha,
        product: selectedProduct,
        district: currentPreviewLead.wilayahKecamatan,
        category: currentPreviewLead.kategoriBisnis,
        rating: currentPreviewLead.ratingMaps,
        phone: currentPreviewLead.noWhatsApp,
        salesOfficerName: currentUser?.displayName || 'Relationship Officer PT Pegadaian Area Maluku'
      })
    : activeText;

  const countLeadsForThisProduct = leads.filter(l => l.rekomendasiProduk === selectedProduct).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shadow-inner">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Master Template WhatsApp
                </span>
                <span className="text-[10px] font-mono bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded">
                  Dinamis & Otomatis
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                Pusat Pengaturan Master Pesan Rekomendasi Produk Pegadaian
              </h3>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Tutup</span>
          </button>
        </div>

        {/* Informative Guidance Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-900 flex items-start gap-2.5 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong>Tersimpan Permanen Otomatis:</strong> Setiap kali Anda menyunting teks di bawah, perubahan akan <strong>langsung menjadi Master Pesan Default Anda</strong> dan tidak akan kembali ke teks awal meski jendela ditutup, kecuali jika Anda menyuntingnya lagi atau menekan tombol Reset.
          </div>
        </div>

        {/* Product Selector Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 border-b border-slate-200 shrink-0 overflow-x-auto">
          <span className="text-xs font-bold text-slate-700 mr-1 shrink-0">
            Pilih Produk Rekomendasi:
          </span>
          {(['Cicil Emas', 'Pinjaman Usaha', 'Amanah'] as const).map(prod => {
            const count = leads.filter(l => l.rekomendasiProduk === prod).length;
            const isSelected = selectedProduct === prod;
            return (
              <button
                key={prod}
                type="button"
                onClick={() => handleProductChange(prod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{prod}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count} prospek
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Workspace (Editor + Live Preview Split) */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Template Editor */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            
            {/* Tag Buttons to insert dynamic variables */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1 text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Klik Tag untuk Menyisipkan Variabel Dinamis:
                </span>
                <span className="text-[10px] text-slate-500">
                  Akan diganti otomatis per usaha
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_PLACEHOLDERS.map(p => (
                  <button
                    key={p.tag}
                    type="button"
                    onClick={() => handleInsertTag(p.tag)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-400 text-[11px] font-mono font-semibold transition-all shadow-2xs active:scale-95"
                    title={`${p.desc} (Contoh: ${p.example})`}
                  >
                    <span className="text-emerald-600 font-bold">+</span>
                    <span>{p.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Master Template Textarea */}
            <div className="flex-1 flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <span>Draf Master Pesan ({selectedProduct}):</span>
                  {autoSaveBadge && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Tersimpan sebagai Default
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeText.length} karakter
                </span>
              </div>
              <textarea
                value={activeText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={14}
                className="w-full flex-1 bg-white border-2 border-emerald-600/70 focus:border-emerald-600 rounded-xl p-3.5 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-400/50 shadow-inner"
                placeholder="Ketik draf master pesan Anda di sini..."
              />
            </div>

            {/* Bottom Actions for Editor */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleResetCurrent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
                title="Reset kembali ke teks standar bawaan Pegadaian"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset ke Standar Pegadaian</span>
              </button>

              <div className="flex items-center gap-2">
                {savedSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Tersimpan Permanen sebagai Default!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveCurrent}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Simpan & Terapkan ke Semua Prospek</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Live Simulated Preview */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col space-y-3">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Nyata untuk Nasabah:</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                Live Preview
              </span>
            </div>

            {/* Select lead to preview with */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">
                Pilih Contoh Usaha untuk Dicoba:
              </label>
              <select
                value={previewLeadId}
                onChange={(e) => setPreviewLeadId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.namaUsaha} ({lead.wilayahKecamatan} - {lead.rekomendasiProduk})
                  </option>
                ))}
              </select>
            </div>

            {/* WhatsApp Chat Bubble Simulation */}
            <div className="flex-1 bg-emerald-900/5 border border-emerald-200 rounded-xl p-3.5 overflow-y-auto max-h-[380px] shadow-inner space-y-2">
              <div className="text-[10px] font-mono text-emerald-800 font-bold flex items-center justify-between pb-1 border-b border-emerald-200">
                <span>Penerima: {currentPreviewLead?.namaUsaha || 'Nama Usaha'}</span>
                <span>{currentPreviewLead?.noWhatsApp || ''}</span>
              </div>
              <div className="bg-white rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap shadow-xs border border-slate-200">
                {livePreviewText}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Perhatikan bagaimana <strong>{currentPreviewLead?.namaUsaha}</strong> dan <strong>{currentPreviewLead?.wilayahKecamatan}</strong> terisi otomatis.</span>
              <button
                type="button"
                onClick={() => onCopyNotice(livePreviewText, 'Pratinjau Pesan')}
                className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Salin</span>
              </button>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            PT PEGADAIAN (PERSERO) &bull; Kantor Area Ambon &bull; Master Pesan WhatsApp v2.5
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold transition-colors"
          >
            Selesai & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
