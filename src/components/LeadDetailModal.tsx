import React, { useState, useRef, useEffect } from 'react';
import { X, Star, MessageCircle, Copy, Check, ExternalLink, MapPin, Building, ShieldCheck, Phone, Pencil, Save, Search, Smartphone, Instagram, Facebook, Video, Globe, Navigation, Radar, Sparkles, FileText, CheckCircle2, Image as ImageIcon, Upload, Download, RefreshCw } from 'lucide-react';
import { BusinessLead } from '../types';
import { getWhatsAppUrl, getGoogleMapsUrl, isMobilePhone } from '../utils/exporters';
import { 
  buildProfessionalWhatsAppMessage, 
  getEffectiveBrochure,
  saveCustomBrochure,
  resetCustomBrochure,
  compressImageFile,
  copyImageToClipboard,
  downloadBrochureImage,
  PEGADAIAN_BROCHURES 
} from '../data/pegadaianBrochures';
import {
  getMasterTemplates,
  renderMasterTemplateText
} from '../data/masterTemplates';

interface LeadDetailModalProps {
  lead: BusinessLead | null;
  onClose: () => void;
  onCopyText: (text: string, label: string) => void;
  onUpdateDraft?: (leadId: string, newDraft: string) => void;
  onUpdateContact?: (leadId: string, updates: { noWhatsApp?: string; noTeleponMaps?: string }) => void;
  onUpdateNotesAndStatus?: (leadId: string, updates: { statusKontak?: 'Belum Dihubungi' | 'Terkirim' | 'Merespon' | 'Closing'; catatanSales?: string }) => void;
  onOpenAIScript?: (lead: BusinessLead) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onCopyText,
  onUpdateDraft,
  onUpdateContact,
  onUpdateNotesAndStatus,
  onOpenAIScript
}) => {
  const [draftMessage, setDraftMessage] = useState(lead?.drafPesanWAPertama || '');
  const [isCopied, setIsCopied] = useState(false);
  const [brochureStateVersion, setBrochureStateVersion] = useState(0);
  const [isUploadingBrochure, setIsUploadingBrochure] = useState(false);
  const [imageCopyFeedback, setImageCopyFeedback] = useState<string | null>(null);

  // Sales CRM notes and status state
  const [salesStatus, setSalesStatus] = useState(lead?.statusKontak || 'Belum Dihubungi');
  const [salesNotes, setSalesNotes] = useState(lead?.catatanSales || '');
  const [notesSaved, setNotesSaved] = useState(false);

  // Edit Phone States
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [inputMapsPhone, setInputMapsPhone] = useState(lead?.noTeleponMaps || '');
  const [inputWhatsApp, setInputWhatsApp] = useState(lead?.noWhatsApp || '');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (lead) {
      setDraftMessage(lead.drafPesanWAPertama);
      setSalesStatus(lead.statusKontak || 'Belum Dihubungi');
      setSalesNotes(lead.catatanSales || '');
      setInputMapsPhone(lead.noTeleponMaps || '');
      setInputWhatsApp(lead.noWhatsApp || '');
    }
  }, [lead?.id, lead?.drafPesanWAPertama, lead?.statusKontak, lead?.catatanSales, lead?.noTeleponMaps, lead?.noWhatsApp]);

  useEffect(() => {
    const handleUpdate = () => setBrochureStateVersion(v => v + 1);
    window.addEventListener('pegadaian_brochures_updated', handleUpdate);
    return () => window.removeEventListener('pegadaian_brochures_updated', handleUpdate);
  }, []);

  if (!lead) return null;

  const activeBrochure = getEffectiveBrochure(lead.rekomendasiProduk || 'Pinjaman Usaha');

  const handleUploadFromGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lead.rekomendasiProduk) return;

    try {
      setIsUploadingBrochure(true);
      const compressed = await compressImageFile(file, 1280, 0.84);
      saveCustomBrochure(lead.rekomendasiProduk, compressed, file.name);
      
      // Auto regenerate draft with custom brochure note
      const prof = buildProfessionalWhatsAppMessage({
        businessName: lead.namaUsaha,
        product: lead.rekomendasiProduk,
        district: lead.wilayahKecamatan,
        category: lead.kategoriBisnis,
        rating: lead.ratingMaps
      });
      setDraftMessage(prof.messageText);
      if (onUpdateDraft) onUpdateDraft(lead.id, prof.messageText);
      onCopyText(file.name, `Brosur ${lead.rekomendasiProduk} berhasil diunggah dari galeri!`);
    } catch (err: any) {
      console.error('Failed to upload brochure:', err);
    } finally {
      setIsUploadingBrochure(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyImageToClipboard = async () => {
    const success = await copyImageToClipboard(activeBrochure.bannerUrl);
    if (success) {
      setImageCopyFeedback('Gambar disalin ke Clipboard! Siap Ctrl+V di WA');
    } else {
      setImageCopyFeedback('Link gambar disalin');
      navigator.clipboard.writeText(activeBrochure.bannerUrl);
    }
    setTimeout(() => setImageCopyFeedback(null), 3000);
  };

  const handleCopy = () => {
    onCopyText(draftMessage, 'Draf Pesan WhatsApp');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    if (onUpdateDraft) {
      onUpdateDraft(lead.id, draftMessage);
    }
  };

  const handleLoadFromMasterTemplate = () => {
    const templates = getMasterTemplates();
    const templateText = templates[lead.rekomendasiProduk];
    if (templateText) {
      const rendered = renderMasterTemplateText(templateText, {
        businessName: lead.namaUsaha,
        product: lead.rekomendasiProduk,
        district: lead.wilayahKecamatan,
        category: lead.kategoriBisnis,
        rating: lead.ratingMaps,
        phone: lead.noWhatsApp
      });
      setDraftMessage(rendered);
      if (onUpdateDraft) {
        onUpdateDraft(lead.id, rendered);
      }
      onCopyText(`Format Master (${lead.rekomendasiProduk})`, 'Diterapkan dengan Nama Usaha');
    }
  };

  const handleSaveNotes = () => {
    if (onUpdateNotesAndStatus) {
      onUpdateNotesAndStatus(lead.id, {
        statusKontak: salesStatus,
        catatanSales: salesNotes
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }
  };

  const handleSaveContact = () => {
    if (onUpdateContact) {
      onUpdateContact(lead.id, {
        noTeleponMaps: inputMapsPhone.trim(),
        noWhatsApp: inputWhatsApp.trim()
      });
    }
    setIsEditingContact(false);
  };

  const waUrl = getWhatsAppUrl(lead.noWhatsApp, draftMessage);
  const mapsUrl = lead.googleMapsUrl || getGoogleMapsUrl(lead.namaUsaha, lead.wilayahKecamatan, lead.alamatLengkap);
  const platform = lead.platformSumber || 'Google Maps';
  const targetUrl = lead.socialUrl || mapsUrl;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`text-white p-5 flex items-start justify-between ${
          platform === 'TikTok' ? 'bg-slate-950' :
          platform === 'Instagram' ? 'bg-gradient-to-r from-pink-800 via-rose-700 to-amber-700' :
          platform === 'Facebook' ? 'bg-blue-900' :
          'bg-gradient-to-r from-[#04281f] via-[#063b2e] to-[#04281f]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              {platform === 'TikTok' && <Video className="w-5 h-5 text-pink-400" />}
              {platform === 'Instagram' && <Instagram className="w-5 h-5 text-pink-200" />}
              {platform === 'Facebook' && <Facebook className="w-5 h-5 text-blue-200" />}
              {platform === 'Google Maps' && <Building className="w-5 h-5 text-amber-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-black/40 text-amber-300 border border-white/10">
                  {lead.id}
                </span>
                <span className="text-xs text-emerald-100 font-medium">
                  {lead.kategoriBisnis}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {platform} Terverifikasi
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {lead.namaUsaha}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors border border-white/30"
              title={`Buka profil ${lead.namaUsaha} di ${platform}`}
            >
              {platform === 'TikTok' && <Video className="w-3.5 h-3.5 text-pink-400" />}
              {platform === 'Instagram' && <Instagram className="w-3.5 h-3.5 text-pink-200" />}
              {platform === 'Facebook' && <Facebook className="w-3.5 h-3.5 text-blue-200" />}
              {platform === 'Google Maps' && <MapPin className="w-3.5 h-3.5 text-white" />}
              <span>{platform}</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Location & Social/Maps Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Wilayah / Kecamatan:</span>
              <span className="text-slate-800 font-bold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {lead.wilayahKecamatan}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">
                {lead.socialHandle ? `Profil & Audien ${platform}:` : 'Rating & Ulasan Google Maps:'}
              </span>
              <span className="text-slate-800 font-bold flex items-center gap-1 mt-0.5">
                {lead.socialHandle ? (
                  <a 
                    href={lead.socialUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-pink-700 hover:underline flex items-center gap-1"
                  >
                    <span>{lead.socialHandle}</span>
                    <span className="text-slate-500 font-normal">({lead.followerCount})</span>
                  </a>
                ) : (
                  <>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    {lead.ratingMaps.toFixed(1)} / 5.0 {lead.reviewCount ? `(${lead.reviewCount} ulasan)` : ''}
                  </>
                )}
              </span>
            </div>

            {lead.alamatLengkap && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-semibold text-slate-700">Alamat:</span> {lead.alamatLengkap}
                </div>
                {lead.distanceKm !== undefined && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                    ± {lead.distanceKm} km dari pusat kota
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Contact Verification Section */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                Informasi Kontak (Google Maps & WhatsApp Outreach)
              </span>

              <button
                onClick={() => setIsEditingContact(!isEditingContact)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                {isEditingContact ? 'Batal Koreksi' : 'Koreksi Nomor'}
              </button>
            </div>

            {isEditingContact ? (
              <div className="space-y-3 pt-1 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    No. Telepon Google Maps:
                  </label>
                  <input
                    type="text"
                    value={inputMapsPhone}
                    onChange={(e) => setInputMapsPhone(e.target.value)}
                    placeholder="Contoh: (0911) 352825"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      No. WhatsApp PIC / Outreach (+628...):
                    </label>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent('"' + lead.namaUsaha + '" Ambon "08"')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Search className="w-2.5 h-2.5" />
                      Cari No. HP di Google
                    </a>
                  </div>
                  <input
                    type="text"
                    value={inputWhatsApp}
                    onChange={(e) => setInputWhatsApp(e.target.value)}
                    placeholder="Contoh: +6281248889988"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingContact(false)}
                    className="px-2.5 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveContact}
                    className="px-3 py-1 text-xs rounded bg-emerald-700 text-white font-bold flex items-center gap-1 hover:bg-emerald-800"
                  >
                    <Save className="w-3 h-3" />
                    Simpan Kontak
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Telepon Listing Google Maps */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase flex items-center justify-between">
                    <span>Telepon Google Maps:</span>
                    <span className={`px-1 rounded text-[9px] font-bold border ${
                      lead.noTeleponMaps?.includes('0911') 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {lead.noTeleponMaps?.includes('0911') ? 'PSTN Meja/Kantor' : 'Ponsel Maps'}
                    </span>
                  </span>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {lead.noTeleponMaps || 'Belum Ada Listing'}
                    </span>
                    {lead.noTeleponMaps && (
                      <a
                        href={`tel:${lead.noTeleponMaps.replace(/[^0-9+]/g, '')}`}
                        className="px-2.5 py-1 rounded text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow-2xs"
                      >
                        <Phone className="w-3 h-3" />
                        Panggil
                      </a>
                    )}
                  </div>
                  {lead.noTeleponMaps?.includes('0911') && (
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      *Nomor kabel Telkom kantor. Tidak dapat menerima pesan WhatsApp.
                    </p>
                  )}
                </div>

                {/* WhatsApp Outreach */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase flex items-center justify-between">
                    <span>No. WhatsApp Sales Outreach:</span>
                    <span className={`px-1 rounded text-[9px] font-bold border ${
                      lead.noWhatsApp && isMobilePhone(lead.noWhatsApp)
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {lead.noWhatsApp && isMobilePhone(lead.noWhatsApp) ? 'WA Terverifikasi' : 'Belum Ada WA'}
                    </span>
                  </span>

                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {lead.noWhatsApp && isMobilePhone(lead.noWhatsApp) ? lead.noWhatsApp : 'Belum Ada'}
                    </span>
                    
                    {lead.noWhatsApp && isMobilePhone(lead.noWhatsApp) ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1 shadow-2xs"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Chat WA
                      </a>
                    ) : (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent('"' + lead.namaUsaha + '" Ambon "08"')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded text-[11px] font-bold bg-slate-100 text-blue-700 hover:bg-blue-50 border border-slate-300 flex items-center gap-1"
                        title="Cari nomor HP/WA pemilik di Google"
                      >
                        <Search className="w-3 h-3" />
                        Cari di Google
                      </a>
                    )}
                  </div>

                  {!lead.noWhatsApp || !isMobilePhone(lead.noWhatsApp) ? (
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Dapat diinput dari hasil panggilan/canvassing</span>
                      <button
                        onClick={() => setIsEditingContact(true)}
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        + Input No. WA
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* AI Lead Profiling & Pegadaian Matching */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Hasil AI Lead Scoring PT Pegadaian Area Ambon
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-xs font-black text-emerald-800">
                Skor: {lead.skorKelayakan} / 100
              </div>
            </div>

            <div className="text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Rekomendasi Produk:</span>
                <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-700 text-white shadow-2xs">
                  {lead.rekomendasiProduk}
                </span>
              </div>
              {lead.alasanRekomendasi && (
                <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded border border-emerald-100 mt-1">
                  <span className="font-semibold text-emerald-950">Dasar Rekomendasi:</span> {lead.alasanRekomendasi}
                </div>
              )}
            </div>
          </div>

          {/* CRM Sales Pipeline & Notes Section */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Status CRM & Catatan Lapangan Sales Pegadaian
              </span>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-md border border-emerald-300 transition-colors flex items-center gap-1"
              >
                {notesSaved ? <Check className="w-3 h-3 text-emerald-700" /> : <Save className="w-3 h-3 text-emerald-700" />}
                {notesSaved ? 'Tersimpan!' : 'Simpan Status & Catatan'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Status Pipeline:
                </label>
                <select
                  value={salesStatus}
                  onChange={(e) => setSalesStatus(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="Belum Dihubungi">Prospek Baru (Belum Dihubungi)</option>
                  <option value="Terkirim">Pesan Outreach Terkirim</option>
                  <option value="Merespon">Merespon / Minat (Tanya Tabel)</option>
                  <option value="Closing">Deal / Pengajuan Berkas (Won)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan Progres / Kendala:
                </label>
                <input
                  type="text"
                  value={salesNotes}
                  onChange={(e) => setSalesNotes(e.target.value)}
                  placeholder="Contoh: Pemilik minat tambah armada pickup, minta survei hari Kamis"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Pitch Draft (Editable & Actionable) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                Draf Pesan Pendekatan Pertama (WhatsApp Outreach):
              </label>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadFromMasterTemplate}
                  className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 transition-colors"
                  title={`Terapkan format Master Pesan (${lead.rekomendasiProduk}) otomatis sesuai profil ${lead.namaUsaha}`}
                >
                  <FileText className="w-3 h-3 text-amber-600" />
                  Format dari Master
                </button>

                {onOpenAIScript && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAIScript(lead);
                    }}
                    className="text-[11px] text-teal-800 hover:text-teal-950 font-bold flex items-center gap-1 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    Kustomisasi Tone AI
                  </button>
                )}
                
                <button
                  onClick={handleCopy}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Tersalin' : 'Salin Pesan'}
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onBlur={handleSaveDraft}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-slate-50 focus:bg-white leading-relaxed"
            />
            
            {/* Professional Brochure & Image Attachment Preview */}
            {lead.rekomendasiProduk && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFromGallery}
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-28 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-300 relative bg-slate-200 cursor-pointer group"
                  title="Klik untuk upload foto brosur dari galeri HP/laptop Anda"
                >
                  <img
                    src={activeBrochure.bannerUrl}
                    alt={activeBrochure.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                    Ganti Foto
                  </div>
                  <span className={`absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-bold ${
                    activeBrochure.isCustom ? 'bg-emerald-600 text-white' : 'bg-slate-900/80 text-amber-300'
                  }`}>
                    {activeBrochure.isCustom ? 'Galeri Aktif' : 'Brosur HD'}
                  </span>
                </div>

                <div className="text-xs text-slate-700 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate">Lampiran: {activeBrochure.title}</span>
                    </div>
                    {activeBrochure.isCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          if (lead.rekomendasiProduk) {
                            resetCustomBrochure(lead.rekomendasiProduk);
                            setBrochureStateVersion(v => v + 1);
                          }
                        }}
                        className="text-[10px] text-slate-500 hover:text-rose-600 underline"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5 italic line-clamp-1">
                    {activeBrochure.tagline}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prof = buildProfessionalWhatsAppMessage({
                          businessName: lead.namaUsaha,
                          product: lead.rekomendasiProduk,
                          district: lead.wilayahKecamatan,
                          category: lead.kategoriBisnis,
                          rating: lead.ratingMaps
                        });
                        setDraftMessage(prof.messageText);
                        if (onUpdateDraft) onUpdateDraft(lead.id, prof.messageText);
                      }}
                      className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded border border-emerald-300 transition-colors"
                    >
                      Terapkan Pesan Lengkap
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingBrochure}
                      className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-300 inline-flex items-center gap-1 transition-colors"
                    >
                      {isUploadingBrochure ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                      ) : (
                        <Upload className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>Upload dari Galeri</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyImageToClipboard}
                      className="text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 inline-flex items-center gap-1 px-2.5 py-1 rounded shadow-xs transition-colors"
                      title="Salin gambar ke clipboard agar siap ditempel (Ctrl+V) langsung ke chat WhatsApp nasabah"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin Gambar (Ctrl+V di WA)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadBrochureImage(activeBrochure.bannerUrl, activeBrochure.downloadFilename)}
                      className="text-[11px] font-semibold text-slate-700 hover:text-emerald-700 inline-flex items-center gap-1 px-1.5 py-1"
                      title="Unduh gambar ke HP/Laptop"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh</span>
                    </button>
                  </div>

                  {imageCopyFeedback && (
                    <div className="mt-1 text-[10px] text-emerald-800 bg-emerald-100/80 p-1.5 rounded font-semibold animate-in fade-in">
                      {imageCopyFeedback}
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-500 mt-1">
              Pesan disesuaikan dengan nada profesional dan santun khas Maluku untuk pelaku usaha di Kota Ambon. Anda dapat menyuntingnya langsung di kotak teks sebelum mengirim via WhatsApp.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline"
          >
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>Verifikasi Profil & Kontak di Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
            >
              Tutup
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Buka WhatsApp Sekarang
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
