/** Default image shown when a video has no generated thumbnail. */
export const DEFAULT_THUMBNAIL = "/default-thumbnail.jpg";

/** Serve local media via the app's HTTP server (same as video streaming). */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `http://127.0.0.1:8000/thumbnail?path=${encodeURIComponent(path)}`;
}

/** Resolves a thumbnail path, falling back to the default image. */
export function thumbnailSrc(path: string | null | undefined): string {
  return mediaUrl(path) ?? DEFAULT_THUMBNAIL;
}
