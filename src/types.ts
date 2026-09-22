export type PegadaianProduct = 'Amanah' | 'Pinjaman Usaha' | 'Cicil Emas';

export type BusinessCategory = 
  | 'Kuliner' 
  | 'Otomotif' 
  | 'Retail' 
  | 'Jasa' 
  | 'Konstruksi' 
  | 'Kesehatan' 
  | 'Agribisnis/Perikanan'
  | 'Lainnya';

export type LeadPlatform = 'Google Maps' | 'TikTok' | 'Instagram' | 'Facebook';

export interface AmbonFocalPoint {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  description: string;
}

export interface BusinessLead {
  id: string; // e.g. AMB-001
  namaUsaha: string; // Official verified business name in Ambon
  kategoriBisnis: string; // Otomotif, Kuliner, Retail, Jasa, Konstruksi, etc.
  wilayahKecamatan: string; // e.g., Sirimau, Passo-Baguala, Laha-Teluk Ambon, Lateri
  alamatLengkap?: string;
  platformSumber?: LeadPlatform; // Google Maps, TikTok, Instagram, Facebook
  sumberData?: string; // e.g., "Live Scraped: Serper.dev Google Maps", "Live Scraped: Overpass Geolocation Ambon"
  socialHandle?: string; // e.g. @theambonmaniseshop2, @daporkolekole
  socialUrl?: string; // Direct verified link to IG / FB / Web / Maps
  followerCount?: string; // e.g. "15K+ followers", "Rating 4.8 (500+ ulasan)"
  noTeleponMaps?: string; // Official phone number as listed on Google Maps (e.g. (0911) 341202 / 0822-9057-3903)
  noWhatsApp: string; // Real WhatsApp mobile number (+628...), or empty if only landline
  statusWA?: 'Terverifikasi (08xx)' | 'Hanya Telepon Kantor (0911)' | 'Belum Ada WA';
  saluranKontakUtama?: 'WhatsApp (08xx)' | 'Telepon Kantor (PSTN 0911)';
  ratingMaps: number; // 1.0 - 5.0
  reviewCount?: number;
  skorKelayakan: number; // 1 - 100
  rekomendasiProduk: PegadaianProduct; // Amanah / Pinjaman Usaha / Cicil Emas
  alasanRekomendasi?: string;
  drafPesanWAPertama: string; // Personalized Indonesian message
  statusKontak?: 'Belum Dihubungi' | 'Terkirim' | 'Merespon' | 'Closing';
  catatanSales?: string; // Private internal field notes by sales agent
  jadwalFollowUp?: string; // e.g. YYYY-MM-DD
  tagsCustom?: string[]; // e.g. ["Prioritas Tinggi", "Minat Emas", "Butuh Survey Lokasi"]
  googleMapsUrl?: string; // Direct live Google Maps URL
  isMapsVerified?: boolean; // Real-time Google Maps verification status
  latitude?: number;
  longitude?: number;
  distanceKm?: number; // Distance in KM from selected center point
  isRealtimeScraped?: boolean; // True if fetched live from Serper or Overpass
  scrapingEngine?: 'serper_google_maps' | 'overpass_geolocation' | 'live_web' | 'verified_cache';
}

export interface ExtractionRequest {
  keyword: string;
  district?: string;
  platform?: LeadPlatform | 'all';
  mode?: 'search' | 'full_scan';
  count?: number;
  radiusMeters?: number; // Manual radius selection in meters (e.g. 500, 1000, 3000, 5000, 10000, 15000)
  centerLat?: number; // Latitude of scan center in Ambon
  centerLon?: number; // Longitude of scan center in Ambon
  centerName?: string; // e.g. "Pusat Kota Ambon (Lapangan Merdeka)"
}

export interface ExtractionResponse {
  success: boolean;
  source: 'serper_live' | 'overpass_live' | 'gemini' | 'directory_cache' | 'social_scan';
  platform?: string;
  totalExtracted: number;
  timestamp: string;
  leads: BusinessLead[];
  radiusUsedMeters?: number;
  centerUsed?: {
    name: string;
    lat: number;
    lon: number;
  };
  hasSerperKey?: boolean;
}
