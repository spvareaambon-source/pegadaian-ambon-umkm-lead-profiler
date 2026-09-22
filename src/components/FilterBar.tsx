import React from 'react';
import { Search, Filter, RefreshCw, MapPin, Tag, Award, Phone, Globe, Instagram, Facebook, Video, Sparkles, Radar, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { LeadPlatform, AmbonFocalPoint } from '../types';
import { AMBON_DISTRICTS, BUSINESS_CATEGORIES, PEGADAIAN_PRODUCTS, KEYWORD_PRESETS } from '../data/ambonDirectory';
import { AMBON_RADIUS_OPTIONS, AMBON_FOCAL_POINTS } from '../data/ambonGeoConfig';

export const CONTACT_CHANNELS = [
  'Semua Saluran Kontak',
  '🟢 WA Aktif (08xx)',
  '📞 Telepon Kantor (0911)'
];

export const PLATFORM_OPTIONS: { id: LeadPlatform | 'all'; label: string; desc: string; icon: string }[] = [
  { id: 'all', label: 'Semua Platform', desc: 'Maps, TikTok, IG, FB', icon: 'Globe' },
  { id: 'Google Maps', label: 'Google Maps', desc: 'Direktori Fisik', icon: 'MapPin' },
  { id: 'Instagram', label: 'Instagram', desc: 'IG Shop / Butik', icon: 'Instagram' },
  { id: 'TikTok', label: 'TikTok', desc: 'TikTok Shop / Viral', icon: 'Video' },
  { id: 'Facebook', label: 'Facebook', desc: 'Halaman Niaga / Jasa', icon: 'Facebook' },
];

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedPlatform: LeadPlatform | 'all';
  onPlatformChange: (val: LeadPlatform | 'all') => void;
  selectedDistrict: string;
  onDistrictChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedProduct: string;
  onProductChange: (val: string) => void;
  selectedContactFilter: string;
  onContactFilterChange: (val: string) => void;
  minScore: number;
  onMinScoreChange: (val: number) => void;
  selectedRadiusMeters: number;
  onRadiusChange: (meters: number) => void;
  selectedFocalPoint: AmbonFocalPoint;
  onFocalPointChange: (point: AmbonFocalPoint) => void;
  showRadiusPanel: boolean;
  onToggleRadiusPanel: () => void;
  onTriggerExtraction: (keyword: string, platform?: LeadPlatform | 'all') => void;
  isExtracting: boolean;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  selectedDistrict,
  onDistrictChange,
  selectedCategory,
  onCategoryChange,
  selectedProduct,
  onProductChange,
  selectedContactFilter,
  onContactFilterChange,
  minScore,
  onMinScoreChange,
  selectedRadiusMeters,
  onRadiusChange,
  selectedFocalPoint,
  onFocalPointChange,
  showRadiusPanel,
  onToggleRadiusPanel,
  onTriggerExtraction,
  isExtracting,
  onResetFilters
}) => {
  const radiusKm = selectedRadiusMeters / 1000;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 mb-5 space-y-4">
      
      {/* Platform Selector Bar (Google Maps, TikTok, Instagram, Facebook) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Kanal Sumber Data:
        </label>

        <div className="flex items-center gap-1.5 flex-wrap">
          {PLATFORM_OPTIONS.map((plat) => {
            const isSelected = selectedPlatform === plat.id;
            return (
              <button
                key={plat.id}
                id={`btn-platform-${plat.id.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onPlatformChange(plat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? plat.id === 'TikTok'
                      ? 'bg-slate-950 text-white shadow-xs'
                      : plat.id === 'Instagram'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xs'
                      : plat.id === 'Facebook'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : plat.id === 'Google Maps'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                {plat.id === 'TikTok' && <Video className="w-3.5 h-3.5" />}
                {plat.id === 'Instagram' && <Instagram className="w-3.5 h-3.5" />}
                {plat.id === 'Facebook' && <Facebook className="w-3.5 h-3.5" />}
                {plat.id === 'Google Maps' && <MapPin className="w-3.5 h-3.5" />}
                {plat.id === 'all' && <Globe className="w-3.5 h-3.5" />}
                <span>{plat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input and Primary Scan */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="input-search-keyword"
            type="text"
            placeholder="Cari nama usaha, kata kunci produk, atau jenis bisnis di Ambon..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                onTriggerExtraction(searchQuery, selectedPlatform);
              }
            }}
            className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-300/80 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-sm font-medium text-slate-900 placeholder-slate-400 bg-slate-50/50 hover:bg-white focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded hover:bg-slate-200/60"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Scan Platform Button */}
        <button
          id="btn-run-extraction"
          onClick={() => onTriggerExtraction(searchQuery || 'Semua Usaha Ambon', selectedPlatform)}
          disabled={isExtracting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 shrink-0 bg-emerald-700 hover:bg-emerald-800 active:scale-95 border border-emerald-600/30"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
          <span>{isExtracting ? 'Memindai...' : 'Pindai Data'}</span>
        </button>
      </div>

      {/* Preset Keyword Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">
          Sektor Populer:
        </span>
        {KEYWORD_PRESETS.map((preset) => {
          const isActive = searchQuery.toLowerCase() === preset.toLowerCase();
          return (
            <button
              key={preset}
              id={`preset-${preset.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => {
                onSearchChange(preset);
                onTriggerExtraction(preset, selectedPlatform);
              }}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all shrink-0 border ${
                isActive
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100">
        
        {/* District Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-600" />
            Wilayah
          </label>
          <select
            id="select-district"
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300/80 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
          >
            {AMBON_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-emerald-600" />
            Kategori
          </label>
          <select
            id="select-category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300/80 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
          >
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Pegadaian Product Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-600" />
            Produk
          </label>
          <select
            id="select-product"
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300/80 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
          >
            {PEGADAIAN_PRODUCTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Contact Channel Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3 text-emerald-600" />
            Kontak
          </label>
          <select
            id="select-contact-channel"
            value={selectedContactFilter}
            onChange={(e) => onContactFilterChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300/80 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
          >
            {CONTACT_CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        {/* Radius Selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Radar className="w-3 h-3 text-emerald-600" />
              Radius
            </label>
            <button
              type="button"
              onClick={onToggleRadiusPanel}
              className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold"
              title="Pengaturan koordinat radar lanjutan"
            >
              {showRadiusPanel ? 'Tutup GPS' : 'Titik GPS'}
            </button>
          </div>
          <select
            id="select-radius"
            value={selectedRadiusMeters}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300/80 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
          >
            <option value={500}>500 meter</option>
            <option value={1000}>1 km</option>
            <option value={2000}>2 km</option>
            <option value={3000}>3 km (Standar)</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={15000}>15 km (Maksimal)</option>
          </select>
        </div>

        {/* Min Score Filter */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-600" />
              Min. Skor:
            </label>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {minScore}+
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <input
              id="range-min-score"
              type="range"
              min="0"
              max="95"
              step="5"
              value={minScore}
              onChange={(e) => onMinScoreChange(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-1.5"
            />
            {minScore > 0 && (
              <button
                onClick={onResetFilters}
                className="text-[10px] text-slate-400 hover:text-slate-700 underline shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
