const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

const isProd = process.env.NODE_ENV === "production";
const API_URL = process.env.BACKEND_URL || (isProd ? "https://delschool-2.onrender.com" : "http://localhost:47005");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: isProd ? "https" : "http",
        hostname: isProd ? "delschool-2.onrender.com" : "localhost",
        port: isProd ? "" : "47005",
        pathname: "/api/student/photo/**",
      },
      {
        protocol: isProd ? "https" : "http",
        hostname: isProd ? "delschool-2.onrender.com" : "localhost",
        port: isProd ? "" : "47005",
        pathname: "/student/photo/**",
      },
      {
        protocol: isProd ? "https" : "http",
        hostname: isProd ? "delschool-2.onrender.com" : "localhost",
        port: isProd ? "" : "47005",
        pathname: "/api/employer/photo/**",
      },
      {
        protocol: isProd ? "https" : "http",
        hostname: isProd ? "delschool-2.onrender.com" : "localhost",
        port: isProd ? "" : "47005",
        pathname: "/employer/photo/**",
      },
    ],
  },
  experimental: {
    optimizeCss: false,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: "/student/photo/:filename",
        destination: `${API_URL}/student/photo/:filename`,
      }
    ];
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: "styles",
        test: /\.(css|scss|sass)$/,
        chunks: "all",
        enforce: true,
        priority: 20,
      };
    }
    return config;
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swMinify: true,
  workboxOptions: {
    disableDevLogs: true,
    // Enterprise hardening: NEVER cache auth, sync, or dynamic API calls
    runtimeCaching: [
      {
        // 1. Auth & Sync: NetworkOnly (Absolute source of truth)
        urlPattern: ({ url }) => 
          url.pathname.includes('/api/auth/') || 
          url.pathname.includes('/api/sync/') ||
          url.pathname.includes('/api/me'),
        handler: 'NetworkOnly',
      },
      {
        // 2. Photos: CacheFirst (Static-like assets)
        urlPattern: ({ url }) => url.pathname.includes('/api/student/photo/'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'student-photos',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }
        }
      },
      {
        // 3. Navigation: NetworkFirst
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          networkTimeoutSeconds: 5,
        },
      }
    ],
  },
});

module.exports = withPWA(withNextIntl(nextConfig));

