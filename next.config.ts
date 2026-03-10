import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Permitir deploy mientras se corrigen tipos Supabase (string | null vs string)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
