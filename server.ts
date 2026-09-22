import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { queryVerifiedAmbonDirectory } from './src/data/ambonRealPlaces';
import { queryVerifiedSocialMediaLeads, VERIFIED_AMBON_SOCIAL_LEADS } from './src/data/ambonSocialMediaLeads';
import { 
  scrapeSerperGoogleMaps, 
  scrapeOverpassLiveRadius, 
  scrapeLiveSocialMedia 
} from './src/server/realtimeScraper';
import { calculateHaversineDistanceKm } from './src/data/ambonGeoConfig';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client if API key is present
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Pegadaian Area Ambon Real-Time Scraper & Lead Profiler',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasSerperKey: Boolean(process.env.SERPER_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Endpoint to view brochure image with full OpenGraph / WhatsApp Rich Link Preview metadata
app.get('/brosur/:slug', (req, res) => {
  const { slug } = req.params;
  
  let title = 'Brosur Resmi PT Pegadaian Area Ambon';
  let desc = 'Solusi Resmi Investasi Emas Batangan & Pembiayaan Modal Usaha UMKM Kota Ambon';
  let imageUrl = 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80';
  let badge = 'PT Pegadaian Area Ambon';

  if (slug === 'emas' || slug === 'cicil-emas') {
    title = 'Brosur Resmi Cicil Emas Logam Mulia 24K - Pegadaian Area Ambon';
    desc = 'Amankan profit usaha dengan Emas Batangan 24K Galeri 24, Antam & UBS. Uang muka ringan mulai 10%, angsuran tetap & harga dikunci.';
    imageUrl = 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80';
    badge = 'Cicil Emas Batangan 99.99%';
  } else if (slug === 'modal' || slug === 'pinjaman-usaha' || slug === 'usaha') {
    title = 'Brosur Resmi Pinjaman Modal Usaha UMKM - Pegadaian Area Ambon';
    desc = 'Pembiayaan Modal Kerja & Investasi Usaha hingga Rp 500 Juta+. Agunan BPKB motor/mobil atau SHM, kendaraan tetap dipakai berniaga.';
    imageUrl = 'https://images.unsplash.com/photo-1556742049-0a67e5572240?auto=format&fit=crop&w=1200&q=80';
    badge = 'Pinjaman Usaha & Kupedes';
  } else if (slug === 'amanah' || slug === 'kendaraan') {
    title = 'Brosur Resmi Pembiayaan Kendaraan Syariah Pegadaian Amanah';
    desc = 'Miliki armada motor niaga & mobil pickup usaha dengan akad syariah murni, DP ringan mulai 10% dan cicilan flat.';
    imageUrl = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
    badge = 'Pegadaian Amanah Syariah';
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  
  <!-- WhatsApp & OpenGraph Rich Card Metadata -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="PT Pegadaian (Persero) Area Ambon">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  
  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${imageUrl}">

  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #064e3b;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      max-width: 640px;
      width: 100%;
      background: #ffffff;
      color: #0f172a;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    }
    .image-container {
      width: 100%;
      height: 340px;
      background: #0f172a;
      position: relative;
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .content {
      padding: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h1 {
      margin: 12px 0 8px 0;
      font-size: 20px;
      line-height: 1.3;
      color: #0f172a;
    }
    p {
      margin: 0 0 20px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn {
      flex: 1;
      min-width: 140px;
      text-align: center;
      padding: 12px 18px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 13px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #059669;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #047857;
    }
    .btn-outline {
      background: #f8fafc;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }
    .btn-outline:hover {
      background: #f1f5f9;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #a7f3d0;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="image-container">
      <img src="${imageUrl}" alt="${title}">
    </div>
    <div class="content">
      <span class="badge">${badge}</span>
      <h1>${title}</h1>
      <p>${desc}</p>
      <div class="actions">
        <a href="${imageUrl}" target="_blank" download class="btn btn-primary">Unduh Gambar Brosur HD</a>
        <a href="https://wa.me/6282290573903?text=Halo%20Pegadaian%20Area%20Ambon%2C%20saya%20tertarik%20dengan%20${encodeURIComponent(title)}" class="btn btn-outline">Konsultasi via WhatsApp</a>
      </div>
    </div>
  </div>
  <div class="footer">
    PT PEGADAIAN (PERSERO) &bull; Kantor Area Ambon &bull; Jl. Kakialy No.1, Kel. Rijali, Kec. Sirimau, Kota Ambon
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

// System configuration info for UI status badges
app.get('/api/config', (req, res) => {
  res.json({
    hasSerperKey: Boolean(process.env.SERPER_API_KEY),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    realtimeEngines: ['Serper.dev Google Maps API', 'OpenStreetMap Overpass Geolocation API (No Key Required)', 'Multi-Platform Verified Directory'],
    defaultCenter: {
      name: 'Pusat Kota Ambon (Lapangan Merdeka)',
      lat: -3.6974,
      lon: 128.1812
    }
  });
});

// API endpoint to extract and profile leads in real-time across Google Maps (with manual radius) and Social Media
app.post('/api/extract-leads', async (req, res) => {
  const { 
    keyword = 'Semua', 
    district = 'Semua Wilayah', 
    platform = 'all', 
    count = 25, 
    mode = 'search',
    radiusMeters = 3000,
    centerLat = -3.6974,
    centerLon = 128.1812,
    centerName = 'Pusat Kota Ambon'
  } = req.body;
  
  const totalItems = Math.min(Math.max(Number(count) || 25, 5), 60);
  const numericRadius = Number(radiusMeters) || 3000;
  const numLat = Number(centerLat) || -3.6974;
  const numLon = Number(centerLon) || 128.1812;

  let leadsResult: any[] = [];
  let scrapingSource: 'serper_live' | 'overpass_live' | 'directory_cache' | 'social_scan' = 'directory_cache';

  // 1. Check if user configured SERPER_API_KEY for real-time live Google Maps or Web Scraping
  if (process.env.SERPER_API_KEY) {
    try {
      if (platform === 'Google Maps' || platform === 'all') {
        const serperLeads = await scrapeSerperGoogleMaps({
          keyword,
          radiusMeters: numericRadius,
          centerLat: numLat,
          centerLon: numLon,
          count: totalItems
        });

        if (serperLeads && serperLeads.length > 0) {
          leadsResult = serperLeads;
          scrapingSource = 'serper_live';
        }
      }

      if (platform === 'TikTok' || platform === 'Instagram' || platform === 'Facebook') {
        const socialLeads = await scrapeLiveSocialMedia({
          keyword,
          platform,
          district,
          count: totalItems
        });
        if (socialLeads && socialLeads.length > 0) {
          leadsResult = socialLeads;
          scrapingSource = 'serper_live';
        }
      }
    } catch (serperErr) {
      console.warn('Serper.dev live scraping error, failing over to Overpass/local:', serperErr);
    }
  }

  // 2. If Serper wasn't used or returned empty, query real-time OpenStreetMap Overpass Geolocation API (Live radius around coordinates)
  if (leadsResult.length === 0 && (platform === 'Google Maps' || platform === 'all')) {
    try {
      const overpassLeads = await scrapeOverpassLiveRadius({
        keyword,
        radiusMeters: numericRadius,
        centerLat: numLat,
        centerLon: numLon,
        count: totalItems
      });

      if (overpassLeads && overpassLeads.length > 0) {
        leadsResult = overpassLeads;
        scrapingSource = 'overpass_live';
      }
    } catch (overpassErr) {
      console.warn('Overpass live radius scraping failed, failing over to verified directory:', overpassErr);
    }
  }

  // 3. Fallback or Social leads blending: If live scrapers yielded insufficient items, enrich from the verified Kota Ambon directory
  if (leadsResult.length < 5) {
    let fallbackLeads: any[] = [];
    if (platform === 'TikTok' || platform === 'Instagram' || platform === 'Facebook') {
      fallbackLeads = queryVerifiedSocialMediaLeads(keyword, district, platform);
      scrapingSource = 'social_scan';
    } else if (platform === 'Google Maps') {
      fallbackLeads = queryVerifiedAmbonDirectory(keyword, district, totalItems);
    } else {
      const mapsLeads = queryVerifiedAmbonDirectory(keyword, district, Math.ceil(totalItems * 0.6));
      const socialLeads = queryVerifiedSocialMediaLeads(keyword, district, 'all');
      fallbackLeads = [...socialLeads, ...mapsLeads];
    }

    // Attach calculated distance for each fallback lead relative to centerLat / centerLon
    const enrichedFallback = fallbackLeads.map(lead => {
      // Estimate coordinates if missing
      const lat = lead.latitude || numLat;
      const lon = lead.longitude || numLon;
      const dist = calculateHaversineDistanceKm(numLat, numLon, lat, lon);
      return {
        ...lead,
        distanceKm: dist
      };
    });

    // Merge without duplicates
    const existingTitles = new Set(leadsResult.map(l => l.namaUsaha.toLowerCase().trim()));
    for (const item of enrichedFallback) {
      if (!existingTitles.has(item.namaUsaha.toLowerCase().trim())) {
        leadsResult.push(item);
      }
      if (leadsResult.length >= totalItems) break;
    }
  }

  return res.status(200).json({
    success: true,
    source: scrapingSource,
    platform: platform,
    message: scrapingSource === 'serper_live'
      ? `Berhasil scraping real-time via Serper.dev Google Maps API (Radius: ${numericRadius / 1000} km di sekitar ${centerName}).`
      : scrapingSource === 'overpass_live'
      ? `Berhasil scraping real-time via OpenStreetMap Overpass Geolocation Ambon (Radius: ${numericRadius / 1000} km di sekitar ${centerName}).`
      : `Berhasil memindai entitas terverifikasi Kota Ambon (Radius: ${numericRadius / 1000} km).`,
    totalExtracted: leadsResult.length,
    radiusUsedMeters: numericRadius,
    centerUsed: {
      name: centerName,
      lat: numLat,
      lon: numLon
    },
    hasSerperKey: Boolean(process.env.SERPER_API_KEY),
    timestamp: new Date().toISOString(),
    leads: leadsResult
  });
});

// Gemini Search Grounding endpoint (gemini-3.5-flash with googleSearch tool)
app.post('/api/ai/grounded-search', async (req, res) => {
  const { query, district = 'Kota Ambon' } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ 
      error: 'GEMINI_API_KEY is not configured on the server',
      mockInfo: `Pencarian grounded untuk "${query}" di ${district} memerlukan GEMINI_API_KEY.`
    });
  }

  try {
    const prompt = `Berikan informasi terkini, profil bisnis, dan tren pasar UMKM di ${district}, Maluku terkait: "${query}".
Sertakan juga analisis rekomendasi produk PT Pegadaian yang tepat (misal: Cicil Emas untuk tabungan usaha, Pinjaman Usaha/Kupedes untuk ekspansi modal, atau Amanah untuk kendaraan niaga). Format respons secara terstruktur dengan poin-poin yang mudah dipahami oleh Relationship Manager Pegadaian.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const candidate = response.candidates?.[0];
    const text = response.text || '';
    const groundingMetadata = candidate?.groundingMetadata || null;

    return res.json({
      success: true,
      query,
      district,
      analysis: text,
      groundingMetadata,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Gemini Search Grounding error:', error);
    return res.status(500).json({ 
      error: error.message || 'Gagal menjalankan Google Search Grounding',
      details: String(error)
    });
  }
});

// Gemini Maps Grounding endpoint (gemini-3.5-flash with googleMaps tool)
app.post('/api/ai/grounded-maps', async (req, res) => {
  const { placeQuery, district = 'Kota Ambon', lat = -3.6974, lon = 128.1812 } = req.body;
  if (!placeQuery) {
    return res.status(400).json({ error: 'placeQuery parameter is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ 
      error: 'GEMINI_API_KEY is not configured on the server',
      mockInfo: `Pencarian Google Maps Grounding untuk "${placeQuery}" di Ambon memerlukan GEMINI_API_KEY.`
    });
  }

  try {
    const prompt = `Cari dan analisis entitas lokasi bisnis di Google Maps untuk "${placeQuery}" di wilayah ${district}, Kota Ambon, Maluku (koordinat sekitar ${lat}, ${lon}).
Jelaskan:
1. Nama entitas usaha dan estimasi lokasi/jalan utama di Ambon
2. Potensi aktivitas ekonomi dan peluang ekspansi bisnis
3. Rekomendasi produk pembiayaan atau investasi PT Pegadaian (Kupedes/Pinjaman Usaha, Cicil Emas Logam Mulia, atau Amanah)
4. Rekomendasi pendekatan (pitching angle) yang paling sopan dan tepat bagi pemilik usaha di Ambon.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });

    const candidate = response.candidates?.[0];
    const text = response.text || '';
    const groundingMetadata = candidate?.groundingMetadata || null;

    return res.json({
      success: true,
      placeQuery,
      district,
      analysis: text,
      groundingMetadata,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Gemini Maps Grounding error:', error);
    return res.status(500).json({ 
      error: error.message || 'Gagal menjalankan Google Maps Grounding',
      details: String(error)
    });
  }
});

// Start server and handle Vite middleware
async function startServer() {
  // Local development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `PT Pegadaian Area Ambon Lead Profiler server running on http://0.0.0.0:${PORT}`
      );
    });

    return;
  }

  // Production / local production mode
  const distPath = path.join(process.cwd(), 'dist');

  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Vercel handles the HTTP server.
  // Only listen when running outside Vercel.
  if (process.env.VERCEL !== '1') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `PT Pegadaian Area Ambon Lead Profiler server running on http://0.0.0.0:${PORT}`
      );
    });
  }
}

// Export Express app for Vercel Serverless Functions
export default app;

// Start the local server only when not running on Vercel
if (process.env.VERCEL !== '1') {
  startServer();
}
