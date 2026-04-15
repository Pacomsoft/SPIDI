import { type UserRoleValue } from '../value-objects/user-role';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

interface ISessionSchema {
  userId: string;
  userName: string;
  userRole: string;
  role: UserRoleValue;
  expiresAt: number;
}

export class Session {
  private constructor(private readonly _entity: ISessionSchema) {}

  static create(
    userId: string,
    userName: string,
    userRole: string,
    role: UserRoleValue,
  ): Session {
    return new Session({
      userId,
      userName,
      userRole,
      role,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });
  }

  static restore(data: ISessionSchema): Session {
    return new Session(data);
  }

  get userId(): string { return this._entity.userId; }
  get userName(): string { return this._entity.userName; }
  get userRole(): string { return this._entity.userRole; }
  get role(): UserRoleValue { return this._entity.role; }
  get expiresAt(): number { return this._entity.expiresAt; }

  isExpired(): boolean {
    return Date.now() > this._entity.expiresAt;
  }

  renew(): Session {
    return new Session({ ...this._entity, expiresAt: Date.now() + SESSION_DURATION_MS });
  }

  withRole(role: UserRoleValue, userRole: string): Session {
    return new Session({ ...this._entity, role, userRole });
  }

  toPlainObject(): ISessionSchema {
    return { ...this._entity };
  }
}
