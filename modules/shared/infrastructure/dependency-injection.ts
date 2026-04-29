import { type IConfiguracionRepository } from '../domain/contracts/configuracion-repository.interface';
import { type IIdempotencyRepository } from '../domain/contracts/idempotency-repository.interface';
import { type ITokenRepository } from '../domain/contracts/token-repository.interface';
import { IndexedDbConfiguracionRepository } from './configuracion/indexed-db-configuracion.repository';
import { IndexedDbIdempotencyRepository } from './idempotency/indexed-db-idempotency.repository';
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
