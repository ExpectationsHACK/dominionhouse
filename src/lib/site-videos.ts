import type { VideoCarouselItem } from "@/components/site/video-carousel";
import { mediaUrl } from "@/lib/media";

/**
 * Five-second clips cut from the house's own footage (public/video/, sources
 * kept out of the deploy in media-originals/). Shown until clips are added at
 * /admin/content; adding any clip for a page replaces that page's list.
 */
const clip = (id: string, title: string): VideoCarouselItem => ({
  id,
  title,
  videoUrl: mediaUrl(`/video/${id}.mp4`),
  posterUrl: mediaUrl(`/video/${id}.jpg`),
});

/** Homepage, "What a service feels like". */
export const SERVICE_CLIPS: VideoCarouselItem[] = [
  clip("home-joy", "Joy"),
  clip("home-fellowship", "Worship"),
  clip("home-gathering", "Community"),
  clip("home-praise", "Praise"),
  clip("home-word", "The Word"),
];

/** Fresh Fire page, "What it feels like". */
export const CAMP_CLIPS: VideoCarouselItem[] = [
  clip("camp-impartation", "Impartation"),
  clip("camp-ministration", "Ministration"),
  clip("camp-consecration", "Consecration"),
  clip("camp-prayer", "Prayer"),
  clip("camp-worship", "Worship"),
];
