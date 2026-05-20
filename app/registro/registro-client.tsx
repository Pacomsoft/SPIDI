'use client';

import { FetchHttpClient } from '@/modules/shared/infrastructure/http-client/fetch-http-client';
import { IndexedDbConfiguracionRepository } from '@/modules/shared/infrastructure/configuracion/indexed-db-configuracion.repository';
import { RegistroView } from '@/modules/registro/application/presentation/views/registro.view';
import { createRegistroModule } from '@/modules/registro/infrastructure/dependency-injection';

const configuracionRepository = new IndexedDbConfiguracionRepository();
const httpClient = new FetchHttpClient(process.env.NEXT_PUBLIC_API_URL ?? '', { configuracionRepository });
const { useCases, configuracionRepository: configRepo } = createRegistroModule(httpClient, configuracionRepository);

export function RegistroClient() {
  return (
    <RegistroView
      getStatesUseCase={useCases.getStates}
      requestVerificationCodeSmsUseCase={useCases.requestVerificationCodeSms}
      validateVerificationCodeSmsUseCase={useCases.validateVerificationCodeSms}
      requestVerificationCodeEmailUseCase={useCases.requestVerificationCodeEmail}
      validateVerificationCodeEmailUseCase={useCases.validateVerificationCodeEmail}
      guardarDriverUseCase={useCases.guardarDriver}
      checkDuplicateUseCase={useCases.checkDuplicate}
      configuracionRepository={configRepo}
    />
  );
}
