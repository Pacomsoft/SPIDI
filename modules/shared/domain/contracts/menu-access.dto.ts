export interface IMenuAccess {
  label: string;
  code: string;
  icon: string;
  path: string;
  displayMenu: boolean;
  order: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface IRoleDto {
  name: string;
  label: string;
  description: string;
  menus: IMenuAccess[];
}
