import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Download, 
  Sparkles, 
  ExternalLink, 
  Smartphone, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { 
  PegadaianProductBrochure, 
  getEffectiveBrochure, 
  saveCustomBrochure, 
  resetCustomBrochure, 
  compressImageFile, 
  copyImageToClipboard, 
  downloadBrochureImage,
  PEGADAIAN_BROCHURES 
} from '../data/pegadaianBrochures';

interface BrochureUploadCardProps {
  product: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah';
  onUpdated?: () => void;
  onCopyNotice?: (text: string, label: string) => void;
}

export const BrochureUploadCard: React.FC<BrochureUploadCardProps> = ({
  product,
  onUpdated,
  onCopyNotice
}) => {
  const [brochure, setBrochure] = useState<PegadaianProductBrochure>(() => getEffectiveBrochure(product));
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [customTaglineInput, setCustomTaglineInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshBrochure = () => {
    const updated = getEffectiveBrochure(product);
    setBrochure(updated);
    setCustomTitleInput(updated.title);
    setCustomTaglineInput(updated.tagline);
    if (onUpdated) onUpdated();
  };

  useEffect(() => {
    refreshBrochure();
    const handleStorageUpdate = (e: Event) => {
      refreshBrochure();
    };
    window.addEventListener('pegadaian_brochures_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('pegadaian_brochures_updated', handleStorageUpdate);
    };
  }, [product]);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Format file harus berupa gambar (JPG, PNG, atau WEBP)');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      // Compress to optimal JPEG
      const compressedDataUrl = await compressImageFile(file, 1280, 0.84);
      saveCustomBrochure(product, compressedDataUrl, file.name);
      refreshBrochure();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Gagal memproses gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleResetToDefault = () => {
    resetCustomBrochure(product);
    refreshBrochure();
  };

  const handleCopyImage = async () => {
    const success = await copyImageToClipboard(brochure.bannerUrl);
    if (success) {
      setCopySuccess('Gambar disalin ke Clipboard! Siap di-paste (Ctrl+V) ke WhatsApp Web');
      if (onCopyNotice) onCopyNotice('Gambar Brosur', 'Disalin ke Clipboard');
    } else {
      // Fallback: download or copy link
      if (brochure.bannerUrl.startsWith('http')) {
        navigator.clipboard.writeText(brochure.bannerUrl);
        setCopySuccess('Link gambar disalin ke Clipboard');
        if (onCopyNotice) onCopyNotice(brochure.bannerUrl, 'Tautan Gambar');
      } else {
        setCopySuccess('Gunakan tombol "Unduh Gambar" untuk menyimpan ke galeri');
      }
    }
    setTimeout(() => setCopySuccess(null), 3500);
  };

  const handleSaveCustomMeta = () => {
    if (!customTitleInput.trim()) return;
    saveCustomBrochure(
      product, 
      brochure.bannerUrl, 
      brochure.downloadFilename, 
      customTitleInput.trim(), 
      customTaglineInput.trim()
    );
    setIsEditingMeta(false);
    refreshBrochure();
  };

  return (
    <div 
      className={`border rounded-2xl overflow-hidden transition-all bg-white flex flex-col ${
        brochure.isCustom 
          ? 'border-emerald-300 ring-2 ring-emerald-500/20 shadow-md' 
          : 'border-slate-200 shadow-xs'
      }`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Visual Image Banner with Drag & Drop */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative h-48 bg-slate-100 overflow-hidden cursor-pointer group ${
          isDragOver ? 'ring-4 ring-emerald-500 bg-emerald-50' : ''
        }`}
        onClick={() => fileInputRef.current?.click()}
        title="Klik atau seret file gambar untuk mengganti brosur dari galeri Anda"
      >
        <img 
          src={brochure.bannerUrl} 
          alt={brochure.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-between p-3">
          {/* Top badges */}
          <div className="flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-amber-300 backdrop-blur-xs border border-amber-400/30">
              {brochure.badge}
            </span>
            {brochure.isCustom ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="w-3 h-3 text-white" />
                Brosur Galeri Anda (Aktif)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-300 backdrop-blur-xs">
                Brosur Default Resmi
              </span>
            )}
          </div>

          {/* Bottom hover prompt */}
          <div className="bg-slate-900/85 backdrop-blur-xs rounded-xl p-2 text-white flex items-center justify-between opacity-95 group-hover:opacity-100 transition-opacity border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Ganti Gambar Brosur</span>
                  <span className="text-[10px] text-emerald-300">({product})</span>
                </div>
                <div className="text-[10px] text-slate-300">
                  Klik untuk pilih dari Galeri / Kamera
                </div>
              </div>
            </div>
            <button
              type="button"
              className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline px-1"
            >
              Pilih Foto
            </button>
          </div>
        </div>

        {/* Loading Spinner during upload */}
        {isUploading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-10">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs font-semibold">Mengompres & Memuat Gambar...</span>
          </div>
        )}
      </div>

      {/* Card Info & Actions */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Title & Tagline */}
          {!isEditingMeta ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {brochure.title}
                </h4>
                {brochure.isCustom && (
                  <button
                    type="button"
                    onClick={() => setIsEditingMeta(true)}
                    className="text-[10px] text-emerald-700 hover:underline shrink-0 font-medium"
                  >
                    Edit Teks
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 italic leading-tight">
                {brochure.tagline}
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Judul Penawaran:</label>
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Sub-judul / Tagline:</label>
                <input
                  type="text"
                  value={customTaglineInput}
                  onChange={(e) => setCustomTaglineInput(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingMeta(false)}
                  className="px-2 py-1 rounded text-[10px] text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomMeta}
                  className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                >
                  Simpan Teks
                </button>
              </div>
            </div>
          )}

          {/* Product Highlights */}
          <ul className="mt-2.5 space-y-1 text-xs text-slate-600">
            {brochure.highlights.slice(0, 3).map((h, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{h}</span>
              </li>
            ))}
          </ul>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Copy Toast feedback */}
          {copySuccess && (
            <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>{copySuccess}</span>
            </div>
          )}
        </div>

        {/* Bottom Operational Toolbar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {/* Upload Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload dari Galeri</span>
            </button>

            {brochure.isCustom && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs transition-colors"
                title="Kembalikan ke brosur default resmi PT Pegadaian"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <span>Reset Default</span>
              </button>
            )}
          </div>

          {/* Clipboard & Download Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors p-1"
              title="Salin Gambar ke Clipboard (Bisa di-paste Ctrl+V di WhatsApp Web)"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Salin Gambar</span>
            </button>

            <button
              type="button"
              onClick={() => downloadBrochureImage(brochure.bannerUrl, brochure.downloadFilename)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors p-1"
              title="Unduh gambar brosur ke perangkat Anda"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Unduh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
