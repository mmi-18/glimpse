import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare Workers don't run Next's default image optimizer. Skipping
    // optimization keeps `<Image>` working everywhere (data URLs, SVGs,
    // remote URLs) without paying for Cloudflare Images. Revisit if/when
    // we want server-side resizing.
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "https", hostname: "kyvfiihydffryedrftcs.supabase.co" },
    ],
  },
};

export default nextConfig;

// Hook OpenNext into `next dev` so dev-server sees the Workers context
// (env, bindings) the same way prod does. No-op when not running dev.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
