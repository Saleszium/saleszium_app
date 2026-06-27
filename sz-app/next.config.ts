import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(".."),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Electron compatibility
  images: {
    unoptimized: true, // Disable image optimization for Electron
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.livechat-static.com',
      },
    ],
  },
  output: 'standalone', // Optimize for production builds
};

export default nextConfig;
