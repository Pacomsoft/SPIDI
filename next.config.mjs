const isDev = process.env.NODE_ENV === "development";
const useHttps = process.env.USE_HTTPS === "true";
const urlBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const apiUrl = urlBase.endsWith("/") ? urlBase.substring(0, urlBase.length - 1) : urlBase;
const cpsReportEndpoint = "/api/v1/reporting/csp-reports";

const cspHeader = `
  script-src 'self'${isDev ? " 'unsafe-inline' 'unsafe-eval'" : ''} ${apiUrl} https://localhost:3000;
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  img-src 'self' data: blob:;
  font-src 'self' fonts.gstatic.com;
  frame-ancestors 'self';
  form-action 'self' https://login.microsoftonline.com;
  connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com ${apiUrl};
  report-uri ${apiUrl}${cpsReportEndpoint};
  report-to csp-report=${apiUrl}${cpsReportEndpoint};
  default-src 'self';
  base-uri 'self' ${apiUrl};
  object-src 'none';  
  ${useHttps ? "block-all-mixed-content; upgrade-insecure-requests;" : ""}
`;
// Rompe Next.js; validar en prod
// require-trusted-types-for [missing] Consider requiring Trusted Types for scripts to lock down DOM XSS injection sinks. You can do this by adding "require-trusted-types-for 'script'" to your policy.

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
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
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
