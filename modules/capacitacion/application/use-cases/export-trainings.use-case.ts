import type { IExportTrainingsUseCase, IExportTrainingsInput } from '../../domain/contracts/export-trainings-use-case.interface';
import type { ITrainingRepository } from '../../domain/contracts/training-repository.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

export class ExportTrainingsUseCase implements IExportTrainingsUseCase {
  constructor(private readonly repository: ITrainingRepository) {}

  async execute(input: IExportTrainingsInput): Promise<IResultApi<Blob>> {
    return this.repository.exportTrainings(input.filters, input.format);
  }
}
