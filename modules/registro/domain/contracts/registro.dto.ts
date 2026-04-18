export interface IRegistroDTO {
  formId: string;
  firstName: string;
  middleName: string;
  paternalSurname: string;
  maternalSurname: string;
  phone: string;
  email: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlates: string;
  vehicleColor: string;
  workStateId?: number;
  workStateName: string;
  workCityId?: number;
  workCityName: string;
  referalSource: string;
  verifiedSms: boolean;
  verifiedEmail: boolean;
}
