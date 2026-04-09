/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizar imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['localhost', '127.0.0.1', 'res.cloudinary.com', 'backend-production-2ce7.up.railway.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'backend-production-2ce7.up.railway.app',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
