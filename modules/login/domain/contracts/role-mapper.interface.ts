import { type UserRoleValue } from '../value-objects/user-role';
import { type IGroupDTO } from './graph-api-service.interface';

export interface IRoleMapper {
  fromGroups(groups: IGroupDTO[]): UserRoleValue | null;
}
