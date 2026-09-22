import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  Phone, 
  AlertCircle, 
  MessageSquare, 
  ExternalLink, 
  ChevronRight, 
  Pause, 
  Check, 
  Copy, 
  Image as ImageIcon, 
  Sparkles,
  Award,
  Layers,
  Flame,
  Download,
  ShieldCheck,
  RefreshCw,
  Building2,
  Users,
  Upload,
  Camera,
  Edit3,
  RotateCcw,
  CheckCheck,
  Eye,
  Info,
  Save,
  FileText,
  Sliders,
  Play,
  Zap,
  Calendar,
  Trash2,
  CheckSquare,
  Bell
} from 'lucide-react';
import { BusinessLead } from '../types';
import { getWhatsAppUrl, isMobilePhone } from '../utils/exporters';
import { 
  getEffectiveBrochure, 
  buildProfessionalWhatsAppMessage, 
  PegadaianProductBrochure,
  saveCustomBrochure,
  resetCustomBrochure,
  compressImageFile,
  copyImageToClipboard,
  downloadBrochureImage
} from '../data/pegadaianBrochures';
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
import { BrochureUploadCard } from './BrochureUploadCard';
import { User } from 'firebase/auth';

export interface WeeklyAutomationConfig {
  enabled: boolean;
  dayOfWeek: number; // 0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
  time: string; // '09:00'
  targetFilter: 'uncontacted' | 'all';
  delaySeconds: number; // 8
  lastRunTimestamp: number | null;
  autoOpenChat: boolean;
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function getNextWeeklySchedule(dayOfWeek: number, timeStr: string): { nextDate: Date; formattedText: string; daysRemaining: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours || 9, minutes || 0, 0, 0);

  const currentDay = now.getDay();
  let dayDiff = (dayOfWeek - currentDay + 7) % 7;

  // If today is the day and scheduled time has already passed today, advance to next week
  if (dayDiff === 0 && now.getTime() >= next.getTime()) {
    dayDiff = 7;
  }

  next.setDate(now.getDate() + dayDiff);
  
  const dayName = DAY_NAMES[dayOfWeek];
  const dateStr = next.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedText = `${dayName}, ${dateStr} pk ${timeStr} WIT`;
  
  return { nextDate: next, formattedText, daysRemaining: dayDiff };
}

interface WhatsAppBlastModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: BusinessLead[];
  onUpdateLeadStatus: (leadId: string, newStatus: 'Belum Dihubungi' | 'Terkirim' | 'Merespon' | 'Closing') => void;
  onUpdateLeadDraft?: (leadId: string, newDraft: string) => void;
  onCopyText: (text: string, label: string) => void;
  currentUser?: User | null;
  initialTab?: 'queue' | 'all-list' | 'brochures' | 'master-template' | 'automation';
}

export const WhatsAppBlastModal: React.FC<WhatsAppBlastModalProps> = ({
  isOpen,
  onClose,
  leads,
  onUpdateLeadStatus,
  onUpdateLeadDraft,
  onCopyText,
  currentUser,
  initialTab = 'queue'
}) => {
  // Filter leads with valid mobile phone
  const validLeads = useMemo(() => leads.filter(l => isMobilePhone(l.noWhatsApp)), [leads]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentLeadIds, setSentLeadIds] = useState<Set<string>>(new Set());
  const [useCustomPitchTemplate, setUseCustomPitchTemplate] = useState<boolean>(true);
  const [selectedProductOverride, setSelectedProductOverride] = useState<'recommended' | 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah'>('recommended');
  const [activeTab, setActiveTab] = useState<'queue' | 'all-list' | 'brochures' | 'master-template' | 'automation'>(initialTab);
  const [copiedImageBanner, setCopiedImageBanner] = useState<string | null>(null);
  const [brochureVersion, setBrochureVersion] = useState(0);
  const [isQuickUploading, setIsQuickUploading] = useState(false);

  // Master message templates state
  const [masterTemplatesVersion, setMasterTemplatesVersion] = useState(0);
  const [masterProductTab, setMasterProductTab] = useState<'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah'>('Cicil Emas');
  const [masterEditText, setMasterEditText] = useState<string>('');
  const [masterSaveNotice, setMasterSaveNotice] = useState<boolean>(false);
  const [masterPreviewLeadId, setMasterPreviewLeadId] = useState<string>('');

  // Custom edited message tracking per lead
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [isEditingMessage, setIsEditingMessage] = useState<boolean>(false);

  // --- WEEKLY AUTOMATION CONFIG & STATE ---
  const [automationConfig, setAutomationConfig] = useState<WeeklyAutomationConfig>(() => {
    try {
      const saved = localStorage.getItem('pegadaian_wa_weekly_automation_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse weekly automation config:', e);
    }
    return {
      enabled: true,
      dayOfWeek: 1, // Senin
      time: '09:00',
      targetFilter: 'uncontacted',
      delaySeconds: 8,
      lastRunTimestamp: null,
      autoOpenChat: true
    };
  });

  const updateAutomationConfig = (updates: Partial<WeeklyAutomationConfig>) => {
    setAutomationConfig(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('pegadaian_wa_weekly_automation_v1', JSON.stringify(next));
      return next;
    });
  };

  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [autoCountdown, setAutoCountdown] = useState<number>(0);
  const [autoCurrentIndex, setAutoCurrentIndex] = useState<number>(0);
  const [autoLogs, setAutoLogs] = useState<Array<{ id: string; time: string; leadName: string; product: string; phone: string; status: 'sent' | 'skipped' }>>(() => {
    try {
      const saved = localStorage.getItem('pegadaian_wa_automation_logs_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const autoQueueLeads = useMemo(() => {
    if (automationConfig.targetFilter === 'uncontacted') {
      return validLeads.filter(l => l.statusKontak === 'Belum Dihubungi' && !sentLeadIds.has(l.id));
    }
    return validLeads;
  }, [validLeads, automationConfig.targetFilter, sentLeadIds]);

  const nextScheduleInfo = useMemo(() => {
    return getNextWeeklySchedule(automationConfig.dayOfWeek, automationConfig.time);
  }, [automationConfig.dayOfWeek, automationConfig.time]);

  // Automation Timer Tick Effect
  useEffect(() => {
    let timer: any = null;
    if (isAutoRunning) {
      if (autoCountdown > 0) {
        timer = setTimeout(() => {
          setAutoCountdown(c => c - 1);
        }, 1000);
      } else {
        // Countdown reached 0: dispatch current lead!
        if (autoCurrentIndex < autoQueueLeads.length) {
          const leadToDispatch = autoQueueLeads[autoCurrentIndex];
          if (leadToDispatch) {
            const pData = buildProfessionalWhatsAppMessage({
              businessName: leadToDispatch.namaUsaha,
              product: leadToDispatch.rekomendasiProduk,
              district: leadToDispatch.wilayahKecamatan,
              category: leadToDispatch.kategoriBisnis,
              rating: leadToDispatch.ratingMaps,
              salesOfficerName: currentUser?.displayName || 'Relationship Officer PT Pegadaian Area Ambon'
            });
            const waUrl = getWhatsAppUrl(leadToDispatch.noWhatsApp, pData.messageText);

            if (automationConfig.autoOpenChat) {
              window.open(waUrl, '_blank');
            }

            // Mark sent
            setSentLeadIds(prev => new Set(prev).add(leadToDispatch.id));
            onUpdateLeadStatus(leadToDispatch.id, 'Terkirim');

            const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newLogEntry = {
              id: `${Date.now()}-${leadToDispatch.id}`,
              time: `${nowStr} WIT`,
              leadName: leadToDispatch.namaUsaha,
              product: leadToDispatch.rekomendasiProduk,
              phone: leadToDispatch.noWhatsApp,
              status: 'sent' as const
            };

            setAutoLogs(prev => {
              const updated = [newLogEntry, ...prev].slice(0, 50);
              localStorage.setItem('pegadaian_wa_automation_logs_v1', JSON.stringify(updated));
              return updated;
            });

            // Advance to next
            if (autoCurrentIndex + 1 < autoQueueLeads.length) {
              setAutoCurrentIndex(i => i + 1);
              setAutoCountdown(automationConfig.delaySeconds);
            } else {
              // Completed all!
              setIsAutoRunning(false);
              updateAutomationConfig({ lastRunTimestamp: Date.now() });
              onCopyText('Siklus otomatis mingguan selesai', 'Automation Selesai');
            }
          }
        } else {
          setIsAutoRunning(false);
        }
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAutoRunning, autoCountdown, autoCurrentIndex, autoQueueLeads, automationConfig, currentUser]);

  const handleStartAutomation = () => {
    if (autoQueueLeads.length === 0) {
      alert('Tidak ada nasabah target dalam antrian otomatisasi saat ini.');
      return;
    }
    setAutoCurrentIndex(0);
    setAutoCountdown(3); // 3 seconds initial countdown to prepare
    setIsAutoRunning(true);
  };

  const handlePauseAutomation = () => {
    setIsAutoRunning(false);
  };

  const handleResumeAutomation = () => {
    if (autoCurrentIndex >= autoQueueLeads.length) {
      setAutoCurrentIndex(0);
    }
    setAutoCountdown(2);
    setIsAutoRunning(true);
  };

  const handleStopAutomation = () => {
    setIsAutoRunning(false);
    setAutoCurrentIndex(0);
    setAutoCountdown(0);
  };

  const handleClearAutoLogs = () => {
    setAutoLogs([]);
    localStorage.removeItem('pegadaian_wa_automation_logs_v1');
  };

  const quickFileInputRef = useRef<HTMLInputElement | null>(null);

  // Listen for brochure updates (e.g. from upload in another card)
  useEffect(() => {
    const handleUpdate = () => {
      setBrochureVersion(v => v + 1);
    };
    window.addEventListener('pegadaian_brochures_updated', handleUpdate);
    return () => {
      window.removeEventListener('pegadaian_brochures_updated', handleUpdate);
    };
  }, []);

  // Listen for master templates updates
  useEffect(() => {
    const handleMasterUpdate = () => {
      setMasterTemplatesVersion(v => v + 1);
    };
    window.addEventListener(MASTER_TEMPLATES_EVENT, handleMasterUpdate);
    return () => {
      window.removeEventListener(MASTER_TEMPLATES_EVENT, handleMasterUpdate);
    };
  }, []);

  // Sync master editor text when tab or product changes
  useEffect(() => {
    const current = getMasterTemplates();
    setMasterEditText(current[masterProductTab] || DEFAULT_MASTER_TEMPLATES[masterProductTab]);
    const match = validLeads.find(l => l.rekomendasiProduk === masterProductTab) || validLeads[0];
    if (match) {
      setMasterPreviewLeadId(match.id);
    }
  }, [masterProductTab, masterTemplatesVersion]);

  // Real-time auto-persistence when user edits master text
  const handleMasterTextChange = (val: string) => {
    setMasterEditText(val);
    saveMasterTemplates({
      [masterProductTab]: val
    });
    setMasterSaveNotice(true);
  };

  // Safe tab change saving pending text first
  const handleMasterProductTabChange = (newProd: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah') => {
    if (masterEditText && masterEditText.trim()) {
      saveMasterTemplates({
        [masterProductTab]: masterEditText
      });
    }
    setMasterProductTab(newProd);
    const current = getMasterTemplates();
    setMasterEditText(current[newProd] || DEFAULT_MASTER_TEMPLATES[newProd]);
    const match = validLeads.find(l => l.rekomendasiProduk === newProd) || validLeads[0];
    if (match) {
      setMasterPreviewLeadId(match.id);
    }
  };

  // Safe modal close ensuring any active edit is saved
  const handleCloseModal = () => {
    if (masterEditText && masterEditText.trim()) {
      saveMasterTemplates({
        [masterProductTab]: masterEditText
      });
    }
    onClose();
  };

  const currentLead: BusinessLead | undefined = validLeads[currentIndex];

  // Determine active product for current lead
  const effectiveProduct: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah' = 
    selectedProductOverride === 'recommended'
      ? (currentLead ? currentLead.rekomendasiProduk : 'Pinjaman Usaha')
      : selectedProductOverride;

  const currentBrochure = getEffectiveBrochure(effectiveProduct);

  // Build standard professional message template
  const defaultProfessionalData = currentLead ? buildProfessionalWhatsAppMessage({
    businessName: currentLead.namaUsaha,
    product: effectiveProduct,
    district: currentLead.wilayahKecamatan,
    category: currentLead.kategoriBisnis,
    rating: currentLead.ratingMaps,
    salesOfficerName: currentUser?.displayName || 'Relationship Officer PT Pegadaian Area Ambon'
  }) : null;

  // Key for local edited message cache
  const leadEditKey = currentLead ? `${currentLead.id}_${effectiveProduct}` : '';

  // Current effective message: custom edited message if available, otherwise professional template or lead default
  const effectiveMessageText = currentLead 
    ? (customMessages[leadEditKey] !== undefined 
        ? customMessages[leadEditKey] 
        : (useCustomPitchTemplate && defaultProfessionalData ? defaultProfessionalData.messageText : currentLead.drafPesanWAPertama))
    : '';

  const isCurrentMessageEdited = currentLead && customMessages[leadEditKey] !== undefined && customMessages[leadEditKey] !== defaultProfessionalData?.messageText;

  const currentWaUrl = currentLead
    ? getWhatsAppUrl(currentLead.noWhatsApp, effectiveMessageText)
    : '';

  const handleMessageChange = (newText: string) => {
    if (!currentLead) return;
    setCustomMessages(prev => ({
      ...prev,
      [leadEditKey]: newText
    }));
    if (onUpdateLeadDraft) {
      onUpdateLeadDraft(currentLead.id, newText);
    }
  };

  const handleResetMessageToDefault = () => {
    if (!currentLead || !defaultProfessionalData) return;
    const defaultText = defaultProfessionalData.messageText;
    setCustomMessages(prev => {
      const copy = { ...prev };
      delete copy[leadEditKey];
      return copy;
    });
    if (onUpdateLeadDraft) {
      onUpdateLeadDraft(currentLead.id, defaultText);
    }
    onCopyText('Pesan dikembalikan ke format awal', 'Reset Pesan');
  };

  const handleMarkSentAndNext = () => {
    if (!currentLead) return;
    setSentLeadIds(prev => new Set(prev).add(currentLead.id));
    onUpdateLeadStatus(currentLead.id, 'Terkirim');
    if (currentIndex < validLeads.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSaveMasterInBlast = () => {
    saveMasterTemplates({
      [masterProductTab]: masterEditText
    });
    setMasterSaveNotice(true);
    onCopyText(`Master Pesan ${masterProductTab}`, 'Tersimpan & Diperbarui Otomatis');
    setTimeout(() => setMasterSaveNotice(false), 3500);

    if (onUpdateLeadDraft) {
      const officerName = currentUser?.displayName || 'Relationship Officer PT Pegadaian Area Maluku';
      validLeads.forEach(lead => {
        if (lead.rekomendasiProduk === masterProductTab) {
          const newDraft = renderMasterTemplateText(masterEditText, {
            businessName: lead.namaUsaha,
            product: lead.rekomendasiProduk,
            district: lead.wilayahKecamatan,
            category: lead.kategoriBisnis,
            rating: lead.ratingMaps,
            phone: lead.noWhatsApp,
            salesOfficerName: officerName
          });
          onUpdateLeadDraft(lead.id, newDraft);
        }
      });
    }
  };

  const handleResetMasterInBlast = () => {
    if (confirm(`Kembalikan Master Pesan untuk produk "${masterProductTab}" ke format resmi Pegadaian default?`)) {
      const updated = resetMasterTemplates(masterProductTab);
      setMasterEditText(updated[masterProductTab]);
      setMasterSaveNotice(true);
      onCopyText(`Master Pesan ${masterProductTab}`, 'Dikembalikan ke Standar Resmi');
      setTimeout(() => setMasterSaveNotice(false), 3000);
    }
  };

  const handleInsertMasterTag = (tag: string) => {
    setMasterEditText(prev => prev + ' ' + tag);
  };

  const handleCopyImageAction = async () => {
    const success = await copyImageToClipboard(currentBrochure.bannerUrl);
    if (success) {
      setCopiedImageBanner('✅ Gambar Brosur Disalin ke Clipboard! Buka chat WhatsApp lalu tekan Ctrl+V (Paste) untuk mengirim gambar.');
      onCopyText('Gambar Brosur HD', 'Disalin ke Clipboard (Siap Ctrl+V di WhatsApp)');
    } else {
      if (currentBrochure.bannerUrl.startsWith('http')) {
        navigator.clipboard.writeText(currentBrochure.bannerUrl);
        setCopiedImageBanner('Link gambar brosur disalin ke Clipboard.');
        onCopyText(currentBrochure.bannerUrl, 'Tautan Gambar');
      } else {
        setCopiedImageBanner('Gunakan tombol Unduh untuk menyimpan file gambar ke Galeri.');
      }
    }
    setTimeout(() => setCopiedImageBanner(null), 4000);
  };

  const handleQuickUploadFromGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsQuickUploading(true);
      const compressed = await compressImageFile(file, 1280, 0.84);
      saveCustomBrochure(effectiveProduct, compressed, file.name);
      setBrochureVersion(v => v + 1);
      onCopyText(file.name, `Brosur ${effectiveProduct} Galeri Berhasil Diupload`);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsQuickUploading(false);
      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
    }
  };

  const handleResetCurrentBrochure = () => {
    resetCustomBrochure(effectiveProduct);
    setBrochureVersion(v => v + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  WhatsApp Blast Pro
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {sentLeadIds.size} / {validLeads.length} Kontak Terkirim
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight mt-0.5 flex items-center gap-2">
                Broadcast Pesan Profesional & Brosur Gambar Resmi
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCloseModal}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-colors"
            >
              ✕ Tutup
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'queue'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Antrian Broadcast ({validLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'automation'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Automation Mingguan</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                automationConfig.enabled ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-600'
              }`}>
                {automationConfig.enabled ? 'AKTIF' : 'OFF'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('all-list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all-list'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Daftar Semua Nomor ({validLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('brochures')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'brochures'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Katalog Brosur Resmi
            </button>
            <button
              onClick={() => setActiveTab('master-template')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'master-template'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Master Template Pesan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-slate-950 font-black">
                Dinamis
              </span>
            </button>
          </div>

          {/* Progress % */}
          <div className="text-xs font-mono font-bold text-slate-600">
            {validLeads.length > 0 ? Math.round((sentLeadIds.size / validLeads.length) * 100) : 0}% Selesai
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 shrink-0">
          <div
            className="bg-emerald-600 h-1.5 transition-all duration-300"
            style={{ width: `${validLeads.length > 0 ? (sentLeadIds.size / validLeads.length) * 100 : 0}%` }}
          />
        </div>

        {/* Body Content */}
        {validLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada nomor WhatsApp seluler (08xx / 628xx) di daftar hasil filter saat ini.</p>
            <p className="text-xs text-slate-500 mt-1">Coba gunakan tombol "Full Scan Kota Ambon" atau sesuaikan filter wilayah.</p>
          </div>
        ) : activeTab === 'automation' ? (
          /* Weekly Automation View */
          <div className="p-5 overflow-y-auto space-y-4">
            
            {/* Automation Header Banner */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/30 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Sistem Otomatisasi WhatsApp Mingguan</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      automationConfig.enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {automationConfig.enabled ? 'Aktif Terjadwal' : 'Non-Aktif'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    Setiap minggu pada waktu yang ditentukan, sistem akan menyiapkan dan mengeksekusi pengiriman pesan promosi resmi Pegadaian (Cicil Emas & Pinjaman Usaha) secara berurutan dan aman ke nasabah Kota Ambon.
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => updateAutomationConfig({ enabled: !automationConfig.enabled })}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                    automationConfig.enabled 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{automationConfig.enabled ? 'Otomatisasi: AKTIF' : 'Otomatisasi: NON-AKTIF'}</span>
                </button>
              </div>
            </div>

            {/* Live Schedule Status Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Jadwal Pengiriman Rutin</span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  Setiap {DAY_NAMES[automationConfig.dayOfWeek]} pk {automationConfig.time} WIT
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Jadwal Terdekat:</span>
                  <span className="font-semibold text-emerald-700">{nextScheduleInfo.formattedText}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Target Penerima Pesan</span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  {autoQueueLeads.length} Kontak Siap Kirim
                </div>
                <div className="text-[11px] text-slate-500">
                  {automationConfig.targetFilter === 'uncontacted' 
                    ? 'Difilter: Hanya nasabah yang belum pernah dihubungi' 
                    : 'Difilter: Seluruh nomor terverifikasi di daftar prospek'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Proteksi Anti-Blokir WA</span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  Jeda {automationConfig.delaySeconds} Detik / Pesan
                </div>
                <div className="text-[11px] text-slate-500">
                  Interval manusiawi aman mematuhi batas proteksi spam Meta WhatsApp
                </div>
              </div>
            </div>

            {/* Live Automation Console / Runner */}
            <div className="border-2 border-emerald-500/40 rounded-2xl p-4 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Eksekusi Siklus Otomatisasi Mingguan</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Jalankan siklus kirim otomatis berkala untuk nasabah antrean minggu ini dengan satu klik.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isAutoRunning ? (
                    <>
                      <button
                        type="button"
                        onClick={handlePauseAutomation}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Jeda Sementara</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStopAutomation}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all"
                      >
                        Hentikan
                      </button>
                    </>
                  ) : autoCurrentIndex > 0 && autoCurrentIndex < autoQueueLeads.length ? (
                    <>
                      <button
                        type="button"
                        onClick={handleResumeAutomation}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Lanjutkan (#{autoCurrentIndex + 1})</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStopAutomation}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                      >
                        Reset Antrean
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartAutomation}
                      disabled={autoQueueLeads.length === 0}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 border border-emerald-500/40"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Jalankan Siklus Kirim Mingguan ({autoQueueLeads.length} Kontak)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Dispatch Progress Bar */}
              {isAutoRunning && (
                <div className="bg-white border border-emerald-300 rounded-xl p-3.5 space-y-2.5 animate-in fade-in shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-900">
                        Memproses Kontak #{autoCurrentIndex + 1} dari {autoQueueLeads.length}:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {autoQueueLeads[autoCurrentIndex]?.namaUsaha} ({autoQueueLeads[autoCurrentIndex]?.rekomendasiProduk})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Kirim otomatis dalam: {autoCountdown} dtk</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                      style={{ 
                        width: `${autoQueueLeads.length > 0 ? ((autoCurrentIndex) / autoQueueLeads.length) * 100 : 0}%` 
                      }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Nomor WhatsApp: <strong className="text-slate-800 font-mono">{autoQueueLeads[autoCurrentIndex]?.noWhatsApp}</strong></span>
                    <span>Wilayah: {autoQueueLeads[autoCurrentIndex]?.wilayahKecamatan}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule & Filter Configuration Settings */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Pengaturan Jadwal & Parameter Otomatisasi
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">Tersimpan Otomatis di Browser Anda</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                {/* 1. Day & Time */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hari Pengiriman Mingguan</span>
                  </label>
                  <select
                    value={automationConfig.dayOfWeek}
                    onChange={(e) => updateAutomationConfig({ dayOfWeek: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {DAY_NAMES.map((name, idx) => (
                      <option key={idx} value={idx}>
                        Setiap {name} {idx === 1 ? '(Rekomendasi - Awal Pekan Usaha)' : ''}
                      </option>
                    ))}
                  </select>

                  <div className="pt-2 space-y-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Jam Pengiriman (WIT)</span>
                    </label>
                    <select
                      value={automationConfig.time}
                      onChange={(e) => updateAutomationConfig({ time: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="08:30">08:30 WIT (Pagi Hari)</option>
                      <option value="09:00">09:00 WIT (Jam Operasional Kantor)</option>
                      <option value="09:30">09:30 WIT (Waktu Santai Pedagang)</option>
                      <option value="10:00">10:00 WIT (Pagi Menjelang Siang)</option>
                      <option value="14:00">14:00 WIT (Siang Hari)</option>
                      <option value="16:00">16:00 WIT (Sore Hari)</option>
                    </select>
                  </div>
                </div>

                {/* 2. Target Filter */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kriteria Nasabah Target</span>
                  </label>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                      <input
                        type="radio"
                        name="targetFilter"
                        checked={automationConfig.targetFilter === 'uncontacted'}
                        onChange={() => updateAutomationConfig({ targetFilter: 'uncontacted' })}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-800 block">Hanya Nasabah Belum Dihubungi</span>
                        <span className="text-slate-500 text-[10px]">Mencegah pesan ganda ke kontak yang sudah pernah di-chat.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                      <input
                        type="radio"
                        name="targetFilter"
                        checked={automationConfig.targetFilter === 'all'}
                        onChange={() => updateAutomationConfig({ targetFilter: 'all' })}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="text-[11px]">
                        <span className="font-bold text-slate-800 block">Semua Prospek ({validLeads.length})</span>
                        <span className="text-slate-500 text-[10px]">Follow-up rutin promosi emas & pembiayaan berkala.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Anti-Spam & Delivery Preferences */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Interval Jeda Anti-Spam (Detik)</span>
                  </label>
                  <select
                    value={automationConfig.delaySeconds}
                    onChange={(e) => updateAutomationConfig({ delaySeconds: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={5}>5 Detik (Cepat)</option>
                    <option value={8}>8 Detik (Rekomendasi Standar WhatsApp)</option>
                    <option value={12}>12 Detik (Sangat Aman)</option>
                    <option value={15}>15 Detik (Maksimal Anti-Spam)</option>
                  </select>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={automationConfig.autoOpenChat}
                        onChange={(e) => updateAutomationConfig({ autoOpenChat: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-700 text-xs">
                        Buka Otomatis Tab WhatsApp Web / App
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1 pl-5">
                      Sistem akan membuka tab WhatsApp baru dengan draf pesan siap kirim.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Queue Table Preview */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-slate-800">
                    Daftar Antrean Kontak Mingguan ({autoQueueLeads.length} Prospek Siap Dikirim)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {sentLeadIds.size} Sudah Dikirim di Sesi Ini
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {autoQueueLeads.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Semua kontak nasabah telah terkirim! Tidak ada antrean baru yang belum dihubungi.
                  </div>
                ) : (
                  autoQueueLeads.slice(0, 15).map((lead, idx) => {
                    const isSent = sentLeadIds.has(lead.id);
                    const isCurrent = isAutoRunning && autoCurrentIndex === idx;

                    return (
                      <div 
                        key={lead.id} 
                        className={`p-2.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                          isCurrent ? 'bg-emerald-50/80 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-slate-400 text-[10px] w-6">#{idx + 1}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{lead.namaUsaha}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-600 text-white font-bold animate-pulse">
                                  Sedang Dikirim
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {lead.wilayahKecamatan} &bull; WA: <span className="font-mono text-slate-700">{lead.noWhatsApp}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lead.rekomendasiProduk === 'Cicil Emas'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {lead.rekomendasiProduk}
                          </span>

                          {isSent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Terkirim
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Dalam Antrean</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Execution Audit Log */}
            {autoLogs.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Catatan Riwayat Pengiriman Otomatis ({autoLogs.length} Pesan)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAutoLogs}
                    className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Bersihkan Riwayat</span>
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 text-[11px]">
                  {autoLogs.map((log) => (
                    <div key={log.id} className="p-2 px-4 flex items-center justify-between text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-900">{log.leadName}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-500">{log.product}</span>
                        <span className="font-mono text-slate-400">({log.phone})</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : activeTab === 'brochures' ? (
          /* Catalog & Upload View */
          <div className="p-5 overflow-y-auto space-y-4">
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Upload & Personalisasi Brosur dari Galeri Anda</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                    AKTIF
                  </span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  Anda dapat mengunggah foto brosur promo langsung dari galeri HP atau laptop Anda untuk nasabah <strong>Cicil Emas (Logam Mulia)</strong> maupun <strong>Pinjaman Usaha (Pembiayaan Modal/Kupedes)</strong>. Brosur yang diunggah akan otomatis disimpan dan digunakan sebagai lampiran pesan resmi WhatsApp nasabah.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['Cicil Emas', 'Pinjaman Usaha', 'Amanah'] as const).map((prodKey) => (
                <BrochureUploadCard
                  key={`${prodKey}-${brochureVersion}`}
                  product={prodKey}
                  onUpdated={() => setBrochureVersion(v => v + 1)}
                  onCopyNotice={onCopyText}
                />
              ))}
            </div>
          </div>
        ) : activeTab === 'all-list' ? (
          /* All Leads Quick Blast Table */
          <div className="p-4 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Klik tombol kirim WhatsApp di samping setiap prospek untuk mengirim pesan profesional beserta brosur gambar:
              </span>
              <span className="text-xs font-mono text-slate-500">
                Total: {validLeads.length} Kontak
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {validLeads.map((lead, idx) => {
                const prod = selectedProductOverride === 'recommended' ? lead.rekomendasiProduk : selectedProductOverride;
                const pData = buildProfessionalWhatsAppMessage({
                  businessName: lead.namaUsaha,
                  product: prod,
                  district: lead.wilayahKecamatan,
                  category: lead.kategoriBisnis,
                  rating: lead.ratingMaps,
                  salesOfficerName: currentUser?.displayName || 'Relationship Officer PT Pegadaian Area Ambon'
                });
                const waUrl = getWhatsAppUrl(lead.noWhatsApp, pData.messageText);
                const isSent = sentLeadIds.has(lead.id);

                return (
                  <div key={lead.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-slate-400 text-[11px] w-6">#{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{lead.namaUsaha}</div>
                        <div className="text-[11px] text-slate-500">
                          {lead.wilayahKecamatan} &bull; WA: <strong className="text-slate-700">{lead.noWhatsApp}</strong> &bull; Rekomendasi: <span className="text-emerald-700 font-semibold">{prod}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terkirim
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Siap</span>
                      )}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setSentLeadIds(prev => new Set(prev).add(lead.id));
                          onUpdateLeadStatus(lead.id, 'Terkirim');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                        <span>Kirim WA & Brosur</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'master-template' ? (
          /* Master Message Template View */
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            
            {/* Header / Intro banner */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-300 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <FileText className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Pusat Pengaturan Master Pesan Dinamis</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px]">
                    OTOMATIS BERUBAH KE SELURUH NASABAH
                  </span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  Ketika Anda mengubah teks Master Pesan di bawah ini lalu menekan tombol <strong>"Simpan Master Pesan"</strong>, seluruh pesan WhatsApp untuk semua usaha dengan rekomendasi produk tersebut ({validLeads.filter(l => l.rekomendasiProduk === masterProductTab).length} prospek) akan <strong>otomatis berubah serentak</strong> menyesuaikan <strong>Nama Usaha</strong> dan <strong>Kecamatan</strong> masing-masing.
                </p>
              </div>
            </div>

            {/* Product Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-700 shrink-0">Pilih Produk:</span>
              {(['Cicil Emas', 'Pinjaman Usaha', 'Amanah'] as const).map(pKey => {
                const count = validLeads.filter(l => l.rekomendasiProduk === pKey).length;
                const isSelected = masterProductTab === pKey;
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => handleMasterProductTabChange(pKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    <span>{pKey}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count} kontak
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Editor & Live Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Column: Template Editor */}
              <div className="lg:col-span-7 space-y-3">
                
                {/* Placeholders Toolbar */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1 text-emerald-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Sisipkan Tag Otomatis ke Master Pesan:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Berubah otomatis per nasabah
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_PLACEHOLDERS.map(p => (
                      <button
                        key={p.tag}
                        type="button"
                        onClick={() => handleInsertMasterTag(p.tag)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-400 text-[11px] font-mono font-semibold transition-all shadow-2xs active:scale-95"
                        title={`${p.desc} (Contoh: ${p.example})`}
                      >
                        <span className="text-emerald-600 font-bold">+</span>
                        <span>{p.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span>Format Master Pesan ({masterProductTab}):</span>
                      {masterSaveNotice && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Tersimpan Otomatis sebagai Default
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {masterEditText.length} karakter
                    </span>
                  </div>
                  <textarea
                    value={masterEditText}
                    onChange={(e) => handleMasterTextChange(e.target.value)}
                    rows={13}
                    className="w-full bg-white border-2 border-emerald-600/70 focus:border-emerald-600 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    placeholder="Ketik draf master pesan di sini..."
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleResetMasterInBlast}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset ke Standar Pegadaian</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {masterSaveNotice && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Master Pesan Berhasil Disimpan!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveMasterInBlast}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                    >
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>Simpan & Terapkan Master Pesan</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Simulated Preview */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Pratinjau Hasil Per Nasabah:</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Otomatis Berubah
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Coba Tampilkan untuk Nama Usaha:
                  </label>
                  <select
                    value={masterPreviewLeadId}
                    onChange={(e) => setMasterPreviewLeadId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {validLeads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.namaUsaha} ({l.wilayahKecamatan} - {l.rekomendasiProduk})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rendered Preview Box */}
                {(() => {
                  const pLead = validLeads.find(l => l.id === masterPreviewLeadId) || validLeads[0];
                  const rendered = pLead ? renderMasterTemplateText(masterEditText, {
                    businessName: pLead.namaUsaha,
                    product: masterProductTab,
                    district: pLead.wilayahKecamatan,
                    category: pLead.kategoriBisnis,
                    rating: pLead.ratingMaps,
                    phone: pLead.noWhatsApp,
                    salesOfficerName: currentUser?.displayName || 'Relationship Officer PT Pegadaian Area Maluku'
                  }) : masterEditText;

                  return (
                    <div className="flex-1 bg-emerald-950/5 border border-emerald-200 rounded-xl p-3 overflow-y-auto max-h-[360px] shadow-inner space-y-2">
                      <div className="text-[10px] font-mono text-emerald-800 font-bold flex items-center justify-between pb-1 border-b border-emerald-200">
                        <span>Penerima: {pLead?.namaUsaha}</span>
                        <span>{pLead?.noWhatsApp}</span>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap shadow-xs border border-slate-200">
                        {rendered}
                      </div>
                    </div>
                  );
                })()}

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Nama usaha dan wilayah langsung terisi dinamis.</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('queue')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Kembali ke Antrian Kirim →
                  </button>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* Sequential Queue View with Full Professional Visual Preview */
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            
            {/* Step Counter & Business Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    Antrian #{currentIndex + 1} / {validLeads.length}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200">
                    Produk: {effectiveProduct}
                  </span>
                  <span className="text-xs text-slate-500">
                    Skor: <strong>{currentLead?.skorKelayakan}</strong>
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mt-1">
                  {currentLead?.namaUsaha}
                </h4>
                <p className="text-xs text-slate-600">
                  {currentLead?.wilayahKecamatan} &bull; {currentLead?.kategoriBisnis} &bull; WA: <strong className="text-slate-900">{currentLead?.noWhatsApp}</strong>
                </p>
              </div>

              {/* Status pill */}
              <div className="text-right shrink-0">
                {currentLead && sentLeadIds.has(currentLead.id) ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Pesan Sudah Dikirim
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-200/80 px-3 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Siap Dikirim
                  </span>
                )}
              </div>
            </div>

            {/* Campaign Product Override Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilih Format Penawaran Produk:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedProductOverride('recommended')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedProductOverride === 'recommended'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Rekomendasi AI ({currentLead?.rekomendasiProduk})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProductOverride('Cicil Emas')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedProductOverride === 'Cicil Emas'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🥇 Cicil Emas (Galeri 24/Antam/UBS)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProductOverride('Pinjaman Usaha')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedProductOverride === 'Pinjaman Usaha'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  💼 Pinjaman Usaha / Kupedes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProductOverride('Amanah')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedProductOverride === 'Amanah'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🚗 Amanah Syariah
                </button>
              </div>
            </div>

            {/* Split View: Text Message Preview & Visual Image Brochure */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Text Area (Editable & Customizable) */}
              <div className="md:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Teks Pesan WhatsApp Profesional:</span>
                    {isCurrentMessageEdited && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Diedit Kustom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrentMessageEdited && (
                      <button
                        type="button"
                        onClick={handleResetMessageToDefault}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                        title="Kembalikan isi pesan ke template standar Pegadaian"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMasterProductTab(effectiveProduct);
                        setActiveTab('master-template');
                      }}
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 transition-colors shadow-2xs"
                      title={`Ubah Master Pesan untuk produk ${effectiveProduct} (otomatis ubah seluruh nasabah ${effectiveProduct})`}
                    >
                      <Sliders className="w-3 h-3 text-amber-600" />
                      <span>Master Pesan ({effectiveProduct})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingMessage(prev => !prev)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                      title="Klik untuk mengedit atau menyunting langsung kata-kata pesan ini"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingMessage ? 'Selesai Edit' : 'Sunting / Edit Teks'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onCopyText(effectiveMessageText, 'Teks Pesan WhatsApp')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin Pesan</span>
                    </button>
                  </div>
                </div>

                {isEditingMessage ? (
                  <div className="space-y-1.5">
                    <textarea
                      value={effectiveMessageText}
                      onChange={(e) => handleMessageChange(e.target.value)}
                      rows={14}
                      className="w-full bg-white border-2 border-emerald-500 rounded-xl p-3 text-xs text-slate-800 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="Ketik atau ubah pesan WhatsApp resmi Anda di sini..."
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Tip: Gunakan tanda bintang (*) untuk teks tebal dan garis bawah (_) untuk teks miring.</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingMessage(false)}
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        Tutup Editor ✓
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditingMessage(true)}
                    className="bg-emerald-50/50 hover:bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap max-h-72 overflow-y-auto cursor-pointer transition-colors group relative"
                    title="Klik di sini kapan saja untuk menyunting pesan"
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 shadow-xs border border-slate-200 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-blue-600" />
                      <span>Klik untuk sunting</span>
                    </div>
                    {effectiveMessageText}
                  </div>
                )}
              </div>

              {/* Accompanying Image Brochure Card */}
              <div className="md:col-span-5 space-y-2">
                <input
                  ref={quickFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQuickUploadFromGallery}
                  className="hidden"
                />

                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>Brosur Gambar:</span>
                    {currentBrochure.isCustom ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white">
                        Galeri Anda (Aktif)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-normal bg-slate-200 text-slate-600">
                        Default Resmi
                      </span>
                    )}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => quickFileInputRef.current?.click()}
                    disabled={isQuickUploading}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                    title="Ganti brosur dengan foto/gambar dari galeri HP atau laptop Anda"
                  >
                    {isQuickUploading ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>{isQuickUploading ? 'Memuat...' : 'Upload Galeri'}</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <div className="relative h-36 bg-slate-100 overflow-hidden group">
                    <img 
                      src={currentBrochure.bannerUrl} 
                      alt={currentBrochure.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end justify-between p-2.5">
                      <span className="text-[11px] font-bold text-amber-300 leading-tight drop-shadow-xs">
                        {currentBrochure.title}
                      </span>
                    </div>

                    {/* Quick hover trigger to upload */}
                    <div 
                      onClick={() => quickFileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/50 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-1.5"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Klik untuk Ganti dari Galeri</span>
                    </div>
                  </div>

                  <div className="p-3 text-[11px] space-y-2 text-slate-600 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{currentBrochure.badge}</span>
                      {currentBrochure.isCustom && (
                        <button
                          type="button"
                          onClick={handleResetCurrentBrochure}
                          className="text-[10px] text-slate-500 hover:text-rose-600 flex items-center gap-0.5 underline"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Reset ke Default</span>
                        </button>
                      )}
                    </div>

                    <ul className="space-y-1">
                      {currentBrochure.highlights.slice(0, 2).map((hl, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{hl}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Professional WhatsApp Picture Guide */}
                    <div className="bg-emerald-100/70 border border-emerald-300/70 rounded-lg p-2 text-[10px] text-emerald-950 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-emerald-900">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Cara Gambar Tampil Cantik di WhatsApp:</span>
                      </div>
                      <p className="leading-snug text-slate-700">
                        1. Klik tombol <strong>Salin Gambar</strong> di bawah.<br />
                        2. Di chat WhatsApp nasabah, tekan <strong>Ctrl + V</strong> (Paste) sehingga foto terlampir penuh layaknya akun Pegadaian Business resmi!
                      </p>
                    </div>

                    {/* Action buttons under card */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyImageAction}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95"
                        title="Salin gambar ke clipboard agar siap ditempel (Ctrl+V) di WhatsApp Web atau aplikasi WA"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Gambar (Ctrl+V di WA)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadBrochureImage(currentBrochure.bannerUrl, currentBrochure.downloadFilename)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-semibold text-slate-700 transition-colors"
                        title="Unduh file gambar brosur ini ke perangkat Anda"
                      >
                        <Download className="w-3 h-3 text-slate-500" />
                        <span>Unduh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('brochures')}
                        className="text-[10px] font-bold text-emerald-700 hover:underline px-1"
                      >
                        Katalog →
                      </button>
                    </div>

                    {copiedImageBanner && (
                      <div className="p-2 rounded bg-emerald-600 text-white text-[11px] font-medium text-center animate-in fade-in shadow-xs">
                        {copiedImageBanner}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Anti-Spam Safety Advice */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Standar Keamanan Anti-Blokir WhatsApp Meta:</strong> Sistem membuka sesi per nomor dengan interval klik manusiawi. Teks otomatis dilengkapi link gambar brosur resmi berkualitas tinggi (Galeri 24 / Antam / UBS) yang langsung muncul pratinjaunya di chat WhatsApp nasabah.
              </span>
            </div>

          </div>
        )}

        {/* Footer Navigation & Blast Action */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0 || activeTab !== 'queue'}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              ← Kontak Sebelumnya
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(validLeads.length - 1, prev + 1))}
              disabled={currentIndex >= validLeads.length - 1 || activeTab !== 'queue'}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              Kontak Berikutnya →
            </button>
          </div>

          {activeTab === 'automation' ? (
            <div className="flex items-center gap-2">
              {isAutoRunning ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    <span>Otomatisasi Berjalan ({autoCurrentIndex + 1}/{autoQueueLeads.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handlePauseAutomation}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Jeda</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStopAutomation}
                    className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                  >
                    Hentikan
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartAutomation}
                    disabled={autoQueueLeads.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-emerald-500/40 disabled:opacity-40"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Jalankan Siklus Mingguan Sekarang ({autoQueueLeads.length} Kontak)</span>
                  </button>
                </div>
              )}
            </div>
          ) : currentLead && activeTab === 'queue' ? (
            <div className="flex items-center gap-2">
              <a
                href={currentWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleMarkSentAndNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-emerald-500/40"
              >
                <Send className="w-4 h-4" />
                <span>Kirim WhatsApp Sekarang ({currentIndex + 1} dari {validLeads.length})</span>
              </a>
            </div>
          ) : null}

        </div>

      </div>
    </div>
  );
};
