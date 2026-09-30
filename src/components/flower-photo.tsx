"use client";

import { useEffect, useRef, useState } from "react";
import { blurred, landscape, square } from "@/lib/cloudinary-url";

type Variant = "chip" | "thumb" | "card";

const SQUARE_PX = { chip: 32, thumb: 56 } as const;
const CARD_WIDTHS = [480, 800, 1200];

// Placeholder colours: the same flower always gets the same one.
const TINTS = [
  "bg-sage-wash text-moss",
  "bg-rose-wash text-rose-deep",
  "bg-clay-wash text-clay",
  "bg-linen-deep text-soil-soft",
];

function tintFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

type Props = {
  url: string | null;
  name: string;
  variant: Variant;
  className?: string;
  /** Card only: load straight away (it's the main content, above the fold). */
  priority?: boolean;
};

/**
 * A flower's photo from Cloudinary, sized for where it's shown.
 * Lazy-loaded; a tiny blurred copy shows until the real image fades in.
 * Flowers without a photo get a tinted placeholder instead.
 */
export function FlowerPhoto({ url, name, variant, className = "", priority }: Props) {
  const shape =
    variant === "card"
      ? "aspect-[4/3] w-full rounded-sm"
      : variant === "thumb"
        ? "size-14 rounded-md"
        : "size-8 rounded";

  if (!url) return <Placeholder name={name} variant={variant} className={`${shape} ${className}`} />;

  let src: string;
  let srcSet: string;
  let sizes: string | undefined;
  if (variant === "card") {
    src = landscape(url, 800);
    srcSet = CARD_WIDTHS.map((w) => `${landscape(url, w)} ${w}w`).join(", ");
    sizes = "(min-width: 768px) 55vw, 100vw";
  } else {
    const px = SQUARE_PX[variant];
    src = square(url, px);
    srcSet = `${square(url, px)} 1x, ${square(url, px * 2)} 2x`;
  }

  return (
    <LoadedImage
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      blur={blurred(url)}
      alt={variant === "card" ? `Photo of ${name}` : ""}
      priority={priority}
      className={`${shape} ${className}`}
    />
  );
}

function LoadedImage({
  src,
  srcSet,
  sizes,
  blur,
  alt,
  priority,
  className,
}: {
  src: string;
  srcSet: string;
  sizes?: string;
  blur: string;
  alt: string;
  priority?: boolean;
  className: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // A cached image can finish loading before hydration, so onLoad never fires.
  useEffect(() => {
    setLoaded(Boolean(img.current?.complete && img.current.naturalWidth));
  }, [src]);

  return (
    <span className={`relative block shrink-0 overflow-hidden bg-linen-deep ${className}`}>
      <span
        aria-hidden
        className={`absolute inset-0 scale-110 bg-cover bg-center blur-md transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundImage: `url("${blur}")` }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary does the resizing */}
      <img
        ref={img}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`relative size-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}

function Placeholder({
  name,
  variant,
  className,
}: {
  name: string;
  variant: Variant;
  className: string;
}) {
  const tint = tintFor(name);

  if (variant !== "card") {
    return (
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center font-serif italic leading-none ${tint} ${
          variant === "thumb" ? "text-3xl" : "text-lg"
        } ${className}`}
      >
        {name.charAt(0)}
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={`No photo of ${name} yet`}
      className={`flex flex-col items-center justify-center gap-4 ${tint} ${className}`}
    >
      <svg viewBox="0 0 64 96" className="h-2/5 w-auto" fill="none" aria-hidden>
        <g stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 94 C 31.5 76, 33.5 62, 32.6 42" />
          <path d="M32 76 C 24 75, 18 69, 16 61 C 23 62, 29 67, 32 76 Z" />
          <path d="M32.3 62 C 39 60, 45 53, 47 45 C 40 47, 34 53, 32.3 62 Z" />
          <path d="M32.6 42 C 25 39, 22 27, 26 14 C 28.5 18, 30.5 21, 32.6 25 C 34.7 21, 36.7 18, 39.2 14 C 43 27, 40 39, 32.6 42 Z" />
        </g>
      </svg>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em]">No photo yet</span>
    </span>
  );
}
