import React, { useMemo, useState } from "react";

/**
 * CollectionIndex
 * - series: [{id,name,count}]
 * - sets:   [{id,name,serieId,serieName,owned,total,pct}]
 * - onJump: (serieId?:string, setId?:string) => void
 */
export default function CollectionIndex({ series=[], sets=[], onJump, onReset }){
  const [qSerie, setQSerie] = useState("");
  const [qSet, setQSet] = useState("");

  const fSeries = useMemo(() => {
    const v = qSerie.trim().toLowerCase();
    return !v ? series : series.filter(s => (s.name||"").toLowerCase().includes(v) || (s.id||"").toLowerCase().includes(v));
  }, [qSerie, series]);

  const fSets = useMemo(() => {
    const v = qSet.trim().toLowerCase();
    return !v ? sets : sets.filter(s => (s.name||"").toLowerCase().includes(v) || (s.id||"").toLowerCase().includes(v) || (s.serieName||"").toLowerCase().includes(v));
  }, [qSet, sets]);

  return (
    <aside className="glass rounded-2xl p-3 md:p-4 sticky top-3 h-fit max-h-[calc(100vh-1rem)] overflow-auto">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-semibold">Index</div>
        <button className="text-xs px-2 py-1 border rounded" onClick={onReset}>Réinitialiser</button>
      </div>

      <div className="text-xs uppercase opacity-70 mb-1">Séries</div>
      <input
        className="w-full border rounded px-2 py-1 mb-2 bg-white/80 text-black text-sm"
        placeholder="Rechercher série…"
        value={qSerie}
        onChange={(e)=>setQSerie(e.target.value)}
      />
      <ul className="space-y-1 mb-4">
        {fSeries.map(s => (
          <li key={s.id}>
            <button
              className="w-full text-left px-2 py-1 rounded hover:bg-white/10"
              onClick={()=> onJump(s.id, "")}
              title={`${s.name} — ${s.count} cartes`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{s.name || s.id}</span>
                <span className="text-xs opacity-70">{s.count}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="text-xs uppercase opacity-70 mb-1">Sets</div>
      <input
        className="w-full border rounded px-2 py-1 mb-2 bg-white/80 text-black text-sm"
        placeholder="Rechercher set…"
        value={qSet}
        onChange={(e)=>setQSet(e.target.value)}
      />
      <ul className="space-y-1">
        {fSets.map(s => (
          <li key={s.id}>
            <button
              className="w-full text-left px-2 py-1 rounded hover:bg-white/10"
              onClick={()=> onJump(s.serieId, s.id)}
              title={`${s.name} — ${s.owned}/${s.total || "?"} (${s.pct}%)`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate">{s.name} <span className="opacity-70 text-xs">({s.id})</span></div>
                <div className="text-xs opacity-70">{s.owned}/{s.total || "?"}</div>
              </div>
              <div className="h-1 rounded bg-white/10 overflow-hidden mt-1">
                <div className="h-full bg-cyan-500" style={{ width: (s.pct||0) + "%" }} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
