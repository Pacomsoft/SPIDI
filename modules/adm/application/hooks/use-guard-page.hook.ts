import { usePathname } from "next/navigation";
import { type IMenuAccess } from "@/modules/login/domain/contracts/spidi-auth-service.interface";
import { ModuleAccess } from "@/modules/adm/domain/value-objects/module-access";
import { type IMenuItem } from "@/modules/adm/domain/contracts/menu-item.interface";

const GUID_SEGMENT =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMBER_SEGMENT = /\/\d+$/;
// Cubre IDs alfanuméricos con guiones que contienen al menos un dígito: asp-001, drv-123, DS-0001
// NO captura slugs de ruta como "resumenes-diarios" (solo letras, sin dígitos)
const ALPHANUMERIC_ID_SEGMENT = /\/[a-zA-Z0-9]*\d[a-zA-Z0-9-]*$/;

function stripTrailingSlash(path: string): string {
  return path.endsWith("/") ? path.substring(0, path.length - 1) : path;
}

function normalizePath(path: string): string {
  const cleaned = stripTrailingSlash(path);
  if (GUID_SEGMENT.test(cleaned)) return cleaned.replace(GUID_SEGMENT, "/[id]");
  if (NUMBER_SEGMENT.test(cleaned)) return cleaned.replace(NUMBER_SEGMENT, "/[id]");
  if (ALPHANUMERIC_ID_SEGMENT.test(cleaned)) return cleaned.replace(ALPHANUMERIC_ID_SEGMENT, "/[id]");
  return cleaned;
}

/**
 * Dado un path normalizado, retorna el path padre quitando el último segmento.
 * Ejemplo: /adm/aspirantes/[id] → /adm/aspirantes
 */
function getParentPath(path: string): string | null {
  const segments = path.split("/");
  if (segments.length <= 2) return null; // /adm o menos, no hay padre útil
  return segments.slice(0, -1).join("/");
}

interface IUseGuardPageResult {
  isAllowed: boolean;
  isLoading: boolean;
  allowedModules: IMenuItem[];
}

export function useGuardPage(
  menus: IMenuAccess[] | null,
  isLoading: boolean,
): IUseGuardPageResult {
  const pathname = usePathname();
  const normalizedPath = normalizePath(pathname);

  if (pathname === "/adm/") {
    // Base page is always allowed
    return { isAllowed: true, isLoading, allowedModules: [] };
  }

  const moduleAccess = ModuleAccess.create(menus ?? []);

  // Primero intenta match exacto; si falla, sube al padre (herencia de permisos)
  const parentPath = getParentPath(normalizedPath);
  const isAllowed =
    moduleAccess.canAccessRoute(normalizedPath) ||
    (parentPath !== null && moduleAccess.canAccessRoute(parentPath));

  const allowedModules: IMenuItem[] = (menus ?? [])
    .filter((m) => m.canView)
    .map((m) => ({
      title: m.label,
      icon: m.icon,
      url: m.path,
      visible: m.displayMenu,
      moduleKey: m.code,
    }));

  return { isAllowed, isLoading, allowedModules };
}
