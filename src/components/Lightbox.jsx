import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
export default function Lightbox({ cards, index, onIndexChange, onClose }){
  const card = cards[index]
  const src = card?.getImageURL?.('high','png') || card?.getImageURL?.('high','webp') || '/placeholder.svg'
  useEffect(() => {
    const onKey = e => { if (e.key==='Escape') onClose?.(); if (e.key==='ArrowRight' && index<cards.length-1) onIndexChange(index+1); if (e.key==='ArrowLeft' && index>0) onIndexChange(index-1) }
    window.addEventListener('keydown', onKey); const prev = document.body.style.overflow; document.body.style.overflow='hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [index, cards, onIndexChange, onClose])
  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative max-w-[95vw] max-h-[90vh]">
          <img src={src} alt={card?.name||'Card'} className="max-w-full max-h-[90vh] object-contain rounded shadow-lg select-none" />
          <div className="absolute -top-12 left-0 text-white text-sm flex gap-2">
            <button disabled={index<=0} onClick={()=>onIndexChange(index-1)} className="px-3 py-1 bg-white/20 rounded disabled:opacity-50">← Précédente</button>
            <button disabled={index>=cards.length-1} onClick={()=>onIndexChange(index+1)} className="px-3 py-1 bg-white/20 rounded disabled:opacity-50">Suivante →</button>
          </div>
          <div className="absolute -top-12 right-0 text-white text-sm flex gap-2">
            <button onClick={onClose} className="px-3 py-1 bg-white/20 rounded">Fermer</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
