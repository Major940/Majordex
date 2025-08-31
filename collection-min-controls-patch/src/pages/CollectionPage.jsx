import React, { useEffect, useMemo, useRef, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import useCollection from '../hooks/useCollection'
import useWishlist from '../hooks/useWishlist'
import TCGdex from '@tcgdex/sdk'
import CardImage from '../components/CardImage'

const safe = (s) => String(s||'').replace(/;/g, ',')

export default function CollectionPage({ lang }){
  const [favIds] = useLocalStorage('favs', [])
  const { col, add, remove } = useCollection() // simplifié : qty +/- et supprimer
  const { wish } = useWishlist()

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('set')
  const [filter, setFilter] = useState('all') // all | dupes | wish
  const [condFilter] = useState('') // conservé pour compat si besoin

  const sdkRef = useRef(null)
  useEffect(() => { sdkRef.current = new TCGdex(lang) }, [lang])

  // Charger détails pour (collection ∪ favoris)
  const masterIds = useMemo(() => Array.from(new Set([...Object.keys(col||{}), ...favIds])), [col, favIds])

  useEffect(() => {
    if (!masterIds?.length){ setCards([]); return }
    let cancel = false; setLoading(true)
    ;(async () => {
      try {
        const res = await Promise.allSettled(masterIds.map(id => sdkRef.current.card.get(id)))
        const ok = res.filter(r => r.status==='fulfilled').map(r => r.value)
        if (!cancel) setCards(ok)
      } finally { if (!cancel) setLoading(false) }
    })()
    return () => { cancel = true }
  }, [masterIds, lang])

  // ====== Stats min ======
  const ownedEntries = useMemo(() => Object.entries(col||{}).filter(([,e]) => (e?.qty||0) > 0), [col])
  const ownedIds = ownedEntries.map(([id]) => id)
  const uniqueOwned = ownedIds.length
  const totalQty = ownedEntries.reduce((s,[,e]) => s + (e.qty||0), 0)
  const dupesCount = ownedEntries.reduce((s,[,e]) => s + Math.max(0,(e.qty||0)-1), 0)
  const wishOwned = wish.filter(id => ownedIds.includes(id)).length

  // Progression par set (simple top 5)
  const [setTotals, setSetTotals] = useState({})
  useEffect(() => {
    const ids = [...new Set(cards.map(c => c.set?.id).filter(Boolean))]
    if (!ids.length) return
    const base = `https://api.tcgdex.net/v2/${lang}`
    ;(async () => {
      const entries = await Promise.all(ids.map(async id => {
        try {
          const res = await fetch(`${base}/sets/${id}`).then(r=>r.json())
          const total = Array.isArray(res?.cards) ? res.cards.length : (res?.cardCount || 0)
          return [id, total]
        } catch { return [id, 0] }
      }))
      setSetTotals(Object.fromEntries(entries))
    })()
  }, [cards, lang])

  const progress = useMemo(() => {
    const map = new Map()
    for (const id of ownedIds){
      const c = cards.find(x=>x.id===id); if(!c) continue
      const sid = c.set?.id; if(!sid) continue
      map.set(sid, (map.get(sid)||0)+1)
    }
    const rows = [...map.entries()].map(([sid, owned]) => {
      const total = setTotals[sid] || 0
      const name = cards.find(x=>x.set?.id===sid)?.set?.name || sid
      const pct = total? Math.round(owned*100/total) : 0
      return { sid, name, owned, total, pct }
    }).sort((a,b)=> b.pct - a.pct)
    return rows.slice(0,5)
  }, [ownedIds, cards, setTotals])

  // ====== Filtres d'affichage & tri ======
  const filtered = useMemo(() => {
    let arr = cards
    const v = q.trim().toLowerCase()
    if (v) arr = arr.filter(c => (c.name||'').toLowerCase().includes(v) || (c.set?.name||'').toLowerCase().includes(v))
    if (filter === 'dupes') arr = arr.filter(c => (col[c.id]?.qty||0) > 1)
    if (filter === 'wish') arr = arr.filter(c => wish.includes(c.id))
    if (sort === 'name') arr = [...arr].sort((a,b)=> (a.name||'').localeCompare(b.name||''))
    if (sort === 'set') arr = [...arr].sort((a,b)=> (a.set?.id||'').localeCompare(b.set?.id||'') || (a.localId||'').localeCompare(b.localId||''))
    if (sort === 'rarity') arr = [...arr].sort((a,b)=> (a.rarity||'').localeCompare(b.rarity||''))
    return arr
  }, [cards, q, sort, filter, col, wish])

  const bySetGroups = useMemo(() => groupBySet(filtered), [filtered])

  // Export CSV
  const exportCSV = () => {
    const headers = ['id','name','setId','setName','localId','rarity','hp','types','qty']
    const lines = [headers.join(';')]
    for (const c of cards){
      const e = col[c.id] || { qty: 0 }
      const row = [c.id, safe(c.name), c.set?.id||'', safe(c.set?.name||''), c.localId||'', c.rarity||'', c.hp||'', (c.types||[]).join(','), e.qty]
      lines.push(row.join(';'))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'collection.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6">
      {/* Barre d'actions minimaliste */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-bold">Ma Collection</h2>
          <div className="flex items-center gap-2">
            <input className="border rounded px-3 py-2 w-64 bg-white/80 text-black" placeholder="Rechercher" value={q} onChange={(e)=>setQ(e.target.value)} />
            <select className="border rounded px-2 py-2 bg-white/80 text-black" value={sort} onChange={(e)=>setSort(e.target.value)}>
              <option value="set">Par set</option>
              <option value="name">Par nom</option>
              <option value="rarity">Par rareté</option>
            </select>
            <select className="border rounded px-2 py-2 bg-white/80 text-black" value={filter} onChange={(e)=>setFilter(e.target.value)}>
              <option value="all">Aucun filtre</option>
              <option value="dupes">Doublons</option>
              <option value="wish">Wishlist ❤️</option>
            </select>
            <button className="px-3 py-2 rounded bg-cyan-600 text-white" onClick={exportCSV}>Export CSV</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <StatChip label="Uniques" value={uniqueOwned} />
          <StatChip label="Exemplaires" value={totalQty} />
          <StatChip label="Doublons" value={dupesCount} tone="amber" />
          <StatChip label="Wishlist complétée" value={`${wishOwned}/${wish.length}`} tone="pink" />
        </div>
      </div>

      {/* Progress top 5 simple */}
      {progress.length>0 && (
        <div className="glass rounded-2xl p-4">
          <h3 className="font-semibold mb-2">Progression (Top 5 sets)</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {progress.map(p => (
              <ProgressRow key={p.sid} name={`${p.name} (${p.sid})`} value={p.pct} meta={`${p.owned}/${p.total}`} />
            ))}
          </div>
        </div>
      )}

      {/* Groupes par set + cartes */}
      {loading ? (
        <div className="text-slate-300">Chargement…</div>
      ) : (
        <div className="grid gap-6">
          {bySetGroups.map(group => (
            <div key={group.meta.id} className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">{group.meta.name} <span className="text-sm text-slate-300">({group.meta.id})</span></div>
                <div className="text-sm text-slate-300">{group.items.length} cartes</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {group.items.map(c => {
                  const entry = col[c.id] || { qty: 0 }
                  return (
                    <div key={c.id} className="glass rounded-xl p-2">
                      <CardImage card={c} />
                      <div className="mt-2 font-semibold text-sm truncate" title={c.name}>{c.name}</div>
                      <div className="text-xs text-slate-300">{c.id}</div>

                      {/* ---- Barre de contrôle ultra simple ---- */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button className="px-2 py-1 text-xs border rounded" onClick={()=>add(c.id,-1)} aria-label="Diminuer">-</button>
                          <span className="text-xs w-6 text-center">{entry.qty}</span>
                          <button className="px-2 py-1 text-xs border rounded" onClick={()=>add(c.id,+1)} aria-label="Augmenter">+</button>
                        </div>
                        <button className="px-2 py-1 text-xs border rounded" onClick={()=>remove(c.id)} title="Retirer de ma collection">🗑</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function groupBySet(cards){
  const m = new Map()
  for (const c of cards){
    const key = c.set?.id || 'unknown'
    if (!m.has(key)) m.set(key, { meta: c.set || { id: key, name: '—' }, items: [] })
    m.get(key).items.push(c)
  }
  return Array.from(m.values()).sort((a,b)=> (a.meta.id||'').localeCompare(b.meta.id||''))
}

function StatChip({ label, value, tone='cyan' }){
  const bg = tone==='pink' ? 'bg-pink-600/20 text-pink-300 border-pink-600/40'
    : tone==='amber' ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
    : 'bg-cyan-600/20 text-cyan-200 border-cyan-600/40'
  return (
    <div className={`glass rounded-2xl p-4 border ${bg}`}>
      <div className="text-sm">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
    </div>
  )
}

function ProgressRow({ name, value, meta }){
  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-sm">
        <span className="truncate" title={name}>{name}</span>
        <span className="text-slate-300">{meta} — {value}%</span>
      </div>
      <div className="h-2 rounded bg-white/10 overflow-hidden">
        <div className="h-full bg-cyan-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
