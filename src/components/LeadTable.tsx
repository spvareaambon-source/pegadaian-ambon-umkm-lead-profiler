import React, { useState } from 'react';
import { Star, MessageCircle, Copy, Check, ExternalLink, Info, ArrowUpDown, MapPin, Phone, Pencil, X, Save, Search, Smartphone, PhoneCall, Plus, Instagram, Facebook, Video, Globe, Navigation, Radar, Sparkles, Image as ImageIcon } from 'lucide-react';
import { BusinessLead } from '../types';
import { getWhatsAppUrl, getGoogleMapsUrl, isMobilePhone } from '../utils/exporters';
import { buildProfessionalWhatsAppMessage } from '../data/pegadaianBrochures';

interface LeadTableProps {
  leads: BusinessLead[];
  onSelectLead: (lead: BusinessLead) => void;
  onCopyText: (text: string, label: string) => void;
  onUpdateContact?: (leadId: string, updates: { noWhatsApp?: string; noTeleponMaps?: string }) => void;
  onOpenAIScript?: (lead: BusinessLead) => void;
}

type SortField = 'id' | 'namaUsaha' | 'ratingMaps' | 'skorKelayakan' | 'wilayahKecamatan';

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onSelectLead,
  onCopyText,
  onUpdateContact,
  onOpenAIScript
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('skorKelayakan');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Quick Contact Edit State
  const [editingLead, setEditingLead] = useState<BusinessLead | null>(null);
  const [tempMapsPhone, setTempMapsPhone] = useState('');
  const [tempWhatsApp, setTempWhatsApp] = useState('');

  const handleCopyDraft = (lead: BusinessLead) => {
    onCopyText(lead.drafPesanWAPertama, `Draf WA ${lead.namaUsaha}`);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for scores/ratings
    }
  };

  const handleStartEdit = (lead: BusinessLead, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLead(lead);
    setTempMapsPhone(lead.noTeleponMaps || '');
    setTempWhatsApp(lead.noWhatsApp || '');
  };

  const handleSaveContact = () => {
    if (!editingLead) return;
    if (onUpdateContact) {
      onUpdateContact(editingLead.id, {
        noTeleponMaps: tempMapsPhone.trim(),
        noWhatsApp: tempWhatsApp.trim()
      });
    }
    setEditingLead(null);
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'id') {
      comparison = a.id.localeCompare(b.id);
    } else if (sortField === 'namaUsaha') {
      comparison = a.namaUsaha.localeCompare(b.namaUsaha);
    } else if (sortField === 'ratingMaps') {
      comparison = a.ratingMaps - b.ratingMaps;
    } else if (sortField === 'skorKelayakan') {
      comparison = a.skorKelayakan - b.skorKelayakan;
    } else if (sortField === 'wilayahKecamatan') {
      comparison = a.wilayahKecamatan.localeCompare(b.wilayahKecamatan);
    }
    return sortAsc ? comparison : -comparison;
  });

  const getProductBadgeColor = (prod: string) => {
    switch (prod) {
      case 'Amanah':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Pinjaman Usaha':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'Cicil Emas':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'text-emerald-800 bg-emerald-50 border-emerald-300';
    if (score >= 75) return 'text-teal-800 bg-teal-50 border-teal-300';
    if (score >= 65) return 'text-amber-800 bg-amber-50 border-amber-300';
    return 'text-slate-700 bg-slate-100 border-slate-300';
  };

  const renderPlatformBadge = (lead: BusinessLead) => {
    const plat = lead.platformSumber || 'Google Maps';
    switch (plat) {
      case 'TikTok':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950 text-white border border-slate-800">
            <Video className="w-2.5 h-2.5 text-pink-400" />
            TikTok
          </span>
        );
      case 'Instagram':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Instagram className="w-2.5 h-2.5 text-rose-600" />
            Instagram
          </span>
        );
      case 'Facebook':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Facebook className="w-2.5 h-2.5 text-blue-600" />
            Facebook
          </span>
        );
      case 'Google Maps':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <MapPin className="w-2.5 h-2.5 text-teal-600" />
            Maps
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      
      {/* Table Notice Header */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-800">
            Direktori Terverifikasi UMKM Kota Ambon
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300">
            Real-Time Data
          </span>
        </div>
        <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
            🟢 WA Aktif: 08xx
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-medium border border-blue-200">
            📞 Telp Kantor: PSTN (0911)
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          
          {/* Exact Required Headers */}
          <thead>
            <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th 
                className="py-3.5 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  ID
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              
              <th 
                className="py-3.5 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors min-w-[220px]"
                onClick={() => handleSort('namaUsaha')}
              >
                <div className="flex items-center gap-1">
                  Nama Usaha & Platform
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3.5 px-3.5 min-w-[110px]">
                Kategori Bisnis
              </th>

              <th 
                className="py-3.5 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors min-w-[130px]"
                onClick={() => handleSort('wilayahKecamatan')}
              >
                <div className="flex items-center gap-1">
                  Wilayah/Kecamatan
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3.5 px-3.5 min-w-[180px]">
                No. WhatsApp/Telepon
              </th>

              <th 
                className="py-3.5 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors min-w-[90px]"
                onClick={() => handleSort('ratingMaps')}
              >
                <div className="flex items-center gap-1">
                  Rating / Audien
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th 
                className="py-3.5 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors min-w-[120px]"
                onClick={() => handleSort('skorKelayakan')}
              >
                <div className="flex items-center gap-1">
                  Skor Kelayakan (1-100)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3.5 px-3.5 min-w-[130px]">
                Produk Pegadaian
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <p className="font-semibold text-slate-700">Tidak ada entitas yang sesuai dengan filter.</p>
                    <p className="text-slate-400 text-xs mt-1">Coba sesuaikan kata kunci pencarian atau pilihan kecamatan.</p>
                  </div>
                </td>
              </tr>
            ) : sortedLeads.map((lead) => {
              const profData = buildProfessionalWhatsAppMessage({
                businessName: lead.namaUsaha,
                product: lead.rekomendasiProduk,
                district: lead.wilayahKecamatan,
                category: lead.kategoriBisnis,
                rating: lead.ratingMaps
              });
              const waUrl = getWhatsAppUrl(lead.noWhatsApp, profData.messageText);
              const isCopied = copiedId === lead.id;
              const mapsUrl = lead.googleMapsUrl || getGoogleMapsUrl(lead.namaUsaha, lead.wilayahKecamatan, lead.alamatLengkap);

              return (
                <tr 
                  key={lead.id}
                  className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectLead(lead)}
                >
                  {/* ID */}
                  <td className="py-3 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[11px]">
                      {lead.id}
                    </span>
                  </td>

                  {/* Nama Usaha & Platform */}
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderPlatformBadge(lead)}
                        <span className="hover:text-emerald-700 transition-colors font-bold text-xs sm:text-sm">
                          {lead.namaUsaha}
                        </span>
                      </div>

                      {lead.alamatLengkap && (
                        <span className="text-[11px] text-slate-500 font-normal line-clamp-1">
                          {lead.alamatLengkap}
                        </span>
                      )}

                      {/* Direct Verification Link (TikTok / IG / FB / Maps) */}
                      {lead.socialUrl ? (
                        <a
                          href={lead.socialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-emerald-700 hover:underline w-fit"
                          title={`Buka di ${lead.platformSumber}`}
                        >
                          <span>{lead.socialHandle || `Buka di ${lead.platformSumber}`}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      ) : (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-700 hover:underline w-fit"
                          title="Buka di Google Maps"
                        >
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span>Google Maps</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Kategori Bisnis */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {lead.kategoriBisnis}
                    </span>
                  </td>

                  {/* Wilayah/Kecamatan & Distance */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-slate-700">{lead.wilayahKecamatan}</span>
                      {lead.distanceKm !== undefined && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 w-fit">
                          <Navigation className="w-2.5 h-2.5 text-sky-600" />
                          {lead.distanceKm} km
                        </span>
                      )}
                    </div>
                  </td>

                  {/* No. WhatsApp/Telepon (Dual Display: Official Maps Phone & WhatsApp Outreach) */}
                  <td className="py-3 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-1.5">
                      
                      {/* Telepon Resmi Google Maps */}
                      {lead.noTeleponMaps && (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${lead.noTeleponMaps.replace(/[^0-9+]/g, '')}`}
                            className="text-slate-800 hover:text-blue-700 flex items-center gap-1 font-mono text-[11px] font-semibold"
                            title="Klik untuk menghubungi telepon resmi terdaftar di Google Maps"
                          >
                            {lead.noTeleponMaps.includes('0911') ? (
                              <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                            ) : (
                              <Smartphone className="w-3 h-3 text-emerald-600 shrink-0" />
                            )}
                            <span>{lead.noTeleponMaps}</span>
                          </a>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-sans font-medium border ${
                            lead.noTeleponMaps.includes('0911')
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {lead.noTeleponMaps.includes('0911') ? 'PSTN Kantor' : 'Ponsel Maps'}
                          </span>
                        </div>
                      )}

                      {/* WhatsApp Outreach Line */}
                      <div className="flex items-center justify-between gap-1.5">
                        {lead.noWhatsApp && isMobilePhone(lead.noWhatsApp) ? (
                          <div className="flex items-center gap-1">
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 font-mono font-bold text-[11px]"
                              title="Klik untuk membuka chat WhatsApp langsung"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{lead.noWhatsApp}</span>
                            </a>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-sans font-bold">
                              WA Aktif
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span className="italic">Belum ada no. WA</span>
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent('"' + lead.namaUsaha + '" Ambon "08"')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 ml-0.5 font-semibold"
                              title="Cari nomor HP/WA pemilik di Google"
                            >
                              <Search className="w-2.5 h-2.5" />
                              <span>Cari</span>
                            </a>
                          </div>
                        )}

                        {/* Quick Edit Contact Button */}
                        <button
                          onClick={(e) => handleStartEdit(lead, e)}
                          className="text-slate-400 hover:text-emerald-700 p-1 hover:bg-slate-100 rounded transition-colors"
                          title="Input / Koreksi nomor kontak atau WhatsApp"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>

                    </div>
                  </td>

                  {/* Rating / Audien */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>{lead.ratingMaps.toFixed(1)}</span>
                      </div>
                      {lead.followerCount ? (
                        <span className="text-[10px] font-semibold text-pink-700">
                          {lead.followerCount}
                        </span>
                      ) : lead.reviewCount ? (
                        <span className="text-[10px] text-slate-500 font-normal">
                          {lead.reviewCount} ulasan
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Skor Kelayakan (1-100) */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] border ${getScoreBadgeColor(lead.skorKelayakan)}`}>
                        {lead.skorKelayakan} / 100
                      </span>
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(lead.skorKelayakan, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Rekomendasi Produk Pegadaian */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getProductBadgeColor(lead.rekomendasiProduk)}`}>
                      {lead.rekomendasiProduk}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
        <div>
          Menampilkan <span className="font-bold text-slate-800">{sortedLeads.length}</span> entitas terverifikasi Kota Ambon.
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Prioritas Tinggi (Skor &gt; 85)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Potensial (75 - 84)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Berkembang (&lt; 75)
          </span>
        </div>
      </div>

      {/* Quick Contact Editor Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {editingLead.id}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Koreksi Nomor Kontak Usaha
                </h3>
                <p className="text-xs text-slate-500">{editingLead.namaUsaha}</p>
              </div>
              <button 
                onClick={() => setEditingLead(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nomor Telepon Google Maps (Landline / Telepon Resmi):
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={tempMapsPhone}
                    onChange={(e) => setTempMapsPhone(e.target.value)}
                    placeholder="Contoh: (0911) 352825 atau 0812-4840-8888"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Sesuai dengan nomor yang tercantum di kartu bisnis Google Maps.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nomor WhatsApp Outreach (Format +628...):
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={tempWhatsApp}
                    onChange={(e) => setTempWhatsApp(e.target.value)}
                    placeholder="Contoh: +6281248889988"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-slate-500">
                    Masukkan nomor ponsel pemilik/PIC toko (08xx).
                  </span>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent('"' + editingLead.namaUsaha + '" Ambon "08"')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Search className="w-2.5 h-2.5" />
                    Cari No. HP di Google
                  </a>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <a
                  href={editingLead.googleMapsUrl || getGoogleMapsUrl(editingLead.namaUsaha, editingLead.wilayahKecamatan, editingLead.alamatLengkap)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Lihat di Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingLead(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveContact}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
