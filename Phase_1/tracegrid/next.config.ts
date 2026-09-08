import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Spline is now loaded via CDN web component, so no bundler config needed.
  // Using empty turbopack config to satisfy Next.js 16 default.
  turbopack: {},
};

export default nextConfig;
