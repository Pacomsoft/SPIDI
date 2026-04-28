import { type IDriverDetailDTO } from '../contracts/driver-detail.dto';

interface IDriverSchema {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  driverStatus: 'Enabled' | 'Disabled' | 'Suspended';
  incapacityStatus: 'Without incapacity' | 'With incapacity';
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlates: string;
  vehicleColor: string;
  lastOrderStore: string;
  lastCheckInDate: string;
}

export class Driver {
  private readonly _entity: IDriverSchema;

  private constructor(schema: IDriverSchema) {
    this._entity = schema;
  }

  static create(dto: IDriverDetailDTO): Driver {
    return new Driver({
      id: dto.id,
      firstName: dto.firstName,
      paternalLastName: dto.paternalLastName,
      maternalLastName: dto.maternalLastName,
      phone: dto.phone,
      email: dto.email,
      city: dto.city,
      state: dto.state,
      driverStatus: dto.driverStatus,
      incapacityStatus: dto.incapacityStatus,
      vehicleMake: dto.vehicleMake,
      vehicleModel: dto.vehicleModel,
      vehicleYear: dto.vehicleYear,
      vehiclePlates: dto.vehiclePlates,
      vehicleColor: dto.vehicleColor,
      lastOrderStore: dto.lastOrderStore,
      lastCheckInDate: dto.lastCheckInDate,
    });
  }

  get id(): string { return this._entity.id; }
  get firstName(): string { return this._entity.firstName; }
  get paternalLastName(): string { return this._entity.paternalLastName; }
  get maternalLastName(): string { return this._entity.maternalLastName; }
  get fullName(): string { return `${this._entity.firstName} ${this._entity.paternalLastName} ${this._entity.maternalLastName}`; }
  get phone(): string { return this._entity.phone; }
  get email(): string { return this._entity.email; }
  get city(): string { return this._entity.city; }
  get state(): string { return this._entity.state; }
  get driverStatus(): 'Enabled' | 'Disabled' | 'Suspended' { return this._entity.driverStatus; }
  get incapacityStatus(): 'Without incapacity' | 'With incapacity' { return this._entity.incapacityStatus; }
  get vehicleMake(): string { return this._entity.vehicleMake; }
  get vehicleModel(): string { return this._entity.vehicleModel; }
  get vehicleYear(): string { return this._entity.vehicleYear; }
  get vehiclePlates(): string { return this._entity.vehiclePlates; }
  get vehicleColor(): string { return this._entity.vehicleColor; }
  get lastOrderStore(): string { return this._entity.lastOrderStore; }
  get lastCheckInDate(): string { return this._entity.lastCheckInDate; }
  get isEnabled(): boolean { return this._entity.driverStatus === 'Enabled'; }
  get isSuspended(): boolean { return this._entity.driverStatus === 'Suspended'; }
}
