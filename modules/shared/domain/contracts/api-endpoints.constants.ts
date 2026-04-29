export const API_ENDPOINTS = {
  // Drivers
  DRIVER: '/api/v1/driver',
  DRIVER_BY_ID: (id: string) => `/api/v1/driver/${id}`,
  DRIVER_EXPORT: (format: string) => `/api/v1/driver/export/${format}`,
  DRIVER_CHECK_DUPLICATE: '/api/v1/driver/check-duplicate',
  // Applicants
  APPLICANT: '/api/v1/applicant',
  APPLICANT_BY_ID: (id: string) => `/api/v1/applicant/${id}`,
  APPLICANT_EXPORT: (format: string) => `/api/v1/applicant/export/${format}`,
  // Catalogs
  CATALOGS_STATES: '/api/v1/catalogs/states',
  CATALOGS_BANKS: '/api/v1/catalogs/banks',
  CATALOGS_STORES: '/api/v1/catalogs/stores',
  CATALOGS_FISCAL_REGIMES: '/api/v1/catalogs/fiscal-regimes',
  CATALOGS_VEHICLE_MAKES: '/api/v1/catalogs/vehicle-makes',
  CATALOGS_VEHICLE_MODELS: '/api/v1/catalogs/vehicle-models',
  CATALOGS_GENDERS: '/api/v1/catalogs/genders',
  CATALOGS_NATIONALITIES: '/api/v1/catalogs/nationalities',
  CATALOGS_DRIVER_STATUSES: '/api/v1/catalogs/driver-statuses',
  CATALOGS_APPLICATION_STATUSES: '/api/v1/catalogs/application-statuses',
  // Login and Authorization
  ENTRA_ACCESS_URL: '/api/v1/authorization/entra-access',
  ME_URL: '/api/v1/authorization/me',
  REFRESH_URL: '/api/v1/authorization/token/refresh',
  LOGOUT_URL: '/api/v1/authorization/logout',
  // Registration
  REGISTRATION_STATES: '/api/v1/register/states',
  REGISTRATION_REQUEST_SMS: '/api/v1/otp/send-sms',
  REGISTRATION_VALIDATE_SMS: '/api/v1/otp/validate-sms',  
  REGISTRATION_REQUEST_EMAIL: '/api/v1/otp/send-email',
  REGISTRATION_VALIDATE_EMAIL: '/api/v1/otp/validate-email',
} as const;
