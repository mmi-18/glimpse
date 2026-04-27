import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * glimpse. uses defaults — no R2 cache yet (we don't rely on ISR).
 * Add `incrementalCache: r2IncrementalCache` later if we adopt static
 * regeneration on creator profile pages.
 */
export default defineCloudflareConfig({});
