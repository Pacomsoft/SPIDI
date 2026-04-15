'use client';

import { DeniedView } from '@/modules/denied/application/presentation/views/denied.view';
import { createDeniedModule } from '@/modules/denied/infrastructure/dependency-injection';

const { navigation } = createDeniedModule();

export function DeniedClient() {
  return <DeniedView navigation={navigation} />;
}
