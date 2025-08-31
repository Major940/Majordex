import React, { useEffect, useMemo, useRef, useState } from 'react'
import TCGdex from '@tcgdex/sdk'
import CardImage from '../components/CardImage'
import useCollection from '../hooks/useCollection'
import useWishlist from '../hooks/useWishlist'
import Accordion from '../components/Accordion'
import CollectionIndex from '../components/CollectionIndex'

const safe = (s) => String(s||'').replace(/;/g, ',')

export default function CollectionPage({ lang }){
  const { col, add, remove } = useCollection()
  const { wish } = useWishlist()

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  const [activeSerie, setActiveSerie] = useState('')
  const [activeSet, setActiveSet] = useState('')

  const sdkRef = useRef(null)
  useEffect(() => { sdkRef.current = new TCGdex(lang) }, [lang])

  const ownedEntries = useMemo(() => Object.entries(col||{}).filter(([,e]) => (e?.qty||0) > 0), [col])
  const ownedIds = useMemo(() => ownedEntries.map(([id]) => id), [ownedEntries])

  useEffect(() => {
    if (!ownedIds?.length){ setCards([]); return }
    let cancel = false; setLoading(true)
    ;(async () => {
      try {
        const res = await Promise.allSettled(ownedIds.map(id => sdkRef.current.card.get(id)))
        const ok = res.filter(r => r.status==='fulfilled').map(r => r.value)
        if (!cancel) setCards(ok)
      } finally { if (!cancel) setLoading(false) }
    })()
    return () => { cancel = true }
  }, [ownedIds, lang])

  const uniqueOwned = ownedIds.length
  const totalQty = ownedEntries.reduce((s,[,e]) => s + (e.qty||0), 0)
  const dupesCount = ownedEntries.reduce((s,[,e]) => s + Math.max(0,(e.qty||0)-1), 0)
  const wishOwned = wish.filter(id => ownedIds.includes(id)).length

  const [setsMeta, setSetsMeta] = useState({})
  useEffect(() => {
    const setIds = [...new Set(cards.map(c => c.set?.id).filter(Boolean))]
    if (!setIds.length) return
    const base = `https://api.tcgdex.net/v2/${lang}`
    ;(async () => {
      const entries = await Promise.all(setIds.map(async sid => {
        try{
          const data = await fetch(`${base}/sets/${sid}`).then(r=>r.json())
          const serie = data?.series || data?.serie || {}
          const total = Array.isArray(data?.cards) ? data.cards.length : (data?.cardCount || 0)
          return [sid, {
            id: sid,
            name: data?.name || sid,
            total,
            releaseDate: data?.releaseDate || data?.release || '',
            serieId: (serie?.id) || (typeof serie==='string'? serie : ''),
            serieName: (serie?.name) || (typeof serie==='string'? serie : ''),
          }]
        }catch(e){
          return [sid, { id: sid, name: sid, total: 0, releaseDate: '', serieId: '', serieName: '' }]
        }
      }))
      setSetsMeta(Object.fromEntries(entries))
    })()
  }, [cards, lang])

  const groups = useMemo(() => {
    const bySerie = new Map()
    for (const c of cards){
      const sid = c.set?.id || 'unknown'
      const meta = setsMeta[sid] || { id: sid, name: sid, serieId: 'unknown', serieName: '—', total: 0 }
      const serieKey = meta.serieId || 'unknown'
      if (!bySerie.has(serieKey)){
        bySerie.set(serieKey, { serieId: serieKey, serieName: meta.serieName || '—', sets: new Map() })
      }
      const serieObj = bySerie.get(serieKey)
      if (!serieObj.sets.has(sid)){
        serieObj.sets.set(sid, { setId: sid, setName: meta.name, total: meta.total, items: [] })
      }
      serieObj.sets.get(sid).items.push(c)
    }
    const arr = Array.from(bySerie.values()).map(s => ({
      ...s,
      sets: Array.from(s.sets.values()).sort((a,b)=> (a.setName||'').localeCompare(b.setName||''))
    }))
    return arr.sort((a,b)=> (a.serieName||'').localeCompare(b.serieName||''))
  }, [cards, setsMeta])

  const seriesIndex = useMemo(() => {
    return groups.map(g => ({
      id: g.serieId, name: g.serieName, count: g.sets.reduce((s,st)=>s+st.items.length,0)
    }))
  }, [groups])

  const setsIndex = useMemo(() => {
    const rows = []
    for (const g of groups){
      for (const st of g.sets){
        const total = st.total || 0
        rows.push({
          id: st.setId,
          name: st.setName,
          serieId: g.serieId,
          serieName: g.serieName,
          owned: st.items.length,
          total,
          pct: total? Math.round(st.items.length*100/total) : 0
        })
      }
    }
    return rows.sort((a,b)=> a.name.localeCompare(b.name))
  }, [groups])

  const filterCard = (c) => {
    const v = q.trim().toLowerCase()
    if (v && !((c.name||'').toLowerCase().includes(v) || (c.set?.name||'').toLowerCase().includes(v) || (c.id||'').toLowerCase().includes(v))) return false
    if (filter === 'dupes' && !((col[c.id]?.qty||0) > 1)) return false
    if (filter === 'wish' && !(wish.includes(c.id))) return false
    return true
  }

  const filteredGroups = useMemo(() => {
    return groups
      .filter(g => !activeSerie || g.serieId === activeSerie)
      .map(g => ({
        ...g,
        sets: g.sets
          .filter(st => !activeSet || st.setId === activeSet)
          .map(st => ({ ...st, items: st.items.filter(filterCard) }))
          .filter(st => st.items.length > 0)
      }))
      .filter(g => g.sets.length > 0)
  }, [groups, activeSerie, activeSet, q, filter])

  // === FIX: reset activeSet when selecting a serie; accept empty string as "clear"
  const refs = useRef({})
  const setRef = (key, el) => { refs.current[key] = el }
  const jumpTo = (serieId, setId) => {
    if (typeof serieId !== 'undefined') setActiveSerie(serieId || '')
    if (typeof setId !== 'undefined') setActiveSet(setId || '')   // <-- important: clear previous set
    requestAnimationFrame(() => {
      const key = (setId && setId !== '') ? setId : (serieId || '')
      const el = refs.current[key]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  const resetIndex = () => { setActiveSerie(''); setActiveSet('') }

  const exportCSV = () => {
    const headers = ['id','name','setId','setName','serieId','serieName','localId','rarity','hp','types','qty']
    const lines = [headers.join(';')]
    for (const c of cards){
      const e = col[c.id] || { qty: 0 }
      const m = setsMeta[c.set?.id] || {}
      const row = [c.id, safe(c.name), c.set?.id||'', safe(c.set?.name||''), m.serieId||'', safe(m.serieName||''), c.localId||'', c.rarity||'', c.hp||'', (c.types||[]).join(','), e.qty]
      lines.push(row.join(';'))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'collection_indexed.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="grid md:grid-cols-[320px,1fr] gap-4">
      <CollectionIndex
        series={seriesIndex}
        sets={setsIndex}
        onJump={jumpTo}
        onReset={resetIndex}
      />

      <div className="grid gap-6">
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-xl font-bold">Ma Collection — Supercharged</h2>
            <div className="flex items-center gap-2">
              <input className="border rounded px-3 py-2 w-64 bg-white/80 text-black" placeholder="Rechercher (nom, set, id)"
                    value={q} onChange={(e)=>setQ(e.target.value)} />
              <select className="border rounded px-2 py-2 bg-white/80 text-black" value={filter} onChange={(e)=>setFilter(e.target.value)}>
                <option value="all">Aucun filtre</option>
                <option value="dupes">Doublons</option>
                <option value="wish">Wishlist ❤️</option>
              </select>
              <button className="px-3 py-2 rounded bg-cyan-600 text-white" onClick={exportCSV}>Export CSV</button>
            </div>
          </div>
        </div>

        {loading ? <div className="text-slate-300">Chargement…</div> : (
          <div className="grid gap-4">
            {filteredGroups.map(serie => (
              <div key={serie.serieId || serie.serieName}>
                <h3 className="text-lg font-bold" ref={(el)=>setRef(serie.serieId, el)}>{serie.serieName || 'Série inconnue'}</h3>
                <div className="grid gap-3 p-3">
                  {serie.sets.map(st => {
                    const meta = setsMeta[st.setId] || { total: 0 }
                    const owned = st.items.length
                    const pct = meta.total ? Math.round(owned * 100 / meta.total) : 0
                    return (
                      <div key={st.setId} ref={(el)=>setRef(st.setId, el)} className="glass rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">
                            {st.setName} <span className="text-slate-300">({st.setId})</span>
                          </div>
                          <div className="text-sm text-slate-300">{owned}/{meta.total || '?'} — {pct}%</div>
                        </div>
                        <div className="h-2 rounded bg-white/10 overflow-hidden my-2">
                          <div className="h-full bg-cyan-500" style={{ width: pct + '%' }} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {st.items.map(c => {
                            const entry = col[c.id] || { qty: 0 }
                            return (
                              <div key={c.id} className="rounded-xl p-2 border border-white/10 hover:border-cyan-500/40 transition">
                                <CardImage card={c} />
                                <div className="mt-2 font-semibold text-sm truncate" title={c.name}>{c.name}</div>
                                <div className="text-xs text-slate-300">{c.id}</div>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <button className="px-2 py-1 text-xs border rounded" onClick={()=>add(c.id,-1)}>-</button>
                                    <span className="text-xs w-6 text-center">{entry.qty}</span>
                                    <button className="px-2 py-1 text-xs border rounded" onClick={()=>add(c.id,+1)}>+</button>
                                  </div>
                                  <button className="px-2 py-1 text-xs border rounded" onClick={()=>remove(c.id)} title="Retirer de ma collection">🗑</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {filteredGroups.length === 0 && (
              <div className="text-slate-300">Aucune carte ne correspond au filtre/à l'index sélectionné.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
