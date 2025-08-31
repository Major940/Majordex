import React from 'react'
import { createPortal } from 'react-dom'

export default function CompareModal({ cards, onClose }){
  if (!cards?.length) return null
  const headers = ['Nom','HP','Types','Rareté','Attaques']
  const rows = cards.map(c => ({
    name: c.name,
    hp: c.hp ?? '—',
    types: c.types?.join(', ') ?? '—',
    rarity: c.rarity ?? '—',
    attacks: c.attacks?.map(a => a.name).join(' · ') ?? '—'
  }))
  const content = (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Comparateur (max 3 cartes)</h3>
            <button onClick={onClose} className="px-3 py-1 border rounded">Fermer</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Champ</th>
                  {rows.map((_,i)=>(<th key={i} className="p-2">Carte {i+1}</th>))}
                </tr>
              </thead>
              <tbody>
                {headers.map((h, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 font-semibold">{h}</td>
                    {rows.map((r,i)=>{
                      const v = [r.name, r.hp, r.types, r.rarity, r.attacks][idx]
                      return <td key={i} className="p-2">{v}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
  return createPortal(content, document.body)
}
