import { BusinessLead, LeadPlatform } from '../types';
import { queryVerifiedAmbonDirectory, VERIFIED_AMBON_BUSINESSES } from './ambonRealPlaces';
import { VERIFIED_AMBON_SOCIAL_LEADS } from './ambonSocialMediaLeads';

const normalizedMapsLeads: BusinessLead[] = VERIFIED_AMBON_BUSINESSES.map(b => ({
  ...b,
  platformSumber: (b.platformSumber || 'Google Maps') as LeadPlatform
}));

export const INITIAL_AMBON_LEADS: BusinessLead[] = [
  ...normalizedMapsLeads,
  ...VERIFIED_AMBON_SOCIAL_LEADS
];

export const AMBON_DISTRICTS: string[] = [
  "Semua Wilayah",
  "Sirimau",
  "Teluk Ambon",
  "Baguala",
  "Nusaniwe",
  "Leitimur Selatan"
];

export const BUSINESS_CATEGORIES: string[] = [
  "Semua Kategori",
  "Kuliner & Restoran",
  "Otomotif & Bengkel",
  "Retail & Sembako",
  "Kesehatan & Farmasi",
  "Konstruksi & Material",
  "Jasa & Percetakan",
  "Perikanan & Maritim",
  "Perhotelan & Pariwisata"
];

export const PEGADAIAN_PRODUCTS = [
  "Semua Produk",
  "Amanah",
  "Pinjaman Usaha",
  "Cicil Emas"
];

export const PLATFORMS_LIST: { id: LeadPlatform | 'all'; name: string; icon: string; countHint?: string }[] = [
  { id: 'all', name: 'Semua Platform', icon: 'Globe' },
  { id: 'Google Maps', name: 'Google Maps', icon: 'MapPin', countHint: '51 Listing' },
  { id: 'Instagram', name: 'Instagram', icon: 'Instagram', countHint: 'IG Shop / Olshop' },
  { id: 'TikTok', name: 'TikTok', icon: 'Video', countHint: 'TikTok Shop / Viral' },
  { id: 'Facebook', name: 'Facebook', icon: 'Facebook', countHint: 'FB Pages / Niaga' }
];

export const KEYWORD_PRESETS = [
  "Semua Usaha",
  "Kuliner Viral",
  "Toko Oleh-Oleh",
  "Online Shop / Butik",
  "Bengkel & Variasi",
  "Perikanan & Hasil Laut",
  "Katering & Kue",
  "Apotek",
  "Bahan Bangunan"
];

