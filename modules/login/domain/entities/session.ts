import { type UserRoleValue } from '../value-objects/user-role';
import { type IMenuAccess } from '../contracts/spidi-auth-service.interface';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

interface ISessionSchema {
  userId: string;
  userName: string;
  userRole: string;
  role: UserRoleValue;
  menus: IMenuAccess[];
  expiresAt: number;
}

export class Session {
  private constructor(private readonly _entity: ISessionSchema) {}

  static create(
    userId: string,
    userName: string,
    userRole: string,
    role: UserRoleValue,
    menus: IMenuAccess[],
  ): Session {
    return new Session({
      userId,
      userName,
      userRole,
      role,
      menus,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });
  }

  static restore(data: ISessionSchema): Session {
    return new Session({ ...data, menus: data.menus ?? [] });
  }

  get userId(): string { return this._entity.userId; }
  get userName(): string { return this._entity.userName; }
  get userRole(): string { return this._entity.userRole; }
  get role(): UserRoleValue { return this._entity.role; }
  get menus(): IMenuAccess[] { return this._entity.menus; }
  get expiresAt(): number { return this._entity.expiresAt; }

  isExpired(): boolean {
    return Date.now() > this._entity.expiresAt;
  }

  renew(): Session {
    return new Session({ ...this._entity, expiresAt: Date.now() + SESSION_DURATION_MS });
  }

  toPlainObject(): ISessionSchema {
    return { ...this._entity };
  }
}
