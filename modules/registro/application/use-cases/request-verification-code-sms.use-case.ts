import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IRegisterRepository } from '../../domain/contracts/register-repository.interface';
import { type IVerificationResult } from '../../domain/contracts/verification-result.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export interface IRequestVerificationCodeSmsInput {
  formId: string;
  phoneNumber: string;
}

export class RequestVerificationCodeSmsUseCase
  implements IUseCase<IRequestVerificationCodeSmsInput, IResultApi<IVerificationResult>>
{
  constructor(private readonly registerRepository: IRegisterRepository) {}

  async execute(input: IRequestVerificationCodeSmsInput): Promise<IResultApi<IVerificationResult>> {
    return await this.registerRepository.requestVerificationCodeSMS(input.formId, input.phoneNumber);
  }
}
