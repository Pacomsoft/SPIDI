export type DriverStatusValue = 'Enabled' | 'Disabled' | 'Suspended';

export interface IChangeDriverStatusInputDTO {
  driverId: string;
  status: DriverStatusValue;
  changedBy: string;
}

export interface IChangeDriverStatusOutputDTO {
  driverId: string;
  status: DriverStatusValue;
  changedBy: string;
  changedAt: string; // ISO date
}
