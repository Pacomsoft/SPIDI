import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IExpiredDocumentItemDTO, IExpiredDocumentsFiltersDTO } from './expired-document.dto';

export interface IGetExpiredDocumentsUseCase
  extends IUseCase<IExpiredDocumentsFiltersDTO, IResultApi<{ items: IExpiredDocumentItemDTO[]; total: number }>> {}
