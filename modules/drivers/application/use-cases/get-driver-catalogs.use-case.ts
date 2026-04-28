import { type IGetDriverCatalogsUseCase } from '../../domain/contracts/get-driver-catalogs-use-case.interface';
import { type IDriverRepository } from '../../domain/contracts/driver-repository.interface';
import { type ICatalogItemDTO } from '../../domain/contracts/driver-list.dto';

export class GetDriverCatalogsUseCase implements IGetDriverCatalogsUseCase {
  constructor(private readonly repository: IDriverRepository) {}

  async execute(catalogEndpoint: string): Promise<IResultApi<ICatalogItemDTO[]>> {
    return this.repository.getCatalogItems(catalogEndpoint);
  }
}
