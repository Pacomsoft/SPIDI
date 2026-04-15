'use client';

import { ConfirmacionView } from '@/modules/confirmacion/application/presentation/views/confirmacion.view';
import { createConfirmacionModule } from '@/modules/confirmacion/infrastructure/dependency-injection';

const { useCases } = createConfirmacionModule();

export function ConfirmacionClient() {
  return <ConfirmacionView getConfirmationUseCase={useCases.getConfirmation} />;
}
