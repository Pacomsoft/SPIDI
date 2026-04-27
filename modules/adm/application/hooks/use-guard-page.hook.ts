import { usePathname } from "next/navigation";
import { type IMenuAccess } from "@/modules/login/domain/contracts/spidi-auth-service.interface";
import { ModuleAccess } from "@/modules/adm/domain/value-objects/module-access";
import { type IMenuItem } from "@/modules/adm/domain/contracts/menu-item.interface";

const GUID_SEGMENT =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMBER_SEGMENT = /\/\d+$/;

function normalizePath(path: string): string {
  if (GUID_SEGMENT.test(path)) return path.replace(GUID_SEGMENT, "/[id]");
  if (NUMBER_SEGMENT.test(path)) return path.replace(NUMBER_SEGMENT, "/[id]");
  return path.endsWith("/") ? path.substring(0, path.length - 1) : path;
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
  const isAllowed = moduleAccess.canAccessRoute(normalizedPath);

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
