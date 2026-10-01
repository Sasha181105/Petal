/** A tiny tap on phones that support it (Android). Silently does nothing elsewhere. */
export function tick(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not supported or blocked.
  }
}
