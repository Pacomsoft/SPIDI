export type UserRoleValue = 'ADMIN_TI' | 'ADMIN_OPERACIONES' | 'FINANZAS' | 'RH';

const VALID_ROLES: UserRoleValue[] = ['ADMIN_TI', 'ADMIN_OPERACIONES', 'FINANZAS', 'RH'];

const ROLE_DESCRIPTIONS: Record<UserRoleValue, string> = {
  ADMIN_TI: 'Administrador de TI',
  ADMIN_OPERACIONES: 'Administrador de Operaciones',
  FINANZAS: 'Finanzas',
  RH: 'Recursos Humanos',
};

const ROLE_HOME_PAGES: Record<UserRoleValue, string> = {
  ADMIN_TI: '/adm/home',
  ADMIN_OPERACIONES: '/adm/home',
  FINANZAS: '/adm/pagos',
  RH: '/adm/capacitacion',
};

interface IUserRoleSchema {
  value: UserRoleValue;
}

export class UserRole {
  private constructor(private readonly _entity: IUserRoleSchema) {}

  static create(value: string): UserRole {
    if (!VALID_ROLES.includes(value as UserRoleValue)) {
      throw new Error(`Rol inválido: ${value}`);
    }
    return new UserRole({ value: value as UserRoleValue });
  }

  get value(): UserRoleValue {
    return this._entity.value;
  }

  getDescription(): string {
    return ROLE_DESCRIPTIONS[this._entity.value];
  }

  getHomePage(): string {
    return ROLE_HOME_PAGES[this._entity.value];
  }

  equals(other: UserRole): boolean {
    return this._entity.value === other.value;
  }
}
