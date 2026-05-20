export const API_ENDPOINTS = {
  // Drivers
  DRIVER: '/api/v1/driver',
  DRIVER_BY_ID: (id: string) => `/api/v1/driver/${id}`,
  DRIVER_EXPORT: (format: string) => `/api/v1/driver/export/${format}`,
  DRIVER_CHECK_DUPLICATE: '/api/v1/driver/check-duplicate',
  // Applicants — ruta real del backend (plural)
  APPLICANT: '/api/v1/applicants',
  APPLICANT_BY_ID: (id: string) => `/api/v1/applicant/${id}`,   // mock — no implementado aún
  APPLICANT_EXPORT: (format: string) => `/api/v1/applicant/export/${format}`, // mock — no implementado aún
  // Catalogs — alineados con el backend real
  CATALOGS_CITIES: '/api/v1/catalogs/cities',              // ciudades donde operar (texto)
  CATALOGS_STATES: '/api/v1/catalogs/states',              // estados de la República (int)
  CATALOGS_BANKS: '/api/v1/catalogs/banks',
  CATALOGS_STORES: '/api/v1/catalogs/stores',
  CATALOGS_FISCAL_REGIMES: '/api/v1/catalogs/fiscal-regimes',
  CATALOGS_CAR_BRANDS: '/api/v1/catalogs/car-brands',      // marcas de auto (int)
  CATALOGS_CAR_MODELS: (carBrandId: number) => `/api/v1/catalogs/car-models?carBrandId=${carBrandId}`, // modelos por marca
  CATALOGS_GENDERS: '/api/v1/catalogs/genders',
  CATALOGS_DRIVER_STATUSES: '/api/v1/catalogs/driver-statuses',
  CATALOGS_APPLICATION_STATUSES: '/api/v1/catalogs/application-statuses',
  CATALOGS_DOCUMENT_STATUSES: (filtered: boolean) => `/api/v1/catalogs/document-statuses?filtered=${filtered}`,
  // Kept for backward-compat with mock screens (no backend yet)
  CATALOGS_VEHICLE_MAKES: '/api/v1/catalogs/car-brands',   // alias → car-brands
  CATALOGS_VEHICLE_MODELS: '/api/v1/catalogs/car-models',  // alias → car-models
  CATALOGS_NATIONALITIES: '/api/v1/catalogs/nationalities', // mock — no implementado aún
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
  // Driver status & documents
  DRIVER_CHANGE_STATUS: (id: string) => `/api/v1/driver/${id}/status`,
  DRIVER_UPLOAD_DOCUMENT: (id: string, documentType: string) => `/api/v1/driver/${id}/document/${documentType}`,
  DRIVER_EXPIRED_DOCUMENTS: '/api/v1/driver/expired-documents',
  DRIVER_EXPIRED_DOCUMENTS_EXPORT: (format: string) => `/api/v1/driver/expired-documents/export/${format}`,
  // Payments - Orders
  PAYMENT_ORDERS: '/api/v1/payments/orders',
  PAYMENT_ORDER_BY_ID: (id: string) => `/api/v1/payments/orders/${id}`,
  PAYMENT_ORDERS_EXPORT: (format: string) => `/api/v1/payments/orders/export/${format}`,
  // Payments - Bonuses
  PAYMENT_BONUSES: '/api/v1/payments/bonuses',
  PAYMENT_BONUS_BY_ID: (id: string) => `/api/v1/payments/bonuses/${id}`,
  PAYMENT_BONUSES_EXPORT: (format: string) => `/api/v1/payments/bonuses/export/${format}`,
  // Payments - Adjustments
  PAYMENT_ADJUSTMENTS: '/api/v1/payments/adjustments',
  PAYMENT_ADJUSTMENT_BY_ID: (id: string) => `/api/v1/payments/adjustments/${id}`,
  PAYMENT_ADJUSTMENTS_EXPORT: (format: string) => `/api/v1/payments/adjustments/export/${format}`,
  // Payments - Daily Summaries
  PAYMENT_DAILY_SUMMARIES: '/api/v1/payments/daily-summaries',
  PAYMENT_DAILY_SUMMARY_BY_ID: (id: string) => `/api/v1/payments/daily-summaries/${id}`,
  PAYMENT_DAILY_SUMMARIES_EXPORT: (format: string) => `/api/v1/payments/daily-summaries/export/${format}`,
  // Payments - Weekly Summaries
  PAYMENT_WEEKLY_SUMMARIES: '/api/v1/payments/weekly-summaries',
  PAYMENT_WEEKLY_SUMMARY_BY_ID: (id: string) => `/api/v1/payments/weekly-summaries/${id}`,
  PAYMENT_WEEKLY_SUMMARIES_EXPORT: (format: string) => `/api/v1/payments/weekly-summaries/export/${format}`,
  // Training
  TRAINING: '/api/v1/training',
  TRAINING_BY_ID: (id: string) => `/api/v1/training/${id}`,
  TRAINING_SEND: (id: string) => `/api/v1/training/${id}/send`,
  TRAINING_EXPORT: (format: string) => `/api/v1/training/export/${format}`,
  TRAINING_PROGRESS: (id: string) => `/api/v1/training/${id}/progress`,
  TRAINING_PROGRESS_EXPORT: (id: string, format: string) => `/api/v1/training/${id}/progress/export/${format}`,
} as const;
