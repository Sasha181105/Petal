"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { blurredFitted, fitted } from "@/lib/cloudinary-url";
import { gentle, quick } from "@/lib/motion";
import { LoadedImage } from "./flower-photo";

const WIDTHS = [800, 1200, 1600];
// How far down a swipe has to go before it closes the photo.
const SWIPE_CLOSE_PX = 110;

type Props = { url: string; name: string; open: boolean; onClose: () => void };

/**
 * Full-screen view of a flower's whole photo (not cropped).
 * Close: tap the backdrop or ✕, press Esc, or swipe the photo down.
 */
export function PhotoLightbox({ url, name, open, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Portal to <body>: the page wrapper is transformed during transitions,
  // which would otherwise trap a fixed overlay inside it.
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo of ${name}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={quick}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-soil/85 p-4 backdrop-blur-sm"
        >
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            className="absolute right-3 top-3 grid size-12 place-items-center rounded-full text-2xl text-linen/80 transition-colors hover:bg-linen/10 hover:text-linen"
          >
            ✕
          </button>

          <motion.figure
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={gentle}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.7 }}
            onDragEnd={(_, info) => info.offset.y > SWIPE_CLOSE_PX && onClose()}
            onClick={(e) => e.stopPropagation()}
            className="flex cursor-grab flex-col items-center active:cursor-grabbing"
          >
            <LoadedImage
              src={fitted(url, 1200)}
              srcSet={WIDTHS.map((w) => `${fitted(url, w)} ${w}w`).join(", ")}
              sizes="92vw"
              blur={blurredFitted(url)}
              alt={`Photo of ${name}`}
              priority
              fit="contain"
              className="h-[min(72dvh,820px)] w-[min(92vw,1100px)] [&_img]:pointer-events-none"
            />
            <figcaption className="mt-4 text-center">
              <span className="font-serif text-4xl italic text-linen">{name}</span>
              <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.18em] text-linen/60">
                <span className="md:hidden">Swipe down or tap outside to close</span>
                <span className="hidden md:inline">Esc or click outside to close</span>
              </span>
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
