import type { NextConfig } from "next";
// Validate environment variables at build/start time
import "@/lib/client/constants/frontend-config";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.mrliving.com.tw",
      },
      {
        protocol: "https",
        hostname: "www.mrliving.com.tw",
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
