import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// KV holds the rendered pages for the routes that revalidate on a timer (the
// homepage refreshes every 60 seconds). It needs no extra setup, unlike R2.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
