import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IExportExpiredDocumentsUseCase
  extends IUseCase<{ format: string }, IResultApi<Blob>> {}
