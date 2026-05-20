import type {
  IExportTrainingProgressUseCase,
  IExportTrainingProgressInput,
  IGetTrainingProgressUseCase,
} from '../../domain/contracts/export-training-progress-use-case.interface';
import type { ITrainingRepository } from '../../domain/contracts/training-repository.interface';
import type { ITrainingProgressDTO } from '../../domain/contracts/training.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class ExportTrainingProgressUseCase implements IExportTrainingProgressUseCase {
  constructor(private readonly repository: ITrainingRepository) {}

  async execute(input: IExportTrainingProgressInput): Promise<IResultApi<Blob>> {
    return this.repository.exportTrainingProgress(input.trainingId, input.format);
  }
}

export class GetTrainingProgressUseCase implements IGetTrainingProgressUseCase {
  constructor(private readonly repository: ITrainingRepository) {}

  async execute(trainingId: string): Promise<IResultApi<ITrainingProgressDTO[]>> {
    return this.repository.getTrainingProgress(trainingId);
  }
}
