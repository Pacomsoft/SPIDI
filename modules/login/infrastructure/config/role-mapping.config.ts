import { type UserRoleValue } from '../../domain/value-objects/user-role';
import { type IRoleMapper } from '../../domain/contracts/role-mapper.interface';
import { type IGroupDTO } from '../../domain/contracts/graph-api-service.interface';

type RoleMapping = Record<UserRoleValue, string[]>;

function buildMapping(): RoleMapping {
  return {
    ADMIN_TI: (process.env.NEXT_PUBLIC_ROLE_ADMIN_TI ?? 'SPIDI-ADMIN-TI').split(',').map((s) => s.trim()),
    ADMIN_OPERACIONES: (process.env.NEXT_PUBLIC_ROLE_ADMIN_OPERACIONES ?? 'SPIDI-ADMIN-OPERACIONES').split(',').map((s) => s.trim()),
    FINANZAS: (process.env.NEXT_PUBLIC_ROLE_FINANZAS ?? 'SPIDI-FINANZAS').split(',').map((s) => s.trim()),
    RH: (process.env.NEXT_PUBLIC_ROLE_RH ?? 'SPIDI-RH').split(',').map((s) => s.trim()),
  };
}

const ROLE_PRIORITY: UserRoleValue[] = ['ADMIN_TI', 'ADMIN_OPERACIONES', 'FINANZAS', 'RH'];

export class RoleMapper implements IRoleMapper {
  private readonly mapping: RoleMapping;

  constructor() {
    this.mapping = buildMapping();
  }

  fromGroups(groups: IGroupDTO[]): UserRoleValue | null {
    const groupIdentifiers = groups.flatMap((g) => [g.id, g.displayName]);
    for (const role of ROLE_PRIORITY) {
      const identifiers = this.mapping[role];
      if (identifiers.some((id) => groupIdentifiers.includes(id))) {
        return role;
      }
    }
    return null;
  }
}
