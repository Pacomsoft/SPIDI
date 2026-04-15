import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IRegisterRepository } from '../../domain/contracts/register-repository.interface';
import { type IStateDTO } from '../../domain/contracts/state.dto';

export class GetStatesUseCase implements IUseCase<void, IStateDTO[]> {
  constructor(private readonly registerRepository: IRegisterRepository) {}

  async execute(): Promise<IStateDTO[]> {
    return this.registerRepository.getStates();
  }
}
