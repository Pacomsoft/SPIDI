import { type ISessionRepository } from '../domain/contracts/session-repository.interface';
import { type ILoginAttemptsRepository } from '../domain/contracts/login-attempts-repository.interface';
import { type ILoginUseCase } from '../domain/contracts/login-use-case.interface';
import { type IValidateTokenUseCase } from '../domain/contracts/validate-token-use-case.interface';
import { type IEnsureTokenValidUseCase } from '../domain/contracts/ensure-token-valid-use-case.interface';
import { IndexedDbSessionRepository } from './repositories/indexed-db-session.repository';
import { IndexedDbLoginAttemptsRepository } from './repositories/indexed-db-login-attempts.repository';
import { MsalAuthService } from './services/msal-auth.service';
import { MicrosoftGraphApiService } from './services/microsoft-graph-api.service';
import { SpidiTokenRefreshService } from './services/spidi-token-refresh.service';
import { RoleMapper } from './config/role-mapping.config';
import { InitiateLoginUseCase } from '../application/use-cases/login.use-case';
import { ValidateTokenUseCase } from '../application/use-cases/validate-token.use-case';
import { EnsureTokenValidUseCase } from '../application/use-cases/ensure-token-valid.use-case';
import { IndexedDbTokenRepository } from '@/modules/shared/infrastructure/tokens/indexed-db-token.repository';

export function createSessionRepository(): ISessionRepository {
  return new IndexedDbSessionRepository();
}

export function createLoginAttemptsRepository(): ILoginAttemptsRepository {
  return new IndexedDbLoginAttemptsRepository();
}

export function createLoginUseCase(): ILoginUseCase {
  const authService = new MsalAuthService();
  const attemptsRepository = createLoginAttemptsRepository();
  return new InitiateLoginUseCase(authService, attemptsRepository);
}

export function createValidateTokenUseCase(): IValidateTokenUseCase {
  const authService = new MsalAuthService();
  const sessionRepository = createSessionRepository();
  const attemptsRepository = createLoginAttemptsRepository();
  const graphApiService = new MicrosoftGraphApiService();
  const roleMapper = new RoleMapper();
  return new ValidateTokenUseCase(
    authService,
    sessionRepository,
    attemptsRepository,
    graphApiService,
    roleMapper,
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
