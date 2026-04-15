import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IAuthService } from '../../domain/contracts/auth-service.interface';
import { type ILoginAttemptsRepository } from '../../domain/contracts/login-attempts-repository.interface';
import { type ILoginInputDTO, type ILoginResultDTO } from '../../domain/contracts/login.dto';
import { TooManyAttemptsError } from '../../domain/errors/too-many-attempts.error';

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 2 * 60 * 1000;

export class InitiateLoginUseCase implements IUseCase<ILoginInputDTO, ILoginResultDTO> {
  constructor(
    private readonly authService: IAuthService,
    private readonly attemptsRepository: ILoginAttemptsRepository,
  ) {}

  async execute(input: ILoginInputDTO): Promise<ILoginResultDTO> {
    if (typeof window !== 'undefined' && input.redirectAfterLogin) {
      sessionStorage.setItem('redirect_after_login', input.redirectAfterLogin);
    }

    const recentCount = await this.attemptsRepository.getRecentCount(LOCKOUT_WINDOW_MS);
    if (recentCount >= LOCKOUT_ATTEMPTS) {
      throw new TooManyAttemptsError();
    }

    await this.authService.initiateRedirect();
    return { initiated: true };
  }
}
