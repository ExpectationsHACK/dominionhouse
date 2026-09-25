import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// R2 holds the rendered pages for the routes that revalidate on a timer (the
// homepage refreshes every 60 seconds).
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
