import type { IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';

export interface IDeleteApplicantUseCase
  extends IUseCase<string, IResultApi<void>> {}
