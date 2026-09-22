import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Table, FileText, BarChart3, Download, Copy, Check, Sparkles, Building2, Layers, Radar, Kanban, Send, Terminal, Sparkle, Globe, Flame, Upload, Zap } from 'lucide-react';
import { BusinessLead, ExtractionResponse, LeadPlatform, AmbonFocalPoint } from './types';
import { INITIAL_AMBON_LEADS } from './data/ambonDirectory';
import { queryVerifiedAmbonDirectory } from './data/ambonRealPlaces';
import { queryVerifiedSocialMediaLeads } from './data/ambonSocialMediaLeads';
import { AMBON_FOCAL_POINTS, AMBON_RADIUS_OPTIONS, calculateHaversineDistanceKm } from './data/ambonGeoConfig';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { RadiusScanPanel } from './components/RadiusScanPanel';
import { LeadTable } from './components/LeadTable';
import { PipelineKanbanView } from './components/PipelineKanbanView';
import { AnalyticsView } from './components/AnalyticsView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { DevConsoleModal } from './components/DevConsoleModal';
import { AIScriptGeneratorModal } from './components/AIScriptGeneratorModal';
import { BulkOutreachModal } from './components/BulkOutreachModal';
import { WhatsAppBlastModal } from './components/WhatsAppBlastModal';
import { GroundedIntelligenceModal } from './components/GroundedIntelligenceModal';
import { auth, db, signInWithGoogle, logOut, testFirestoreConnection } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { exportToCSV, generateMarkdownTable, isMobilePhone } from './utils/exporters';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [isGroundingModalOpen, setIsGroundingModalOpen] = useState<boolean>(false);

  const [leads, setLeads] = useState<BusinessLead[]>(() => {
    try {
      localStorage.removeItem('pegadaian_ambon_leads_v2');
      localStorage.removeItem('pegadaian_ambon_leads_v3');
      localStorage.removeItem('pegadaian_ambon_leads_v4');
      localStorage.removeItem('pegadaian_ambon_leads_v5');
      const cached = localStorage.getItem('pegadaian_ambon_leads_v6');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Clean any old signature text if present
          const sanitized = parsed.map((l: BusinessLead) => {
            if (l.drafPesanWAPertama && l.drafPesanWAPertama.includes('Unit Bisnis Mikro & Keagenan Area Ambon')) {
              return {
                ...l,
                drafPesanWAPertama: l.drafPesanWAPertama.replace(
                  /(\*PT PEGADAIAN \(PERSERO\)\*[\s\S]*📞 Hotline Resmi:[^\n]*|Hormat kami,[\s\S]*📞 Hotline Resmi:[^\n]*)/gi,
                  `Hormat kami,\n\nRelationship Officer\nPT Pegadaian Area Maluku`
                )
              };
            }
            return l;
          });
          return sanitized;
        }
      }
    } catch (err) {
      console.warn('Failed to parse cached leads:', err);
    }
    return INITIAL_AMBON_LEADS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<LeadPlatform | 'all'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('Semua Wilayah');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedProduct, setSelectedProduct] = useState('Semua Produk');
  const [selectedContactFilter, setSelectedContactFilter] = useState('Semua Saluran Kontak');
  const [minScore, setMinScore] = useState(0);

  // Manual Radius & Focal Location State
  const [selectedRadiusMeters, setSelectedRadiusMeters] = useState<number>(3000);
  const [selectedFocalPoint, setSelectedFocalPoint] = useState<AmbonFocalPoint>(AMBON_FOCAL_POINTS[0]);
  const [customLat, setCustomLat] = useState<number>(-3.6974);
  const [customLon, setCustomLon] = useState<number>(128.1812);
  const [isCustomLocation, setIsCustomLocation] = useState<boolean>(false);
  const [showRadiusPanel, setShowRadiusPanel] = useState<boolean>(false);
  const [hasSerperKey, setHasSerperKey] = useState<boolean>(false);
  
  const [activeTab, setActiveTab] = useState<'table' | 'kanban' | 'analytics'>('table');
  const [selectedLead, setSelectedLead] = useState<BusinessLead | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state: Developer Console, AI Script Pitch, Bulk Outreach, WhatsApp Blast
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);
  const [isBulkOutreachOpen, setIsBulkOutreachOpen] = useState(false);
  const [isWhatsAppBlastOpen, setIsWhatsAppBlastOpen] = useState(false);
  const [whatsAppBlastInitialTab, setWhatsAppBlastInitialTab] = useState<'queue' | 'all-list' | 'brochures' | 'master-template' | 'automation'>('queue');
  const [aiPitchLead, setAiPitchLead] = useState<BusinessLead | null>(null);

  // Check backend server config on mount
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.hasSerperKey === 'boolean') {
          setHasSerperKey(data.hasSerperKey);
        }
      })
      .catch(err => console.warn('Could not query /api/config:', err));

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        showToast(`Selamat datang, ${user.displayName || user.email}! Sesi Pegadaian aktif.`);
        syncFromFirestore();
      }
    });

    testFirestoreConnection();

    return () => unsubscribeAuth();
  }, []);

  // Sync leads from Firestore if available
  const syncFromFirestore = async () => {
    try {
      setIsSyncingCloud(true);
      const querySnapshot = await getDocs(collection(db, 'leads'));
      if (!querySnapshot.empty) {
        const cloudLeads: BusinessLead[] = [];
        querySnapshot.forEach(docSnap => {
          cloudLeads.push(docSnap.data() as BusinessLead);
        });
        if (cloudLeads.length > 0) {
          setLeads(prev => {
            const cloudIds = new Set(cloudLeads.map(l => l.id));
            const merged = [...cloudLeads, ...prev.filter(l => !cloudIds.has(l.id))];
            return merged;
          });
          showToast(`Tersinkronisasi ${cloudLeads.length} data prospek dari cloud Firestore.`);
        }
      }
    } catch (e) {
      console.warn('Firestore sync note:', e);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Sync specific lead update to Firestore
  const syncLeadToFirestore = async (leadId: string, partial: Partial<BusinessLead>) => {
    if (!currentUser) return;
    try {
      setIsSyncingCloud(true);
      const leadRef = doc(db, 'leads', leadId);
      await setDoc(leadRef, {
        ...partial,
        id: leadId,
        updatedBy: currentUser.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Sync lead to firestore error:', e);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleSignInGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      showToast('Gagal masuk dengan Google: ' + (error?.message || 'Error'));
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await logOut();
      showToast('Sesi akun telah keluar.');
    } catch (error: any) {
      showToast('Gagal keluar akun: ' + (error?.message || 'Error'));
    }
  };

  // Helper for toast notifications
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} berhasil disalin ke clipboard!`);
  };

  // Trigger Extraction via Multi-Platform API with Manual Radius & Geolocation
  const handleExtractLeads = async (
    keyword: string, 
    district?: string, 
    mode: 'search' | 'full_scan' = 'search',
    platformToScan?: LeadPlatform | 'all',
    radiusOverride?: number
  ) => {
    const targetPlatform = platformToScan || selectedPlatform;
    const activeRadius = radiusOverride || selectedRadiusMeters;
    const activeLat = isCustomLocation ? customLat : selectedFocalPoint.lat;
    const activeLon = isCustomLocation ? customLon : selectedFocalPoint.lon;
    const activeCenterName = isCustomLocation ? 'Koordinat Kustom Pengguna' : selectedFocalPoint.name;

    setIsExtracting(true);
    showToast(`Memindai real-time Kota Ambon (${targetPlatform === 'all' ? 'Multi-Platform' : targetPlatform}, Radius: ${activeRadius / 1000} km)...`);

    try {
      const response = await fetch('/api/extract-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          district: district || selectedDistrict,
          mode,
          platform: targetPlatform,
          count: mode === 'full_scan' ? 30 : 18,
          radiusMeters: activeRadius,
          centerLat: activeLat,
          centerLon: activeLon,
          centerName: activeCenterName
        })
      });

      const data: ExtractionResponse = await response.json();

      if (data.success && data.leads && data.leads.length > 0) {
        setLeads((prev) => {
          const existingIds = new Set(prev.map(l => l.id));
          const existingNames = new Set(prev.map(l => l.namaUsaha.toLowerCase().trim()));
          
          const newEntries = data.leads.filter(l => 
            !existingIds.has(l.id) && !existingNames.has(l.namaUsaha.toLowerCase().trim())
          );

          let nextIndex = prev.length + 1;
          const sanitizedNew = newEntries.map(l => ({
            ...l,
            id: l.id.startsWith('AMB-') || l.id.startsWith('LIVE-') ? l.id : `AMB-${String(nextIndex++).padStart(3, '0')}`,
            distanceKm: l.distanceKm !== undefined 
              ? l.distanceKm 
              : calculateHaversineDistanceKm(activeLat, activeLon, l.latitude || activeLat, l.longitude || activeLon)
          }));

          const updated = [...sanitizedNew, ...prev];
          try {
            localStorage.setItem('pegadaian_ambon_leads_v6', JSON.stringify(updated));
          } catch (e) {
            console.warn(e);
          }
          return updated;
        });

        const engineLabel = data.source === 'serper_live' 
          ? 'Serper.dev Google Maps API' 
          : data.source === 'overpass_live'
          ? 'OpenStreetMap Overpass Geolocation Ambon'
          : 'Direktori Terverifikasi Ambon';

        showToast(`Berhasil memindai ${data.leads.length} entitas [${engineLabel}] dalam radius ${activeRadius / 1000} km!`);
      } else {
        loadVerifiedRealLeads(keyword, district || selectedDistrict, mode, targetPlatform);
      }
    } catch (err) {
      console.warn('Backend call failed, using verified multi-platform database:', err);
      loadVerifiedRealLeads(keyword, district || selectedDistrict, mode, targetPlatform);
    } finally {
      setIsExtracting(false);
    }
  };

  // Direct loader of 100% verified real Kota Ambon entities
  const loadVerifiedRealLeads = (keyword: string, targetDistrict: string, mode: string, platformTarget: LeadPlatform | 'all') => {
    let verifiedList: BusinessLead[] = [];
    if (platformTarget === 'Google Maps') {
      verifiedList = queryVerifiedAmbonDirectory(keyword, targetDistrict, mode === 'full_scan' ? 18 : 8);
    } else if (platformTarget === 'all') {
      const mapsLeads = queryVerifiedAmbonDirectory(keyword, targetDistrict, 10);
      const socialLeads = queryVerifiedSocialMediaLeads(keyword, targetDistrict, 'all');
      verifiedList = [...socialLeads, ...mapsLeads];
    } else {
      verifiedList = queryVerifiedSocialMediaLeads(keyword, targetDistrict, platformTarget);
    }
    
    setLeads((prev) => {
      const existingNames = new Set(prev.map(l => l.namaUsaha.toLowerCase().trim()));
      const newItems = verifiedList.filter(l => !existingNames.has(l.namaUsaha.toLowerCase().trim()));
      
      if (newItems.length === 0) {
        showToast(`Semua entitas terverifikasi untuk '${keyword}' sudah tercantum di tabel.`);
        return prev;
      }

      let nextIndex = prev.length + 1;
      const renumbered = newItems.map(l => ({
        ...l,
        id: l.id.startsWith('AMB-') ? l.id : `AMB-${String(nextIndex++).padStart(3, '0')}`
      }));

      const updated = [...prev, ...renumbered];
      try {
        localStorage.setItem('pegadaian_ambon_leads_v6', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      showToast(`Berhasil memuat ${renumbered.length} entitas usaha terverifikasi Kota Ambon!`);
      return updated;
    });
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Platform Filter
      if (selectedPlatform !== 'all') {
        const leadPlat = lead.platformSumber || 'Google Maps';
        if (leadPlat !== selectedPlatform) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.namaUsaha.toLowerCase().includes(q);
        const matchCat = lead.kategoriBisnis.toLowerCase().includes(q);
        const matchDistrict = lead.wilayahKecamatan.toLowerCase().includes(q);
        const matchDraft = lead.drafPesanWAPertama.toLowerCase().includes(q);
        const matchProduct = lead.rekomendasiProduk.toLowerCase().includes(q);
        const matchHandle = lead.socialHandle ? lead.socialHandle.toLowerCase().includes(q) : false;
        if (!matchName && !matchCat && !matchDistrict && !matchDraft && !matchProduct && !matchHandle) {
          return false;
        }
      }

      // District
      if (selectedDistrict !== 'Semua Wilayah') {
        const districtKey = selectedDistrict.toLowerCase();
        if (!lead.wilayahKecamatan.toLowerCase().includes(districtKey)) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'Semua Kategori') {
        if (lead.kategoriBisnis !== selectedCategory) {
          return false;
        }
      }

      // Product
      if (selectedProduct !== 'Semua Produk') {
        if (lead.rekomendasiProduk !== selectedProduct) {
          return false;
        }
      }

      // Score
      if (lead.skorKelayakan < minScore) {
        return false;
      }

      // Contact Channel
      if (selectedContactFilter === '🟢 WA Aktif (08xx)') {
        if (!lead.noWhatsApp || !isMobilePhone(lead.noWhatsApp)) {
          return false;
        }
      } else if (selectedContactFilter === '📞 Telepon Kantor (0911)') {
        if (lead.noWhatsApp && isMobilePhone(lead.noWhatsApp)) {
          return false;
        }
      }

      return true;
    });
  }, [leads, selectedPlatform, searchQuery, selectedDistrict, selectedCategory, selectedProduct, selectedContactFilter, minScore]);

  const handleUpdateDraft = (leadId: string, newDraft: string) => {
    setLeads(prev => {
      const updated = prev.map(l => l.id === leadId ? { ...l, drafPesanWAPertama: newDraft } : l);
      try {
        localStorage.setItem('pegadaian_ambon_leads_v6', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return updated;
    });
    showToast(`Draf pesan WA untuk ${leadId} berhasil diperbarui.`);
  };

  const handleUpdateContact = (leadId: string, updates: { noWhatsApp?: string; noTeleponMaps?: string }) => {
    setLeads(prev => {
      const updated = prev.map(l => l.id === leadId ? { ...l, ...updates } : l);
      try {
        localStorage.setItem('pegadaian_ambon_leads_v6', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return updated;
    });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
    }
    syncLeadToFirestore(leadId, updates);
    showToast(`Nomor kontak untuk ${leadId} berhasil diperbarui.`);
  };

  const handleUpdateLeadStatus = (
    leadId: string, 
    newStatus: 'Belum Dihubungi' | 'Terkirim' | 'Merespon' | 'Closing'
  ) => {
    setLeads(prev => {
      const updated = prev.map(l => l.id === leadId ? { ...l, statusKontak: newStatus } : l);
      try {
        localStorage.setItem('pegadaian_ambon_leads_v6', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return updated;
    });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, statusKontak: newStatus } : null);
    }
    syncLeadToFirestore(leadId, { statusKontak: newStatus });
    showToast(`Status prospek ${leadId} diubah ke: ${newStatus}`);
  };

  const handleUpdateLeadNotesAndStatus = (
    leadId: string,
    updates: {
      statusKontak?: 'Belum Dihubungi' | 'Terkirim' | 'Merespon' | 'Closing';
      catatanSales?: string;
    }
  ) => {
    setLeads(prev => {
      const updated = prev.map(l => l.id === leadId ? { ...l, ...updates } : l);
      try {
        localStorage.setItem('pegadaian_ambon_leads_v6', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      return updated;
    });
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
    }
    syncLeadToFirestore(leadId, updates);
    showToast(`Catatan & status untuk ${leadId} berhasil disimpan.`);
  };

  const handleResetToOfficialData = () => {
    localStorage.removeItem('pegadaian_ambon_leads_v2');
    localStorage.removeItem('pegadaian_ambon_leads_v3');
    localStorage.removeItem('pegadaian_ambon_leads_v4');
    localStorage.removeItem('pegadaian_ambon_leads_v5');
    localStorage.removeItem('pegadaian_ambon_leads_v6');
    setLeads(INITIAL_AMBON_LEADS);
    setSelectedPlatform('all');
    showToast('Data berhasil disinkronkan kembali ke database terverifikasi multi-platform.');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPlatform('all');
    setSelectedDistrict('Semua Wilayah');
    setSelectedCategory('Semua Kategori');
    setSelectedProduct('Semua Produk');
    setSelectedContactFilter('Semua Saluran Kontak');
    setMinScore(0);
    showToast('Semua filter telah direset.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Brand Header */}
      <Header
        leads={leads}
        onTriggerFullScan={() => handleExtractLeads('Full Scan Kota Ambon', 'Semua Wilayah', 'full_scan', selectedPlatform)}
        isExtracting={isExtracting}
        currentUser={currentUser}
        onSignInWithGoogle={handleSignInGoogle}
        onSignOut={handleSignOutGoogle}
        isSyncingCloud={isSyncingCloud}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Filter & Control Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPlatform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          selectedDistrict={selectedDistrict}
          onDistrictChange={setSelectedDistrict}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          selectedContactFilter={selectedContactFilter}
          onContactFilterChange={setSelectedContactFilter}
          minScore={minScore}
          onMinScoreChange={setMinScore}
          selectedRadiusMeters={selectedRadiusMeters}
          onRadiusChange={setSelectedRadiusMeters}
          selectedFocalPoint={selectedFocalPoint}
          onFocalPointChange={setSelectedFocalPoint}
          showRadiusPanel={showRadiusPanel}
          onToggleRadiusPanel={() => setShowRadiusPanel(!showRadiusPanel)}
          onTriggerExtraction={(kw, plat) => handleExtractLeads(kw, selectedDistrict, 'search', plat)}
          isExtracting={isExtracting}
          onResetFilters={handleResetFilters}
        />

        {/* Real-Time Google Maps Radius & Geolocation Radar Panel */}
        {showRadiusPanel && (selectedPlatform === 'Google Maps' || selectedPlatform === 'all') && (
          <RadiusScanPanel
            selectedRadiusMeters={selectedRadiusMeters}
            onRadiusChange={setSelectedRadiusMeters}
            selectedFocalPoint={selectedFocalPoint}
            onFocalPointChange={setSelectedFocalPoint}
            customLat={customLat}
            customLon={customLon}
            onCustomCoordsChange={(lat, lon) => {
              setCustomLat(lat);
              setCustomLon(lon);
            }}
            isCustomLocation={isCustomLocation}
            setIsCustomLocation={setIsCustomLocation}
            onTriggerScan={() => handleExtractLeads(searchQuery || 'Semua Usaha', selectedDistrict, 'search', selectedPlatform)}
            isExtracting={isExtracting}
            hasSerperKey={hasSerperKey}
          />
        )}

        {/* View Switcher Tabs & Quick Export Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          
          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-2xl w-fit flex-wrap gap-1 border border-slate-300/50 shadow-2xs">
            
            <button
              id="tab-table"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'table'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tabel Data</span>
              <span className="ml-1 px-2 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-mono font-bold">
                {filteredLeads.length}
              </span>
            </button>

            <button
              id="tab-kanban"
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'kanban'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pipeline CRM</span>
            </button>

            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
              <span>Ringkasan Portofolio</span>
            </button>

          </div>

          {/* Action Export Buttons & Bulk Outreach */}
          <div className="flex items-center gap-2">
            
            <button
              id="btn-whatsapp-blast"
              type="button"
              onClick={() => {
                setWhatsAppBlastInitialTab('queue');
                setIsWhatsAppBlastOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 border border-emerald-600/40"
              title="Kirim Pesan WhatsApp Massal beserta Brosur Gambar"
            >
              <Send className="w-3.5 h-3.5 text-emerald-200" />
              <span>WhatsApp Blast</span>
            </button>

            <button
              id="btn-whatsapp-automation"
              type="button"
              onClick={() => {
                setWhatsAppBlastInitialTab('automation');
                setIsWhatsAppBlastOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 border border-amber-400/50"
              title="Otomatisasi Kirim Pesan WhatsApp Mingguan Terjadwal"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>Automation Mingguan</span>
            </button>

            <button
              onClick={() => exportToCSV(filteredLeads)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
              title="Download Data Format CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={handleResetToOfficialData}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300/80 text-slate-700 text-xs font-medium rounded-xl transition-colors shadow-2xs"
              title="Kembalikan data ke daftar awal"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset Data</span>
            </button>
          </div>

        </div>

        {/* Tab Views Content */}
        {activeTab === 'table' && (
          <LeadTable
            leads={filteredLeads}
            onSelectLead={(lead) => setSelectedLead(lead)}
            onCopyText={handleCopyText}
            onUpdateContact={handleUpdateContact}
            onOpenAIScript={(lead) => setAiPitchLead(lead)}
          />
        )}

        {activeTab === 'kanban' && (
          <PipelineKanbanView
            leads={filteredLeads}
            onSelectLead={(lead) => setSelectedLead(lead)}
            onUpdateStatus={handleUpdateLeadStatus}
            onOpenAIScript={(lead) => setAiPitchLead(lead)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            leads={filteredLeads}
            onCopyText={handleCopyText}
          />
        )}

      </main>

      {/* Detail & Outreach Modal */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onCopyText={handleCopyText}
        onUpdateDraft={handleUpdateDraft}
        onUpdateContact={handleUpdateContact}
        onUpdateNotesAndStatus={handleUpdateLeadNotesAndStatus}
        onOpenAIScript={(lead) => setAiPitchLead(lead)}
      />

      {/* Developer Source Code & Console Modal */}
      <DevConsoleModal
        isOpen={isDevConsoleOpen}
        onClose={() => setIsDevConsoleOpen(false)}
      />

      {/* AI Personalized Script Generator Modal */}
      <AIScriptGeneratorModal
        isOpen={!!aiPitchLead}
        onClose={() => setAiPitchLead(null)}
        lead={aiPitchLead}
        onApplyDraftToLead={(leadId, updatedDraft) => {
          handleUpdateDraft(leadId, updatedDraft);
          setAiPitchLead(null);
        }}
        onCopyText={handleCopyText}
      />

      {/* Sequential Bulk WhatsApp Outreach Modal */}
      <BulkOutreachModal
        isOpen={isBulkOutreachOpen}
        onClose={() => setIsBulkOutreachOpen(false)}
        leads={filteredLeads}
        onUpdateLeadStatus={handleUpdateLeadStatus}
        onCopyText={handleCopyText}
      />

      {/* WhatsApp Blast Pro with Official Brochures & Images */}
      <WhatsAppBlastModal
        isOpen={isWhatsAppBlastOpen}
        onClose={() => setIsWhatsAppBlastOpen(false)}
        leads={filteredLeads}
        onUpdateLeadStatus={handleUpdateLeadStatus}
        onUpdateLeadDraft={handleUpdateDraft}
        onCopyText={handleCopyText}
        currentUser={currentUser}
        initialTab={whatsAppBlastInitialTab}
      />

      {/* Google Maps & Search Grounding Intelligence Modal (gemini-3.5-flash) */}
      <GroundedIntelligenceModal
        isOpen={isGroundingModalOpen}
        onClose={() => setIsGroundingModalOpen(false)}
        defaultDistrict={selectedDistrict === 'Semua Wilayah' ? 'Sirimau' : selectedDistrict}
        defaultQuery={searchQuery}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-slate-700">PT Pegadaian (Persero) Area Ambon</span>
            <span>&bull;</span>
            <span>Sistem Direktori & AI Profiling UMKM Maluku</span>
          </div>
          <div>
            Data tersinkronisasi untuk unit kerja Sirimau, Baguala, Teluk Ambon, Nusaniwe, dan Leitimur Selatan.
          </div>
        </div>
      </footer>

    </div>
  );
}
