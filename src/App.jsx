import React, { Suspense } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

const BrowsePage = React.lazy(() => import("./pages/BrowsePage"));
const CollectionPage = React.lazy(() => import("./pages/CollectionPage"));
const WishlistPage = React.lazy(() => import("./pages/WishlistPage"));

export default function App(){
  const location = useLocation();
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto grid gap-4">
        <header className="glass rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-extrabold tracking-tight neon">TCGdex – Finder</h1>
            <nav className="flex gap-2">
              <Link to="/" className={`px-3 py-1 rounded ${location.pathname==='/'?'bg-cyan-500 text-white':'bg-white/10 border'}`}>Explorer</Link>
              <Link to="/collection" className={`px-3 py-1 rounded ${location.pathname.startsWith('/collection')?'bg-fuchsia-500 text-white':'bg-white/10 border'}`}>Collection</Link>
              <Link to="/wishlist" className={`px-3 py-1 rounded ${location.pathname.startsWith('/wishlist')?'bg-pink-500 text-white':'bg-white/10 border'}`}>Wishlist</Link>
            </nav>
          </div>
        </header>

        <Suspense fallback={<div className="text-slate-300 p-6">Chargement…</div>}>
          <Routes>
            <Route path="/" element={<BrowsePage lang="fr" />} />
            <Route path="/collection" element={<CollectionPage lang="fr" />} />
            <Route path="/wishlist" element={<WishlistPage lang="fr" />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
