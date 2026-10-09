/**
 * Where the house's own videos (and their poster stills) are served from.
 *
 * They're about 90% of the site's bandwidth, so in production they come from
 * Cloudflare R2 (no charge for downloads) at NEXT_PUBLIC_MEDIA_BASE_URL, e.g.
 * https://media.dominionhouse.org. Unset, they're served from public/video/
 * by the site itself, which is what local development uses.
 *
 * The bucket mirrors public/video/ under the same paths: to replace a video,
 * update the file in both places.
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").trim().replace(/\/+$/, "");

/** `/video/home-joy.mp4` → the URL to load it from. */
export const mediaUrl = (path: string) => `${MEDIA_BASE}${path.startsWith("/") ? path : `/${path}`}`;
