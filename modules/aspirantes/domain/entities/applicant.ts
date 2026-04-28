import type { IApplicantDetailDTO } from '../contracts/applicant-detail.dto';

interface IApplicantSchema {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlates: string;
  vehicleColor: string;
  applicationStatus: IApplicantDetailDTO['applicationStatus'];
  isDriver: boolean;
}

export class Applicant {
  private readonly _entity: IApplicantSchema;

  private constructor(schema: IApplicantSchema) {
    this._entity = schema;
  }

  static create(data: IApplicantDetailDTO): Applicant {
    if (!data.id) throw new Error('Applicant id is required');
    if (!data.firstName) throw new Error('Applicant firstName is required');
    if (!data.paternalLastName) throw new Error('Applicant paternalLastName is required');
    if (!data.vehiclePlates) throw new Error('Applicant vehiclePlates is required');

    return new Applicant({
      id: data.id,
      firstName: data.firstName,
      paternalLastName: data.paternalLastName,
      maternalLastName: data.maternalLastName,
      phone: data.phone,
      email: data.email,
      city: data.city,
      state: data.state,
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      vehicleYear: data.vehicleYear,
      vehiclePlates: data.vehiclePlates,
      vehicleColor: data.vehicleColor,
      applicationStatus: data.applicationStatus,
      isDriver: data.isDriver,
    });
  }

  get id(): string { return this._entity.id; }
  get fullName(): string {
    return `${this._entity.firstName} ${this._entity.paternalLastName} ${this._entity.maternalLastName}`.trim();
  }
  get applicationStatus(): IApplicantDetailDTO['applicationStatus'] {
    return this._entity.applicationStatus;
  }
  get isDriver(): boolean { return this._entity.isDriver; }

  toDTO(): IApplicantSchema {
    return { ...this._entity };
  }
}
