/** Serve local media via the app's HTTP server (same as video streaming). */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `http://127.0.0.1:8000/thumbnail?path=${encodeURIComponent(path)}`;
}
