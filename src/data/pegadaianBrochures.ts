export interface PegadaianProductBrochure {
  id: string;
  productName: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah';
  title: string;
  badge: string;
  tagline: string;
  highlights: string[];
  bannerUrl: string;
  downloadFilename: string;
  brochureCardHtml: string;
  isCustom?: boolean;
  uploadedAt?: string;
}

export const PEGADAIAN_BROCHURES: Record<'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah', PegadaianProductBrochure> = {
  'Cicil Emas': {
    id: 'cicil-emas',
    productName: 'Cicil Emas',
    title: 'Cicil Emas Batangan 24 Karat (Galeri 24, Antam & UBS)',
    badge: 'Investasi Logam Mulia Murni 99.99%',
    tagline: 'Amankan Keuntungan Usaha dengan Emas Batangan Bersertifikat Resmi',
    bannerUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80',
    downloadFilename: 'Brosur_Resmi_Cicil_Emas_Pegadaian_Ambon.jpg',
    highlights: [
      'Pilihan Cetakan Terpercaya: Galeri 24 (Anak Perusahaan PT Pegadaian), Antam, dan UBS',
      'Kemurnian Terjamin 99.99% dengan Sertifikat Resmi & Terakreditasi LBMA',
      'Uang Muka Terjangkau mulai 10% - 15%, Angsuran Tetap (Fixed Rate) hingga lunas',
      'Bebas Risiko Kenaikan Harga: Harga emas dikunci saat transaksi disetujui',
      'Bisa Diambil Langsung di Kantor Area Ambon (Jl. Kakialy No.1 / Cabang Terdekat)'
    ],
    brochureCardHtml: 'Cicil Emas Pegadaian: Lindungi aset usaha dari inflasi dengan emas batangan fisik murni Antam / Galeri 24 / UBS.'
  },
  'Pinjaman Usaha': {
    id: 'pinjaman-usaha',
    productName: 'Pinjaman Usaha',
    title: 'Pinjaman Usaha Mikro & Kupedes Pegadaian Area Ambon',
    badge: 'Modal Kerja & Investasi Usaha UMKM',
    tagline: 'Suntikan Modal Cepat untuk Tambah Stok Toko, Bahan Baku & Perluasan Usaha',
    bannerUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572240?auto=format&fit=crop&w=1200&q=80',
    downloadFilename: 'Brosur_Pinjaman_Usaha_Pegadaian_Ambon.jpg',
    highlights: [
      'Plafon pinjaman kompetitif mulai Rp 10 Juta hingga Rp 500 Juta+',
      'Jaminan Fleksibel: BPKB Kendaraan bermotor (Motor/Mobil) atau SHM/SHGB',
      'Kendaraan tetap bisa digunakan untuk operasional harian usaha',
      'Sewa modal/bunga flat sangat ringan dengan tenor 12 s/d 36 bulan',
      'Proses survei cepat 1-3 hari kerja langsung oleh petugas mikro Pegadaian Ambon'
    ],
    brochureCardHtml: 'Pinjaman Usaha Pegadaian: Solusi modal kerja dan ekspansi toko tanpa mengganggu kepemilikan aset.'
  },
  'Amanah': {
    id: 'amanah',
    productName: 'Amanah',
    title: 'Pembiayaan Kendaraan Bermotor Syariah Pegadaian Amanah',
    badge: 'Kendaraan Niaga & Operasional Usaha',
    tagline: 'Miliki Motor / Mobil Niaga Baru & Bekas Berkualitas dengan Akad Syariah Murah',
    bannerUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    downloadFilename: 'Brosur_Amanah_Pegadaian_Ambon.jpg',
    highlights: [
      'Pembiayaan Motor Niaga (antar barang/pesanan) & Mobil Pickup/Operasional',
      'Akad Syariah Rahn & Murabahah yang adil, transparan, dan menentramkan',
      'Uang Muka (DP) Ringan mulai 10% untuk motor & 20% untuk mobil niaga',
      'Biaya administrasi transparan, premi asuransi all-risk/TLO sudah termasuk',
      'Proses mudah dan bermitra dengan dealer resmi kendaraan terpercaya di Kota Ambon'
    ],
    brochureCardHtml: 'Pegadaian Amanah: Solusi armada transportasi dan pengiriman barang untuk percepat ekspansi bisnis UMKM.'
  }
};

const CUSTOM_BROCHURES_STORAGE_KEY = 'pegadaian_custom_brochures_ambon_v1';

export interface CustomBrochureData {
  imageUrl: string;
  customTitle?: string;
  customTagline?: string;
  filename?: string;
  uploadedAt: string;
}

/**
 * Get all custom uploaded brochures from localStorage
 */
export function getCustomBrochures(): Record<string, CustomBrochureData> {
  try {
    const raw = localStorage.getItem(CUSTOM_BROCHURES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse custom brochures from storage', err);
    return {};
  }
}

/**
 * Get effective brochure (custom if uploaded by user from gallery, otherwise official default)
 */
export function getEffectiveBrochure(product: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah'): PegadaianProductBrochure {
  const fallback = PEGADAIAN_BROCHURES[product] || PEGADAIAN_BROCHURES['Pinjaman Usaha'];
  const customs = getCustomBrochures();
  const custom = customs[product];

  if (custom && custom.imageUrl) {
    return {
      ...fallback,
      bannerUrl: custom.imageUrl,
      title: custom.customTitle || fallback.title,
      tagline: custom.customTagline || fallback.tagline,
      downloadFilename: custom.filename || `Brosur_Kustom_${product.replace(/\s+/g, '_')}.jpg`,
      isCustom: true,
      uploadedAt: custom.uploadedAt
    };
  }

  return {
    ...fallback,
    isCustom: false
  };
}

/**
 * Save custom uploaded brochure from user gallery
 */
export function saveCustomBrochure(
  product: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah',
  imageUrl: string,
  filename?: string,
  customTitle?: string,
  customTagline?: string
): void {
  try {
    const current = getCustomBrochures();
    current[product] = {
      imageUrl,
      filename: filename || `Brosur_${product.replace(/\s+/g, '_')}_Galeri.jpg`,
      customTitle,
      customTagline,
      uploadedAt: new Date().toISOString()
    };
    localStorage.setItem(CUSTOM_BROCHURES_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('pegadaian_brochures_updated', { detail: { product } }));
  } catch (err) {
    console.error('Failed to save custom brochure to storage:', err);
    throw new Error('Gagal menyimpan brosur ke penyimpanan browser. Pastikan ukuran gambar tidak terlalu besar.');
  }
}

/**
 * Reset brochure back to Pegadaian default
 */
export function resetCustomBrochure(product: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah'): void {
  try {
    const current = getCustomBrochures();
    delete current[product];
    localStorage.setItem(CUSTOM_BROCHURES_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('pegadaian_brochures_updated', { detail: { product } }));
  } catch (err) {
    console.error('Failed to reset brochure:', err);
  }
}

/**
 * Helper to compress and optimize uploaded images from mobile gallery / camera
 */
export function compressImageFile(file: File, maxDimension = 1200, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memproses data gambar'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Copy image directly to system clipboard (for WhatsApp Web Ctrl+V pasting)
 */
export async function copyImageToClipboard(imageUrlOrDataUrl: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrlOrDataUrl);
    const blob = await res.blob();

    // Browsers require image/png for ClipboardItem
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrlOrDataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!pngBlob) return false;

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob })
    ]);
    return true;
  } catch (err) {
    console.warn('Clipboard write image failed:', err);
    return false;
  }
}

/**
 * Download brochure image to user device / downloads folder
 */
export function downloadBrochureImage(imageUrlOrDataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = imageUrlOrDataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import { getMasterTemplates, renderMasterTemplateText } from './masterTemplates';

/**
 * Format an ultra-professional WhatsApp message with product brochure information and image link.
 * Dynamically uses the current Master Template for each product recommendation,
 * injecting the business name, district, category, and officer name.
 */
export function buildProfessionalWhatsAppMessage(params: {
  businessName: string;
  product: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah';
  district: string;
  category: string;
  rating?: number;
  phone?: string;
  salesOfficerName?: string;
  originUrl?: string;
}): {
  messageText: string;
  brochure: PegadaianProductBrochure;
} {
  const { 
    businessName, 
    product, 
    district, 
    category, 
    rating = 4.5,
    phone = '',
    salesOfficerName = 'Relationship Officer PT Pegadaian Area Maluku',
    originUrl = typeof window !== 'undefined' ? window.location.origin : ''
  } = params;
  
  const brochure = getEffectiveBrochure(product);
  const masterTemplates = getMasterTemplates();
  const templateForProduct = masterTemplates[product] || '';

  const messageText = renderMasterTemplateText(templateForProduct, {
    businessName,
    product,
    district,
    category,
    rating,
    phone,
    salesOfficerName,
    originUrl
  });

  return {
    messageText,
    brochure
  };
}
