import { FetchHttpClient } from '@/modules/shared/infrastructure/http-client/fetch-http-client';
import { type IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import { type IToastContext } from '@/modules/shared/domain/contracts/toast.interface';
import {
  createConfiguracionRepository,
  createIdempotencyRepository,
  createTokenRepository,
} from '@/modules/shared/infrastructure/dependency-injection';
import { ApiDriversRepository } from './repositories/api-drivers.repository';
import { MockDriversRepository } from './repositories/mock-drivers.repository';
import { type IDriverRepository } from '../domain/contracts/driver-repository.interface';
import { GetDriversUseCase } from '../application/use-cases/get-drivers.use-case';
import { GetDriverByIdUseCase } from '../application/use-cases/get-driver-by-id.use-case';
import { UpdateDriverUseCase } from '../application/use-cases/update-driver.use-case';
import { DeleteDriverUseCase } from '../application/use-cases/delete-driver.use-case';
import { ExportDriversUseCase } from '../application/use-cases/export-drivers.use-case';
import { GetDriverCatalogsUseCase } from '../application/use-cases/get-driver-catalogs.use-case';
import { GetDriverOrdersUseCase } from '../application/use-cases/get-driver-orders.use-case';
import { GetDriverPaymentsUseCase } from '../application/use-cases/get-driver-payments.use-case';
import { ChangeDriverStatusUseCase } from '../application/use-cases/change-driver-status.use-case';
import { UploadDocumentUseCase } from '../application/use-cases/upload-document.use-case';
import { GetExpiredDocumentsUseCase } from '../application/use-cases/get-expired-documents.use-case';
import { ExportExpiredDocumentsUseCase } from '../application/use-cases/export-expired-documents.use-case';
import { type IGetDriversUseCase } from '../domain/contracts/get-drivers-use-case.interface';
import { type IGetDriverByIdUseCase } from '../domain/contracts/get-driver-by-id-use-case.interface';
import { type IUpdateDriverUseCase } from '../domain/contracts/update-driver-use-case.interface';
import { type IDeleteDriverUseCase } from '../domain/contracts/delete-driver-use-case.interface';
import { type IExportDriversUseCase } from '../domain/contracts/export-drivers-use-case.interface';
import { type IGetDriverCatalogsUseCase } from '../domain/contracts/get-driver-catalogs-use-case.interface';
import { type IGetDriverOrdersUseCase } from '../domain/contracts/get-driver-orders-use-case.interface';
import { type IGetDriverPaymentsUseCase } from '../domain/contracts/get-driver-payments-use-case.interface';
import { type IChangeDriverStatusUseCase } from '../domain/contracts/change-driver-status-use-case.interface';
import { type IUploadDocumentUseCase } from '../domain/contracts/upload-document-use-case.interface';
import { GetDriverDocumentsUseCase } from '../application/use-cases/get-driver-documents.use-case';
import { type IGetDriverDocumentsUseCase } from '../domain/contracts/get-driver-documents-use-case.interface';
import { type IGetExpiredDocumentsUseCase } from '../domain/contracts/get-expired-documents-use-case.interface';
import { type IExportExpiredDocumentsUseCase } from '../domain/contracts/export-expired-documents-use-case.interface';

export function createDriversHttpClient(toastContext?: IToastContext): IHttpClient {
  return new FetchHttpClient(process.env.NEXT_PUBLIC_API_URL ?? '', {
    configuracionRepository: createConfiguracionRepository(),
    idempotencyRepository: createIdempotencyRepository(),
    tokenRepository: createTokenRepository(),
    toastContext,
  });
}

export function createDriversModule(toastContext?: IToastContext) {
  const httpClient = createDriversHttpClient(toastContext);

  // Repositorio mock → datos en memoria, plug & play.
  // El backend de drivers devuelve mockdata hardcodeada aún,
  // por lo que todo el módulo usa mock en el front.
  const mockRepository = new MockDriversRepository();

  // Repositorio API → listo para conectar cuando el backend tenga BD real.
  // Para activar un endpoint: cambiar mockRepository → apiRepository en el use case correspondiente.
  const apiRepository = new ApiDriversRepository(httpClient);

  return {
    useCases: {
      // ── Todo en mock por ahora (backend devuelve datos hardcodeados) ─────────
      // TO REPLACE individual: cambiar mockRepository → apiRepository por use case
      getDrivers:           new GetDriversUseCase(mockRepository)           as IGetDriversUseCase,
      getDriverById:        new GetDriverByIdUseCase(mockRepository)         as IGetDriverByIdUseCase,
      updateDriver:         new UpdateDriverUseCase(mockRepository)          as IUpdateDriverUseCase,
      deleteDriver:         new DeleteDriverUseCase(mockRepository)          as IDeleteDriverUseCase,
      exportDrivers:        new ExportDriversUseCase(mockRepository)         as IExportDriversUseCase,
      getCatalogs:          new GetDriverCatalogsUseCase(mockRepository)     as IGetDriverCatalogsUseCase,
      getOrders:            new GetDriverOrdersUseCase(mockRepository)       as IGetDriverOrdersUseCase,
      getPayments:          new GetDriverPaymentsUseCase(mockRepository)     as IGetDriverPaymentsUseCase,
      changeStatus:         new ChangeDriverStatusUseCase(mockRepository)    as IChangeDriverStatusUseCase,
      uploadDocument:       new UploadDocumentUseCase(mockRepository)        as IUploadDocumentUseCase,
      getExpiredDocuments:  new GetExpiredDocumentsUseCase(mockRepository)   as IGetExpiredDocumentsUseCase,
      exportExpiredDocuments: new ExportExpiredDocumentsUseCase(mockRepository) as IExportExpiredDocumentsUseCase,
      getDocuments:         new GetDriverDocumentsUseCase(mockRepository)    as IGetDriverDocumentsUseCase,
    },
  };
}
