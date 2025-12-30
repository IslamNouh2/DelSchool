/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
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
        destination: `${process.env.NEXT_PUBLIC_API_URL}/student/photo/:filename`,
      },
      {
  source: "/api/:path*",
  destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
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

module.exports = nextConfig;
