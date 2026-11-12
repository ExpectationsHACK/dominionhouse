import type { MetadataRoute } from "next";

const SITE = (process.env.APP_URL ?? "https://dominionhouse.org").replace(/\/$/, "");

/**
 * /robots.txt: everything public may be crawled; the Admin desk, camp
 * profiles, payment and thank-you pages, ticket links and the API are skipped.
 * Points crawlers at the sitemap so new pages are found without waiting for links.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal", "/api/", "/t/", "/camp/payment", "/give/simulate", "/give/thank-you"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
