import { useRouter } from 'next/navigation';
import { type IDeniedNavigation } from '../../domain/contracts/denied-navigation.interface';

interface IUseDeniedResult {
  goHome: () => void;
}

export function useDenied(navigation: IDeniedNavigation): IUseDeniedResult {
  const router = useRouter();

  const goHome = () => {
    router.push('/adm/home');
    navigation.goHome();
  };

  return { goHome };
}
