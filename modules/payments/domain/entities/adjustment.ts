import type { IAdjustmentDetailDTO } from '../contracts/adjustment.dto';
import type { AdjustmentType } from '../contracts/adjustment.dto';

interface IAdjustmentSchema {
  adjustmentId: string;
  driverId: string;
  driverName: string;
  store: string;
  applicationDate: string;
  adjustmentType: AdjustmentType;
  amount: number;
  notes: string;
  createdBy: string;
}

export class Adjustment {
  private readonly _entity: IAdjustmentSchema;

  private constructor(schema: IAdjustmentSchema) {
    this._entity = schema;
  }

  static create(dto: IAdjustmentDetailDTO): Adjustment {
    return new Adjustment({
      adjustmentId: dto.adjustmentId,
      driverId: dto.driverId,
      driverName: dto.driverName,
      store: dto.store,
      applicationDate: dto.applicationDate,
      adjustmentType: dto.adjustmentType,
      amount: dto.amount,
      notes: dto.notes,
      createdBy: dto.createdBy,
    });
  }

  get adjustmentId(): string { return this._entity.adjustmentId; }
  get driverId(): string { return this._entity.driverId; }
  get driverName(): string { return this._entity.driverName; }
  get store(): string { return this._entity.store; }
  get applicationDate(): string { return this._entity.applicationDate; }
  get adjustmentType(): AdjustmentType { return this._entity.adjustmentType; }
  get amount(): number { return this._entity.amount; }
  get notes(): string { return this._entity.notes; }
  get createdBy(): string { return this._entity.createdBy; }

  isPositive(): boolean {
    return this._entity.amount > 0;
  }
}
