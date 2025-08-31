import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

const ToastCtx = createContext(null)
export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])
  const push = useCallback((text, type='info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, text, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[100] space-y-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-3 py-2 rounded shadow text-white ${t.type==='error'?'bg-red-600':'bg-slate-900/90'}`}>{t.text}</div>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  )
}
export function useToast(){ return useContext(ToastCtx) }
