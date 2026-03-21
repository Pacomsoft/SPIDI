// Tipos de roles del sistema
export type Role =
  | "ADMIN_TI"
  | "ADMIN_OPERACIONES"
  | "FINANZAS"
  | "RH"

// Módulos del sistema
export type ModuleKey =
  | "ASPIRANTES"
  | "DRIVERS"
  | "PAGOS"
  | "COMUNICACION"
  | "CAPACITACION"
  | "CONTRATOS"

// Matriz de accesos por rol
const accessMatrix: Record<Role, ModuleKey[]> = {
  ADMIN_TI: [
    "ASPIRANTES",
    "DRIVERS",
    "PAGOS",
    "COMUNICACION",
    "CAPACITACION",
    "CONTRATOS",
  ],
  ADMIN_OPERACIONES: [
    "ASPIRANTES",
    "DRIVERS",
    "PAGOS",
    "COMUNICACION",
    "CAPACITACION",
    "CONTRATOS",
  ],
  FINANZAS: ["DRIVERS", "PAGOS"],
  RH: ["DRIVERS", "COMUNICACION", "CAPACITACION", "CONTRATOS"],
}

/**
 * Verifica si un rol tiene acceso a un módulo específico
 * @param role - Rol del usuario
 * @param moduleKey - Clave del módulo
 * @returns true si tiene acceso, false en caso contrario
 */
export function canAccessModule(role: Role, moduleKey: ModuleKey): boolean {
  return accessMatrix[role].includes(moduleKey)
}

/**
 * Obtiene todos los módulos permitidos para un rol
 * @param role - Rol del usuario
 * @returns Array de módulos permitidos
 */
export function getAllowedModules(role: Role): ModuleKey[] {
  return accessMatrix[role]
}

/**
 * Verifica si un rol tiene acceso total (ADMIN_TI)
 * @param role - Rol del usuario
 * @returns true si es ADMIN_TI
 */
export function isAdminTI(role: Role): boolean {
  return role === "ADMIN_TI"
}

/**
 * Obtiene la página principal (home) según el rol del usuario
 * @param role - Rol del usuario
 * @returns Ruta de la página principal
 */
export function getHomePageForRole(role: Role): string {
  const homePages: Record<Role, string> = {
    ADMIN_TI: "/adm/home",
    ADMIN_OPERACIONES: "/adm/home",
    FINANZAS: "/adm/pagos",
    RH: "/adm/capacitacion",
  }
  
  return homePages[role]
}
