"use client"

import { IndexedDbSessionRepository } from "@/modules/login/infrastructure/repositories/indexed-db-session.repository"
import { type UserRoleValue } from "@/modules/login/domain/value-objects/user-role"

// Re-exportar Role para compatibilidad con componentes existentes
export type Role = UserRoleValue

const sessionRepository = new IndexedDbSessionRepository()

/** Call once on app boot (e.g. in protected-route or root layout) to hydrate in-memory cache */
export async function initSessionRepository(): Promise<void> {
  return sessionRepository.init()
}

export const authProvider = {
  logout: async (): Promise<void> => {
    await sessionRepository.clear()
  },

  getSession: () => {
    return sessionRepository.findCurrentSync()
      ? {
          userId: sessionRepository.findCurrentSync()!.userId,
          userName: sessionRepository.findCurrentSync()!.userName,
          userRole: sessionRepository.findCurrentSync()!.userRole,
          role: sessionRepository.findCurrentSync()!.role as Role,
          expiresAt: sessionRepository.findCurrentSync()!.expiresAt,
        }
      : null
  },

  isAuthenticated: (): boolean => {
    return sessionRepository.findCurrentSync() !== null
  },

  renewSession: async (): Promise<void> => {
    const session = sessionRepository.findCurrentSync()
    if (session) await sessionRepository.renew(session)
  },

  getRole: (): Role | null => {
    return (sessionRepository.findCurrentSync()?.role as Role) ?? null
  },

  setRole: async (role: Role): Promise<void> => {
    const session = sessionRepository.findCurrentSync()
    if (!session) return
    const descriptions: Record<Role, string> = {
      ADMIN_TI: "Administrador de TI",
      ADMIN_OPERACIONES: "Administrador de Operaciones",
      FINANZAS: "Finanzas",
      RH: "Recursos Humanos",
    }
    const updated = session.withRole(role, descriptions[role])
    await sessionRepository.save(updated)
  },
}


