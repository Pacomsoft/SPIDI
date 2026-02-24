"use client"

import { useRouter } from "next/navigation"
import { Role } from "./roles"

const SESSION_KEY = "spidi_session"
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 horas en milisegundos

interface Session {
  userId: string
  userName: string
  userRole: string
  role: Role // Role tipado del sistema
  expiresAt: number
}

export const authProvider = {
  /**
   * Inicia el proceso de login SSO
   * TODO: Integrar App Directory redirect
   * TODO: Recibir callback con token de App Directory
   */
  startLogin: async (): Promise<void> => {
    // Simular delay de redirección a App Directory
    await new Promise((resolve) => setTimeout(resolve, 600))

    // Crear sesión mock con rol por defecto
    const session: Session = {
      userId: "mock-user-123",
      userName: "Juan Pérez",
      userRole: "Admin. de Operaciones",
      role: "ADMIN_OPERACIONES", // Rol por defecto para demostración
      expiresAt: Date.now() + SESSION_DURATION,
    }

    // Guardar en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }

    // TODO: En producción, esto será reemplazado por el redirect a App Directory
    // window.location.href = process.env.NEXT_PUBLIC_APP_DIRECTORY_URL
  },

  /**
   * Cierra la sesión actual
   */
  logout: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY)
    }
  },

  /**
   * Obtiene la sesión actual
   */
  getSession: (): Session | null => {
    if (typeof window === "undefined") {
      return null
    }

    const sessionStr = localStorage.getItem(SESSION_KEY)
    if (!sessionStr) {
      return null
    }

    try {
      const session: Session = JSON.parse(sessionStr)

      // Verificar si la sesión expiró
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }

      return session
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },

  /**
   * Verifica si hay una sesión válida
   */
  isAuthenticated: (): boolean => {
    return authProvider.getSession() !== null
  },

  /**
   * Renueva la sesión extendiendo su expiración
   */
  renewSession: (): void => {
    const session = authProvider.getSession()
    if (session) {
      session.expiresAt = Date.now() + SESSION_DURATION
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      }
    }
  },

  /**
   * Obtiene el rol actual del usuario
   */
  getRole: (): Role | null => {
    const session = authProvider.getSession()
    return session?.role ?? null
  },

  /**
   * Cambia el rol del usuario (solo para modo demo)
   * @param role - Nuevo rol a asignar
   */
  setRole: (role: Role): void => {
    const session = authProvider.getSession()
    if (session && typeof window !== "undefined") {
      session.role = role
      // También actualizar el userRole descriptivo
      const roleDescriptions: Record<Role, string> = {
        ADMIN_TI: "Administrador de TI",
        ADMIN_OPERACIONES: "Administrador de Operaciones",
        FINANZAS: "Finanzas",
        RH: "Recursos Humanos",
      }
      session.userRole = roleDescriptions[role]
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
  },
}
