import useLocalStorage from './useLocalStorage'
export default function useCollection(){
  const [col, setCol] = useLocalStorage('collectionV1', {})
  const ensure = (prev, id) => prev[id] || { qty: 0, cond: 'NM', tags: [] }
  const add = (id, delta=1) => setCol(prev => { const e = ensure(prev, id); return { ...prev, [id]: { ...e, qty: Math.max(0, e.qty + delta) } } })
  const setCond = (id, cond) => setCol(prev => { const e = ensure(prev, id); return { ...prev, [id]: { ...e, cond } } })
  const toggleTag = (id, tag) => setCol(prev => { const e = ensure(prev, id); const tags = e.tags.includes(tag)? e.tags.filter(t=>t!==tag): [...e.tags, tag]; return { ...prev, [id]: { ...e, tags } } })
  const remove = (id) => setCol(prev => { const x = { ...prev }; delete x[id]; return x })
  return { col, setCol, add, setCond, toggleTag, remove }
}
