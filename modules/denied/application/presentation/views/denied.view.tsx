'use client';

import { type IDeniedNavigation } from '../../../domain/contracts/denied-navigation.interface';
import { useDenied } from '../../hooks/use-denied.hook';
import { AccessDeniedCard } from '../components/access-denied-card';

interface IDeniedViewProps {
  navigation: IDeniedNavigation;
}

export function DeniedView({ navigation }: IDeniedViewProps) {
  const { goHome } = useDenied(navigation);

  return <AccessDeniedCard onGoHome={goHome} />;
}
