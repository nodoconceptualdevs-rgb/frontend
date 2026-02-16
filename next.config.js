/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizar imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'backend-production-2ce7.up.railway.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
    // Dominios permitidos (enfoque antiguo pero más simple)
    domains: ['localhost', '127.0.0.1', 'res.cloudinary.com', 'backend-production-2ce7.up.railway.app'],
    // Desactivar optimización de imágenes para desarrollo
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Otras configuraciones
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
