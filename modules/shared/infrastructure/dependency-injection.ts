import { type IConfiguracionRepository } from '../domain/contracts/configuracion-repository.interface';
import { type IIdempotencyRepository } from '../domain/contracts/idempotency-repository.interface';
import { type INonceProvider } from '../domain/contracts/nonce-provider.interface';
import { type ITokenRepository } from '../domain/contracts/token-repository.interface';
import { IndexedDbConfiguracionRepository } from './configuracion/indexed-db-configuracion.repository';
import { IndexedDbIdempotencyRepository } from './idempotency/indexed-db-idempotency.repository';
import { NextNonceProvider } from './nonce/next-nonce.provider';
import { IndexedDbTokenRepository } from './tokens/indexed-db-token.repository';

export function createConfiguracionRepository(): IConfiguracionRepository {
  return new IndexedDbConfiguracionRepository();
}

export function createIdempotencyRepository(): IIdempotencyRepository {
  return new IndexedDbIdempotencyRepository();
}

export function createTokenRepository(): ITokenRepository {
  return new IndexedDbTokenRepository();
}

export function createNonceProvider(): INonceProvider {
  return new NextNonceProvider();
}
