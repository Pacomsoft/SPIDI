import { type IDeniedNavigation } from '../domain/contracts/denied-navigation.interface';
import { DeniedNavigationAdapter } from './navigation/denied-navigation.adapter';

export function createDeniedModule(): { navigation: IDeniedNavigation } {
  return {
    navigation: new DeniedNavigationAdapter(),
  };
}
