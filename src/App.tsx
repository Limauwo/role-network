import React, { useState } from 'react';
import { loadGraphData } from './data/loadGraph';
import { NetworkGraph } from './components/NetworkGraph';
import type { GraphNode } from './types/graph';

export const App: React.FC = () => {
  const graphData = loadGraphData();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 font-sans">
      {/* Top Navbar Header */}
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8]"></div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              Role Network
            </h1>
            <p className="text-[11px] text-slate-400 leading-none">
              Peta Karier IT Interaktif
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Graf Aktif</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            Fase 2 / 5
          </div>
        </div>
      </header>

      {/* Main Graph Canvas Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <NetworkGraph data={graphData} onSelectNode={setSelectedNode} />

        {/* Selected Node Sidebar Inspector */}
        {selectedNode && (
          <aside className="absolute top-4 right-4 z-20 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-5 rounded-xl shadow-2xl text-slate-200 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 mb-1">
                  {selectedNode.type}
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {selectedNode.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition"
                aria-label="Tutup panel"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-300">
              {selectedNode.description && (
                <p className="text-slate-300">{selectedNode.description}</p>
              )}

              {selectedNode.category && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Kategori:</span>
                  <span className="capitalize font-medium text-slate-200">
                    {selectedNode.category}
                  </span>
                </div>
              )}

              {selectedNode.docsUrl && (
                <div className="pt-2">
                  <a
                    href={selectedNode.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium shadow-sm transition"
                  >
                    <span>Buka Dokumentasi Resmi</span>
                    <span className="text-[10px]">↗</span>
                  </a>
                </div>
              )}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default App;
