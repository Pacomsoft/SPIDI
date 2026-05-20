import { FetchHttpClient } from '@/modules/shared/infrastructure/http-client/fetch-http-client';
import { type IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import { type IToastContext } from '@/modules/shared/domain/contracts/toast.interface';
import {
  createConfiguracionRepository,
  createIdempotencyRepository,
  createTokenRepository,
} from '@/modules/shared/infrastructure/dependency-injection';
import { ApiPaymentsRepository } from './repositories/api-payments.repository';
import { MockPaymentsRepository } from './repositories/mock-payments.repository';
import { GetStoresUseCase } from '../application/use-cases/get-stores.use-case';
import { GetOrdersUseCase } from '../application/use-cases/get-orders.use-case';
import { GetOrderByIdUseCase } from '../application/use-cases/get-order-by-id.use-case';
import { ExportOrdersUseCase } from '../application/use-cases/export-orders.use-case';
import { GetBonusesUseCase } from '../application/use-cases/get-bonuses.use-case';
import { GetBonusByIdUseCase } from '../application/use-cases/get-bonus-by-id.use-case';
import { CreateBonusUseCase } from '../application/use-cases/create-bonus.use-case';
import { UpdateBonusUseCase } from '../application/use-cases/update-bonus.use-case';
import { ExportBonusesUseCase } from '../application/use-cases/export-bonuses.use-case';
import { GetAdjustmentsUseCase } from '../application/use-cases/get-adjustments.use-case';
import { GetAdjustmentByIdUseCase } from '../application/use-cases/get-adjustment-by-id.use-case';
import { CreateAdjustmentUseCase } from '../application/use-cases/create-adjustment.use-case';
import { UpdateAdjustmentUseCase } from '../application/use-cases/update-adjustment.use-case';
import { ExportAdjustmentsUseCase } from '../application/use-cases/export-adjustments.use-case';
import { GetDailySummariesUseCase } from '../application/use-cases/get-daily-summaries.use-case';
import { GetDailySummaryByIdUseCase } from '../application/use-cases/get-daily-summary-by-id.use-case';
import { ExportDailySummariesUseCase } from '../application/use-cases/export-daily-summaries.use-case';
import { GetWeeklySummariesUseCase } from '../application/use-cases/get-weekly-summaries.use-case';
import { GetWeeklySummaryByIdUseCase } from '../application/use-cases/get-weekly-summary-by-id.use-case';
import { ExportWeeklySummariesUseCase } from '../application/use-cases/export-weekly-summaries.use-case';

export function createPaymentsHttpClient(toastContext?: IToastContext): IHttpClient {
  return new FetchHttpClient(process.env.NEXT_PUBLIC_API_URL ?? '', {
    configuracionRepository: createConfiguracionRepository(),
    idempotencyRepository: createIdempotencyRepository(),
    tokenRepository: createTokenRepository(),
    toastContext,
  });
}

export function createPaymentsModule(toastContext?: IToastContext) {
  const httpClient = createPaymentsHttpClient(toastContext);

  // Repositorio para datos aún sin API real → mock en memoria
  const mockRepository = new MockPaymentsRepository();

  // Repositorio API → siempre conectado al backend real,
  // independientemente del ambiente (incluyendo local).
  // En local apunta a NEXT_PUBLIC_API_URL=https://localhost:7075
  const apiRepository = new ApiPaymentsRepository(httpClient);

  return {
    useCases: {
      // ── API real disponible → usa apiRepository ──────────────────────────
      getStores: new GetStoresUseCase(apiRepository),

      // ── Sin API real aún → usa mockRepository ────────────────────────────
      getOrders: new GetOrdersUseCase(mockRepository),
      getOrderById: new GetOrderByIdUseCase(mockRepository),
      exportOrders: new ExportOrdersUseCase(mockRepository),
      getBonuses: new GetBonusesUseCase(mockRepository),
      getBonusById: new GetBonusByIdUseCase(mockRepository),
      createBonus: new CreateBonusUseCase(mockRepository),
      updateBonus: new UpdateBonusUseCase(mockRepository),
      exportBonuses: new ExportBonusesUseCase(mockRepository),
      getAdjustments: new GetAdjustmentsUseCase(mockRepository),
      getAdjustmentById: new GetAdjustmentByIdUseCase(mockRepository),
      createAdjustment: new CreateAdjustmentUseCase(mockRepository),
      updateAdjustment: new UpdateAdjustmentUseCase(mockRepository),
      exportAdjustments: new ExportAdjustmentsUseCase(mockRepository),
      getDailySummaries: new GetDailySummariesUseCase(mockRepository),
      getDailySummaryById: new GetDailySummaryByIdUseCase(mockRepository),
      exportDailySummaries: new ExportDailySummariesUseCase(mockRepository),
      getWeeklySummaries: new GetWeeklySummariesUseCase(mockRepository),
      getWeeklySummaryById: new GetWeeklySummaryByIdUseCase(mockRepository),
      exportWeeklySummaries: new ExportWeeklySummariesUseCase(mockRepository),
    },
  };
}
