import React, { useEffect, useMemo, useRef, useState } from 'react'
import Skeleton from '../components/Skeleton'
import CardImage from '../components/CardImage'

export default function CollectionView({ sdk, favIds, setFavIds, lang }){
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('set')
  const fileRef = useRef(null)

  useEffect(() => {
    if (!favIds?.length){ setCards([]); return }
    let cancel = false
    setLoading(true)
    ;(async () => {
      try {
        const res = await Promise.allSettled(favIds.map(id => sdk.card.get(id)))
        const ok = res.filter(r => r.status==='fulfilled').map(r => r.value)
        if (!cancel) setCards(ok)
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => { cancel = true }
  }, [favIds, sdk, lang])

  const filtered = useMemo(() => {
    const v = q.trim().toLowerCase()
    let arr = !v ? cards : cards.filter(c => (c.name||'').toLowerCase().includes(v) || (c.set?.name||'').toLowerCase().includes(v))
    if (sort === 'name') arr = [...arr].sort((a,b)=> (a.name||'').localeCompare(b.name||''))
    if (sort === 'set') arr = [...arr].sort((a,b)=> (a.set?.id||'').localeCompare(b.set?.id||'') || (a.localId||'').localeCompare(b.localId||''))
    if (sort === 'rarity') arr = [...arr].sort((a,b)=> (a.rarity||'').localeCompare(b.rarity||''))
    return arr
  }, [cards, q, sort])

  const bySet = useMemo(() => {
    const m = new Map()
    for (const c of filtered){
      const key = c.set?.id || 'unknown'
      if (!m.has(key)) m.set(key, { meta: c.set || { id: key, name: '—' }, items: [] })
      m.get(key).items.push(c)
    }
    return Array.from(m.values()).sort((a,b)=> (a.meta.id||'').localeCompare(b.meta.id||''))
  }, [filtered])

  const exportJSON = () => {
    const data = { favIds }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'collection.json'; a.click(); URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const headers = ['id','name','setId','setName','localId','rarity','hp','types']
    const lines = [headers.join(';')]
    for (const c of cards){
      const row = [
        c.id, (c.name||'').replace(/;/g, ','),
        c.set?.id || '', (c.set?.name||'').replace(/;/g, ','),
        c.localId || '', c.rarity || '', c.hp || '',
        (c.types||[]).join(',')
      ]
      lines.push(row.join(';'))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'collection.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const importJSON = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const ids = Array.from(new Set([...(favIds||[]), ...((data?.favIds)||[])]))
        setFavIds(ids)
      } catch {}
    }
    reader.readAsText(file)
  }

  const remove = (id) => setFavIds((prev) => prev.filter(x => x !== id))
  const clearAll = () => { if (confirm('Vider toute la collection ?')) setFavIds([]) }

  return (
    <div className="grid gap-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-bold neon">Ma Collection</h2>
          <div className="flex items-center gap-2">
            <input className="border rounded px-3 py-2 w-64 bg-white/70" placeholder="Rechercher dans ma collection" value={q} onChange={(e)=>setQ(e.target.value)} />
            <select className="border rounded px-2 py-2 bg-white/70" value={sort} onChange={(e)=>setSort(e.target.value)}>
              <option value="set">Par set</option>
              <option value="name">Par nom</option>
              <option value="rarity">Par rareté</option>
            </select>
            <button className="px-3 py-2 rounded bg-cyan-600 text-white" onClick={exportCSV}>Export CSV</button>
            <button className="px-3 py-2 rounded bg-fuchsia-600 text-white" onClick={exportJSON}>Export JSON</button>
            <input type="file" ref={fileRef} className="hidden" accept="application/json" onChange={(e)=> e.target.files[0] && importJSON(e.target.files[0]) } />
            <button className="px-3 py-2 rounded border" onClick={()=>fileRef.current?.click()}>Importer JSON</button>
            <button className="px-3 py-2 rounded border" onClick={clearAll}>Vider</button>
          </div>
        </div>
        <div className="text-sm text-slate-300 mt-2">Total : <b>{cards.length}</b> cartes</div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({length: 12}).map((_,i)=>(
            <div key={i} className="glass rounded-xl p-2">
              <Skeleton className="w-full aspect-[3/4] rounded" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {bySet.map(group => (
            <div key={group.meta.id} className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold neon-2">{group.meta.name} <span className="text-sm text-slate-300">({group.meta.id})</span></div>
                <div className="text-sm text-slate-300">{group.items.length} cartes</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {group.items.map(c => (
                  <div key={c.id} className="glass rounded-xl p-2 neon-border">
                    <CardImage card={c} />
                    <div className="mt-2 font-semibold text-sm truncate" title={c.name}>{c.name}</div>
                    <div className="text-xs text-slate-300">{c.id}</div>
                    <div className="mt-2 flex gap-2">
                      <button className="px-2 py-1 text-xs border rounded" onClick={()=>remove(c.id)}>Retirer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
