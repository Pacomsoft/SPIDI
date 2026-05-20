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
import { MockFullAuthService } from './services/mock-full-auth.service';

// ─── SWAP POINT ───────────────────────────────────────────────────────────────
// Cuando NEXT_PUBLIC_USE_MOCK_AUTH=true (rama Vercel/demo):
//   - createAuthService()     → MockFullAuthService  (login instantáneo, sin Microsoft)
//   - createLoginUseCase()    → MockFullAuthService  (idem)
//   - createValidateTokenUseCase() → MockSpidiAuthService (token SPIDI ficticio)
//   - createEnsureTokenValidUseCase() → sin refresh real (token mock no expira en demo)
// En cualquier otro ambiente el flujo real de Entra PKCE se mantiene intacto.
// ─────────────────────────────────────────────────────────────────────────────
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

export function createAuthService(): IAuthService {
  return USE_MOCK_AUTH ? new MockFullAuthService() : new EntraPkceAuthService();
}

export function createSessionRepository(): ISessionRepository {
  return new IndexedDbSessionRepository();
}

export function createLoginAttemptsRepository(): ILoginAttemptsRepository {
  return new IndexedDbLoginAttemptsRepository();
}

export function createLoginUseCase(): ILoginUseCase {
  const authService = USE_MOCK_AUTH ? new MockFullAuthService() : new EntraPkceAuthService();
  const attemptsRepository = createLoginAttemptsRepository();
  return new InitiateLoginUseCase(authService, attemptsRepository);
}

export function createValidateTokenUseCase(): IValidateTokenUseCase {
  const sessionRepository = createSessionRepository();
  const attemptsRepository = createLoginAttemptsRepository();
  const spidiAuthService = USE_MOCK_AUTH
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
  // En modo mock el token nunca "expira" desde el punto de vista del guard:
  // siempre retornamos isValid=true para evitar que useAuthGuard intente
  // hacer refresh contra https://mock.spidi.local (URL ficticia) y falle.
  if (USE_MOCK_AUTH) {
    return { execute: async () => ({ isValid: true }) };
  }

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
