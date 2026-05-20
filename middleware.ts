import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';
const useHttps = process.env.USE_HTTPS === 'true';
const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';
const serverBaseUrl = process.env.AUTH_URL || 'https://localhost:3000';
const urlBase = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3000';
const apiUrl = !urlBase.endsWith('/') ? `${urlBase}/` : urlBase;
const serverUrl = !serverBaseUrl.endsWith('/') ? `${serverBaseUrl}/` : serverBaseUrl;
const cspReportEndpoint = 'api/v1/reporting/csp-reports';

// En modo mock (Vercel demo) no se necesita conectar a Microsoft ni al backend real.
// La CSP no incluye login.microsoftonline.com ni graph.microsoft.com para
// cumplir con el principio de menor privilegio en el entorno de demostración.
const msFormAction  = isMockMode ? '' : 'https://login.microsoftonline.com';
const msConnectSrc  = isMockMode ? '' : 'https://login.microsoftonline.com https://graph.microsoft.com';
// En modo mock, apiUrl apunta a un dominio ficticio (mock.spidi.local) que
// nunca se alcanza — se incluye de todas formas para que el código compile sin errores CSP.

function buildCspHeader(nonce: string): string {
  return [
    `script-src 'self' 'strict-dynamic' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ''} 'nonce-${nonce}' ${apiUrl} ${serverUrl}`,
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' fonts.gstatic.com",
    "frame-ancestors 'self'",
    `form-action 'self' ${msFormAction}`.trimEnd(),
    `connect-src 'self' ${msConnectSrc} ${apiUrl} ${serverUrl}`.replace(/\s+/g, ' ').trimEnd(),
    `report-uri ${apiUrl}${cspReportEndpoint}`,
    `report-to csp-report`,
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
