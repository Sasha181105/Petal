import type { NextConfig } from "next";

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
};

export default nextConfig;
