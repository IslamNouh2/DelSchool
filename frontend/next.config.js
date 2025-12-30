/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "47005",
        pathname: "/student/photo/**",
      },
      {
        protocol: "https",
        hostname: "delschool-2.onrender.com",
        pathname: "/student/photo/**",
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
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
      {
        source: "/student/photo/:filename",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/student/photo/:filename`,
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
