/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // output: 'standalone', // DISABLING STANDALONE FOR SHARED HOSTING COMPATIBILITY
  // reactCompiler: false, // DEPRECATED in Next 15 config root
  transpilePackages: ['@whiskeysockets/baileys', '@hapi/boom'],
  serverExternalPackages: ['jimp', 'socket.io', 'socket.io-adapter', 'socket.io-parser'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },       // Google OAuth
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },    // GitHub OAuth
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },    // Facebook OAuth
      { protocol: 'https', hostname: 'cdn.discordapp.com' },              // Discord OAuth
      { protocol: 'https', hostname: 'res.cloudinary.com' },              // Cloudinary uploads
      { protocol: 'https', hostname: '**.amazonaws.com' },                // S3 uploads
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
