interface ILoginAttemptSchema {
  timestamp: number;
}

export class LoginAttempt {
  private constructor(private readonly _entity: ILoginAttemptSchema) {}

  static create(): LoginAttempt {
    return new LoginAttempt({ timestamp: Date.now() });
  }

  static restore(timestamp: number): LoginAttempt {
    return new LoginAttempt({ timestamp });
  }

  get timestamp(): number {
    return this._entity.timestamp;
  }

  isWithinWindow(windowMs: number): boolean {
    return Date.now() - this._entity.timestamp <= windowMs;
  }
}
