import { type UserRoleValue } from '@/modules/login/domain/value-objects/user-role';
import { type IMenuAccess } from '@/modules/login/domain/contracts/spidi-auth-service.interface';
import { type ModuleKey } from '../value-objects/module-access';

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
