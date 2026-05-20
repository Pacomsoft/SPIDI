# BACKEND_SERVICES.md — Manual de Integración Frontend → Backend

> **SPIDI Front-React** | Actualizado: 2026-05-19  
> Este documento describe todos los servicios que el frontend consume o espera del backend,
> su estado actual (API real vs mock), los DTOs de entrada/salida, y cómo hacer el swap
> mock → API cuando el endpoint esté listo.

---

## Índice

1. [Convenciones](#convenciones)
2. [Resumen ejecutivo](#resumen-ejecutivo)
3. [Módulo: adm / Authorization](#módulo-adm--authorization)
4. [Módulo: aspirantes](#módulo-aspirantes)
5. [Módulo: drivers](#módulo-drivers)
6. [Módulo: payments](#módulo-payments)
7. [Módulo: capacitacion](#módulo-capacitacion)
8. [Módulo: registro / OTP](#módulo-registro--otp)
9. [Catálogos compartidos](#catálogos-compartidos)
10. [Cómo hacer el swap mock → API](#cómo-hacer-el-swap-mock--api)

---

## Convenciones

| Símbolo | Significado |
|---------|-------------|
| ✅ REAL | Endpoint real con BD real en el backend |
| ⚠️ PARTIAL | Endpoint real con fallback a mock en el front si falla |
| 🟡 MOCK | Mock en el front — backend tiene datos hardcodeados o endpoint inexistente |

**Patrón plug & play:** todos los módulos 🟡 tienen `mockRepository` y `apiRepository` coexistiendo
en el DI. Cuando el backend implemente el endpoint real, el swap es cambiar `mockRepository → apiRepository`
en el use case correspondiente dentro de `dependency-injection.ts`, sin tocar ninguna otra capa.

Base URL: `process.env.NEXT_PUBLIC_API_URL` (ej. `https://api.spidi.heb.com`)

---

## Resumen ejecutivo

| Módulo | Estado general | Mock en |
|--------|---------------|---------|
| adm / auth | ✅ Todo real | — |
| registro / OTP | ✅ Todo real | — |
| catálogos compartidos | ✅ Todo real | — |
| aspirantes | ⚠️ Parcial | Front (métodos de detalle, edición, docs, propuestas) |
| drivers | 🟡 Mock total | Front — backend devuelve datos hardcodeados en C# |
| payments | 🟡 Mock total | Front — no existe PaymentsController en el backend |
| capacitacion | 🟡 Mock total | Front — no existe controller en el backend |

---

## Módulo: adm / Authorization

**Repositorio:** `modules/adm/infrastructure/`  
**Patrón:** Siempre API real — usa `FetchHttpClient` directamente, sin mock.

### Servicios

| # | Estado | Método | Endpoint | Descripción |
|---|--------|--------|----------|-------------|
| 1 | ✅ REAL | `GET` | `/api/v1/authorization/entra-access` | Inicia flujo PKCE con Microsoft Entra |
| 2 | ✅ REAL | `GET` | `/api/v1/authorization/me` | Perfil del usuario autenticado |
| 3 | ✅ REAL | `POST` | `/api/v1/authorization/token/refresh` | Refresca el access token |
| 4 | ✅ REAL | `POST` | `/api/v1/authorization/logout` | Cierra sesión e invalida token |

### DTOs

**GET `/me` — Response `IAdmDTO`**
```ts
interface IAdmDTO {
  id: string;
  name: string;
  email: string;
  role: string;           // 'admin' | 'operator' | ...
  permissions: string[];
  storeId?: string;
}
```

**POST `/token/refresh` — Request / Response `ITokenDTO`**
```ts
// Request:
{ refreshToken: string }

// Response:
interface ITokenDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;  // segundos
}
```

---

## Módulo: aspirantes

**Repositorio API:** `modules/aspirantes/infrastructure/repositories/api-applicants.repository.ts`  
**DI:** `modules/aspirantes/infrastructure/dependency-injection.ts`  
**Patrón:** API-first con fallback a mock en el `catch` — este módulo mantiene su patrón original
porque `getApplicants` y los catálogos están realmente conectados al backend.

### Servicios

| # | Estado | Método | Endpoint | Descripción |
|---|--------|--------|----------|-------------|
| 1 | ✅ REAL | `GET` | `/api/v1/applicants` | Lista paginada de aspirantes |
| 2 | ⚠️ PARTIAL | `GET` | `/api/v1/catalogs/cities` | Ciudades de operación (fallback mock si falla) |
| 3 | ⚠️ PARTIAL | `GET` | `/api/v1/catalogs/application-statuses` | Estatus de solicitud (fallback mock si falla) |
| 4 | 🟡 MOCK | `GET` | `/api/v1/applicant/{id}` | Detalle de aspirante |
| 5 | 🟡 MOCK | `PUT` | `/api/v1/applicant/{id}` | Actualizar aspirante |
| 6 | 🟡 MOCK | `DELETE` | `/api/v1/applicant/{id}` | Eliminar aspirante |
| 7 | 🟡 MOCK | `GET` | `/api/v1/applicant/export/{format}` | Exportar lista (`csv` / `xlsx`) |
| 8 | 🟡 MOCK | `GET` | `/api/v1/applicant/{id}/documents` | Documentos del aspirante |
| 9 | 🟡 MOCK | `PUT` | `/api/v1/applicant/{id}/documents/{type}` | Actualizar documento |
| 10 | 🟡 MOCK | `GET` | `/api/v1/applicant/{id}/proposals` | Propuestas enviadas |
| 11 | 🟡 MOCK | `POST` | `/api/v1/applicant/{id}/proposals` | Crear propuesta |

### DTOs

**GET `/applicants` — Query params**
```ts
interface IApplicantFiltersDTO {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search?: string;
  applicationStatus?: string;   // '' | 'activos' | 'todos' | 'Pending' | 'In Review' | 'Proposal Sent' | 'Approved' | 'Rejected'
  documentationStatus?: string; // '' | 'Pendiente' | 'No legible' | 'Prevalidado' | 'Validado'
  location?: string;
  dateFrom?: string;            // ISO date
  dateTo?: string;              // ISO date
}
```

> **Mapeo applicationStatus → int (backend):**
> `''`/`'activos'` → `0` | `'todos'` → `-1` | `'Pending'` → `1` | `'In Review'` → `2` |
> `'Proposal Sent'` → `3` | `'Approved'` → `4` | `'Rejected'` → `5`

**GET `/applicants` — Response (shape del backend)**
```ts
{
  items: {
    id: number;
    firstName: string;
    parentalSurname: string;
    maternalSurname: string | null;
    phone: string | null;
    email: string | null;
    location: string;
    registrationDate: string | null;
    applicationStatus: string;
    applicationStatusId: number;  // 1-5
    notes: string | null;
    documents: {
      id: number;
      type: string;    // 'NSS' | 'LICENSE' | 'CAR_INSURANCE' | 'INE' | 'CSF' | 'BANK_CLABE'
      name: string;
      number: string;
      status: string;  // 'Pendiente' | 'No legible' | 'Prevalidado' | 'Validado'
      link: string;
      issueDate: string | null;
      expireDate: string | null;
    }[];
    vehicle: {
      id: number;
      brand: string;
      model: string;
      year: number;
      plate: string;
      color: string;
      vin: string | null;
    } | null;
    totalCount: number;
  }[];
  total: number;
}
```

**POST `/applicant/{id}/proposals` — Request / Response**
```ts
// Request:
interface ICreateProposalDTO {
  applicantId: string;
  store: string;
  startTime: string;  // 'HH:mm'
  endTime: string;    // 'HH:mm'
}

// Response:
interface IProposalDTO {
  id: string;
  store: string;
  schedule: string;  // 'HH:mm - HH:mm'
  sentAt: string;    // ISO datetime
  status: 'Active' | 'Accepted' | 'Rejected' | 'Expired';
  expiresIn: number; // ms
  respondedAt?: string;
}
```

### Swap mock → API (servicios pendientes)

El `ApiApplicantsRepository` ya tiene los métodos con llamada real + fallback mock en el `catch`.
Para activar sin fallback cuando el backend esté estable, eliminar el bloque `catch` de mock:

```ts
// Antes (con fallback):
async getApplicantById(id: string): Promise<IResultApi<IApplicantDetailDTO>> {
  try {
    const response = await this.httpClient.get<IApplicantDetailDTO>(API_ENDPOINTS.APPLICANT_BY_ID(id));
    return { success: true, data: response.data };
  } catch {
    return { success: true, data: getMockApplicantDetail(id) }; // ← eliminar
  }
}

// Después (API real):
async getApplicantById(id: string): Promise<IResultApi<IApplicantDetailDTO>> {
  try {
    const response = await this.httpClient.get<IApplicantDetailDTO>(API_ENDPOINTS.APPLICANT_BY_ID(id));
    return { success: true, data: response.data };
  } catch (error) {
    const fetchError = error instanceof FetchError ? error : null;
    return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? 'Error' } };
  }
}
```

---

## Módulo: drivers

**Repositorio Mock:** `modules/drivers/infrastructure/repositories/mock-drivers.repository.ts`  
**Repositorio API:** `modules/drivers/infrastructure/repositories/api-drivers.repository.ts`  
**DI:** `modules/drivers/infrastructure/dependency-injection.ts`  
**Patrón:** Coexistente — `mockRepository` y `apiRepository` instanciados por separado.
Todos los use cases apuntan a `mockRepository` porque el backend (`DriverController.cs`)
devuelve datos hardcodeados en C#, sin BD real.

> **Swap:** Cambiar `mockRepository → apiRepository` por use case en el DI cuando el backend implemente BD real.

### Servicios

| # | Estado | Método | Endpoint | Descripción |
|---|--------|--------|----------|-------------|
| 1 | 🟡 MOCK | `GET` | `/api/v1/driver` | Lista paginada de conductores |
| 2 | 🟡 MOCK | `GET` | `/api/v1/driver/{id}` | Detalle de conductor |
| 3 | 🟡 MOCK | `PUT` | `/api/v1/driver/{id}` | Actualizar conductor |
| 4 | 🟡 MOCK | `DELETE` | `/api/v1/driver/{id}` | Eliminar conductor |
| 5 | 🟡 MOCK | `GET` | `/api/v1/driver/export/{format}` | Exportar lista (`csv` / `xlsx`) |
| 6 | 🟡 MOCK | `GET` | `/api/v1/driver/{id}/documents` | Documentos del conductor |
| 7 | 🟡 MOCK | `PUT` | `/api/v1/driver/{id}/documents/{type}` | Actualizar documento |
| 8 | 🟡 MOCK | `GET` | `/api/v1/driver/{id}/orders` | Órdenes del conductor |
| 9 | 🟡 MOCK | `GET` | `/api/v1/driver/{id}/payments` | Pagos semanales del conductor |
| 10 | 🟡 MOCK | `PUT` | `/api/v1/driver/{id}/status` | Cambiar estatus del conductor |
| 11 | 🟡 MOCK | `POST` | `/api/v1/driver/{id}/document/{type}` | Subir documento (multipart) |
| 12 | 🟡 MOCK | `GET` | `/api/v1/driver/expired-documents` | Lista de documentos vencidos |
| 13 | 🟡 MOCK | `GET` | `/api/v1/driver/expired-documents/export/{format}` | Exportar documentos vencidos |

### DTOs

**GET `/driver` — Query params `IDriverFiltersDTO`**
```ts
interface IDriverFiltersDTO {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search?: string;
  driverStatus?: string[];   // → backend recibe como CSV: 'ACTIVE,INACTIVE'
  stateOfCountry?: string;
  lastOrderStore?: string;
}
```

**GET `/driver` — Response**
```ts
{
  items: IDriverListItemDTO[];
  total: number;
}

interface IDriverListItemDTO {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName?: string;
  phone: string;
  email: string;
  curp: string;           // RFC NO está en lista — solo en detalle
  driverStatus: string;   // 'Enabled' | 'Suspended' | 'Disabled'
  stateOfCountry?: string;
  lastOrderStore?: string;
  lastOrderDate?: string; // ISO datetime
}
```

**GET `/driver/{id}` — Response `IDriverDetailDTO`** (ver `modules/drivers/domain/contracts/driver-detail.dto.ts`)
```ts
// Campos principales:
interface IDriverDetailDTO {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName?: string;
  phone: string;
  email: string;
  rfc: string;            // RFC solo en detalle
  curp: string;
  nss: string;
  driverStatus: string;
  gender: string;
  birthDate: string;
  nationality: string;
  // dirección, datos fiscales, vehículo, beneficiarios...
  // ver DTO completo en el archivo referenciado
}
```

**PUT `/driver/{id}/status` — Request**
```ts
interface IChangeDriverStatusInputDTO {
  driverId: string;
  status: string;    // 'Enabled' | 'Suspended' | 'Disabled'
  reason?: string;
}
```

**POST `/driver/{id}/document/{type}` — Request (multipart/form-data)**
```ts
interface IUploadDocumentInputDTO {
  driverId: string;
  documentType: string;  // 'NSS' | 'LICENSE' | 'CAR_INSURANCE' | 'INE' | 'CSF' | 'BANK_CLABE'
  file: File;
  issueDate?: string;    // ISO date
  expireDate?: string;   // ISO date
}
```

**GET `/driver/{id}/payments` — Query params**
```ts
{
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  year?: number;
  week?: number;
}
```

---

## Módulo: payments

**Repositorio Mock:** `modules/payments/infrastructure/repositories/mock-payments.repository.ts`  
**Repositorio API:** `modules/payments/infrastructure/repositories/api-payments.repository.ts`  
**DI:** `modules/payments/infrastructure/dependency-injection.ts`  
**Patrón:** Coexistente — `mockRepository` y `apiRepository` instanciados por separado.
No existe `PaymentsController` en el backend — todo en mock excepto `getStores`.

> **Swap por use case:** en el DI cambiar `mockRepository → apiRepository` + implementar la llamada
> real en `ApiPaymentsRepository` (quitar el `throw` del método correspondiente).

### Servicios

| # | Estado | Método | Endpoint | Descripción |
|---|--------|--------|----------|-------------|
| 1 | ✅ REAL | `GET` | `/api/v1/catalogs/stores` | Lista de tiendas |
| 2 | 🟡 MOCK | `GET` | `/api/v1/payments/orders` | Lista paginada de órdenes |
| 3 | 🟡 MOCK | `GET` | `/api/v1/payments/orders/{id}` | Detalle de orden |
| 4 | 🟡 MOCK | `GET` | `/api/v1/payments/orders/export/{format}` | Exportar órdenes |
| 5 | 🟡 MOCK | `GET` | `/api/v1/payments/bonuses` | Lista de bonos |
| 6 | 🟡 MOCK | `GET` | `/api/v1/payments/bonuses/{id}` | Detalle de bono |
| 7 | 🟡 MOCK | `POST` | `/api/v1/payments/bonuses` | Crear bono |
| 8 | 🟡 MOCK | `PUT` | `/api/v1/payments/bonuses/{id}` | Actualizar bono |
| 9 | 🟡 MOCK | `GET` | `/api/v1/payments/bonuses/export/{format}` | Exportar bonos |
| 10 | 🟡 MOCK | `GET` | `/api/v1/payments/adjustments` | Lista de ajustes |
| 11 | 🟡 MOCK | `GET` | `/api/v1/payments/adjustments/{id}` | Detalle de ajuste |
| 12 | 🟡 MOCK | `POST` | `/api/v1/payments/adjustments` | Crear ajuste |
| 13 | 🟡 MOCK | `PUT` | `/api/v1/payments/adjustments/{id}` | Actualizar ajuste |
| 14 | 🟡 MOCK | `GET` | `/api/v1/payments/adjustments/export/{format}` | Exportar ajustes |
| 15 | 🟡 MOCK | `GET` | `/api/v1/payments/daily-summaries` | Resúmenes diarios |
| 16 | 🟡 MOCK | `GET` | `/api/v1/payments/daily-summaries/{id}` | Detalle resumen diario |
| 17 | 🟡 MOCK | `GET` | `/api/v1/payments/daily-summaries/export/{format}` | Exportar resúmenes diarios |
| 18 | 🟡 MOCK | `GET` | `/api/v1/payments/weekly-summaries` | Resúmenes semanales |
| 19 | 🟡 MOCK | `GET` | `/api/v1/payments/weekly-summaries/{id}` | Detalle resumen semanal |
| 20 | 🟡 MOCK | `GET` | `/api/v1/payments/weekly-summaries/export/{format}` | Exportar resúmenes semanales |

### DTOs

**GET `/catalogs/stores` — Response**
```ts
interface IStoreDTO {
  value: string;  // ID de tienda
  label: string;  // Nombre de tienda
}
```

**GET `/payments/orders` — Query params `IOrderFiltersDTO`**
```ts
interface IOrderFiltersDTO {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search?: string;    // RFC del conductor
  store?: string;
  dateFrom?: string;  // ISO date
  dateTo?: string;    // ISO date
  status?: string;
}
```

**GET `/payments/bonuses` — Query params `IBonusFiltersDTO`**
```ts
interface IBonusFiltersDTO {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search?: string;
  store?: string;
  dateFrom?: string;
  dateTo?: string;
  bonusType?: string;
}
```

**POST `/payments/bonuses` — Request `ICreateBonusDTO`**
```ts
interface ICreateBonusDTO {
  driverId: string;
  store: string;
  amount: number;
  bonusType: string;
  reason?: string;
  appliedDate: string;  // ISO date
}
```

**POST `/payments/adjustments` — Request `ICreateAdjustmentDTO`**
```ts
interface ICreateAdjustmentDTO {
  driverId: string;
  store: string;
  amount: number;         // positivo = cargo, negativo = abono
  adjustmentType: string;
  reason?: string;
  appliedDate: string;    // ISO date
}
```

### Swap mock → API

```ts
// modules/payments/infrastructure/dependency-injection.ts

// 1. Cambiar mockRepository → apiRepository en el use case:
getOrders: new GetOrdersUseCase(apiRepository),  // era mockRepository

// 2. En ApiPaymentsRepository, implementar la llamada real (quitar el throw):
async getOrders(filters: IOrderFiltersDTO): Promise<IResultApi<...>> {
  // reemplazar el throw por:
  const queryParams = { /* mapear filters */ };
  const response = await this.httpClient.get(API_ENDPOINTS.PAYMENT_ORDERS, { queryParams });
  return { success: true, data: response.data };
}
```

---

## Módulo: capacitacion

**Repositorio Mock:** `modules/capacitacion/infrastructure/repositories/mock-training.repository.ts`  
**Repositorio API:** `modules/capacitacion/infrastructure/repositories/api-training.repository.ts`  
**DI:** `modules/capacitacion/infrastructure/dependency-injection.ts`  
**Patrón:** Coexistente — `mockRepository` y `apiRepository` instanciados por separado.
No existe controller de capacitación en el backend — todo en mock.

> **Swap por use case:** en el DI cambiar `mockRepository → apiRepository`. El `ApiTrainingRepository`
> ya tiene todos los métodos implementados con llamadas reales al `httpClient` — solo hay que apuntar el use case.
> Nota: los toasts de éxito/error están en `MockTrainingRepository`. Al hacer el swap, moverlos al hook o use case correspondiente.

### Servicios

| # | Estado | Método | Endpoint | Descripción |
|---|--------|--------|----------|-------------|
| 1 | 🟡 MOCK | `GET` | `/api/v1/training` | Lista paginada de capacitaciones |
| 2 | 🟡 MOCK | `GET` | `/api/v1/training/{id}` | Detalle de capacitación |
| 3 | 🟡 MOCK | `POST` | `/api/v1/training` | Crear capacitación |
| 4 | 🟡 MOCK | `PUT` | `/api/v1/training/{id}` | Actualizar capacitación |
| 5 | 🟡 MOCK | `POST` | `/api/v1/training/{id}/send` | Enviar capacitación (email / link / push) |
| 6 | 🟡 MOCK | `GET` | `/api/v1/training/export/{format}` | Exportar lista de capacitaciones |
| 7 | 🟡 MOCK | `GET` | `/api/v1/training/{id}/progress` | Progreso de conductores |
| 8 | 🟡 MOCK | `GET` | `/api/v1/training/{id}/progress/export/{format}` | Exportar progreso |

### DTOs

**GET `/training` — Query params `ITrainingFiltersDTO`**
```ts
interface ITrainingFiltersDTO {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search?: string;
}
```

**GET `/training` — Response item `ITrainingListItemDTO`**
```ts
interface ITrainingListItemDTO {
  trainingId: string;
  title: string;
  trainingType: 'Mandatory' | 'Optional' | 'CompanyPolicy';
  createdAt: string;  // ISO datetime
}
```

**GET `/training/{id}` — Response `ITrainingDetailDTO`**
```ts
interface ITrainingDetailDTO extends ITrainingListItemDTO {
  content: string;         // HTML del editor WYSIWYG (Quill)
  documentUrl?: string;
  hasQuiz: boolean;
  questions?: IQuestionDTO[];
  minimumScore?: number;   // 0-100, requerido si hasQuiz = true
  createdBy: string;
  isOnboarding?: boolean;
}

interface IQuestionDTO {
  questionIndex: number;
  questionText: string;
  options: { optionIndex: number; text: string }[];
  correctOption: number;
}
```

**POST `/training` — Request `ICreateTrainingDTO`**
```ts
interface ICreateTrainingDTO {
  title: string;
  trainingType: 'Mandatory' | 'Optional' | 'CompanyPolicy';
  content: string;
  documentUrl?: string;
  hasQuiz: boolean;
  questions?: IQuestionDTO[];
  minimumScore?: number;
  isOnboarding?: boolean;
}
```

**POST `/training/{id}/send` — Request `ISendTrainingDTO`**
```ts
interface ISendTrainingDTO {
  trainingId: string;
  sendType: 'Individual' | 'Group' | 'Mass';
  recipientEmails?: string[];  // requerido si sendType = 'Individual'
}
```

**GET `/training/{id}/progress` — Response `ITrainingProgressDTO[]`**
```ts
interface ITrainingProgressDTO {
  progressId: string;
  trainingId: string;
  driverName: string;
  driverId: string;
  answersCount: number;
  correctAnswers: number;
  responseDate: string;  // ISO datetime
}
```

### Swap mock → API

```ts
// modules/capacitacion/infrastructure/dependency-injection.ts

// ApiTrainingRepository ya está instanciado como apiRepository.
// Solo cambiar mockRepository → apiRepository por use case:
getTrainings:    new GetTrainingsUseCase(apiRepository),    // era mockRepository
getTrainingById: new GetTrainingByIdUseCase(apiRepository), // era mockRepository
// ...etc
```

---

## Módulo: registro / OTP

**Repositorio:** `modules/registro/`  
**Patrón:** Siempre API real.

### Servicios

| # | Estado | Método | Endpoint | Descripción |
|---|--------|--------|----------|-------------|
| 1 | ✅ REAL | `GET` | `/api/v1/register/states` | Estados de la República |
| 2 | ✅ REAL | `POST` | `/api/v1/otp/send-sms` | Enviar OTP por SMS |
| 3 | ✅ REAL | `POST` | `/api/v1/otp/validate-sms` | Validar OTP de SMS |
| 4 | ✅ REAL | `POST` | `/api/v1/otp/send-email` | Enviar OTP por email |
| 5 | ✅ REAL | `POST` | `/api/v1/otp/validate-email` | Validar OTP de email |

### DTOs

```ts
// POST /otp/send-sms
{ phone: string }                  // formato: '52XXXXXXXXXX'

// POST /otp/validate-sms
{ phone: string; otp: string }

// POST /otp/send-email
{ email: string }

// POST /otp/validate-email
{ email: string; otp: string }

// GET /register/states → IStateDTO[]
interface IStateDTO {
  value: number;  // ID numérico del estado
  label: string;
}
```

---

## Catálogos compartidos

Definidos en `modules/shared/domain/contracts/api-endpoints.constants.ts`.
Todos con BD real en el backend (`CatalogsController` usa `IMessageBus` → Wolverine).

| Estado | Método | Endpoint | Usado en |
|--------|--------|----------|----------|
| ✅ REAL | `GET` | `/api/v1/catalogs/stores` | payments |
| ✅ REAL | `GET` | `/api/v1/catalogs/cities` | aspirantes, drivers |
| ✅ REAL | `GET` | `/api/v1/catalogs/states` | registro |
| ✅ REAL | `GET` | `/api/v1/catalogs/banks` | drivers |
| ✅ REAL | `GET` | `/api/v1/catalogs/fiscal-regimes` | drivers |
| ✅ REAL | `GET` | `/api/v1/catalogs/car-brands` | aspirantes, drivers |
| ✅ REAL | `GET` | `/api/v1/catalogs/car-models?carBrandId={id}` | aspirantes, drivers |
| ✅ REAL | `GET` | `/api/v1/catalogs/genders` | drivers |
| ✅ REAL | `GET` | `/api/v1/catalogs/driver-statuses` | drivers |
| ✅ REAL | `GET` | `/api/v1/catalogs/application-statuses` | aspirantes |
| ✅ REAL | `GET` | `/api/v1/catalogs/document-statuses?filtered={bool}` | drivers |
| 🟡 MOCK | `GET` | `/api/v1/catalogs/nationalities` | drivers — sin endpoint real aún |

**Response estándar:**
```ts
Array<{ value: string | number; label: string }>
```

---

## Cómo hacer el swap mock → API

### Patrón coexistente (drivers, payments, capacitacion)

Todos estos módulos siguen el mismo patrón en su `dependency-injection.ts`:

```ts
export function createMiModuloModule(toastContext?: IToastContext) {
  const httpClient = new FetchHttpClient(process.env.NEXT_PUBLIC_API_URL ?? '', { ... });
  const mockRepository = new MockMiModuloRepository(toastContext);
  const apiRepository  = new ApiMiModuloRepository(httpClient);

  return {
    useCases: {
      // 🟡 Cambiar mockRepository → apiRepository cuando el backend esté listo:
      getItems:   new GetItemsUseCase(mockRepository),
      getItemById: new GetItemByIdUseCase(mockRepository),
      // ✅ Ya conectado:
      getCatalogs: new GetCatalogsUseCase(apiRepository),
    },
  };
}
```

**Pasos para activar un endpoint:**
1. En el `ApiRepository` del módulo, reemplazar el `throw new Error(...)` del método por la llamada real al `httpClient`.
2. En `dependency-injection.ts`, cambiar `mockRepository → apiRepository` en el use case correspondiente.
3. Los toasts de éxito/error que estaban en `MockRepository` deben moverse al hook o use case al hacer el swap (los mocks los tienen integrados; el API repo solo propaga errores).

### Patrón aspirantes (API-first con fallback)

El `ApiApplicantsRepository` intenta la llamada real y cae al mock en el `catch`.
Para eliminar el fallback cuando el endpoint esté estable: quitar el bloque `catch` de mock
y devolver `{ success: false, error: ... }` en su lugar.

### Variables de entorno

```env
NEXT_PUBLIC_API_URL=https://api.spidi.heb.com  # Base URL del backend
```

---

*Última actualización: 2026-05-19. Para mantener actualizado: revisar `api-endpoints.constants.ts`,
`api-*.repository.ts` y `dependency-injection.ts` de cada módulo.*
