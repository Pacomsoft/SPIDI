import type { IBonusDetailDTO } from '../contracts/bonus.dto';
import type { BonusType } from '../contracts/bonus.dto';

interface IBonusSchema {
  bonusId: string;
  store: string;
  startDate: string;
  endDate: string;
  bonusType: BonusType;
  bonusAmount: number;
  threshold?: number;
  minimumOrders: number;
  createdBy: string;
  lastModifiedBy: string;
}

export class Bonus {
  private readonly _entity: IBonusSchema;

  private constructor(schema: IBonusSchema) {
    this._entity = schema;
  }

  static create(dto: IBonusDetailDTO): Bonus {
    return new Bonus({
      bonusId: dto.bonusId,
      store: dto.store,
      startDate: dto.startDate,
      endDate: dto.endDate,
      bonusType: dto.bonusType,
      bonusAmount: dto.bonusAmount,
      threshold: dto.threshold,
      minimumOrders: dto.minimumOrders,
      createdBy: dto.createdBy,
      lastModifiedBy: dto.lastModifiedBy,
    });
  }

  get bonusId(): string { return this._entity.bonusId; }
  get store(): string { return this._entity.store; }
  get startDate(): string { return this._entity.startDate; }
  get endDate(): string { return this._entity.endDate; }
  get bonusType(): BonusType { return this._entity.bonusType; }
  get bonusAmount(): number { return this._entity.bonusAmount; }
  get threshold(): number | undefined { return this._entity.threshold; }
  get minimumOrders(): number { return this._entity.minimumOrders; }
  get createdBy(): string { return this._entity.createdBy; }
  get lastModifiedBy(): string { return this._entity.lastModifiedBy; }

  isActive(): boolean {
    return new Date() < new Date(this._entity.endDate);
  }

  isEditable(): boolean {
    return new Date() < new Date(this._entity.endDate);
  }

  get fullName(): string {
    const labels: Record<BonusType, string> = {
      Punctuality: 'Puntualidad',
      Productivity: 'Productividad',
      SpecialSchedule: 'Horario Especial',
      Zone: 'Zona',
      Weather: 'Clima',
    };
    return labels[this._entity.bonusType] ?? this._entity.bonusType;
  }
}
