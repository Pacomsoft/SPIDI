import { type ModuleKey } from '@/modules/shared/domain/value-objects/module-access';

export interface IMenuItem {
  title: string;
  icon: string;
  url: string;
  visible: boolean;
  moduleKey: ModuleKey;
}
