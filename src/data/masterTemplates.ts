/**
 * Master Template Management for PT Pegadaian Area Ambon WhatsApp Outreach
 * Allows administrators and relationship officers to edit master templates
 * where all leads under that product recommendation automatically update dynamically.
 */

export interface MasterTemplateItem {
  product: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah';
  title: string;
  template: string;
  description: string;
  updatedAt?: string;
}

export type MasterTemplatesMap = Record<'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah', string>;

export const DEFAULT_MASTER_TEMPLATES: MasterTemplatesMap = {
  'Cicil Emas': `Yth. Pimpinan / Pemilik *{namaUsaha}*
Wilayah {wilayah}, Kota Ambon

Salam hormat,
Perkenalkan saya *{namaPetugas}*. 

Berdasarkan tinjauan reputasi usaha unggulan Anda di sektor *{kategori}* yang sangat aktif dan positif di Kota Ambon, kami ingin memberikan penawaran program prioritas:

🌟 *CICIL EMAS LOGAM MULIA 24K*
_Amankan Nilai Keuntungan Usaha Anda dari Inflasi dengan Emas Batangan Resmi Murni 99.99%_

*Mengapa Pelaku Usaha di Ambon Memilih Cicil Emas Pegadaian?*
⭐ *Pilihan Cetakan Resmi:* Logam Mulia Galeri 24 (anak perusahaan Pegadaian), ANTAM, dan UBS (kadar 99.99% murni bersertifikat LBMA).
⭐ *Kunci Harga Emas:* Harga per gram dikunci saat akad; terlindungi dari lonjakan kenaikan harga emas dunia.
⭐ *Uang Muka Ringan:* Mulai dari 10% - 15%, angsuran tetap (fixed rate) hingga selesai.
⭐ *Emas Fisik Asli:* Emas fisik batangan asli diserahkan langsung di Outlet Pegadaian Area Maluku setelah lunas.

{linkBrosur}

---
💡 *Layanan Jemput Bola di Tempat:*
Jika Bapak/Ibu memerlukan simulasi angsuran resmi atau diskusi di lokasi tempat usaha Anda di {wilayah}, petugas resmi kami siap bersilaturahmi tanpa dipungut biaya apapun.

Apakah berkenan kami kirimkan file PDF tabel simulasi angsuran lengkapnya?

Hormat kami,

Relationship Officer
PT Pegadaian Area Maluku`,

  'Pinjaman Usaha': `Yth. Pimpinan / Pemilik *{namaUsaha}*
Wilayah {wilayah}, Kota Ambon

Salam hormat,
Perkenalkan saya *{namaPetugas}*. 

Berdasarkan tinjauan reputasi usaha unggulan Anda di sektor *{kategori}* yang sangat aktif dan positif di Kota Ambon, kami ingin memberikan penawaran program prioritas:

🌟 *PINJAMAN USAHA & KUPEDES PEGADAIAN*
_Solusi Pembiayaan Modal Kerja dan Investasi Usaha UMKM Kota Ambon dengan Syarat Mudah dan Sewa Modal Kompetitif_

*Fasilitas Pembiayaan Modal Kerja & Investasi:*
💼 *Plafon:* Rp 10.000.000 s/d Rp 500.000.000+
💼 *Jaminan Fleksibel:* BPKB Kendaraan (motor/mobil) atau SHM/SHGB (Kendaraan tetap Anda operasikan untuk berniaga).
💼 *Sewa Modal / Bunga:* Kompetitif dan flat dengan tenor 12 hingga 36 bulan.
💼 *Proses Terbantu:* Pendampingan survei ramah langsung di lokasi usaha Anda di {wilayah}.

{linkBrosur}

---
💡 *Layanan Jemput Bola di Tempat:*
Jika Bapak/Ibu memerlukan simulasi angsuran resmi atau diskusi di lokasi tempat usaha Anda di {wilayah}, petugas resmi kami siap bersilaturahmi tanpa dipungut biaya apapun.

Apakah berkenan kami kirimkan file PDF tabel simulasi angsuran lengkapnya?

Hormat kami,

Relationship Officer
PT Pegadaian Area Maluku`,

  'Amanah': `Yth. Pimpinan / Pemilik *{namaUsaha}*
Wilayah {wilayah}, Kota Ambon

Salam hormat,
Perkenalkan saya *{namaPetugas}*. 

Berdasarkan tinjauan reputasi usaha unggulan Anda di sektor *{kategori}* yang sangat aktif dan positif di Kota Ambon, kami ingin memberikan penawaran program prioritas:

🌟 *PEMBIAYAAN KENDARAAN SYARIAH AMANAH*
_Miliki Armada Motor atau Mobil Niaga Baru untuk Menunjang Mobilitas dan Distribusi Usaha Anda secara Murni Syariah_

*Fasilitas Kendaraan Operasional Syariah AMANAH:*
🚗 *Armada Niaga:* Motor pengantar pesanan kargo maupun Mobil Pickup / Van Niaga.
🚗 *Akad Syariah:* Prinsip Murabahah yang aman, adil, transparan tanpa denda riba tersembunyi.
🚗 *DP Ringan:* Uang muka bersahabat dan tenor fleksibel sesuai siklus perputaran kas usaha Anda.

{linkBrosur}

---
💡 *Layanan Jemput Bola di Tempat:*
Jika Bapak/Ibu memerlukan simulasi angsuran resmi atau diskusi di lokasi tempat usaha Anda di {wilayah}, petugas resmi kami siap bersilaturahmi tanpa dipungut biaya apapun.

Apakah berkenan kami kirimkan file PDF tabel simulasi angsuran lengkapnya?

Hormat kami,

Relationship Officer
PT Pegadaian Area Maluku`
};

const STORAGE_KEY = 'pegadaian_master_message_templates_v2';
const BACKUP_KEY = 'pegadaian_master_message_templates_custom_default';
export const MASTER_TEMPLATES_EVENT = 'pegadaian_master_templates_updated';

// In-memory cache to guarantee immediate read-after-write consistency
let cachedTemplates: MasterTemplatesMap | null = null;

// Helper to replace legacy signatures in any customized text
function replaceOldSignature(text: string): string {
  if (!text) return text;
  return text
    .replace(
      /\*PT PEGADAIAN \(PERSERO\)\*\s*\nUnit Bisnis Mikro & Keagenan Area Ambon\s*\n📍 Jl\. Kakialy No\.1[^\n]*\n📞 Hotline Resmi:[^\n]*/gi,
      `Hormat kami,\n\nRelationship Officer\nPT Pegadaian Area Maluku`
    )
    .replace(
      /Hormat kami,\s*\n\*PT PEGADAIAN \(PERSERO\)\*\s*\nUnit Bisnis Mikro & Keagenan Area Ambon\s*\n📍 Jl\. Kakialy No\.1[^\n]*\n📞 Hotline Resmi:[^\n]*/gi,
      `Hormat kami,\n\nRelationship Officer\nPT Pegadaian Area Maluku`
    );
}

/**
 * Get the current master templates from storage or default
 */
export function getMasterTemplates(): MasterTemplatesMap {
  if (cachedTemplates) {
    return { ...cachedTemplates };
  }

  if (typeof window === 'undefined') return { ...DEFAULT_MASTER_TEMPLATES };

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || 
                localStorage.getItem(BACKUP_KEY) || 
                localStorage.getItem('pegadaian_master_message_templates_v1');
    if (!raw) {
      cachedTemplates = { ...DEFAULT_MASTER_TEMPLATES };
      return { ...DEFAULT_MASTER_TEMPLATES };
    }
    const parsed = JSON.parse(raw);
    const result: MasterTemplatesMap = {
      'Cicil Emas': replaceOldSignature(parsed['Cicil Emas'] || DEFAULT_MASTER_TEMPLATES['Cicil Emas']),
      'Pinjaman Usaha': replaceOldSignature(parsed['Pinjaman Usaha'] || DEFAULT_MASTER_TEMPLATES['Pinjaman Usaha']),
      'Amanah': replaceOldSignature(parsed['Amanah'] || DEFAULT_MASTER_TEMPLATES['Amanah'])
    };
    cachedTemplates = result;
    return { ...result };
  } catch (e) {
    console.warn('Failed to parse master templates from localStorage:', e);
    return { ...DEFAULT_MASTER_TEMPLATES };
  }
}

/**
 * Check if a product's template has been customized by the user
 */
export function isMasterTemplateCustomized(product: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah'): boolean {
  const current = getMasterTemplates();
  return current[product].trim() !== DEFAULT_MASTER_TEMPLATES[product].trim();
}

/**
 * Save master templates to localStorage and dispatch update event
 */
export function saveMasterTemplates(templates: Partial<MasterTemplatesMap>): MasterTemplatesMap {
  const current = getMasterTemplates();
  const updated: MasterTemplatesMap = {
    ...current,
    ...templates
  };

  // Update in-memory cache immediately
  cachedTemplates = { ...updated };

  if (typeof window !== 'undefined') {
    try {
      const serialized = JSON.stringify(updated);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(BACKUP_KEY, serialized);
      window.dispatchEvent(new CustomEvent(MASTER_TEMPLATES_EVENT, { detail: updated }));
    } catch (e) {
      console.warn('Failed to save master templates to localStorage:', e);
    }
  }

  return updated;
}

/**
 * Reset a single product template or all templates to default
 */
export function resetMasterTemplates(product?: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah'): MasterTemplatesMap {
  if (!product) {
    cachedTemplates = { ...DEFAULT_MASTER_TEMPLATES };
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BACKUP_KEY);
        window.dispatchEvent(new CustomEvent(MASTER_TEMPLATES_EVENT, { detail: DEFAULT_MASTER_TEMPLATES }));
      } catch (e) {
        console.warn('Failed to reset master templates:', e);
      }
    }
    return { ...DEFAULT_MASTER_TEMPLATES };
  } else {
    const current = getMasterTemplates();
    current[product] = DEFAULT_MASTER_TEMPLATES[product];
    return saveMasterTemplates(current);
  }
}

/**
 * Replace placeholders in a master template for a specific business lead
 */
export function renderMasterTemplateText(
  rawTemplate: string,
  params: {
    businessName: string;
    product: 'Cicil Emas' | 'Pinjaman Usaha' | 'Amanah';
    district?: string;
    category?: string;
    rating?: number;
    phone?: string;
    salesOfficerName?: string;
    originUrl?: string;
  }
): string {
  const {
    businessName,
    product,
    district = 'Kota Ambon',
    category = 'UMKM',
    rating = 4.5,
    phone = '',
    salesOfficerName = 'Relationship Officer PT Pegadaian Area Maluku',
    originUrl = typeof window !== 'undefined' ? window.location.origin : ''
  } = params;

  let productSlug = 'cicil-emas';
  if (product === 'Pinjaman Usaha') productSlug = 'pinjaman-usaha';
  else if (product === 'Amanah') productSlug = 'amanah';

  let linkBrosur = '';
  if (originUrl && originUrl.startsWith('http')) {
    linkBrosur = `📸 *Lihat & Unduh Brosur Resmi Gambar HD:*\n${originUrl}/brosur/${productSlug}`;
  } else {
    linkBrosur = `📸 *Brosur Resmi:*\n[Gambar Brosur resmi resolusi tinggi dilampirkan bersama pesan ini]`;
  }

  // Replace placeholders dynamically
  let result = rawTemplate
    .replace(/\{namaUsaha\}/gi, businessName)
    .replace(/\{nama_usaha\}/gi, businessName)
    .replace(/\{wilayah\}/gi, district)
    .replace(/\{kecamatan\}/gi, district)
    .replace(/\{kategori\}/gi, category)
    .replace(/\{kategori_bisnis\}/gi, category)
    .replace(/\{produk\}/gi, product)
    .replace(/\{namaPetugas\}/gi, salesOfficerName)
    .replace(/\{nama_petugas\}/gi, salesOfficerName)
    .replace(/\{linkBrosur\}/gi, linkBrosur)
    .replace(/\{link_brosur\}/gi, linkBrosur)
    .replace(/\{rating\}/gi, String(rating))
    .replace(/\{noWhatsApp\}/gi, phone)
    .replace(/\{no_wa\}/gi, phone);

  return result;
}

/**
 * List of available placeholders for user guidance
 */
export const AVAILABLE_PLACEHOLDERS = [
  { tag: '{namaUsaha}', desc: 'Nama usaha / bisnis lead (Otomatis per usaha)', example: 'RM Beta Rasa' },
  { tag: '{wilayah}', desc: 'Wilayah kecamatan tempat usaha berada', example: 'Sirimau' },
  { tag: '{kategori}', desc: 'Kategori sektor bisnis prospek', example: 'Kuliner & Restoran' },
  { tag: '{produk}', desc: 'Nama produk Pegadaian rekomendasi', example: 'Cicil Emas' },
  { tag: '{namaPetugas}', desc: 'Nama petugas / akun RO yang sedang login', example: 'Relationship Officer PT Pegadaian Area Ambon' },
  { tag: '{linkBrosur}', desc: 'Link brosur web resmi + preview kartu WhatsApp', example: 'https://.../brosur/cicil-emas' },
  { tag: '{rating}', desc: 'Rating reputasi di Google Maps', example: '4.8' },
  { tag: '{noWhatsApp}', desc: 'Nomor telepon WhatsApp prospek', example: '08123456789' }
];
