import { type IGetDriversUseCase } from '../../domain/contracts/get-drivers-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type IDriverFiltersDTO, type IDriverListItemDTO } from '../../domain/contracts/driver-list.dto';

export class GetDriversUseCase implements IGetDriversUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(filters: IDriverFiltersDTO): Promise<IResultApi<{ items: IDriverListItemDTO[]; total: number }>> {
    return this.repository.getDrivers(filters);
  }
}
