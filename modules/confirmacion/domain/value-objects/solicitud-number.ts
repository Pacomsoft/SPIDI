interface ISolicitudNumberSchema {
  value: string;
}

export class SolicitudNumber {
  private constructor(private readonly _entity: ISolicitudNumberSchema) {}

  static generate(seed: number): SolicitudNumber {
    const year = new Date().getFullYear();
    const padded = String(Math.abs(seed) % 9000 + 1000).padStart(6, '0');
    return new SolicitudNumber({ value: `SPD-${year}-${padded}` });
  }

  get value(): string {
    return this._entity.value;
  }

  equals(other: SolicitudNumber): boolean {
    return this._entity.value === other.value;
  }
}
