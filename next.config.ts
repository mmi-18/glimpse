import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
