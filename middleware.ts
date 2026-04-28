import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';
const useHttps = process.env.USE_HTTPS === 'true';
const serverUrl = process.env.NEXT_PUBLIC_URL || 'https://localhost:3000';
const urlBase = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3000';
const apiUrl = urlBase.endsWith('/') ? urlBase.slice(0, -1) : urlBase;
const cspReportEndpoint = '/api/v1/reporting/csp-reports';

function buildCspHeader(nonce: string): string {
  return [
    `script-src 'self' 'strict-dynamic' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ''} 'nonce-${nonce}' ${apiUrl} ${serverUrl}`,
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' fonts.gstatic.com",
    "frame-ancestors 'self'",
    "form-action 'self' https://login.microsoftonline.com",
    `connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com ${apiUrl} ${serverUrl}`,
    `report-uri ${apiUrl}${cspReportEndpoint}`,
    `report-to csp-report=${apiUrl}${cspReportEndpoint}`,
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(useHttps ? ['block-all-mixed-content', 'upgrade-insecure-requests'] : []),
  ].join('; ');
}

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce));

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
