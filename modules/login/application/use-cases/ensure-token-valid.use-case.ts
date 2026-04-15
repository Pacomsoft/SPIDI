import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type ITokenRepository } from '@/modules/shared/domain/contracts/token-repository.interface';
import { type ITokenRefreshService } from '../../domain/contracts/token-refresh-service.interface';
import {
  type IEnsureTokenValidInputDTO,
  type IEnsureTokenValidResultDTO,
} from '../../domain/contracts/ensure-token-valid-use-case.interface';

export class EnsureTokenValidUseCase
  implements IUseCase<IEnsureTokenValidInputDTO, IEnsureTokenValidResultDTO>
{
  constructor(
    private readonly tokenRepository: ITokenRepository,
    private readonly tokenRefreshService: ITokenRefreshService,
  ) {}

  async execute(_input: IEnsureTokenValidInputDTO): Promise<IEnsureTokenValidResultDTO> {
    const token = await this.tokenRepository.getToken();

    const isEmpty = !token.accessToken;
    const isExpired = token.expirationToken <= new Date();

    if (!isEmpty && !isExpired) {
      return { isValid: true };
    }

    const refreshed = await this.tokenRefreshService.refresh(token);

    if (refreshed?.accessToken) {
      await this.tokenRepository.addToken(refreshed);
      return { isValid: true };
    }

    await this.tokenRepository.clearToken();
    return { isValid: false };
  }
}
