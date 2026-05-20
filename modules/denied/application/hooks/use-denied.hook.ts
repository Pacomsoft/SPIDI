import { type IDeniedNavigation } from '../../domain/contracts/denied-navigation.interface';

interface IUseDeniedResult {
  goHome: () => void;
}

export function useDenied(navigation: IDeniedNavigation): IUseDeniedResult {
  const goHome = () => {
    navigation.goHome();
  };

  return { goHome };
}
