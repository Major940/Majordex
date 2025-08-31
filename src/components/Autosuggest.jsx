import React, { useEffect, useRef, useState } from 'react'
import TCGdex, { Query } from '@tcgdex/sdk'

export default function Autosuggest({ lang='fr', value, onSelect }){
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const sdkRef = useRef(null)

  useEffect(() => { sdkRef.current = new TCGdex(lang) }, [lang])

  useEffect(() => {
    if (!value || value.trim().length < 2){ setItems([]); setOpen(false); return }
    const run = async () => {
      try {
        const q = Query.create().contains('name', value.trim()).paginate(1, 8)
        const res = await sdkRef.current.card.list(q)
        setItems(Array.isArray(res) ? res : []); setOpen(true)
      } catch {}
    }
    const t = setTimeout(run, 150)
    return () => clearTimeout(t)
  }, [value])

  if (!open || !items.length) return null
  return (
    <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow">
      {items.map(it => (
        <button
          key={it.id}
          className="w-full text-left px-3 py-2 hover:bg-slate-50"
          onClick={() => { onSelect(it.name); setOpen(false) }}
        >
          {it.name}
        </button>
      ))}
    </div>
  )
}
