import React from "react";

export default function CardImage({ card, className='', onClick }){
  const lowPng  = card?.getImageURL?.('low','png');
  const lowWebp = card?.getImageURL?.('low','webp');
  const hiPng   = card?.getImageURL?.('high','png');
  const hiWebp  = card?.getImageURL?.('high','webp');
  const fallback = '/placeholder.svg';

  const src = lowWebp || lowPng || hiWebp || hiPng || fallback;
  const srcSet = [
    lowWebp && `${lowWebp} 1x`,
    hiWebp  && `${hiWebp} 2x`,
    lowPng  && `${lowPng} 1x`,
    hiPng   && `${hiPng} 2x`,
  ].filter(Boolean).join(', ');

  const onErr = (e)=>{ e.currentTarget.src=fallback; e.currentTarget.srcset=''; };

  return (
    <img
      src={src}
      srcSet={srcSet || undefined}
      sizes="(max-width: 768px) 40vw, 220px"
      loading="lazy"
      alt={card?.name || 'Card'}
      className={`w-full aspect-[3/4] object-cover rounded bg-black/30 ${onClick?'cursor-zoom-in':''} ${className}`}
      onError={onErr}
      onClick={onClick}
    />
  );
}
