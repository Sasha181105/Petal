import type { NextConfig } from "next";

// Basic hardening for every response.
const securityHeaders = [
  // Petal is never shown inside another site's frame (no clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The camera is used through the file picker only; nothing else is needed.
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // The dev "N" badge sits bottom-left, right on top of the Waste tab on phones.
  // Build and runtime errors still show in the dev overlay.
  devIndicators: false,

  // The PDF renderer runs as plain Node code rather than being bundled.
  serverExternalPackages: ["@react-pdf/renderer"],

  // The weekly PDF reads font files by path; make sure they ship with it.
  outputFileTracingIncludes: {
    "/weeks/[start]/report": ["./src/assets/fonts/*.ttf"],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
