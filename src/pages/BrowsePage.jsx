import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import TCGdex, { Query } from '@tcgdex/sdk'
import BinderGrid from '../components/BinderGrid'
import CardImage from '../components/CardImage'
import Lightbox from '../components/Lightbox'
import useLocalStorage from '../hooks/useLocalStorage'
import useCollection from '../hooks/useCollection'
import useWishlist from '../hooks/useWishlist'

const PERPAGE = 48

export default function BrowsePage({ lang }){
  const [name, setName] = useState('')
  const [serieId, setSerieId] = useState('')
  const [setId, setSetId] = useState('')
  const [type, setType] = useState('')
  const [rarity, setRarity] = useState('')
  const [hpMin, setHpMin] = useState(0)
  const [hpMax, setHpMax] = useState(400)
  const [sortKey, setSortKey] = useState('id')
  const [sortDir, setSortDir] = useState('DESC')

  const sdkRef = useRef(null)
  const [series, setSeries] = useState([])
  const [sets, setSets] = useState([])
  const [types, setTypes] = useState([])
  const [rarities, setRarities] = useState([])

  const [favs, setFavs] = useLocalStorage('favs', [])
  const { col, add } = useCollection()
  const { wish, toggle: toggleWish } = useWishlist()

  const [lbIndex, setLbIndex] = useState(null)

  useEffect(() => {
    sdkRef.current = new TCGdex(lang)
    const base = `https://api.tcgdex.net/v2/${lang}`
    ;(async () => {
      try {
        const [s, st, t, r] = await Promise.all([
          fetch(`${base}/series`).then(r=>r.json()).catch(()=>[]),
          fetch(`${base}/sets`).then(r=>r.json()).catch(()=>[]),
          fetch(`${base}/types`).then(r=>r.json()).catch(()=>[]),
          fetch(`${base}/rarities`).then(r=>r.json()).catch(()=>[]),
        ])
        setSeries(Array.isArray(s)?s:[])
        setSets(Array.isArray(st)?st:[])
        setTypes(Array.isArray(t)?t:[])
        setRarities(Array.isArray(r)?r:[])
      } catch {}
    })()
  }, [lang])

  const filteredSets = useMemo(() => {
    if (!serieId) return sets
    return (sets||[]).filter(s => (s.id||'').startsWith(serieId))
  }, [serieId, sets])

  const buildQuery = (page) => {
    let q = Query.create()
    if (name.trim()) q = q.contains('name', name.trim())
    if (type.trim()) q = q.contains('types', type.trim())
    if (rarity.trim()) q = q.equal('rarity', rarity.trim())
    if (setId.trim()) q = q.equal('set.id', setId.trim())
    else if (serieId.trim()) q = q.contains('set.id', serieId.trim())
    if (hpMin > 0) q = q.greaterOrEqualThan('hp', hpMin)
    if (hpMax < 400) q = q.lesserThan('hp', hpMax + 1)
    q = q.sort(sortKey, sortDir).paginate(page, PERPAGE)
    return q
  }

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['cards', lang, name, serieId, setId, type, rarity, hpMin, hpMax, sortKey, sortDir],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await sdkRef.current.card.list(buildQuery(pageParam))
      return Array.isArray(res) ? res : []
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage.length >= PERPAGE ? pages.length + 1 : undefined),
  })

  const cards = (data?.pages || []).flat()

  const sentinelRef = useRef(null)
  useEffect(() => {
    const el = sentinelRef.current; if (!el) return
    const io = new IntersectionObserver((entries) => {
      const e = entries[0]
      if (e.isIntersecting && hasNextPage && !isFetchingNextPage){ fetchNextPage() }
    })
    io.observe(el); return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="grid gap-4">
      {/* Filtres */}
      <section className="grid gap-2 glass rounded-2xl p-4">
        <input className="border px-3 py-2 rounded w-full bg-white/80 text-black" placeholder="Nom (ex: Pikachu)"
               value={name} onChange={(e)=>setName(e.target.value)} />
        <div className="grid md:grid-cols-5 gap-2">
          <select className="border rounded px-2 py-2 bg-white/80 text-black" value={serieId} onChange={(e)=>{ setSerieId(e.target.value); setSetId('') }}>
            <option value="">(Tous les blocs/séries)</option>
            {series.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </select>
          <select className="border rounded px-2 py-2 bg-white/80 text-black" value={setId} onChange={(e)=>setSetId(e.target.value)}>
            <option value="">(Tous les sets)</option>
            {filteredSets.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </select>
          <select className="border rounded px-2 py-2 bg-white/80 text-black" value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="">(Tous les types)</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="border rounded px-2 py-2 bg-white/80 text-black" value={rarity} onChange={(e)=>setRarity(e.target.value)}>
            <option value="">(Toutes raretés)</option>
            {rarities.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="number" className="border rounded px-2 py-1 w-20 bg-white/80 text-black" value={hpMin} min={0} max={hpMax} step={10} onChange={(e)=>setHpMin(Number(e.target.value)||0)} />
            <span>→</span>
            <input type="number" className="border rounded px-2 py-1 w-20 bg-white/80 text-black" value={hpMax} min={hpMin} max={400} step={10} onChange={(e)=>setHpMax(Number(e.target.value)||400)} />
          </div>
        </div>
      </section>

      {(isFetching && cards.length===0) ? <div className="text-slate-300">Chargement…</div> : (
        <BinderGrid
          items={cards}
          cols={4}  // <-- 4 cartes par ligne (style binder)
          renderItem={(c) => {
            const isFav = favs.includes(c.id)
            const inWish = wish.includes(c.id)
            const qty = (col[c.id]?.qty)||0
            const onAdd = (e) => { e.stopPropagation(); add(c.id, +1) }

            return (
              <div className="glass rounded-xl p-2 relative">
                <div className="relative">
                  <CardImage card={c} onClick={() => setLbIndex(cards.findIndex(x=>x.id===c.id))} />
                  <button
                    className={`absolute top-2 left-2 text-xs px-2 py-1 rounded ${isFav?'bg-yellow-400 text-black':'bg-white/70 text-black'}`}
                    title="Favori"
                    onClick={(e)=>{ e.stopPropagation(); setFavs(prev=> prev.includes(c.id)? prev.filter(x=>x!==c.id): [...prev,c.id]) }}
                  >{isFav?'★':'☆'}</button>
                  <button
                    className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${inWish?'bg-pink-500 text-white':'bg-white/70 text-black'}`}
                    title="Wishlist"
                    onClick={(e)=>{ e.stopPropagation(); toggleWish(c.id) }}
                  >❤️</button>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                    <button
                      className="flex-1 px-2 py-1 text-[11px] rounded bg-cyan-600 text-white hover:opacity-90 active:opacity-80"
                      title="Ajouter cette carte à ma collection"
                      aria-label="Ajout Collection"
                      onClick={onAdd}
                    >
                      Ajout Collection
                    </button>
                    {qty > 0 && (
                      <span className="text-[11px] px-2 py-1 rounded bg-black/60 text-white" title="Quantité dans ma collection">
                        {qty}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 font-semibold text-sm truncate" title={c.name}>{c.name}</div>
                <div className="text-xs text-slate-300">{c.id}</div>
              </div>
            )
          }}
        />
      )}

      <div ref={sentinelRef} className="h-10" />
      {lbIndex !== null && (<Lightbox cards={cards} index={lbIndex} onIndexChange={setLbIndex} onClose={()=>setLbIndex(null)} />)}
    </div>
  )
}
