import { headers } from 'next/headers';
import type { INonceProvider } from '../../domain/contracts/nonce-provider.interface';

/**
 * Server-side nonce provider.
 * MUST only be used in React Server Components or server-side code.
 * Reads the `x-nonce` header injected by middleware on every request.
 */
export class NextNonceProvider implements INonceProvider {
  async getNonce(): Promise<string> {
    const headersList = await headers();
    return headersList.get('x-nonce') ?? '';
  }
}
