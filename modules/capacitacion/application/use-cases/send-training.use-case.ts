import type { ISendTrainingUseCase } from '../../domain/contracts/send-training-use-case.interface';
import type { ITrainingRepository } from '../../domain/contracts/training-repository.interface';
import type { ISendTrainingDTO } from '../../domain/contracts/training.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class SendTrainingUseCase implements ISendTrainingUseCase {
  constructor(private readonly repository: ITrainingRepository) {}

  async execute(data: ISendTrainingDTO): Promise<IResultApi<{ sent: number; failed: string[] }>> {
    return this.repository.sendTraining(data);
  }
}
