export interface IDriverDetailDTO {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  gender?: string;
  birthDate?: string;
  nationality?: string;
  rfc?: string;
  curp?: string;
  nss?: string;
  photoUrl?: string;
  street?: string;
  externalNumber?: string;
  internalNumber?: string;
  neighborhood?: string;
  postalCode?: string;
  fiscalStreet?: string;
  fiscalExternalNumber?: string;
  fiscalInternalNumber?: string;
  fiscalNeighborhood?: string;
  fiscalCity?: string;
  fiscalState?: string;
  fiscalPostalCode?: string;
  fiscalRegime?: string;
  bank?: string;
  clabe?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlates: string;
  vehicleColor: string;
  driverStatus: 'Enabled' | 'Disabled' | 'Suspended';
  incapacityStatus: 'Without incapacity' | 'With incapacity';
  lastOrderStore: string;
  lastCheckInDate: string;
  internalNotes?: string;
  beneficiaries?: Array<{ name: string; phone: string; percentage: number; }>;
}

export interface IDocumentDTO {
  type: string;
  label: string;
  expirationDate?: string;
  status: 'Pending' | 'Unreadable' | 'Prevalidated' | 'Validated';
  fileUrl?: string;
  isExpired?: boolean;
}

export interface IOrderDTO {
  orderId: string;
  storeName: string;
  deliveryDate: string;
  deliverySlot: string;
}

export interface IPaymentWeekDTO {
  year: number;
  week: number;
  weekStart: string;
  weekEnd: string;
  deliveredOrdersCount: number;
  ordersAmount: number;
  bonusesCount: number;
  bonusesAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
  hasReceipt: boolean;
  receiptUrl?: string;
}
