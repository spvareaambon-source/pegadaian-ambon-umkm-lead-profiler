import React, { useState } from 'react';
import { 
  Radar, 
  MapPin, 
  Compass, 
  Layers, 
  Sliders, 
  Crosshair, 
  Navigation, 
  Sparkles, 
  Radio, 
  Check, 
  RefreshCw,
  Globe,
  Info
} from 'lucide-react';
import { AMBON_FOCAL_POINTS, AMBON_RADIUS_OPTIONS } from '../data/ambonGeoConfig';
import { AmbonFocalPoint } from '../types';

interface RadiusScanPanelProps {
  selectedRadiusMeters: number;
  onRadiusChange: (meters: number) => void;
  selectedFocalPoint: AmbonFocalPoint;
  onFocalPointChange: (point: AmbonFocalPoint) => void;
  customLat: number;
  customLon: number;
  onCustomCoordsChange: (lat: number, lon: number) => void;
  isCustomLocation: boolean;
  setIsCustomLocation: (isCustom: boolean) => void;
  onTriggerScan: () => void;
  isExtracting: boolean;
  hasSerperKey?: boolean;
}

export const RadiusScanPanel: React.FC<RadiusScanPanelProps> = ({
  selectedRadiusMeters,
  onRadiusChange,
  selectedFocalPoint,
  onFocalPointChange,
  customLat,
  customLon,
  onCustomCoordsChange,
  isCustomLocation,
  setIsCustomLocation,
  onTriggerScan,
  isExtracting,
  hasSerperKey = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempLat, setTempLat] = useState(customLat.toString());
  const [tempLon, setTempLon] = useState(customLon.toString());
  const [gpsLoading, setGpsLoading] = useState(false);

  const radiusKm = selectedRadiusMeters / 1000;
  const coverageKm2 = Math.round(Math.PI * Math.pow(radiusKm, 2) * 100) / 100;

  const currentLat = isCustomLocation ? customLat : selectedFocalPoint.lat;
  const currentLon = isCustomLocation ? customLon : selectedFocalPoint.lon;
  const locationName = isCustomLocation ? 'Koordinat Kustom Pengguna' : selectedFocalPoint.name;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lon = Math.round(pos.coords.longitude * 10000) / 10000;
        onCustomCoordsChange(lat, lon);
        setTempLat(lat.toString());
        setTempLon(lon.toString());
        setIsCustomLocation(true);
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        alert('Gagal mendeteksi lokasi otomatis. Silakan pilih dari preset titik Ambon.');
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleApplyCustomCoords = () => {
    const lat = parseFloat(tempLat);
    const lon = parseFloat(tempLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onCustomCoordsChange(lat, lon);
      setIsCustomLocation(true);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-emerald-800/40 shadow-md mb-6 transition-all">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-emerald-800/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Radar Pemindaian Google Maps Kota Ambon
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Real-Time Scraping
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Pilih radius jarak dan titik koordinat pusat secara manual untuk menjaring prospek usaha di Ambon.
            </p>
          </div>
        </div>

        {/* Engine Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasSerperKey ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-500/40 text-sky-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              Serper.dev Maps API Aktif
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Overpass Geolocation (Real-Time Live)
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            {isExpanded ? 'Tutup Pengaturan' : 'Ubah Titik Koordinat'}
          </button>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 items-center">
        
        {/* Left: Focal Point & Radius Status Info (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Active Center Location Selector */}
          <div>
            <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Titik Pusat Scan:
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                {currentLat.toFixed(4)}, {currentLon.toFixed(4)}
              </span>
            </label>

            <select
              value={isCustomLocation ? 'custom' : selectedFocalPoint.id}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomLocation(true);
                  setIsExpanded(true);
                } else {
                  const pt = AMBON_FOCAL_POINTS.find(p => p.id === e.target.value);
                  if (pt) {
                    onFocalPointChange(pt);
                    setIsCustomLocation(false);
                  }
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-emerald-700/50 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {AMBON_FOCAL_POINTS.map((pt) => (
                <option key={pt.id} value={pt.id} className="bg-slate-900 text-white">
                  📍 {pt.name} ({pt.district})
                </option>
              ))}
              <option value="custom" className="bg-slate-900 text-amber-300">
                🎯 Koordinat Kustom (Manual Input)
              </option>
            </select>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Radius</div>
              <div className="text-sm font-extrabold text-emerald-400">
                {radiusKm >= 1 ? `${radiusKm} km` : `${selectedRadiusMeters} m`}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Luas Area</div>
              <div className="text-sm font-extrabold text-amber-400">
                {coverageKm2} km²
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Wilayah</div>
              <div className="text-xs font-bold text-white truncate" title={selectedFocalPoint.district}>
                {isCustomLocation ? 'Kustom' : selectedFocalPoint.district}
              </div>
            </div>
          </div>

        </div>

        {/* Right: Manual Radius Selection Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
          
          {/* Header & Direct Manual Meter Input */}
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Pilih Jarak Radius Pemindaian:
            </label>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              <span className="text-[11px] text-slate-400 font-medium">Radius:</span>
              <input
                type="number"
                min="250"
                max="30000"
                step="250"
                value={selectedRadiusMeters}
                onChange={(e) => {
                  const val = Math.max(250, Math.min(30000, Number(e.target.value) || 1000));
                  onRadiusChange(val);
                }}
                className="w-16 bg-transparent text-emerald-300 font-extrabold text-xs text-right focus:outline-none"
              />
              <span className="text-xs font-bold text-emerald-400">meter</span>
            </div>
          </div>

          {/* Continuous Range Slider */}
          <div className="space-y-1">
            <input
              id="slider-scan-radius"
              type="range"
              min="500"
              max="25000"
              step="250"
              value={selectedRadiusMeters}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>500m (Blok)</span>
              <span>3 km (Kawasan Niaga)</span>
              <span>10 km (Kota)</span>
              <span>25 km (Pulau)</span>
            </div>
          </div>

          {/* Preset Radius Buttons Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
            {AMBON_RADIUS_OPTIONS.map((opt) => {
              const isSelected = selectedRadiusMeters === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  id={`btn-radius-${opt.value}`}
                  onClick={() => onRadiusChange(opt.value)}
                  className={`px-1.5 py-1.5 rounded-lg text-center transition-all text-xs font-semibold ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm scale-105 ring-2 ring-emerald-300'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                  }`}
                  title={`${opt.label}: ${opt.desc}`}
                >
                  <div className="truncate">{opt.label.replace(' (1.000m)', '').replace(' (2.000m)', '').replace(' (3.000m)', '').replace(' (5.000m)', '').replace(' (10.000m)', '').replace(' (15.000m)', '').replace(' (25.000m)', '')}</div>
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* Expandable Coordinate Customizer Panel */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-emerald-800/40 bg-slate-950/60 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              Kustomisasi Titik Koordinat GPS Manual (Latitude & Longitude)
            </span>
            <button
              onClick={handleGetCurrentLocation}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Navigation className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
              {gpsLoading ? 'Mendeteksi...' : 'Gunakan GPS Saya'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Latitude (Lintang Selatan Ambon)</label>
              <input
                type="text"
                placeholder="-3.6974"
                value={tempLat}
                onChange={(e) => setTempLat(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Longitude (Bujur Timur Ambon)</label>
              <input
                type="text"
                placeholder="128.1812"
                value={tempLon}
                onChange={(e) => setTempLon(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleApplyCustomCoords}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Terapkan Koordinat Kustom
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              Pusat Kota Ambon berada di sekitar koordinat <strong>-3.6974, 128.1812</strong>. Koordinat yang Anda masukkan akan menjadi titik acuan perhitungan jarak radius pemindaian.
            </span>
          </div>
        </div>
      )}

      {/* Action Scan Trigger Banner */}
      <div className="mt-3.5 pt-3 border-t border-emerald-800/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Target Scanning: <strong className="text-white">{locationName}</strong> dalam radius <strong className="text-emerald-300">{radiusKm} km</strong>
          </span>
        </div>

        <button
          type="button"
          id="btn-trigger-radius-scan"
          onClick={onTriggerScan}
          disabled={isExtracting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-sm transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
          {isExtracting ? 'Sedang Memindai Real-Time...' : `Pindai Real-Time (Radius ${radiusKm} km)`}
        </button>
      </div>

    </div>
  );
};
