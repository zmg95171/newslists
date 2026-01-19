import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  eslint: {
    // Temporarily ignore ESLint during builds due to flat config compatibility issues
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
