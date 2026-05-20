import { type IMenuAccess } from '@/modules/shared/domain/contracts/menu-access.dto';
import { type IMenuItem } from '@/modules/shared/domain/contracts/menu-item.interface';

export type ModuleKey = string;

export enum PermissionAction {
  View = 'view',
  Create = 'create',
  Edit = 'edit',
  Delete = 'delete',
}

interface IModuleAccessSchema {
  readonly menus: IMenuAccess[];
}

export class ModuleAccess {
  private constructor(private readonly _entity: IModuleAccessSchema) {}

  static create(menus: IMenuAccess[]): ModuleAccess {
    return new ModuleAccess({ menus });
  }

  private _hasPermission(m: IMenuAccess, action: PermissionAction): boolean {
    switch (action) {
      case PermissionAction.Create: return m.canCreate;
      case PermissionAction.Edit:   return m.canEdit;
      case PermissionAction.Delete: return m.canDelete;
      case PermissionAction.View:
      default:                      return m.canView;
    }
  }

  canAccess(code: string, action: PermissionAction = PermissionAction.View): boolean {
    return this._entity.menus.some(m => m.code === code && this._hasPermission(m, action));
  }

  canAccessRoute(path: string): boolean {
    return this._entity.menus.some(m => m.path === path && m.canView);
  }

  getAllowedModules(action: PermissionAction = PermissionAction.View): IMenuItem[] {
    return this._entity.menus
      .filter(m => this._hasPermission(m, action))
      .map(m => ({
        title: m.label,
        icon: m.icon,
        url: m.path,
        visible: m.displayMenu,
        moduleKey: m.code,
      }));
  }
}
