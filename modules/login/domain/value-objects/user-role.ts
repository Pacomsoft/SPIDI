import { type IRoleDto } from '@/modules/login/domain/contracts/spidi-auth-service.interface';
import { ModuleAccess } from '@/modules/shared/domain/value-objects/module-access';

export type UserRoleValue = string;

interface IUserRoleSchema {
  name: string;
  label: string;
  description: string;
  access: ModuleAccess;
}

export class UserRole {
  private constructor(private readonly _entity: IUserRoleSchema) {}

  static create(dto: IRoleDto): UserRole {
    return new UserRole({
      name: dto.name,
      label: dto.label,
      description: dto.description,
      access: ModuleAccess.create(dto.menus),
    });
  }

  get value(): UserRoleValue {
    return this._entity.name;
  }

  get name(): string {
    return this._entity.name;
  }

  get label(): string {
    return this._entity.label;
  }

  get access(): ModuleAccess {
    return this._entity.access;
  }

  getDescription(): string {
    return this._entity.label;
  }

  getHomePage(): string {
    return '/adm/home';
  }

  equals(other: UserRole): boolean {
    return this._entity.name === other.name;
  }
}
