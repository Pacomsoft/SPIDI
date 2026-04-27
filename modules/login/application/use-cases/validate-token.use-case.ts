import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type ITokenRepository } from '@/modules/shared/domain/contracts/token-repository.interface';
import { type IAuthService } from '../../domain/contracts/auth-service.interface';
import { type ISessionRepository } from '../../domain/contracts/session-repository.interface';
import { type ILoginAttemptsRepository } from '../../domain/contracts/login-attempts-repository.interface';
import { type ISpidiAuthService } from '../../domain/contracts/spidi-auth-service.interface';
import { type IValidateTokenInputDTO, type IValidateTokenResultDTO } from '../../domain/contracts/validate-token.dto';
import { Session } from '../../domain/entities/session';
import { UserRole } from '../../domain/value-objects/user-role';
import { LoginFailedError } from '../../domain/errors/login-failed.error';
import { TooManyAttemptsError } from '../../domain/errors/too-many-attempts.error';
import { AccountDisabledError } from '../../domain/errors/account-disabled.error';
import { FetchError } from '@/modules/shared/domain/entities/fetch-error.class';

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 2 * 60 * 1000;
const DISABLED_ACCOUNT_CODE = 'AADSTS50057';

export class ValidateTokenUseCase implements IUseCase<IValidateTokenInputDTO, IValidateTokenResultDTO> {
  constructor(
    private readonly authService: IAuthService,
    private readonly sessionRepository: ISessionRepository,
    private readonly attemptsRepository: ILoginAttemptsRepository,
    private readonly spidiAuthService: ISpidiAuthService,
    private readonly tokenRepository: ITokenRepository,
  ) {}

  async execute(input: IValidateTokenInputDTO): Promise<IValidateTokenResultDTO> {
    let tokenResult;
    try {
      tokenResult = await this.authService.handleRedirectResult();
    } catch (error) {
      await this.recordAndCheckLockout(error);
    }

    if (!tokenResult) {
      throw new LoginFailedError('No se recibio respuesta de autenticacion');
    }

    let spidiResult;
    try {
      spidiResult = await this.spidiAuthService.authenticateWithEntraToken(tokenResult.accessToken);
    } catch (error) {
      await this.recordAndCheckLockout(error);
    }

    if (!spidiResult) {
      throw new LoginFailedError('No se pudo autenticar con el servidor SPIDI');
    }

    await this.tokenRepository.addToken(spidiResult.spidiToken);

    if (!spidiResult.roles.length) {
      throw new LoginFailedError('Tu cuenta no tiene un rol asignado en el sistema');
    }

    const roleDto = spidiResult.roles[0];
    const role = UserRole.create(roleDto);
    const session = Session.create(
      tokenResult.userId,
      tokenResult.userName,
      role.getDescription(),
      role.value,
      roleDto.menus,
    );

    await this.sessionRepository.save(session);
    await this.attemptsRepository.clear();

    const redirectAfterLogin =
      input.redirectAfterLogin ??
      (typeof window !== 'undefined'
        ? (sessionStorage.getItem('redirect_after_login') ?? undefined)
        : undefined);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('redirect_after_login');
    }

    return {
      redirectPath: redirectAfterLogin ?? role.getHomePage(),
      userName: session.userName,
      userRole: session.userRole,
    };
  }

  private async recordAndCheckLockout(error: unknown): Promise<never> {
    const message = error instanceof Error ? error.message : '';

    if (message.includes(DISABLED_ACCOUNT_CODE)) {
      throw new AccountDisabledError();
    }

    await this.attemptsRepository.record();
    const recentCount = await this.attemptsRepository.getRecentCount(LOCKOUT_WINDOW_MS);

    if (recentCount >= LOCKOUT_ATTEMPTS) {
      throw new TooManyAttemptsError();
    }

    if(error instanceof FetchError) {
      throw error;
    }

    throw new LoginFailedError('Credenciales no validas, por favor vuelve a intentar.');
  }
}
