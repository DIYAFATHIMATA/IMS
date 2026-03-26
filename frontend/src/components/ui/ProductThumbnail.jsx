import { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { getSeededProductImage } from '../../utils/productImageMap';

function pickPalette(seed) {
  const palettes = [
    ['from-emerald-100', 'to-emerald-100', 'text-emerald-700'],
    ['from-emerald-100', 'to-teal-100', 'text-emerald-700'],
    ['from-amber-100', 'to-orange-100', 'text-amber-700'],
    ['from-violet-100', 'to-fuchsia-100', 'text-violet-700'],
    ['from-rose-100', 'to-pink-100', 'text-rose-700']
  ];
  const hash = String(seed || 'product')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

export default function ProductThumbnail({ name, category, imageUrl, className = '' }) {
  const [hasError, setHasError] = useState(false);
  const [from, to, iconColor] = useMemo(() => pickPalette(name), [name]);
  const resolvedImage = imageUrl || getSeededProductImage(name, category);
  const showImage = Boolean(resolvedImage) && !hasError;

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {showImage ? (
        <img
          src={resolvedImage}
          alt={name || 'Product image'}
          loading="lazy"
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className={`h-full w-full bg-gradient-to-br ${from} ${to} flex items-center justify-center`}>
          <Package className={`w-6 h-6 ${iconColor}`} />
        </div>
      )}
    </div>
  );
}
