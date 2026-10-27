import React from 'react';
import { loadGraphData } from './data/loadGraph';

export const App: React.FC = () => {
  const graphData = loadGraphData();

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Role Network
        </h1>
        <p className="text-slate-400 mt-1">
          Peta Karier IT Interaktif - Fondasi & Skema Data (Fase 1)
        </p>
      </header>

      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-200 mb-3">
          Status Skema Data
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <span className="text-slate-400 block text-xs uppercase font-medium">
              Jumlah Node
            </span>
            <span className="text-2xl font-bold text-sky-400">
              {graphData.nodes.length}
            </span>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <span className="text-slate-400 block text-xs uppercase font-medium">
              Jumlah Edge
            </span>
            <span className="text-2xl font-bold text-emerald-400">
              {graphData.edges.length}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default App;
