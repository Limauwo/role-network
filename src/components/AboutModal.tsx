import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tentang Role Network dan Cara Berkontribusi"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8]"></div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Tentang Role Network
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup jendela informasi"
          >
            ✕
          </button>
        </div>

        {/* Visi Proyek */}
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            <strong className="text-white">Role Network</strong> adalah platform
            peta jalan karier IT interaktif dengan visualisasi graf jaringan
            (*network graph*). Platform ini hadir sebagai alternatif non-linear dari
            roadmap konvensional untuk menunjukkan bahwa keahlian teknologi saling
            terhubung lintas disiplin.
          </p>
          <p>
            Setiap peran memetakan teknologi riil dengan pranala langsung ke
            dokumentasi resmi berprotokol HTTPS, urutan prasyarat belajar
            logis (*topological order*), serta pelacak progres belajar lokal.
          </p>
        </div>

        {/* Panduan Berkontribusi */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>🤝</span>
            <span>Cara Berkontribusi</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Role Network dikembangkan secara terbuka. Anda dapat membantu
            memperluas graf ke bidang lain (Data, Cybersecurity, Cloud, dll):
          </p>
          <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 pl-1">
            <li>Fork repository di GitHub dan clone ke komputer lokal.</li>
            <li>
              Edit <code className="text-sky-300 font-mono">src/data/graph.json</code>{' '}
              untuk menambah node atau edge baru.
            </li>
            <li>
              Pastikan setiap node skill/tool memiliki{' '}
              <code className="text-sky-300 font-mono">docsUrl</code> HTTPS ke situs resmi.
            </li>
            <li>
              Jalankan <code className="text-emerald-400 font-mono">npm run validate:data</code>{' '}
              dan <code className="text-emerald-400 font-mono">npm run test</code>.
            </li>
            <li>Kirim Pull Request menggunakan template yang tersedia.</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition min-h-[44px]"
          >
            Mengerti & Mulai Jelajah
          </button>
        </div>
      </div>
    </div>
  );
};
