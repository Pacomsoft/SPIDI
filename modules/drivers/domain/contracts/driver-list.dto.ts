import { type IPagination } from '@/modules/shared/domain/contracts/pagination.interface';

export interface IDriverListItemDTO {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  curp: string;
  email: string;
  phone: string;
  stateOfCountry: string;
  driverStatus: 'Enabled' | 'Disabled' | 'Suspended';
  lastOrderStore: string;
  lastOrderDate: string;
}

export interface IDriverFiltersDTO extends IPagination {
  search?: string;
  driverStatus?: string[];
  stateOfCountry?: string;
  lastOrderStore?: string;
}

export interface ICatalogItemDTO {
  value: string;
  label: string;
}
