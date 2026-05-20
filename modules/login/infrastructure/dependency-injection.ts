import { type IAuthService } from '../domain/contracts/auth-service.interface';
import { type ISessionRepository } from '../domain/contracts/session-repository.interface';
import { type ILoginAttemptsRepository } from '../domain/contracts/login-attempts-repository.interface';
import { type ILoginUseCase } from '../domain/contracts/login-use-case.interface';
import { type IValidateTokenUseCase } from '../domain/contracts/validate-token-use-case.interface';
import { type IEnsureTokenValidUseCase } from '../domain/contracts/ensure-token-valid-use-case.interface';
import { IndexedDbSessionRepository } from './repositories/indexed-db-session.repository';
import { IndexedDbLoginAttemptsRepository } from './repositories/indexed-db-login-attempts.repository';
import { EntraPkceAuthService } from './services/entra-pkce-auth.service';
import { SpidiEntraAuthService } from './services/spidi-entra-auth.service';
import { SpidiTokenRefreshService } from './services/spidi-token-refresh.service';
import { InitiateLoginUseCase } from '../application/use-cases/login.use-case';
import { ValidateTokenUseCase } from '../application/use-cases/validate-token.use-case';
import { EnsureTokenValidUseCase } from '../application/use-cases/ensure-token-valid.use-case';
import { IndexedDbTokenRepository } from '@/modules/shared/infrastructure/tokens/indexed-db-token.repository';
import { MockSpidiAuthService } from './services/mock-spidi-auth.service';

export function createAuthService(): IAuthService {
  return new EntraPkceAuthService();
}

export function createSessionRepository(): ISessionRepository {
  return new IndexedDbSessionRepository();
}

export function createLoginAttemptsRepository(): ILoginAttemptsRepository {
  return new IndexedDbLoginAttemptsRepository();
}

export function createLoginUseCase(): ILoginUseCase {
  const authService = new EntraPkceAuthService();
  const attemptsRepository = createLoginAttemptsRepository();
  return new InitiateLoginUseCase(authService, attemptsRepository);
}

export function createValidateTokenUseCase(): IValidateTokenUseCase {
  const sessionRepository = createSessionRepository();
  const attemptsRepository = createLoginAttemptsRepository();
  const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';
  const spidiAuthService = useMockAuth
    ? new MockSpidiAuthService()
    : new SpidiEntraAuthService(process.env.NEXT_PUBLIC_API_URL ?? '');
  const tokenRepository = new IndexedDbTokenRepository();
  return new ValidateTokenUseCase(
    sessionRepository,
    attemptsRepository,
    spidiAuthService,
    tokenRepository,
  );
}

export function createEnsureTokenValidUseCase(): IEnsureTokenValidUseCase {
  const tokenRepository = new IndexedDbTokenRepository();
  const tokenRefreshService = new SpidiTokenRefreshService(
    process.env.NEXT_PUBLIC_API_URL ?? '',
  );
  return new EnsureTokenValidUseCase(tokenRepository, tokenRefreshService);
}

export function createLoginModule() {
  return {
    useCases: {
      login: createLoginUseCase(),
      validateToken: createValidateTokenUseCase(),
    },
    sessionRepository: createSessionRepository(),
  };
}
