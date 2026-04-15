import { v7 as uuidv7 } from 'uuid';
import { type IUseCase } from '../../../shared/domain/contracts/use-case.interface';
import { type IConfiguracionRepository } from '../../../shared/domain/contracts/configuracion-repository.interface';

const SPIDI_ID_KEY = 'spidiId';

export class EnsureSpidiIdUseCase implements IUseCase<void, string> {
  constructor(private readonly configuracionRepository: IConfiguracionRepository) {}

  async execute(): Promise<string> {
    const existing = await this.configuracionRepository.get(SPIDI_ID_KEY);
    if (existing) return existing;
    const newId = uuidv7();
    await this.configuracionRepository.set(SPIDI_ID_KEY, newId);
    return newId;
  }
}
