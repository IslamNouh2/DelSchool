// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"], // <== add this
  },
  experimental: {
    optimizeCss: false,
  },
  rewrites: async () => [
    {
      source: "/api/student/photo/:filename",
      destination: "http://localhost:47005/student/photo/:filename",
    },
  ],
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

export default nextConfig;
