import { type ITokenDto } from '@/modules/shared/domain/contracts/token.dto';
import { type IMenuAccess, type IRoleDto } from '@/modules/shared/domain/contracts/menu-access.dto';

// Re-exported for backward compatibility
export type { IMenuAccess, IRoleDto };

export interface ISpidiAuthResultDTO {
  spidiToken: ITokenDto;
  roles: IRoleDto[];
}

export interface ISpidiAuthService {
  authenticateWithEntraToken(msAccessToken: string): Promise<ISpidiAuthResultDTO>;
}
