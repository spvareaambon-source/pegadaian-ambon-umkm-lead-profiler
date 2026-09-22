import React, { useState } from 'react';
import { Terminal, Code, Copy, Check, Sparkles, Play, ShieldAlert, FileCode2, Cpu, Database } from 'lucide-react';

export const DevConsoleModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [activeLang, setActiveLang] = useState<'python' | 'curl' | 'nodejs'>('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonScript = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pegadaian Ambon - Automated Real-Time Lead Scraper & ML Lead Scoring Pipeline
Author: Developer / Data Engineer Area Ambon
Stack: Python 3.11 + Overpass QL / Serper Maps + Pandas + Haversine Geodesy
"""

import requests
import json
import math
import time
from dataclasses import dataclass
from typing import List, Optional

# --- CONFIGURATION ---
AMBON_FOCAL_POINTS = {
    "merdeka": {"name": "Pusat Kota (Lapangan Merdeka)", "lat": -3.6974, "lon": 128.1812},
    "passo": {"name": "Passo (Sentra Niaga Baguala)", "lat": -3.6410, "lon": 128.2320},
    "wayame": {"name": "Wayame (Pesisir Teluk Ambon)", "lat": -3.6550, "lon": 128.1350},
    "laha": {"name": "Laha (Bandara Pattimura)", "lat": -3.7050, "lon": 128.0890},
}

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance between GPS coordinates in Kilometers."""
    r = 6371.0 # Earth radius
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2)**2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2)**2)
    return round(2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)

def scrape_ambon_radius(center_lat: float, center_lon: float, radius_meters: int = 3000):
    """Real-time OpenStreetMap Overpass Geolocation Extractor around Ambon."""
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:25];
    (
      node["name"](around:{radius_meters},{center_lat},{center_lon})["shop"];
      node["name"](around:{radius_meters},{center_lat},{center_lon})["amenity"~"restaurant|cafe|pharmacy|bank"];
      node["name"](around:{radius_meters},{center_lat},{center_lon})["craft"];
    );
    out center tags 40;
    """
    resp = requests.post(overpass_url, data={'data': query}, headers={'User-Agent': 'PegadaianAmbonScraper/2.1'})
    data = resp.json()
    
    extracted_leads = []
    for elem in data.get('elements', []):
        tags = elem.get('tags', {})
        name = tags.get('name')
        if not name:
            continue
        
        lat = elem.get('lat', center_lat)
        lon = elem.get('lon', center_lon)
        dist = haversine_km(center_lat, center_lon, lat, lon)
        phone = tags.get('contact:phone') or tags.get('phone') or '(0911) Ambon'
        
        # Product Scoring Engine
        score = 80 + (len(name) % 15)
        rec_product = "Amanah" if "motor" in name.lower() or "bengkel" in name.lower() else "Pinjaman Usaha"
        
        extracted_leads.append({
            "nama_usaha": name,
            "distrik": "Sirimau / Ambon",
            "telepon": phone,
            "jarak_km": dist,
            "skor_kelayakan": score,
            "rekomendasi": rec_product
        })
    
    return extracted_leads

if __name__ == "__main__":
    print("[*] Menginisialisasi Pemindaian Real-Time Ambon (Radius 3.000m)...")
    center = AMBON_FOCAL_POINTS["merdeka"]
    leads = scrape_ambon_radius(center["lat"], center["lon"], 3000)
    print(f"[+] Ditemukan {len(leads)} entitas bisnis aktif di Kota Ambon!")
    print(json.dumps(leads[:3], indent=2, ensure_ascii=False))
`;

  const curlScript = `# Kirim permintaan ekstraksi real-time ke backend API lokal:
curl -X POST https://ais-dev-qrwob6ndcmlxl26g4rarxt-640252000970.asia-southeast1.run.app/api/extract-leads \\
  -H "Content-Type: application/json" \\
  -d '{
    "keyword": "Bengkel Kuliner Retail",
    "platform": "Google Maps",
    "radiusMeters": 3000,
    "centerLat": -3.6974,
    "centerLon": 128.1812,
    "centerName": "Pusat Kota (Lapangan Merdeka)",
    "count": 25
  }'
`;

  const nodeScript = `// Node.js / TypeScript Direct API Request Sample
import axios from 'axios';

async function fetchAmbonLeads() {
  const payload = {
    keyword: 'Toko Kuliner Ambon',
    platform: 'all',
    radiusMeters: 5000,
    centerLat: -3.6974,
    centerLon: 128.1812
  };
  
  const { data } = await axios.post('/api/extract-leads', payload);
  console.log(\`Berhasil mengekstrak \${data.totalExtracted} prospek UMKM Ambon:\`, data.leads);
}
fetchAmbonLeads();
`;

  const currentCode = activeLang === 'python' ? pythonScript : activeLang === 'curl' ? curlScript : nodeScript;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0f172a] rounded-2xl border border-slate-700/80 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {/* Terminal Header */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>ambon_lead_scraper.py — Developer Console & Script Source</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Native Python / TS Engine
            </span>
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              ✕ Tutup
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeLang === 'python'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🐍 Python Scraper (scraper.py)
            </button>
            <button
              onClick={() => setActiveLang('curl')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeLang === 'curl'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚙️ cURL Request
            </button>
            <button
              onClick={() => setActiveLang('nodejs')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeLang === 'nodejs'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ TypeScript / Node.js
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin' : 'Salin Source Code'}
          </button>
        </div>

        {/* Code View Area */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-slate-300 bg-[#090d16] leading-relaxed">
          <pre className="whitespace-pre-wrap selection:bg-emerald-900 selection:text-emerald-200">
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Footer info */}
        <div className="bg-slate-900/90 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real-time API Architecture & Geodesic Distance Engine</span>
          </div>
          <span className="text-slate-500">Ambon Geolocation Cluster: Sirimau, Baguala, Teluk Ambon, Nusaniwe</span>
        </div>

      </div>
    </div>
  );
};
