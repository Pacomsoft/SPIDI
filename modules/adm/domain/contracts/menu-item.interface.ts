import { type ModuleKey } from '@/modules/adm/domain/value-objects/module-access';

export interface IMenuItem {
  title: string;
  icon: string;
  url: string;
  visible: boolean;
  moduleKey: ModuleKey;
}
