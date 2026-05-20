import { FetchHttpClient } from '@/modules/shared/infrastructure/http-client/fetch-http-client';
import {
  createConfiguracionRepository,
  createIdempotencyRepository,
  createTokenRepository,
} from '@/modules/shared/infrastructure/dependency-injection';
import { MockTrainingRepository } from './repositories/mock-training.repository';
import { ApiTrainingRepository } from './repositories/api-training.repository';
import type { ITrainingRepository } from '../domain/contracts/training-repository.interface';
import type { IToastContext } from '@/modules/shared/domain/contracts/toast.interface';
import { GetTrainingsUseCase } from '../application/use-cases/get-trainings.use-case';
import { GetTrainingByIdUseCase } from '../application/use-cases/get-training-by-id.use-case';
import { CreateTrainingUseCase } from '../application/use-cases/create-training.use-case';
import { UpdateTrainingUseCase } from '../application/use-cases/update-training.use-case';
import { SendTrainingUseCase } from '../application/use-cases/send-training.use-case';
import { ExportTrainingsUseCase } from '../application/use-cases/export-trainings.use-case';
import { ExportTrainingProgressUseCase, GetTrainingProgressUseCase } from '../application/use-cases/export-training-progress.use-case';
import type { IGetTrainingsUseCase } from '../domain/contracts/get-trainings-use-case.interface';
import type { IGetTrainingByIdUseCase } from '../domain/contracts/get-training-by-id-use-case.interface';
import type { ICreateTrainingUseCase } from '../domain/contracts/create-training-use-case.interface';
import type { IUpdateTrainingUseCase } from '../domain/contracts/update-training-use-case.interface';
import type { ISendTrainingUseCase } from '../domain/contracts/send-training-use-case.interface';
import type { IExportTrainingsUseCase } from '../domain/contracts/export-trainings-use-case.interface';
import type { IExportTrainingProgressUseCase, IGetTrainingProgressUseCase } from '../domain/contracts/export-training-progress-use-case.interface';

export function createCapacitacionModule(toast?: IToastContext) {
  // Repositorio mock → datos en memoria, con toasts integrados, plug & play.
  // El backend de capacitación aún no tiene endpoints con BD real.
  const mockRepository: ITrainingRepository = new MockTrainingRepository(toast);

  // Repositorio API → esqueleto listo para activar cuando el backend implemente los endpoints.
  // Los toasts de éxito/error deben moverse del mock al hook/use-case al hacer el swap.
  // TO REPLACE por use case: cambiar mockRepository → apiRepository en el use case correspondiente.
  const httpClient = new FetchHttpClient(process.env.NEXT_PUBLIC_API_URL ?? '', {
    configuracionRepository: createConfiguracionRepository(),
    idempotencyRepository: createIdempotencyRepository(),
    tokenRepository: createTokenRepository(),
    toastContext: toast,
  });
  const apiRepository: ITrainingRepository = new ApiTrainingRepository(httpClient);

  // Suprime warning de variable no usada hasta que se active el primer endpoint real
  void apiRepository;

  return {
    useCases: {
      // ── Todo en mock por ahora (backend devuelve datos hardcodeados) ─────────
      // TO REPLACE individual: cambiar mockRepository → apiRepository por use case
      getTrainings:           new GetTrainingsUseCase(mockRepository)           as IGetTrainingsUseCase,
      getTrainingById:        new GetTrainingByIdUseCase(mockRepository)         as IGetTrainingByIdUseCase,
      createTraining:         new CreateTrainingUseCase(mockRepository)          as ICreateTrainingUseCase,
      updateTraining:         new UpdateTrainingUseCase(mockRepository)          as IUpdateTrainingUseCase,
      sendTraining:           new SendTrainingUseCase(mockRepository)            as ISendTrainingUseCase,
      exportTrainings:        new ExportTrainingsUseCase(mockRepository)         as IExportTrainingsUseCase,
      exportTrainingProgress: new ExportTrainingProgressUseCase(mockRepository)  as IExportTrainingProgressUseCase,
      getTrainingProgress:    new GetTrainingProgressUseCase(mockRepository)     as IGetTrainingProgressUseCase,
    },
  };
}
