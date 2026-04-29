import { type INonceProvider } from '../domain/contracts/nonce-provider.interface';
import { NextNonceProvider } from './nonce/next-nonce.provider';

/**
 * Server-only dependency injection.
 * MUST only be imported from React Server Components or server-side code.
 * Importing this file in a Client Component will cause a build error.
 */
export function createNonceProvider(): INonceProvider {
  return new NextNonceProvider();
}
