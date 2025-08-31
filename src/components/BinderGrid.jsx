import React from 'react'

/**
 * BinderGrid : grille fixe 4 colonnes (style classeur)
 * - cols par défaut = 4
 * - gap par défaut = 12px
 */
export default function BinderGrid({ items, cols = 4, gap = 12, renderItem }){
  const template = `repeat(${cols}, minmax(0, 1fr))`
  return (
    <div
      className="w-full"
      style={{ display:'grid', gridTemplateColumns: template, gap }}
    >
      {items.map((it, i) => (
        <div key={it.id || i} className="p-2">{renderItem(it, i)}</div>
      ))}
    </div>
  )
}
