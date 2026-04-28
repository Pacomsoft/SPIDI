const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://localhost:3000").replace(/\/$/, "");
const cpsReportEndpoint = "/api/v1/reporting/csp-reports";

const nextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Reporting-Endpoints",
            value: `csp-endpoint="${apiUrl}${cpsReportEndpoint}"`,
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), fullscreen=(self), geolocation=(self), publickey-credentials-get=(self), clipboard-read=(self), clipboard-write=(self), idle-detection=(self)",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
