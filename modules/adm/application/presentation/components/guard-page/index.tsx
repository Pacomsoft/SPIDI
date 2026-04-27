'use client';

import { useModuleAccessContext } from '@/modules/adm/application/presentation/components/guard-page/module-access.context';
import { DeniedView } from '@/modules/denied/application/presentation/views/denied.view';
import { createDeniedModule } from '@/modules/denied/infrastructure/dependency-injection';

interface IGuardPageProps {
  children: React.ReactNode;
}

const deniedModule = createDeniedModule();

export function GuardPage({ children }: IGuardPageProps) {
  const { isAllowed, isLoading } = useModuleAccessContext();

  if (isLoading) return null;

  if (!isAllowed) return <DeniedView navigation={deniedModule.navigation} />;

  return <>{children}</>;
}
