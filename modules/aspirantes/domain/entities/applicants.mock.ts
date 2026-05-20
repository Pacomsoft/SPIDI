/**
 * Mock data centralizado para el módulo de aspirantes.
 *
 * Se usa como fallback cuando el API real no está disponible o devuelve error.
 * Cubre TODOS los endpoints del módulo:
 *   - Listado paginado
 *   - Detalle del aspirante
 *   - Documentos del aspirante
 *   - Propuestas enviadas al aspirante
 *   - Catálogos (ciudades, estatus de solicitud)
 *
 * Cuando un endpoint esté listo en el backend, el repositorio lo consumirá
 * directamente y este mock dejará de usarse para ese método.
 */

import type { IApplicantListItemDTO } from '../contracts/applicant-list.dto';
import type { IApplicantDetailDTO, IApplicantDocumentDTO, IProposalDTO } from '../contracts/applicant-detail.dto';
import type { ICatalogItemDTO } from '../contracts/applicant-list.dto';

// ─────────────────────────────────────────────────────────────────────────────
//  Listado de aspirantes
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_APPLICANTS: IApplicantListItemDTO[] = [
  {
    id: 'asp-001',
    firstName: 'Carlos',
    paternalLastName: 'Ramírez',
    maternalLastName: 'López',
    phone: '5551234567',
    email: 'carlos.ramirez@email.com',
    location: 'Ciudad de México',
    registrationDate: '2024-11-01T10:00:00Z',
    applicationStatus: 'Pending',
    notes: 'Aspirante con buen perfil. Pendiente validación de documentos.',
    vehicle: { make: 'Nissan', model: 'Versa', year: 2021, color: 'Blanco' },
    documents: [
      { code: 'INE',         name: 'INE / IFE',              status: 'Validado' },
      { code: 'CURP',        name: 'CURP',                   status: 'Pendiente' },
      { code: 'RFC',         name: 'RFC',                    status: 'Pendiente' },
      { code: 'LICENSE',     name: 'Licencia de conducir',   status: 'Validado' },
      { code: 'CAR_INS',     name: 'Seguro de Auto',         status: 'No legible' },
      { code: 'BANK_CLABE',  name: 'Carátula cuenta bancaria', status: 'Prevalidado' },
    ],
  },
  {
    id: 'asp-002',
    firstName: 'Ana',
    paternalLastName: 'González',
    maternalLastName: 'Pérez',
    phone: '5559876543',
    email: 'ana.gonzalez@email.com',
    location: 'Guadalajara',
    registrationDate: '2024-11-05T14:30:00Z',
    applicationStatus: 'In Review',
    vehicle: { make: 'Toyota', model: 'Yaris', year: 2022, color: 'Gris' },
    documents: [
      { code: 'INE',         name: 'INE / IFE',              status: 'Validado' },
      { code: 'CURP',        name: 'CURP',                   status: 'Validado' },
      { code: 'RFC',         name: 'RFC',                    status: 'Validado' },
      { code: 'LICENSE',     name: 'Licencia de conducir',   status: 'Validado' },
      { code: 'CAR_INS',     name: 'Seguro de Auto',         status: 'Validado' },
      { code: 'BANK_CLABE',  name: 'Carátula cuenta bancaria', status: 'Validado' },
    ],
  },
  {
    id: 'asp-003',
    firstName: 'Roberto',
    paternalLastName: 'Martínez',
    maternalLastName: 'Sánchez',
    phone: '5554561230',
    email: 'roberto.martinez@email.com',
    location: 'Monterrey',
    registrationDate: '2024-11-10T09:15:00Z',
    applicationStatus: 'Proposal Sent',
    notes: 'Documentos en revisión por el equipo de validación.',
    vehicle: { make: 'Honda', model: 'Civic', year: 2020, color: 'Negro' },
    documents: [
      { code: 'INE',         name: 'INE / IFE',              status: 'Validado' },
      { code: 'CURP',        name: 'CURP',                   status: 'Prevalidado' },
      { code: 'RFC',         name: 'RFC',                    status: 'Prevalidado' },
      { code: 'LICENSE',     name: 'Licencia de conducir',   status: 'Validado' },
      { code: 'CAR_INS',     name: 'Seguro de Auto',         status: 'Prevalidado' },
      { code: 'BANK_CLABE',  name: 'Carátula cuenta bancaria', status: 'Validado' },
    ],
  },
  {
    id: 'asp-004',
    firstName: 'Laura',
    paternalLastName: 'Torres',
    maternalLastName: 'Ruiz',
    phone: '5557890123',
    email: 'laura.torres@email.com',
    location: 'Puebla',
    registrationDate: '2024-11-15T16:00:00Z',
    applicationStatus: 'Approved',
    vehicle: { make: 'Volkswagen', model: 'Polo', year: 2023, color: 'Rojo' },
    documents: [
      { code: 'INE',         name: 'INE / IFE',              status: 'Validado' },
      { code: 'CURP',        name: 'CURP',                   status: 'Validado' },
      { code: 'RFC',         name: 'RFC',                    status: 'Validado' },
      { code: 'LICENSE',     name: 'Licencia de conducir',   status: 'Validado' },
      { code: 'CAR_INS',     name: 'Seguro de Auto',         status: 'Validado' },
      { code: 'BANK_CLABE',  name: 'Carátula cuenta bancaria', status: 'Validado' },
    ],
  },
  {
    id: 'asp-005',
    firstName: 'Miguel',
    paternalLastName: 'Hernández',
    maternalLastName: 'Vega',
    phone: '5553214567',
    email: 'miguel.hernandez@email.com',
    location: 'Ciudad de México',
    registrationDate: '2024-11-20T11:45:00Z',
    applicationStatus: 'Rejected',
    notes: 'No cumplió con los requisitos mínimos del vehículo.',
    vehicle: { make: 'Kia', model: 'Rio', year: 2019, color: 'Azul' },
    documents: [
      { code: 'INE',         name: 'INE / IFE',              status: 'Pendiente' },
      { code: 'CURP',        name: 'CURP',                   status: 'Pendiente' },
      { code: 'RFC',         name: 'RFC',                    status: 'Pendiente' },
      { code: 'LICENSE',     name: 'Licencia de conducir',   status: 'No legible' },
      { code: 'CAR_INS',     name: 'Seguro de Auto',         status: 'Pendiente' },
      { code: 'BANK_CLABE',  name: 'Carátula cuenta bancaria', status: 'Pendiente' },
    ],
  },
  {
    id: 'asp-006',
    firstName: 'Diana',
    paternalLastName: 'Castillo',
    maternalLastName: 'Morales',
    phone: '5556547890',
    email: 'diana.castillo@email.com',
    location: 'Guadalajara',
    registrationDate: '2024-11-22T08:30:00Z',
    applicationStatus: 'Pending',
    vehicle: { make: 'Chevrolet', model: 'Spark', year: 2022, color: 'Blanco' },
    documents: [
      { code: 'INE',         name: 'INE / IFE',              status: 'Prevalidado' },
      { code: 'CURP',        name: 'CURP',                   status: 'Pendiente' },
      { code: 'RFC',         name: 'RFC',                    status: 'Pendiente' },
      { code: 'LICENSE',     name: 'Licencia de conducir',   status: 'Pendiente' },
      { code: 'CAR_INS',     name: 'Seguro de Auto',         status: 'Pendiente' },
      { code: 'BANK_CLABE',  name: 'Carátula cuenta bancaria', status: 'Pendiente' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Detalle de aspirante (mock por id — devuelve siempre un template)
// ─────────────────────────────────────────────────────────────────────────────
export function getMockApplicantDetail(id: string): IApplicantDetailDTO {
  const found = MOCK_APPLICANTS.find((a) => a.id === id);
  return {
    id,
    firstName:        found?.firstName        ?? 'Carlos',
    paternalLastName: found?.paternalLastName ?? 'Ramírez',
    maternalLastName: found?.maternalLastName ?? 'López',
    phone:            found?.phone            ?? '5551234567',
    email:            found?.email            ?? 'carlos.ramirez@email.com',
    city:             found?.location         ?? 'Ciudad de México',
    state:            'CDMX',
    vehicleMake:      found?.vehicle?.make    ?? 'Nissan',
    vehicleModel:     found?.vehicle?.model   ?? 'Versa',
    vehicleYear:      String(found?.vehicle?.year ?? 2021),
    vehiclePlates:    'ABC-1234',
    vehicleColor:     found?.vehicle?.color   ?? 'Blanco',
    applicationStatus: (found?.applicationStatus ?? 'Pending') as IApplicantDetailDTO['applicationStatus'],
    isDriver:         false,
    gender:           'Masculino',
    birthDate:        '1990-05-15',
    nationality:      'Mexicana',
    rfc:              'RALC900515AB1',
    curp:             'RALC900515HMCRPR04',
    nss:              '12345678901',
    cityOfInterest:   found?.location ?? 'Ciudad de México',
    street:           'Av. Insurgentes Sur',
    externalNumber:   '1234',
    internalNumber:   '5',
    neighborhood:     'Del Valle',
    postalCode:       '03100',
    fiscalStreet:     'Av. Insurgentes Sur',
    fiscalExternalNumber: '1234',
    fiscalCity:       'Ciudad de México',
    fiscalState:      'CDMX',
    fiscalPostalCode: '03100',
    fiscalRegime:     'Régimen de Incorporación Fiscal',
    bank:             'BBVA',
    clabe:            '012345678901234567',
    internalNotes:    found?.notes,
    beneficiaries:    [{ name: 'María López', phone: '5559990001', percentage: 100 }],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Documentos del aspirante
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_APPLICANT_DOCUMENTS: IApplicantDocumentDTO[] = [
  { type: 'ine',                 label: 'INE / IFE',              expirationDate: '2027-01-01', status: 'Validated' },
  { type: 'curp',                label: 'CURP',                   expirationDate: undefined,    status: 'Prevalidated' },
  { type: 'rfc',                 label: 'RFC',                    expirationDate: undefined,    status: 'Pending' },
  { type: 'comprobante_domicilio', label: 'Comprobante de domicilio', expirationDate: '2025-03-01', status: 'Unreadable' },
  { type: 'licencia',            label: 'Licencia de conducir',   expirationDate: '2026-06-15', status: 'Validated' },
  { type: 'tarjeta_circulacion', label: 'Tarjeta de circulación', expirationDate: '2025-12-31', status: 'Prevalidated' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Propuestas del aspirante
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_PROPOSALS: IProposalDTO[] = [
  {
    id:          'prop-001',
    store:       'HEB Insurgentes',
    schedule:    '08:00 - 16:00',
    sentAt:      '2024-11-10T09:00:00Z',
    status:      'Active',
    expiresIn:   72 * 3600 * 1000,
    respondedAt: undefined,
  },
  {
    id:          'prop-002',
    store:       'HEB Pedregal',
    schedule:    '12:00 - 20:00',
    sentAt:      '2024-10-20T14:00:00Z',
    status:      'Rejected',
    expiresIn:   undefined,
    respondedAt: '2024-10-21T10:30:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Catálogos
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_CATALOG_CITIES: ICatalogItemDTO[] = [
  { value: 'Ciudad de México', label: 'Ciudad de México' },
  { value: 'Guadalajara',      label: 'Guadalajara' },
  { value: 'Monterrey',        label: 'Monterrey' },
  { value: 'Puebla',           label: 'Puebla' },
  { value: 'León',             label: 'León' },
  { value: 'Tijuana',          label: 'Tijuana' },
  { value: 'Mérida',           label: 'Mérida' },
];

export const MOCK_CATALOG_APPLICATION_STATUSES: ICatalogItemDTO[] = [
  { value: 'Pending',       label: 'Pendiente' },
  { value: 'In Review',     label: 'En revisión' },
  { value: 'Proposal Sent', label: 'Propuesta enviada' },
  { value: 'Approved',      label: 'Aprobado' },
  { value: 'Rejected',      label: 'Rechazado' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: filtrado en memoria (simula lo que haría el SP)
// ─────────────────────────────────────────────────────────────────────────────
export function filterMockApplicants(
  items: IApplicantListItemDTO[],
  filters: {
    search?: string;
    applicationStatus?: string;
    documentationStatus?: string;
    location?: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortDirection: string;
  },
): { items: IApplicantListItemDTO[]; total: number } {
  let filtered = [...items];

  // Filtro por búsqueda libre
  if (filters.search) {
    const term = filters.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.firstName.toLowerCase().includes(term) ||
        a.paternalLastName.toLowerCase().includes(term) ||
        a.maternalLastName.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        a.phone.includes(term),
    );
  }

  // Filtro por estatus de solicitud
  if (filters.applicationStatus && filters.applicationStatus !== '' && filters.applicationStatus !== 'activos' && filters.applicationStatus !== 'todos') {
    filtered = filtered.filter((a) => a.applicationStatus === filters.applicationStatus);
  } else if (!filters.applicationStatus || filters.applicationStatus === 'activos') {
    // default: Pending, In Review, Proposal Sent
    filtered = filtered.filter((a) =>
      ['Pending', 'In Review', 'Proposal Sent'].includes(a.applicationStatus),
    );
  }
  // 'todos' → sin filtro adicional

  // Filtro por ubicación
  if (filters.location) {
    filtered = filtered.filter((a) =>
      a.location.toLowerCase().includes(filters.location!.toLowerCase()),
    );
  }

  // Ordenamiento
  filtered.sort((a, b) => {
    const dir = filters.sortDirection === 'asc' ? 1 : -1;
    if (filters.sortBy === 'registrationDate') {
      return dir * (new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime());
    }
    if (filters.sortBy === 'firstName') {
      return dir * a.firstName.localeCompare(b.firstName);
    }
    return 0;
  });

  const total = filtered.length;
  const start = (filters.page - 1) * filters.pageSize;
  const paged = filtered.slice(start, start + filters.pageSize);

  return { items: paged, total };
}
