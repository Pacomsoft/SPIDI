/**
 * Mock repository para el módulo de drivers.
 *
 * Simula TODOS los endpoints del repositorio con datos en memoria.
 * El estado muta correctamente (changeStatus, updateDriver, uploadDocument)
 * para que el flujo completo funcione en local sin backend.
 *
 * Plug & play: cuando el backend esté listo, basta con swapear este
 * repositorio por ApiDriversRepository en dependency-injection.ts.
 */

import type { IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import type { IPagination } from '@/modules/shared/domain/contracts/pagination.interface';
import type { IDriverListItemDTO, IDriverFiltersDTO, ICatalogItemDTO } from '../../domain/contracts/driver-list.dto';
import type { IDriverDetailDTO, IDocumentDTO, IOrderDTO, IPaymentWeekDTO } from '../../domain/contracts/driver-detail.dto';
import type { IUpdateDriverDTO } from '../../domain/contracts/update-driver.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IChangeDriverStatusInputDTO, IChangeDriverStatusOutputDTO } from '../../domain/contracts/change-driver-status.dto';
import type { IUploadDocumentInputDTO, IUploadDocumentOutputDTO } from '../../domain/contracts/upload-document.dto';
import type { IExpiredDocumentItemDTO, IExpiredDocumentsFiltersDTO } from '../../domain/contracts/expired-document.dto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms = 600): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isoDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function mondayOf(weeksAgo: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff - weeksAgo * 7);
  return d.toISOString().split('T')[0];
}

function sundayOf(weeksAgo: number): string {
  const d = new Date(mondayOf(weeksAgo));
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

function weekNumber(weeksAgo: number): number {
  const d = new Date(mondayOf(weeksAgo));
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const STORES = ['HEB Monterrey Centro', 'HEB San Pedro', 'HEB Cumbres', 'HEB Valle', 'HEB Contry'];
const SLOTS  = ['09:00–11:00', '11:00–13:00', '13:00–15:00', '15:00–17:00', '17:00–19:00'];

const MOCK_DRIVERS_DETAIL: IDriverDetailDTO[] = [
  {
    id: 'DRV-001',
    firstName: 'Carlos',
    paternalLastName: 'Ramírez',
    maternalLastName: 'Garza',
    phone: '8112345678',
    email: 'carlos.ramirez@spidi.mx',
    city: 'Monterrey',
    state: 'Nuevo León',
    gender: 'M',
    birthDate: '1990-03-12',
    nationality: 'Mexicana',
    rfc: 'RAGC900312AB1',
    curp: 'RAGC900312HNLMZR09',
    nss: '12345678901',
    street: 'Av. Constitución',
    externalNumber: '1200',
    internalNumber: 'A',
    neighborhood: 'Centro',
    postalCode: '64000',
    fiscalStreet: 'Av. Constitución',
    fiscalExternalNumber: '1200',
    fiscalNeighborhood: 'Centro',
    fiscalCity: 'Monterrey',
    fiscalState: 'Nuevo León',
    fiscalPostalCode: '64000',
    fiscalRegime: '612 - Personas Físicas con Actividades Empresariales',
    bank: 'BBVA',
    clabe: '012580012345678901',
    vehicleMake: 'Nissan',
    vehicleModel: 'Versa',
    vehicleYear: '2021',
    vehiclePlates: 'ABC-123-NL',
    vehicleColor: 'Blanco',
    driverStatus: 'Enabled',
    incapacityStatus: 'Without incapacity',
    lastOrderStore: 'HEB Monterrey Centro',
    lastCheckInDate: isoDate(-1),
    internalNotes: 'Driver puntual. Sin incidencias reportadas.',
    beneficiaries: [
      { name: 'María Garza López', phone: '8119876543', percentage: 100 },
    ],
  },
  {
    id: 'DRV-002',
    firstName: 'José Luis',
    paternalLastName: 'Morales',
    maternalLastName: 'Vega',
    phone: '8187654321',
    email: 'joseluis.morales@spidi.mx',
    city: 'San Pedro Garza García',
    state: 'Nuevo León',
    gender: 'M',
    birthDate: '1988-07-25',
    nationality: 'Mexicana',
    rfc: 'MOVJ880725CD2',
    curp: 'MOVJ880725HNLRRSL3',
    nss: '98765432101',
    street: 'Blvd. Díaz Ordaz',
    externalNumber: '400',
    neighborhood: 'Valle Oriente',
    postalCode: '66269',
    fiscalStreet: 'Blvd. Díaz Ordaz',
    fiscalExternalNumber: '400',
    fiscalNeighborhood: 'Valle Oriente',
    fiscalCity: 'San Pedro Garza García',
    fiscalState: 'Nuevo León',
    fiscalPostalCode: '66269',
    fiscalRegime: '612 - Personas Físicas con Actividades Empresariales',
    bank: 'Santander',
    clabe: '014580098765432101',
    vehicleMake: 'Toyota',
    vehicleModel: 'Yaris',
    vehicleYear: '2019',
    vehiclePlates: 'XYZ-456-NL',
    vehicleColor: 'Gris',
    driverStatus: 'Suspended',
    incapacityStatus: 'Without incapacity',
    lastOrderStore: 'HEB San Pedro',
    lastCheckInDate: isoDate(-5),
    internalNotes: 'Suspendido por incidente del 2024-12-01. Pendiente revisión.',
    beneficiaries: [],
  },
  {
    id: 'DRV-003',
    firstName: 'Alejandro',
    paternalLastName: 'Torres',
    maternalLastName: 'Sánchez',
    phone: '8193216549',
    email: 'alejandro.torres@spidi.mx',
    city: 'Guadalupe',
    state: 'Nuevo León',
    gender: 'M',
    birthDate: '1995-11-08',
    nationality: 'Mexicana',
    rfc: 'TOSA951108EF3',
    curp: 'TOSA951108HNLRNL05',
    nss: '11223344556',
    street: 'Calle Moctezuma',
    externalNumber: '88',
    neighborhood: 'La Fama',
    postalCode: '67190',
    fiscalStreet: 'Calle Moctezuma',
    fiscalExternalNumber: '88',
    fiscalNeighborhood: 'La Fama',
    fiscalCity: 'Guadalupe',
    fiscalState: 'Nuevo León',
    fiscalPostalCode: '67190',
    fiscalRegime: '612 - Personas Físicas con Actividades Empresariales',
    bank: 'Banamex',
    clabe: '002580011223344556',
    vehicleMake: 'Volkswagen',
    vehicleModel: 'Vento',
    vehicleYear: '2022',
    vehiclePlates: 'MNO-789-NL',
    vehicleColor: 'Negro',
    driverStatus: 'Disabled',
    incapacityStatus: 'With incapacity',
    lastOrderStore: 'HEB Cumbres',
    lastCheckInDate: isoDate(-10),
    internalNotes: '',
    beneficiaries: [
      { name: 'Laura Sánchez Ruiz', phone: '8196543210', percentage: 60 },
      { name: 'Pedro Torres Gómez', phone: '8191234567', percentage: 40 },
    ],
  },
];

// Documentos por driver (mutables en memoria)
const MOCK_DOCUMENTS: Record<string, IDocumentDTO[]> = {
  'DRV-001': [
    { type: 'NSS',         label: 'NSS',                      status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
    { type: 'LICENSE',     label: 'Licencia de Conducir',     status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', expirationDate: isoDate(45)  },
    { type: 'INSURANCE',   label: 'Seguro del Vehículo',      status: 'Prevalidated', fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', expirationDate: isoDate(120) },
    { type: 'INE',         label: 'INE',                      status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', expirationDate: isoDate(200) },
    { type: 'CSF',         label: 'Constancia Fiscal (CSF)',  status: 'Pending' },
    { type: 'CLABE_COVER', label: 'Carátula CLABE',           status: 'Unreadable',   fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
    { type: 'CONTRACT',    label: 'Contrato',                 status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
  ],
  'DRV-002': [
    { type: 'NSS',         label: 'NSS',                      status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
    { type: 'LICENSE',     label: 'Licencia de Conducir',     status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', expirationDate: isoDate(-5) },
    { type: 'INSURANCE',   label: 'Seguro del Vehículo',      status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', expirationDate: isoDate(20) },
    { type: 'INE',         label: 'INE',                      status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', expirationDate: isoDate(300) },
    { type: 'CSF',         label: 'Constancia Fiscal (CSF)',  status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
    { type: 'CLABE_COVER', label: 'Carátula CLABE',           status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
    { type: 'CONTRACT',    label: 'Contrato',                 status: 'Validated',    fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' },
  ],
  'DRV-003': [
    { type: 'NSS',         label: 'NSS',                      status: 'Pending' },
    { type: 'LICENSE',     label: 'Licencia de Conducir',     status: 'Pending',      expirationDate: undefined },
    { type: 'INSURANCE',   label: 'Seguro del Vehículo',      status: 'Pending',      expirationDate: undefined },
    { type: 'INE',         label: 'INE',                      status: 'Unreadable',   fileUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf', expirationDate: isoDate(100) },
    { type: 'CSF',         label: 'Constancia Fiscal (CSF)',  status: 'Pending' },
    { type: 'CLABE_COVER', label: 'Carátula CLABE',           status: 'Pending' },
    { type: 'CONTRACT',    label: 'Contrato',                 status: 'Pending' },
  ],
};

// Pedidos (estáticos, suficiente para paginar)
const MOCK_ORDERS: IOrderDTO[] = Array.from({ length: 28 }, (_, i) => ({
  orderId: `ORD-${String(i + 1).padStart(4, '0')}`,
  storeName: STORES[i % STORES.length],
  deliveryDate: isoDate(-(i + 1)),
  deliverySlot: SLOTS[i % SLOTS.length],
}));

// Pagos (12 semanas hacia atrás)
const MOCK_PAYMENTS: IPaymentWeekDTO[] = Array.from({ length: 12 }, (_, i) => {
  const orders = 15 + (i % 8);
  const bonuses = i % 3 === 0 ? 2 : 0;
  const ordersAmt = orders * 65;
  const bonusesAmt = bonuses * 50;
  const adjustment = i % 5 === 0 ? -30 : 0;
  return {
    year: new Date(mondayOf(i)).getFullYear(),
    week: weekNumber(i),
    weekStart: mondayOf(i),
    weekEnd: sundayOf(i),
    deliveredOrdersCount: orders,
    ordersAmount: ordersAmt,
    bonusesCount: bonuses,
    bonusesAmount: bonusesAmt,
    adjustmentAmount: adjustment,
    totalAmount: ordersAmt + bonusesAmt + adjustment,
    hasReceipt: i < 10,
    receiptUrl: i < 10 ? 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf' : undefined,
  };
});

// Estado mutable en memoria (mutamos clones para que React re-renderice)
let driversStore: IDriverDetailDTO[] = MOCK_DRIVERS_DETAIL.map(d => ({ ...d }));

function findDriver(id: string): IDriverDetailDTO | undefined {
  return driversStore.find(d => d.id === id);
}

function sortAndPaginate<T>(
  items: T[],
  pagination: IPagination,
  sortFn?: (a: T, b: T) => number,
): { items: T[]; total: number } {
  let sorted = sortFn ? [...items].sort(sortFn) : [...items];
  if (pagination.sortDirection === 'desc') sorted = sorted.reverse();
  const start = (pagination.page - 1) * pagination.pageSize;
  return { items: sorted.slice(start, start + pagination.pageSize), total: items.length };
}

// ─── Mock Repository ──────────────────────────────────────────────────────────

export class MockDriversRepository implements IDriverRepository {

  async getDrivers(filters: IDriverFiltersDTO): Promise<IResultApi<{ items: IDriverListItemDTO[]; total: number }>> {
    await delay();
    let items: IDriverListItemDTO[] = driversStore.map(d => ({
      id: d.id,
      firstName: d.firstName,
      paternalLastName: d.paternalLastName,
      maternalLastName: d.maternalLastName,
      curp: d.curp ?? '',
      email: d.email,
      phone: d.phone,
      stateOfCountry: d.state,
      driverStatus: d.driverStatus,
      lastOrderStore: d.lastOrderStore,
      lastOrderDate: d.lastCheckInDate,
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(d =>
        `${d.firstName} ${d.paternalLastName} ${d.maternalLastName}`.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.phone.includes(q),
      );
    }
    if (filters.driverStatus?.length) {
      items = items.filter(d => filters.driverStatus!.includes(d.driverStatus));
    }
    if (filters.stateOfCountry) {
      items = items.filter(d => d.stateOfCountry === filters.stateOfCountry);
    }
    if (filters.lastOrderStore) {
      items = items.filter(d => d.lastOrderStore === filters.lastOrderStore);
    }

    const total = items.length;
    const start = (filters.page - 1) * filters.pageSize;
    return { success: true, data: { items: items.slice(start, start + filters.pageSize), total } };
  }

  async getDriverById(id: string): Promise<IResultApi<IDriverDetailDTO>> {
    await delay();
    const driver = findDriver(id);
    if (!driver) return { success: false, error: { statusCode: 404, message: 'Driver no encontrado' } };
    return { success: true, data: { ...driver } };
  }

  async updateDriver(id: string, data: IUpdateDriverDTO): Promise<IResultApi<IDriverDetailDTO>> {
    await delay();
    const idx = driversStore.findIndex(d => d.id === id);
    if (idx === -1) return { success: false, error: { statusCode: 404, message: 'Driver no encontrado' } };
    driversStore[idx] = { ...driversStore[idx], ...data };
    return { success: true, data: { ...driversStore[idx] } };
  }

  async deleteDriver(id: string): Promise<IResultApi<void>> {
    await delay();
    const idx = driversStore.findIndex(d => d.id === id);
    if (idx === -1) return { success: false, error: { statusCode: 404, message: 'Driver no encontrado' } };
    driversStore.splice(idx, 1);
    return { success: true };
  }

  async exportDrivers(_filters: IDriverFiltersDTO, _format: string): Promise<IResultApi<Blob>> {
    await delay();
    const csv = 'id,nombre,status\n' + driversStore.map(d => `${d.id},${d.firstName} ${d.paternalLastName},${d.driverStatus}`).join('\n');
    return { success: true, data: new Blob([csv], { type: 'text/csv' }) };
  }

  async getDocuments(driverId: string): Promise<IResultApi<IDocumentDTO[]>> {
    await delay(400);
    const docs = MOCK_DOCUMENTS[driverId] ?? [];
    return { success: true, data: docs.map(d => ({ ...d })) };
  }

  async updateDocument(driverId: string, documentType: string, data: Partial<IDocumentDTO>): Promise<IResultApi<IDocumentDTO>> {
    await delay();
    const docs = MOCK_DOCUMENTS[driverId];
    if (!docs) return { success: false, error: { statusCode: 404, message: 'Driver no encontrado' } };
    const idx = docs.findIndex(d => d.type === documentType);
    if (idx === -1) return { success: false, error: { statusCode: 404, message: 'Documento no encontrado' } };
    docs[idx] = { ...docs[idx], ...data };
    return { success: true, data: { ...docs[idx] } };
  }

  async getOrders(driverId: string, pagination: IPagination): Promise<IResultApi<{ items: IOrderDTO[]; total: number }>> {
    await delay();
    // Todos los drivers comparten el mismo pool de pedidos en el mock
    void driverId;
    const result = sortAndPaginate(MOCK_ORDERS, pagination, (a, b) =>
      a.deliveryDate.localeCompare(b.deliveryDate),
    );
    return { success: true, data: result };
  }

  async getPayments(
    driverId: string,
    pagination: IPagination,
    filterYear?: number,
    filterWeek?: number,
  ): Promise<IResultApi<{ items: IPaymentWeekDTO[]; total: number }>> {
    await delay();
    void driverId;
    let items = [...MOCK_PAYMENTS];
    if (filterYear !== undefined) items = items.filter(p => p.year === filterYear);
    if (filterWeek !== undefined) items = items.filter(p => p.week === filterWeek);
    const result = sortAndPaginate(items, pagination, (a, b) =>
      a.weekStart.localeCompare(b.weekStart),
    );
    return { success: true, data: result };
  }

  async getCatalogItems(_catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>> {
    await delay(200);
    return {
      success: true,
      data: [
        { value: 'Nuevo León', label: 'Nuevo León' },
        { value: 'Jalisco',    label: 'Jalisco'    },
        { value: 'CDMX',       label: 'CDMX'       },
      ],
    };
  }

  async changeStatus(input: IChangeDriverStatusInputDTO): Promise<IResultApi<IChangeDriverStatusOutputDTO>> {
    await delay();
    const idx = driversStore.findIndex(d => d.id === input.driverId);
    if (idx === -1) {
      return { success: false, error: { statusCode: 404, message: 'Driver no encontrado' } };
    }
    driversStore[idx] = { ...driversStore[idx], driverStatus: input.status };
    return {
      success: true,
      data: {
        driverId: input.driverId,
        status: input.status,
        changedBy: input.changedBy,
        changedAt: new Date().toISOString(),
      },
    };
  }

  async uploadDocument(input: IUploadDocumentInputDTO): Promise<IResultApi<IUploadDocumentOutputDTO>> {
    await delay(800);
    const docs = MOCK_DOCUMENTS[input.driverId];
    if (docs) {
      const idx = docs.findIndex(d => d.type === input.documentType);
      const fakeUrl = `https://mock-storage.spidi.mx/${input.driverId}/${input.documentType}.pdf`;
      if (idx !== -1) {
        docs[idx] = { ...docs[idx], fileUrl: fakeUrl, status: 'Pending' };
      } else {
        docs.push({ type: input.documentType, label: input.documentLabel, status: 'Pending', fileUrl: fakeUrl });
      }
    }
    return {
      success: true,
      data: {
        driverId: input.driverId,
        documentType: input.documentType,
        url: `https://mock-storage.spidi.mx/${input.driverId}/${input.documentType}.pdf`,
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  async getExpiredDocuments(filters: IExpiredDocumentsFiltersDTO): Promise<IResultApi<{ items: IExpiredDocumentItemDTO[]; total: number }>> {
    await delay();
    const mockExpired: IExpiredDocumentItemDTO[] = [
      {
        driverId: 'DRV-001',
        fullName: 'Carlos Ramírez Garza',
        rfc: 'RAGC900312AB1',
        expiredDocuments: [],
        expiringDocuments: ['Licencia de Conducir'],
        oldestExpiryDate: isoDate(45),
      },
      {
        driverId: 'DRV-002',
        fullName: 'José Luis Morales Vega',
        rfc: 'MOVJ880725CD2',
        expiredDocuments: ['Licencia de Conducir'],
        expiringDocuments: ['Seguro del Vehículo'],
        oldestExpiryDate: isoDate(-5),
      },
    ];
    const start = (filters.page - 1) * filters.pageSize;
    return {
      success: true,
      data: { items: mockExpired.slice(start, start + filters.pageSize), total: mockExpired.length },
    };
  }

  async exportExpiredDocuments(_format: string): Promise<IResultApi<Blob>> {
    await delay();
    const csv = 'driverId,fullName,expiredDocuments\nDRV-002,José Luis Morales Vega,Licencia de Conducir';
    return { success: true, data: new Blob([csv], { type: 'text/csv' }) };
  }
}
