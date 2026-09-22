import React, { useState } from 'react';
import { Copy, Check, Download, FileText, Eye, Code } from 'lucide-react';
import { BusinessLead } from '../types';
import { generateMarkdownTable } from '../utils/exporters';

interface MarkdownTableViewProps {
  leads: BusinessLead[];
  onCopyText: (text: string, label: string) => void;
}

export const MarkdownTableView: React.FC<MarkdownTableViewProps> = ({
  leads,
  onCopyText
}) => {
  const [viewMode, setViewMode] = useState<'raw' | 'preview'>('raw');
  const [isCopied, setIsCopied] = useState(false);

  const markdownContent = generateMarkdownTable(leads);

  const handleCopy = () => {
    onCopyText(markdownContent, 'Tabel Markdown');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pegadaian_Ambon_UMKM_Table_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      
      {/* Top Header Controls */}
      <div className="bg-slate-900 text-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Format Resmi: Markdown Table Clean Data
          </span>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            {leads.length} Entitas
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View */}
          <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700">
            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'raw'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Raw Markdown
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'preview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Render
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            id="btn-copy-markdown"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'Tersalin!' : 'Salin Markdown'}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            id="btn-download-markdown"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-all"
            title="Download file .md"
          >
            <Download className="w-3.5 h-3.5" />
            .MD
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'raw' ? (
        <div className="p-4 bg-slate-950 overflow-x-auto">
          <pre className="font-mono text-[11px] leading-relaxed text-emerald-400 whitespace-pre selection:bg-emerald-800 selection:text-white">
            {markdownContent}
          </pre>
        </div>
      ) : (
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                <th className="p-2 border-r border-slate-300">ID</th>
                <th className="p-2 border-r border-slate-300">Nama Usaha</th>
                <th className="p-2 border-r border-slate-300">Kategori Bisnis</th>
                <th className="p-2 border-r border-slate-300">Wilayah/Kecamatan</th>
                <th className="p-2 border-r border-slate-300">No. WhatsApp/Telepon</th>
                <th className="p-2 border-r border-slate-300">Rating Maps</th>
                <th className="p-2 border-r border-slate-300">Skor Kelayakan (1-100)</th>
                <th className="p-2 border-r border-slate-300">Rekomendasi Produk Pegadaian</th>
                <th className="p-2">Draf Pesan WA Pertama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-2 font-mono font-bold text-slate-700 border-r border-slate-200">{l.id}</td>
                  <td className="p-2 font-semibold text-slate-900 border-r border-slate-200">{l.namaUsaha}</td>
                  <td className="p-2 border-r border-slate-200">{l.kategoriBisnis}</td>
                  <td className="p-2 border-r border-slate-200">{l.wilayahKecamatan}</td>
                  <td className="p-2 font-mono text-emerald-700 font-semibold border-r border-slate-200">{l.noWhatsApp}</td>
                  <td className="p-2 border-r border-slate-200">{l.ratingMaps}</td>
                  <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{l.skorKelayakan}</td>
                  <td className="p-2 font-semibold text-emerald-800 border-r border-slate-200">{l.rekomendasiProduk}</td>
                  <td className="p-2 text-slate-700 italic">{l.drafPesanWAPertama}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Instructions */}
      <div className="bg-slate-100 px-4 py-2 text-[11px] text-slate-600 border-t border-slate-200 flex items-center justify-between">
        <span>
          💡 Output tabel di atas siap disalin langsung ke laporan markdown resmi atau diekspor ke format dokumen PT Pegadaian.
        </span>
        <button
          onClick={handleCopy}
          className="text-emerald-700 hover:text-emerald-900 font-bold underline"
        >
          Klik untuk Salin Seluruh Tabel
        </button>
      </div>

    </div>
  );
};
