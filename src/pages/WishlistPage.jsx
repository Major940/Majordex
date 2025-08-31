import React, { useEffect, useRef, useState } from 'react'
import useWishlist from '../hooks/useWishlist'
import TCGdex from '@tcgdex/sdk'
import CardImage from '../components/CardImage'

export default function WishlistPage({ lang }){
  const { wish } = useWishlist()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const sdkRef = useRef(null)
  useEffect(() => { sdkRef.current = new TCGdex(lang) }, [lang])
  useEffect(() => {
    if (!wish?.length){ setCards([]); return }
    let cancel = false; setLoading(true)
    ;(async () => {
      try {
        const res = await Promise.allSettled(wish.map(id => sdkRef.current.card.get(id)))
        const ok = res.filter(r => r.status==='fulfilled').map(r => r.value)
        if (!cancel) setCards(ok)
      } finally { if (!cancel) setLoading(false) }
    })()
    return () => { cancel = true }
  }, [wish, lang])
  return (
    <div className="grid gap-4">
      <div className="glass rounded-2xl p-4"><h2 className="text-xl font-bold">Ma Wishlist ({wish.length})</h2></div>
      {loading ? <div className="text-slate-300">Chargement…</div> : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cards.map(c => (
            <div key={c.id} className="glass rounded-xl p-2">
              <CardImage card={c} />
              <div className="mt-2 font-semibold text-sm truncate" title={c.name}>{c.name}</div>
              <div className="text-xs text-slate-300">{c.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
