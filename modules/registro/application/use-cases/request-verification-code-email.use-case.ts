import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IRegisterRepository } from '../../domain/contracts/register-repository.interface';
import { type IVerificationResult } from '../../domain/contracts/verification-result.dto';

export interface IRequestVerificationCodeEmailInput {
  formId: string;
  email: string;
}

export class RequestVerificationCodeEmailUseCase
  implements IUseCase<IRequestVerificationCodeEmailInput, IResultApi<IVerificationResult>>
{
  constructor(private readonly registerRepository: IRegisterRepository) {}

  async execute(input: IRequestVerificationCodeEmailInput): Promise<IResultApi<IVerificationResult>> {
    return this.registerRepository.requestVerificationCodeEmail(input.formId, input.email);
  }
}
