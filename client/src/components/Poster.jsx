import { Film } from 'lucide-react';
import { useState } from 'react';
export default function Poster({ src, title, className = '' }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <div className={`poster-fallback ${className}`}><Film size={34}/><span>{title || 'IMovies'}</span><small>NOW SHOWING</small></div>;
  return <img className={`movie-poster ${className}`} src={src} alt={`${title} poster`} loading="lazy" onError={() => setBroken(true)} />;
}
