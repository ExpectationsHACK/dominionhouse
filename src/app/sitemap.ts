import type { MetadataRoute } from "next";

/** The live address, https://dominionhouse.org (APP_URL), without a trailing slash. */
const SITE = (process.env.APP_URL ?? "https://dominionhouse.org").replace(/\/$/, "");

/**
 * The public pages, for search engines (served at /sitemap.xml). Private and
 * one-off pages (Admin desk, camp profile, payment and thank-you pages,
 * ticket links) are left out; robots.ts asks crawlers to skip them too.
 * Add a page here when a new public page goes live.
 */
const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/camp", priority: 0.9, changeFrequency: "weekly" },
  { path: "/camp/register", priority: 0.8, changeFrequency: "monthly" },
  { path: "/spiritual-growth-bootcamp", priority: 0.8, changeFrequency: "weekly" },
  { path: "/events", priority: 0.7, changeFrequency: "weekly" },
  { path: "/give", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/vision", priority: 0.6, changeFrequency: "monthly" },
  { path: "/locations", priority: 0.6, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map((page) => ({
    url: `${SITE}${page.path === "/" ? "" : page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
