import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // output: 'standalone', // DISABLING STANDALONE FOR SHARED HOSTING COMPATIBILITY
  // reactCompiler: false, // DEPRECATED in Next 15 config root
  serverExternalPackages: ['jimp', 'socket.io', 'socket.io-adapter', 'socket.io-parser', '@whiskeysockets/baileys', '@hapi/boom'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
    turbo: {
      resolveAlias: {
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      }
    }
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    };
    return config;
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
