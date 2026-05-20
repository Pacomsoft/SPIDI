import { type IMenuAccess } from '@/modules/shared/domain/contracts/menu-access.dto';
import { type ModuleKey } from '@/modules/shared/domain/value-objects/module-access';

export type UserRoleValue = string;

export interface ICheckModuleAccessInputDTO {
  moduleKey: ModuleKey;
}

export interface ICheckModuleAccessResultDTO {
  hasAccess: boolean;
  role: UserRoleValue | null;
}

export interface IGetHomePageResultDTO {
  homePage: string;
  role: UserRoleValue | null;
}

export interface ISessionInfoDTO {
  userId: string;
  userName: string;
  userRole: string;
  role: UserRoleValue;
  menus: IMenuAccess[];
  expiresAt: number;
}
