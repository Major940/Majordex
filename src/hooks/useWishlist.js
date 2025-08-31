import useLocalStorage from './useLocalStorage'
export default function useWishlist(){
  const [wish, setWish] = useLocalStorage('wishlistV1', [])
  const toggle = (id) => setWish(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  return { wish, toggle }
}
