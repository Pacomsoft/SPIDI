const isDev = process.env.NODE_ENV === 'development';
const useHttps = process.env.USE_HTTPS === 'true';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const cpsReportEndpoint = '/api/v1/reporting/csp-reports';

const cspHeader = `
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  img-src 'self' data: blob:;
  font-src 'self' fonts.gstatic.com;
  frame-ancestors 'self';
  form-action 'self';
  report-uri ${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl}${cpsReportEndpoint};
  report-to csp-endpoint;
  default-src 'self';
  base-uri 'self' ${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl};
  ${useHttps ? 'block-all-mixed-content; upgrade-insecure-requests;' : ''}
`;

const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Reporting-Endpoints',
            value: `csp-endpoint="${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl}${cpsReportEndpoint}"`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;