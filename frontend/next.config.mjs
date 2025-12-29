/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,   // ⬅️ Important
  },
  images: {
    domains: ["localhost"],
  },
  experimental: {
    optimizeCss: false,
  },
  async rewrites() {
    return [
      {
        source: "/api/student/photo/:filename",
        destination: "http://delschool-1.onrender.com/student/photo/:filename",
      },
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

module.exports = nextConfig;   // ⬅️ Correct export
