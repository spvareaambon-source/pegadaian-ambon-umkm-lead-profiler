import { AmbonFocalPoint } from '../types';

export interface RadiusOption {
  value: number; // in meters
  label: string;
  badge: string;
  desc: string;
  coverageAreaKm2: number;
}

export const AMBON_RADIUS_OPTIONS: RadiusOption[] = [
  { 
    value: 500, 
    label: '500 meter', 
    badge: 'Blok Dekat', 
    desc: 'Target sangat rapat sekeliling lokasi (radius jalan/lorong usaha)',
    coverageAreaKm2: 0.79
  },
  { 
    value: 1000, 
    label: '1 km (1.000m)', 
    badge: 'Lingkungan', 
    desc: 'Cakupan lingkungan sekitar dan tetangga bisnis terdekat',
    coverageAreaKm2: 3.14
  },
  { 
    value: 2000, 
    label: '2 km (2.000m)', 
    badge: 'Kelurahan', 
    desc: 'Cakupan satu kelurahan dan sentra ekonomi mikro',
    coverageAreaKm2: 12.57
  },
  { 
    value: 3000, 
    label: '3 km (3.000m)', 
    badge: 'Kawasan Niaga', 
    desc: 'Kawasan komersial koridor jalan utama Ambon',
    coverageAreaKm2: 28.27
  },
  { 
    value: 5000, 
    label: '5 km (5.000m)', 
    badge: 'Kecamatan', 
    desc: 'Satu wilayah kecamatan penuh beserta penyangganya',
    coverageAreaKm2: 78.54
  },
  { 
    value: 10000, 
    label: '10 km (10.000m)', 
    badge: 'Lintas Kota', 
    desc: 'Lintas kecamatan dari pusat kota hingga teluk',
    coverageAreaKm2: 314.16
  },
  { 
    value: 15000, 
    label: '15 km (15.000m)', 
    badge: 'Teluk & Pesisir', 
    desc: 'Seluruh pesisir Teluk Ambon dan koridor Jembatan Merah Putih',
    coverageAreaKm2: 706.86
  },
  { 
    value: 25000, 
    label: '25 km (25.000m)', 
    badge: 'Pulau Ambon', 
    desc: 'Cakupan menyeluruh Pulau Ambon (Jazirah Leihitu & Leitimur)',
    coverageAreaKm2: 1963.50
  },
];

export const AMBON_FOCAL_POINTS: AmbonFocalPoint[] = [
  {
    id: 'lapangan-merdeka',
    name: 'Pusat Kota (Lapangan Merdeka)',
    district: 'Sirimau',
    lat: -3.6974,
    lon: 128.1812,
    description: 'Pusat pemerintahan, perbankan, perhotelan, Jl. AY Patty, dan Jl. Sam Ratulangi'
  },
  {
    id: 'batu-merah-mcm',
    name: 'Batu Merah & Maluku City Mall',
    district: 'Sirimau',
    lat: -3.6890,
    lon: 128.1950,
    description: 'Koridor Jl. Jend. Sudirman, MCM, Hative Kecil, dan pertokoan retail padat'
  },
  {
    id: 'passo-baguala',
    name: 'Passo (Pusat Niaga Baguala)',
    district: 'Baguala',
    lat: -3.6410,
    lon: 128.2320,
    description: 'Hub perniagaan Passo, Halong, Lateri, pasar grosir, dan transit darat'
  },
  {
    id: 'wayame-teluk',
    name: 'Wayame & Pesisir Teluk Ambon',
    district: 'Teluk Ambon',
    lat: -3.6550,
    lon: 128.1350,
    description: 'Sentra kuliner seafood pantai (RM Apong), hotel pesisir, dan koridor kampus Unpatti'
  },
  {
    id: 'laha-bandara',
    name: 'Laha & Bandara Pattimura',
    district: 'Teluk Ambon',
    lat: -3.7050,
    lon: 128.0890,
    description: 'Zona gerbang logistik udara, oleh-oleh bandara, dan perikanan Laha/Tawiri'
  },
  {
    id: 'galala-ikan-asar',
    name: 'Galala (Sentra Ikan Asar & JMP)',
    district: 'Baguala',
    lat: -3.6680,
    lon: 128.2050,
    description: 'Pusat kuliner ikan asar Maluku, akses Jembatan Merah Putih, dan pergudangan'
  },
  {
    id: 'nusaniwe-wainitu',
    name: 'Silale & Wainitu (Nusaniwe)',
    district: 'Nusaniwe',
    lat: -3.7060,
    lon: 128.1750,
    description: 'Dealer otomotif (Toyota Hasjrat), RM Dedes, perbengkelan, dan niaga Nusaniwe'
  },
  {
    id: 'latuhalat-pintu-kota',
    name: 'Latuhalat & Pantai Pintu Kota',
    district: 'Nusaniwe',
    lat: -3.7700,
    lon: 128.1250,
    description: 'Sentra pariwisata bahari, homestay, resort, dan UMKM pesisir selatan Ambon'
  },
  {
    id: 'hutumuri-leitimur',
    name: 'Hutumuri (Leitimur Selatan)',
    district: 'Leitimur Selatan',
    lat: -3.7120,
    lon: 128.2520,
    description: 'Sentra perkebunan pala, cengkeh, minyak kayu putih, dan agribisnis'
  },
];

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
}
