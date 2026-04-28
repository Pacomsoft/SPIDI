import { type IExportDriversUseCase } from '../../domain/contracts/export-drivers-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IDriverFiltersDTO } from '../../domain/contracts/driver-list.dto';

export class ExportDriversUseCase implements IExportDriversUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(input: { filters: IDriverFiltersDTO; format: string }): Promise<IResultApi<Blob>> {
    return this.repository.exportDrivers(input.filters, input.format);
  }
}
