"use client";

import { useCallback, useState } from "react";
import { FlowerPhoto } from "./flower-photo";
import { PhotoLightbox } from "./photo-lightbox";

type Props = { url: string | null; name: string; variant: "chip" | "thumb" };

/**
 * A flower thumbnail that opens the full photo when tapped.
 * Flowers without a photo just show the placeholder (nothing to enlarge).
 */
export function ZoomablePhoto({ url, name, variant }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (!url) return <FlowerPhoto url={null} name={name} variant={variant} />;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // Don't also trigger whatever the thumbnail sits inside.
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`View larger photo of ${name}`}
        className={`group relative shrink-0 rounded-md transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${
          // Keep the tap target at least 44px even for the small chip size.
          variant === "chip" ? "-m-1.5 p-1.5" : ""
        }`}
      >
        <FlowerPhoto url={url} name={name} variant={variant} />
        {/* Magnifier badge: says "you can open this". */}
        <span
          aria-hidden
          className={`absolute grid place-items-center rounded-full bg-linen/90 text-soil ring-1 ring-soil/15 ${
            variant === "chip" ? "bottom-0 right-0 size-4" : "-bottom-1 -right-1 size-6"
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            className={variant === "chip" ? "size-2.5" : "size-3.5"}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5 L14 14" />
          </svg>
        </span>
      </button>
      <PhotoLightbox url={url} name={name} open={open} onClose={close} />
    </>
  );
}
