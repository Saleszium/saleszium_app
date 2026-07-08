import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(".."),
    resolveAlias: isDev ? {
      "@saleszium/rhinon-sdk": "../bot-sdk",
    } : {},
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.resolve.alias["@saleszium/rhinon-sdk"] = path.resolve(__dirname, "../bot-sdk");
    }
    return config;
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
