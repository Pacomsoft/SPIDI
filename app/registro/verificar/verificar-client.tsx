'use client';

import { IndexedDbConfiguracionRepository } from '@/modules/shared/infrastructure/configuracion/indexed-db-configuracion.repository';
import { VerificarView } from '@/modules/verificar/application/presentation/views/verificar.view';
import { createVerificarModule } from '@/modules/verificar/infrastructure/dependency-injection';

const configuracionRepository = new IndexedDbConfiguracionRepository();
const { useCases } = createVerificarModule(configuracionRepository);

export function VerificarClient() {
  return (
    <VerificarView
      verifyOtpUseCase={useCases.verifyOtp}
      resendOtpUseCase={useCases.resendOtp}
      submitRegistrationUseCase={useCases.submitRegistration}
    />
  );
}
