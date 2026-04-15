const isDev = process.env.NODE_ENV === 'development';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const cpsReportEndpoint = '/api/v1/reporting/csp-reports';
 
const cspHeader = `
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  img-src 'self' data: blob:;
  font-src 'self' fonts.gstatic.com;
  frame-ancestors 'self';
  form-action 'self';
  block-all-mixed-content;
  report-uri: ${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl}${cpsReportEndpoint};
  report-to: csp-report=${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl}${cpsReportEndpoint}
  default-src 'self';
  base-uri 'self' ${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl};
  upgrade-insecure-requests;
`;

const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true, // <-- permite build aunque haya errores de lint
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
          { key: 'Reporting-Endpoints', value: `csp-endpoint="${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl}${cpsReportEndpoint}"` },
        ]
      }
    ]
  },
};

export default nextConfig;