import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev "N" badge sits bottom-left, right on top of the Waste tab on phones.
  // Build and runtime errors still show in the dev overlay.
  devIndicators: false,
};

export default nextConfig;
