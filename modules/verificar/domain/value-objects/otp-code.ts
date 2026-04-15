interface IOtpCodeSchema {
  value: string;
}

export class OtpCode {
  private constructor(private readonly _entity: IOtpCodeSchema) {}

  static create(raw: string): OtpCode {
    const cleaned = raw.trim();
    if (!/^\d{6}$/.test(cleaned)) {
      throw new Error('El código debe tener exactamente 6 dígitos numéricos.');
    }
    return new OtpCode({ value: cleaned });
  }

  get value(): string {
    return this._entity.value;
  }

  equals(other: OtpCode): boolean {
    return this._entity.value === other.value;
  }
}
