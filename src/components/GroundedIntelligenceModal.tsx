import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Globe, 
  ExternalLink, 
  Loader2, 
  Check, 
  X,
  Compass,
  ArrowRight
} from 'lucide-react';

const KECAMATAN_AMBON = [
  'Sirimau',
  'Baguala',
  'Teluk Ambon',
  'Nusaniwe',
  'Leitimur Selatan'
];

interface GroundedIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDistrict?: string;
  defaultQuery?: string;
}

export const GroundedIntelligenceModal: React.FC<GroundedIntelligenceModalProps> = ({
  isOpen,
  onClose,
  defaultDistrict = 'Sirimau',
  defaultQuery = ''
}) => {
  const [activeMode, setActiveMode] = useState<'maps' | 'search'>('maps');
  const [query, setQuery] = useState(defaultQuery || 'Toko Grosir & Sembako di Batu Merah');
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict || 'Sirimau');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteGroundedAI = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setResultText(null);
    setGroundingMetadata(null);

    const endpoint = activeMode === 'maps' ? '/api/ai/grounded-maps' : '/api/ai/grounded-search';
    const payload = activeMode === 'maps' 
      ? { placeQuery: query, district: selectedDistrict }
      : { query, district: selectedDistrict };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses permintaan grounded intelligence.');
      }
      setResultText(data.analysis);
      setGroundingMetadata(data.groundingMetadata);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan koneksi ke server AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Google Maps & Search Grounding</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  gemini-3.5-flash
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Riset intelijen real-time berbasis Google Maps & Google Search untuk wilayah Kota Ambon
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Grounding Tool Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMode('maps')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'maps'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Google Maps Grounding</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('search')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'search'
                  ? 'bg-white text-blue-800 shadow-xs border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Google Search Grounding</span>
            </button>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {activeMode === 'maps' ? 'Nama Lokasi / Tempat Bisnis di Ambon' : 'Topik Riset / Peluang Bisnis'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    activeMode === 'maps' 
                      ? 'contoh: Rumah Makan Padang di Urimesing, Toko Bangunan Passo' 
                      : 'contoh: Tren harga cengkeh & pala Ambon, UMKM ikan asap'
                  }
                  className="w-full px-3.5 py-2 pl-9 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kecamatan Target
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {KECAMATAN_AMBON.map((kec) => (
                  <option key={kec} value={kec}>{kec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              Menghubungkan langsung ke data terkini Google Maps & Web via Gemini 3.5 Flash
            </span>

            <button
              onClick={handleExecuteGroundedAI}
              disabled={isLoading || !query.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menganalisis Real-Time...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Jalankan Grounding Riset</span>
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <p className="font-semibold mb-1">Pemberitahuan Sistem:</p>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Result Output */}
          {resultText && (
            <div className="space-y-3 pt-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Hasil Analisis Grounding Real-Time
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date().toLocaleTimeString('id-ID')} WIT
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {resultText}
              </div>

              {/* Grounding Web Sources / Citations */}
              {groundingMetadata?.webSearchQueries && (
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                  <div className="text-[11px] font-bold text-blue-900 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-700" />
                    Query Pencarian yang Digunakan oleh Model:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {groundingMetadata.webSearchQueries.map((q: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono">
                        "{q}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>PT Pegadaian Area Ambon &bull; Powered by Gemini 3.5 Flash Grounding Tools</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
