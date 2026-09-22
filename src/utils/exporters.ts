import { BusinessLead } from '../types';

/**
 * Generates an exact Markdown Table conforming strictly to the requested columns:
 * - ID
 * - Nama Usaha
 * - Kategori Bisnis
 * - Wilayah/Kecamatan
 * - No. WhatsApp/Telepon
 * - Rating Maps
 * - Skor Kelayakan (1-100)
 * - Rekomendasi Produk Pegadaian
 * - Draf Pesan WA Pertama
 */
export function generateMarkdownTable(leads: BusinessLead[]): string {
  const sanitizeCell = (text: string | number | undefined): string => {
    if (text === undefined || text === null) return '-';
    // Replace newlines and pipe characters to preserve markdown table structure
    return String(text).replace(/\|/g, '\\|').replace(/\r?\n|\r/g, ' ').trim();
  };

  const headers = [
    'ID',
    'Platform',
    'Nama Usaha',
    'Kategori Bisnis',
    'Wilayah/Kecamatan',
    'Akun / Handle',
    'No. WhatsApp/Telepon',
    'Rating / Reputasi',
    'Skor Kelayakan (1-100)',
    'Rekomendasi Produk Pegadaian',
    'Draf Pesan WA Pertama'
  ];

  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;

  const rows = leads.map(lead => {
    const contactDisplay = lead.noTeleponMaps && lead.noTeleponMaps !== lead.noWhatsApp
      ? `${lead.noTeleponMaps} / WA: ${lead.noWhatsApp}`
      : lead.noWhatsApp;
    const platformDisplay = lead.platformSumber || 'Google Maps';
    const handleDisplay = lead.socialHandle || (lead.googleMapsUrl ? 'Google Maps' : '-');
    return `| ${sanitizeCell(lead.id)} | ${sanitizeCell(platformDisplay)} | ${sanitizeCell(lead.namaUsaha)} | ${sanitizeCell(lead.kategoriBisnis)} | ${sanitizeCell(lead.wilayahKecamatan)} | ${sanitizeCell(handleDisplay)} | ${sanitizeCell(contactDisplay)} | ${sanitizeCell(lead.ratingMaps)} | ${sanitizeCell(lead.skorKelayakan)} | ${sanitizeCell(lead.rekomendasiProduk)} | ${sanitizeCell(lead.drafPesanWAPertama)} |`;
  });

  return [headerRow, separatorRow, ...rows].join('\n');
}

/**
 * Exports data to CSV with UTF-8 BOM for perfect Excel compatibility in Indonesian locale
 */
export function exportToCSV(leads: BusinessLead[], filename = 'Pegadaian_Ambon_UMKM_Leads.csv'): void {
  const headers = [
    'ID',
    'Platform Sumber',
    'Nama Usaha',
    'Kategori Bisnis',
    'Wilayah/Kecamatan',
    'Akun Medsos / Handle',
    'Link Profil / Maps',
    'Follower / Audiens',
    'Alamat Lengkap',
    'No. Telepon Google Maps',
    'No. WhatsApp Outreach',
    'Rating Maps',
    'Jumlah Review',
    'Skor Kelayakan (1-100)',
    'Rekomendasi Produk Pegadaian',
    'Alasan Rekomendasi',
    'Draf Pesan WA Pertama'
  ];

  const escapeCSV = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(h => `"${h}"`).join(','),
    ...leads.map(lead => [
      escapeCSV(lead.id),
      escapeCSV(lead.platformSumber || 'Google Maps'),
      escapeCSV(lead.namaUsaha),
      escapeCSV(lead.kategoriBisnis),
      escapeCSV(lead.wilayahKecamatan),
      escapeCSV(lead.socialHandle || '-'),
      escapeCSV(lead.socialUrl || lead.googleMapsUrl || ''),
      escapeCSV(lead.followerCount || '-'),
      escapeCSV(lead.alamatLengkap || ''),
      escapeCSV(lead.noTeleponMaps || '-'),
      escapeCSV(lead.noWhatsApp),
      escapeCSV(lead.ratingMaps),
      escapeCSV(lead.reviewCount || 0),
      escapeCSV(lead.skorKelayakan),
      escapeCSV(lead.rekomendasiProduk),
      escapeCSV(lead.alasanRekomendasi || ''),
      escapeCSV(lead.drafPesanWAPertama)
    ].join(','))
  ];

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Checks if a phone number is an Indonesian mobile phone (08xx or 628xx)
 */
export function isMobilePhone(phone?: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.startsWith('08') || digits.startsWith('628') || (digits.length >= 10 && digits.startsWith('8'));
}

/**
 * Creates direct WhatsApp link with encoded message only if phone is valid mobile
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  if (!phone) return '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 9) return '';
  const normalizedPhone = cleanPhone.startsWith('0') 
    ? '62' + cleanPhone.substring(1) 
    : cleanPhone;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Creates direct Google Maps Search URL for real-time verification
 */
export function getGoogleMapsUrl(businessName: string, district?: string, address?: string): string {
  const query = `${businessName} ${address ? address : ''} ${district ? district : ''} Kota Ambon`.replace(/\s+/g, ' ').trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
