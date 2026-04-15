import { type ITokenDto } from '@/modules/shared/domain/contracts/token.dto';

export interface ITokenRefreshService {
  refresh(token: ITokenDto): Promise<ITokenDto | null>;
}
