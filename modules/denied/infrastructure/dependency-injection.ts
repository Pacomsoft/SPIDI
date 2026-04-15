import { type IDeniedNavigation } from '../domain/contracts/denied-navigation.interface';

export function createDeniedModule(): { navigation: IDeniedNavigation } {
  return {
    navigation: {
      goHome: () => {
        if (typeof window !== 'undefined') {
          window.location.href = '/adm/home';
        }
      },
    },
  };
}
