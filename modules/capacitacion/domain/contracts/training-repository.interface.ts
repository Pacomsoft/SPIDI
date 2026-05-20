import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type {
  ITrainingListItemDTO,
  ITrainingDetailDTO,
  ICreateTrainingDTO,
  IUpdateTrainingDTO,
  ISendTrainingDTO,
  ITrainingProgressDTO,
  ITrainingFiltersDTO,
} from './training.dto';

export interface ITrainingRepository {
  getTrainings(filters: ITrainingFiltersDTO): Promise<IResultApi<{ items: ITrainingListItemDTO[]; total: number }>>;
  getTrainingById(id: string): Promise<IResultApi<ITrainingDetailDTO>>;
  createTraining(data: ICreateTrainingDTO): Promise<IResultApi<ITrainingDetailDTO>>;
  updateTraining(id: string, data: IUpdateTrainingDTO): Promise<IResultApi<ITrainingDetailDTO>>;
  sendTraining(data: ISendTrainingDTO): Promise<IResultApi<{ sent: number; failed: string[] }>>;
  exportTrainings(filters: ITrainingFiltersDTO, format: string): Promise<IResultApi<Blob>>;
  getTrainingProgress(trainingId: string): Promise<IResultApi<ITrainingProgressDTO[]>>;
  exportTrainingProgress(trainingId: string, format: string): Promise<IResultApi<Blob>>;
}
