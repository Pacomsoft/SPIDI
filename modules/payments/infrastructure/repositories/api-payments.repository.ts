/**
 * API repository para el módulo de pagos.
 *
 * Métodos con API real disponible → llaman al backend directamente.
 * Métodos sin API real aún        → stub con error explícito (nunca deben
 *                                   ser invocados: el DI los enruta al
 *                                   MockPaymentsRepository directamente).
 *
 * Plug & play: cuando un endpoint esté listo en el backend:
 *   1. Implementar la llamada real en el método correspondiente (quitar el throw).
 *   2. En dependency-injection.ts, cambiar mockRepository → apiRepository
 *      en el use case correspondiente.
 */

import type { IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import type { IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IOrderListItemDTO, IOrderDetailDTO, IOrderFiltersDTO, IStoreDTO } from '../../domain/contracts/order.dto';
import type { IBonusListItemDTO, IBonusDetailDTO, IBonusFiltersDTO, ICreateBonusDTO, IUpdateBonusDTO } from '../../domain/contracts/bonus.dto';
import type { IAdjustmentListItemDTO, IAdjustmentDetailDTO, IAdjustmentFiltersDTO, ICreateAdjustmentDTO, IUpdateAdjustmentDTO } from '../../domain/contracts/adjustment.dto';
import type { IDailySummaryListItemDTO, IDailySummaryDetailDTO, IDailySummaryFiltersDTO } from '../../domain/contracts/daily-summary.dto';
import type { IWeeklySummaryListItemDTO, IWeeklySummaryDetailDTO, IWeeklySummaryFiltersDTO } from '../../domain/contracts/weekly-summary.dto';
import { API_ENDPOINTS } from '@/modules/shared/domain/contracts/api-endpoints.constants';
import { FetchError } from '@/modules/shared/domain/entities/fetch-error.class';

export class ApiPaymentsRepository implements IPaymentRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  // ── REAL API ────────────────────────────────────────────────────────────────

  /** GET /api/v1/catalogs/stores — API real disponible */
  async getStores(): Promise<IResultApi<IStoreDTO[]>> {
    try {
      const response = await this.httpClient.get<IStoreDTO[]>(API_ENDPOINTS.CATALOGS_STORES);
      return { success: true, data: response.data };
    } catch (error) {
      const fetchError = error instanceof FetchError ? error : null;
      return { success: false, error: { statusCode: fetchError?.statusCode, message: fetchError?.message ?? (error instanceof Error ? error.message : 'Error desconocido') } };
    }
  }

  // ── PENDIENTE DE API REAL (stubs — el DI enruta estos métodos al MockPaymentsRepository) ──

  // TODO: connect to real API → GET /api/v1/payments/orders
  async getOrders(_filters: IOrderFiltersDTO): Promise<IResultApi<{ items: IOrderListItemDTO[]; total: number }>> {
    throw new Error('[ApiPaymentsRepository] getOrders: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/orders/:id
  async getOrderById(_id: string): Promise<IResultApi<IOrderDetailDTO>> {
    throw new Error('[ApiPaymentsRepository] getOrderById: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/orders/export/:format
  async exportOrders(_filters: IOrderFiltersDTO, _format: string): Promise<IResultApi<Blob>> {
    throw new Error('[ApiPaymentsRepository] exportOrders: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/bonuses
  async getBonuses(_filters: IBonusFiltersDTO): Promise<IResultApi<{ items: IBonusListItemDTO[]; total: number }>> {
    throw new Error('[ApiPaymentsRepository] getBonuses: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/bonuses/:id
  async getBonusById(_id: string): Promise<IResultApi<IBonusDetailDTO>> {
    throw new Error('[ApiPaymentsRepository] getBonusById: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → POST /api/v1/payments/bonuses
  async createBonus(_data: ICreateBonusDTO): Promise<IResultApi<IBonusDetailDTO>> {
    throw new Error('[ApiPaymentsRepository] createBonus: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → PUT /api/v1/payments/bonuses/:id
  async updateBonus(_id: string, _data: IUpdateBonusDTO): Promise<IResultApi<IBonusDetailDTO>> {
    throw new Error('[ApiPaymentsRepository] updateBonus: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/bonuses/export/:format
  async exportBonuses(_filters: IBonusFiltersDTO, _format: string): Promise<IResultApi<Blob>> {
    throw new Error('[ApiPaymentsRepository] exportBonuses: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/adjustments
  async getAdjustments(_filters: IAdjustmentFiltersDTO): Promise<IResultApi<{ items: IAdjustmentListItemDTO[]; total: number }>> {
    throw new Error('[ApiPaymentsRepository] getAdjustments: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/adjustments/:id
  async getAdjustmentById(_id: string): Promise<IResultApi<IAdjustmentDetailDTO>> {
    throw new Error('[ApiPaymentsRepository] getAdjustmentById: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → POST /api/v1/payments/adjustments
  async createAdjustment(_data: ICreateAdjustmentDTO): Promise<IResultApi<IAdjustmentDetailDTO>> {
    throw new Error('[ApiPaymentsRepository] createAdjustment: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → PUT /api/v1/payments/adjustments/:id
  async updateAdjustment(_id: string, _data: IUpdateAdjustmentDTO): Promise<IResultApi<IAdjustmentDetailDTO>> {
    throw new Error('[ApiPaymentsRepository] updateAdjustment: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/adjustments/export/:format
  async exportAdjustments(_filters: IAdjustmentFiltersDTO, _format: string): Promise<IResultApi<Blob>> {
    throw new Error('[ApiPaymentsRepository] exportAdjustments: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/daily-summaries
  async getDailySummaries(_filters: IDailySummaryFiltersDTO): Promise<IResultApi<{ items: IDailySummaryListItemDTO[]; total: number }>> {
    throw new Error('[ApiPaymentsRepository] getDailySummaries: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/daily-summaries/:id
  async getDailySummaryById(_id: string): Promise<IResultApi<IDailySummaryDetailDTO>> {
    throw new Error('[ApiPaymentsRepository] getDailySummaryById: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/daily-summaries/export/:format
  async exportDailySummaries(_filters: IDailySummaryFiltersDTO, _format: string): Promise<IResultApi<Blob>> {
    throw new Error('[ApiPaymentsRepository] exportDailySummaries: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/weekly-summaries
  async getWeeklySummaries(_filters: IWeeklySummaryFiltersDTO): Promise<IResultApi<{ items: IWeeklySummaryListItemDTO[]; total: number }>> {
    throw new Error('[ApiPaymentsRepository] getWeeklySummaries: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/weekly-summaries/:id
  async getWeeklySummaryById(_id: string): Promise<IResultApi<IWeeklySummaryDetailDTO>> {
    throw new Error('[ApiPaymentsRepository] getWeeklySummaryById: enrutar al mockRepository en el DI, no llamar directamente');
  }

  // TODO: connect to real API → GET /api/v1/payments/weekly-summaries/export/:format
  async exportWeeklySummaries(_filters: IWeeklySummaryFiltersDTO, _format: string): Promise<IResultApi<Blob>> {
    throw new Error('[ApiPaymentsRepository] exportWeeklySummaries: enrutar al mockRepository en el DI, no llamar directamente');
  }
}
