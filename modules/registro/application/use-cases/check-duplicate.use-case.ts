import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IRegisterRepository } from '../../domain/contracts/register-repository.interface';
import { type ICheckDuplicateResult } from '../../domain/contracts/check-duplicate-result.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface ICheckDuplicateInput {
  phoneNumber: string;
  email: string;
}

export class CheckDuplicateUseCase
  implements IUseCase<ICheckDuplicateInput, IResultApi<ICheckDuplicateResult>>
{
  constructor(private readonly registerRepository: IRegisterRepository) {}

  async execute(input: ICheckDuplicateInput): Promise<IResultApi<ICheckDuplicateResult>> {
    return this.registerRepository.checkDuplicate(input.phoneNumber, input.email);
  }
}
