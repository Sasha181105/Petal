// Client-safe helpers for building Cloudinary delivery URLs.

/**
 * Insert a transformation into a stored Cloudinary URL, e.g.
 *   .../image/upload/v17/petal/x.jpg  +  "w_200,c_fill"
 *   → .../image/upload/w_200,c_fill/v17/petal/x.jpg
 */
export function transform(url: string, t: string): string {
  return url.replace("/image/upload/", `/image/upload/${t}/`);
}

/** Square crop, auto format/quality, smart focus on the flower. */
export const square = (url: string, px: number) =>
  transform(url, `c_fill,g_auto,w_${px},h_${px},f_auto,q_auto`);

/** 4:3 crop for the flower card. */
export const landscape = (url: string, width: number) =>
  transform(url, `c_fill,g_auto,w_${width},h_${Math.round(width * 0.75)},f_auto,q_auto`);

/** Tiny heavily blurred version (~1 KB) shown while the real image loads. */
/** Whole photo, no crop, at most `width` wide (for the enlarged view). */
export const fitted = (url: string, width: number) => transform(url, `c_limit,w_${width},f_auto,q_auto`);

/** Blurred stand-in for the uncropped photo. */
export const blurredFitted = (url: string) => transform(url, "c_limit,w_40,e_blur:100,q_40,f_auto");

// Light blur only: the browser blurs it again, and too much turns every photo brown.
export const blurred = (url: string) => transform(url, "c_fill,g_auto,w_40,h_30,e_blur:100,q_40,f_auto");
