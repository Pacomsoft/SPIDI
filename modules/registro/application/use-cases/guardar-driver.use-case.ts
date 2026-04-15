import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IRegisterRepository } from '../../domain/contracts/register-repository.interface';
import { type IRegistroDTO } from '../../domain/contracts/registro.dto';
import { type IRegisterApplicantDto } from '../../domain/contracts/register-applicant.dto';

export class GuardarDriverUseCase implements IUseCase<IRegistroDTO, IResultApi<IRegisterApplicantDto>> {
  constructor(private readonly registerRepository: IRegisterRepository) {}

  async execute(input: IRegistroDTO): Promise<IResultApi<IRegisterApplicantDto>> {
    return this.registerRepository.guardarDriver(input);
  }
}
