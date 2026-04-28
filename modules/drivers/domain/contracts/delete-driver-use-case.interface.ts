import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';

export interface IDeleteDriverUseCase extends IUseCase<string, IResultApi<void>> {}
