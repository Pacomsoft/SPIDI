import { type IDeniedNavigation } from '../../domain/contracts/denied-navigation.interface';

export class DeniedNavigationAdapter implements IDeniedNavigation {
  goHome(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/adm/home';
    }
  }
}
