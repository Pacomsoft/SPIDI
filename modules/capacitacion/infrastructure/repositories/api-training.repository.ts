/**
 * API repository para el módulo de capacitación.
 *
 * Todos los métodos son stubs — el backend aún no tiene los endpoints
 * implementados con BD real (devuelve mockdata hardcodeada).
 *
 * El DI enruta todos los use cases al MockTrainingRepository.
 * Este archivo existe como esqueleto plug & play para cuando el backend esté listo.
 *
 * Plug & play: cuando un endpoint esté listo en el backend:
 *   1. Implementar la llamada real en el método correspondiente (quitar el throw).
 *   2. En dependency-injection.ts, descomentar la línea ApiTrainingRepository
 *      y comentar MockTrainingRepository (o hacer coexistencia por use case).
 */

import type { ITrainingRepository } from '../../domain/contracts/training-repository.interface';
import type { IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type {
  ITrainingListItemDTO,
  ITrainingDetailDTO,
  ICreateTrainingDTO,
  IUpdateTrainingDTO,
  ISendTrainingDTO,
  ITrainingProgressDTO,
  ITrainingFiltersDTO,
} from '../../domain/contracts/training.dto';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';
import { FetchError } from '@/modules/shared/domain/entities/fetch-error.class';

export class ApiTrainingRepository implements ITrainingRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  // ── PENDIENTE DE API REAL ────────────────────────────────────────────────────
  // Todos los métodos lanzan un error descriptivo porque el DI nunca los invoca
  // directamente — el MockTrainingRepository es el que sirve los datos.
  // Cuando el backend implemente el endpoint real, reemplaza el throw por la
  // llamada real al httpClient y actualiza el DI.

  // TODO: connect to real API → GET /api/v1/training
  async getTrainings(_filters: ITrainingFiltersDTO): Promise<IResultApi<{ items: ITrainingListItemDTO[]; total: number }>> {
    try {
      const queryParams: Record<string, string> = {
        page:          String(_filters.page),
        pageSize:      String(_filters.pageSize),
        sortBy:        _filters.sortBy,
        sortDirection: _filters.sortDirection,
      };
      if (_filters.search) queryParams.search = _filters.search;

      const response = await this.httpClient.get<{ items: ITrainingListItemDTO[]; total: number }>(
        API_ENDPOINTS.TRAINING, { queryParams }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // TODO: connect to real API → GET /api/v1/training/:id
  async getTrainingById(_id: string): Promise<IResultApi<ITrainingDetailDTO>> {
    try {
      const response = await this.httpClient.get<ITrainingDetailDTO>(API_ENDPOINTS.TRAINING_BY_ID(_id));
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // TODO: connect to real API → POST /api/v1/training
  async createTraining(_data: ICreateTrainingDTO): Promise<IResultApi<ITrainingDetailDTO>> {
    try {
      const response = await this.httpClient.post<ITrainingDetailDTO>(API_ENDPOINTS.TRAINING, _data);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // TODO: connect to real API → PUT /api/v1/training/:id
  async updateTraining(_id: string, _data: IUpdateTrainingDTO): Promise<IResultApi<ITrainingDetailDTO>> {
    try {
      const response = await this.httpClient.put<ITrainingDetailDTO>(API_ENDPOINTS.TRAINING_BY_ID(_id), _data);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // TODO: connect to real API → POST /api/v1/training/:id/send
  async sendTraining(_data: ISendTrainingDTO): Promise<IResultApi<{ sent: number; failed: string[] }>> {
    try {
      const response = await this.httpClient.post<{ sent: number; failed: string[] }>(
        API_ENDPOINTS.TRAINING_SEND(_data.trainingId), _data
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // TODO: connect to real API → GET /api/v1/training/export/:format
  async exportTrainings(_filters: ITrainingFiltersDTO, _format: string): Promise<IResultApi<Blob>> {
    try {
      const queryParams: Record<string, string> = {
        page:          String(_filters.page),
        pageSize:      String(_filters.pageSize),
        sortBy:        _filters.sortBy,
        sortDirection: _filters.sortDirection,
      };
      if (_filters.search) queryParams.search = _filters.search;

      const response = await this.httpClient.get<Blob>(
        API_ENDPOINTS.TRAINING_EXPORT(_format), { queryParams }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // TODO: connect to real API → GET /api/v1/training/:id/progress
  async getTrainingProgress(_trainingId: string): Promise<IResultApi<ITrainingProgressDTO[]>> {
    try {
      const response = await this.httpClient.get<ITrainingProgressDTO[]>(
        API_ENDPOINTS.TRAINING_PROGRESS(_trainingId)
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // TODO: connect to real API → GET /api/v1/training/:id/progress/export/:format
  async exportTrainingProgress(_trainingId: string, _format: string): Promise<IResultApi<Blob>> {
    try {
      const response = await this.httpClient.get<Blob>(
        API_ENDPOINTS.TRAINING_PROGRESS_EXPORT(_trainingId, _format)
      );
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ── Helper ───────────────────────────────────────────────────────────────────

  private handleError(error: unknown): IResultApi<never> {
    const fetchError = error instanceof FetchError ? error : null;
    return {
      success: false,
      error: {
        statusCode: fetchError?.statusCode,
        message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error desconocido'),
      },
    };
  }
}
