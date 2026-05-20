import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IDocumentDTO } from './driver-detail.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IGetDriverDocumentsUseCase extends IUseCase<string, IResultApi<IDocumentDTO[]>> {}
