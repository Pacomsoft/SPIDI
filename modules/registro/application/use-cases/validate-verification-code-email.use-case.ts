import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IRegisterRepository } from '../../domain/contracts/register-repository.interface';
import { type IVerificationResult } from '../../domain/contracts/verification-result.dto';

export interface IValidateVerificationCodeEmailInput {
  formId: string;
  email: string;
  code: string;
}

export class ValidateVerificationCodeEmailUseCase
  implements IUseCase<IValidateVerificationCodeEmailInput, IResultApi<IVerificationResult>>
{
  constructor(private readonly registerRepository: IRegisterRepository) {}

  async execute(input: IValidateVerificationCodeEmailInput): Promise<IResultApi<IVerificationResult>> {
    return this.registerRepository.validateVerificationCodeEmail(input.formId, input.email, input.code);
  }
}
