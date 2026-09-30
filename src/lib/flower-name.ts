import { z } from "zod";

/** Trimmed, single-spaced, first letter capitalised, 1–60 characters. */
export const flowerName = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(1).max(60))
  .transform((s) => s.charAt(0).toUpperCase() + s.slice(1));
