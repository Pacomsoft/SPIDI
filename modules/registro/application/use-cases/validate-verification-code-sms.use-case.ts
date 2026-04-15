import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IRegisterRepository } from '../../domain/contracts/register-repository.interface';
import { type IVerificationResult } from '../../domain/contracts/verification-result.dto';

export interface IValidateVerificationCodeSmsInput {
  formId: string;
  phoneNumber: string;
  code: string;
}

export class ValidateVerificationCodeSmsUseCase
  implements IUseCase<IValidateVerificationCodeSmsInput, IResultApi<IVerificationResult>>
{
  constructor(private readonly registerRepository: IRegisterRepository) {}

  async execute(input: IValidateVerificationCodeSmsInput): Promise<IResultApi<IVerificationResult>> {
    return this.registerRepository.validateVerificationCodeSMS(input.formId, input.phoneNumber, input.code);
  }
}
