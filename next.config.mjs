const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },

  eslint: {
    ignoreDuringBuilds: true, // <-- permite build aunque haya errores de lint
  },
};

export default nextConfig;