import { FetchHttpClient } from '@/modules/shared/infrastructure/http-client/fetch-http-client';
import { type IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import { type IToastContext } from '@/modules/shared/domain/contracts/toast.interface';
import {
  createConfiguracionRepository,
  createIdempotencyRepository,
  createTokenRepository,
} from '@/modules/shared/infrastructure/dependency-injection';
import { ApiDriversRepository } from './repositories/api-drivers.repository';
import { type IDriverRepository } from '../domain/contracts/driver-repository.interface';
import { GetDriversUseCase } from '../application/use-cases/get-drivers.use-case';
import { GetDriverByIdUseCase } from '../application/use-cases/get-driver-by-id.use-case';
import { UpdateDriverUseCase } from '../application/use-cases/update-driver.use-case';
import { DeleteDriverUseCase } from '../application/use-cases/delete-driver.use-case';
import { ExportDriversUseCase } from '../application/use-cases/export-drivers.use-case';
import { GetDriverCatalogsUseCase } from '../application/use-cases/get-driver-catalogs.use-case';
import { GetDriverOrdersUseCase } from '../application/use-cases/get-driver-orders.use-case';
import { GetDriverPaymentsUseCase } from '../application/use-cases/get-driver-payments.use-case';
import { type IGetDriversUseCase } from '../domain/contracts/get-drivers-use-case.interface';
import { type IGetDriverByIdUseCase } from '../domain/contracts/get-driver-by-id-use-case.interface';
import { type IUpdateDriverUseCase } from '../domain/contracts/update-driver-use-case.interface';
import { type IDeleteDriverUseCase } from '../domain/contracts/delete-driver-use-case.interface';
import { type IExportDriversUseCase } from '../domain/contracts/export-drivers-use-case.interface';
import { type IGetDriverCatalogsUseCase } from '../domain/contracts/get-driver-catalogs-use-case.interface';
import { type IGetDriverOrdersUseCase } from '../domain/contracts/get-driver-orders-use-case.interface';
import { type IGetDriverPaymentsUseCase } from '../domain/contracts/get-driver-payments-use-case.interface';

export function createDriversHttpClient(toastContext?: IToastContext): IHttpClient {
  return new FetchHttpClient('', {
    configuracionRepository: createConfiguracionRepository(),
    idempotencyRepository: createIdempotencyRepository(),
    tokenRepository: createTokenRepository(),
    toastContext,
  });
}

export function createDriversRepository(httpClient: IHttpClient): IDriverRepository {
  return new ApiDriversRepository(httpClient);
}

export function createDriversModule(toastContext?: IToastContext) {
  const httpClient = createDriversHttpClient(toastContext);
  const repository = createDriversRepository(httpClient);
  return {
    repository,
    useCases: {
      getDrivers: new GetDriversUseCase(repository) as IGetDriversUseCase,
      getDriverById: new GetDriverByIdUseCase(repository) as IGetDriverByIdUseCase,
      updateDriver: new UpdateDriverUseCase(repository) as IUpdateDriverUseCase,
      deleteDriver: new DeleteDriverUseCase(repository) as IDeleteDriverUseCase,
      exportDrivers: new ExportDriversUseCase(repository) as IExportDriversUseCase,
      getCatalogs: new GetDriverCatalogsUseCase(repository) as IGetDriverCatalogsUseCase,
      getOrders: new GetDriverOrdersUseCase(repository) as IGetDriverOrdersUseCase,
      getPayments: new GetDriverPaymentsUseCase(repository) as IGetDriverPaymentsUseCase,
    },
  };
}
