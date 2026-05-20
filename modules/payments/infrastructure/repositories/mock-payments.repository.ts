import * as XLSX from 'xlsx';
import type { IPaymentRepository } from '../../domain/contracts/payment-repository.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IOrderListItemDTO, IOrderDetailDTO, IOrderFiltersDTO, IStoreDTO, OrderStatus } from '../../domain/contracts/order.dto';
import type { IBonusListItemDTO, IBonusDetailDTO, IBonusFiltersDTO, ICreateBonusDTO, IUpdateBonusDTO } from '../../domain/contracts/bonus.dto';
import type { IAdjustmentListItemDTO, IAdjustmentDetailDTO, IAdjustmentFiltersDTO, ICreateAdjustmentDTO, IUpdateAdjustmentDTO } from '../../domain/contracts/adjustment.dto';
import type { IDailySummaryListItemDTO, IDailySummaryDetailDTO, IDailySummaryFiltersDTO } from '../../domain/contracts/daily-summary.dto';
import type { IWeeklySummaryListItemDTO, IWeeklySummaryDetailDTO, IWeeklySummaryFiltersDTO } from '../../domain/contracts/weekly-summary.dto';

// ─── Mock seed data ────────────────────────────────────────────────────────────

/** Catálogo de tiendas — refleja lo que devuelve GET /api/v1/catalogs/stores */
const MOCK_STORES: IStoreDTO[] = [
  { value: 1, label: 'HEB Monterrey Centro', externalId: 'HEB-001' },
  { value: 2, label: 'HEB San Pedro',        externalId: 'HEB-002' },
  { value: 3, label: 'HEB Cumbres',          externalId: 'HEB-003' },
  { value: 4, label: 'HEB Valle',            externalId: 'HEB-004' },
  { value: 5, label: 'HEB Contry',           externalId: 'HEB-005' },
];

const STORES = MOCK_STORES.map(s => s.label);

const MOCK_DRIVERS = [
  { driverId: 'DRV-001', driverName: 'Carlos Ramírez Garza', rfc: 'RAGC850312AB1' },
  { driverId: 'DRV-002', driverName: 'José Luis Morales Vega', rfc: 'MOVJ900118CD2' },
  { driverId: 'DRV-003', driverName: 'Alejandro Torres Sánchez', rfc: 'TOSA780924EF3' },
  { driverId: 'DRV-004', driverName: 'Miguel Ángel Hernández López', rfc: 'HELM820615GH4' },
  { driverId: 'DRV-005', driverName: 'Roberto Elizondo Garza', rfc: 'EIGR950201IJ5' },
  { driverId: 'DRV-006', driverName: 'Juan Pablo Martínez Reyes', rfc: 'MARJ881107KL6' },
];

const ORDER_STATUSES: OrderStatus[] = ['Delivered', 'Cancelled', 'Pending', 'InRoute'];

function isoDate(daysAgo: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoDateOnly(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function mondayOf(weeksAgo: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff - weeksAgo * 7);
  return d.toISOString().split('T')[0];
}

// ─── Orders ────────────────────────────────────────────────────────────────────

const MOCK_ORDERS: IOrderDetailDTO[] = Array.from({ length: 32 }, (_, i) => {
  const driver = MOCK_DRIVERS[i % MOCK_DRIVERS.length];
  const store = STORES[i % STORES.length];
  const status = ORDER_STATUSES[i % ORDER_STATUSES.length];
  const daysAgo = i;
  const paymentAmount = 55 + (i % 10) * 5;
  const bonusAmount = i % 3 === 0 ? 20 : 0;
  const adjustmentAmount = i % 7 === 0 ? -10 : 0;
  return {
    orderId: `ORD-${String(i + 1).padStart(4, '0')}`,
    driverName: driver.driverName,
    driverId: driver.driverId,
    deliveryDateTime: isoDate(daysAgo, 10 + (i % 8)),
    store,
    orderStatus: status,
    paymentAmount,
    bonusAmount,
    adjustmentAmount,
    routeId: `RTE-${String(i + 1).padStart(3, '0')}`,
    assignedAt: isoDate(daysAgo, 9),
    startedAt: isoDate(daysAgo, 9, 30),
    closedAt: isoDate(daysAgo, 10 + (i % 8), 45),
    customerSlot: `${9 + (i % 5)}:00 - ${10 + (i % 5)}:00`,
    appliedBonuses: bonusAmount > 0
      ? [{ bonusId: `BON-${String((i % 10) + 1).padStart(3, '0')}`, bonusType: 'Punctuality', amount: bonusAmount }]
      : [],
  };
});

// ─── Bonuses ───────────────────────────────────────────────────────────────────

const BONUS_TYPES = ['Punctuality', 'Productivity', 'SpecialSchedule', 'Zone', 'Weather'] as const;

const MOCK_BONUSES: IBonusDetailDTO[] = Array.from({ length: 10 }, (_, i) => ({
  bonusId: `BON-${String(i + 1).padStart(3, '0')}`,
  store: STORES[i % STORES.length],
  startDate: isoDateOnly(30 - i * 2),
  endDate: isoDateOnly(-(10 + i * 3)),
  createdAt: isoDate(35 + i),
  bonusType: BONUS_TYPES[i % BONUS_TYPES.length],
  bonusAmount: 15 + i * 5,
  threshold: i % 2 === 0 ? 5 + i : undefined,
  minimumOrders: 3 + i,
  createdBy: 'admin@spidi.mx',
  lastModifiedBy: 'admin@spidi.mx',
  affectedOrders: MOCK_ORDERS.filter((_, oi) => oi % (i + 2) === 0).map(o => o.orderId).slice(0, 5),
}));

// ─── Adjustments ──────────────────────────────────────────────────────────────

const ADJ_TYPES = ['OperationalError', 'SystemError', 'OperationalAdjustment'] as const;

const MOCK_ADJUSTMENTS: IAdjustmentDetailDTO[] = Array.from({ length: 15 }, (_, i) => {
  const driver = MOCK_DRIVERS[i % MOCK_DRIVERS.length];
  const amount = i % 3 === 0 ? -(10 + i * 3) : (10 + i * 2);
  return {
    adjustmentId: `ADJ-${String(i + 1).padStart(3, '0')}`,
    driverName: driver.driverName,
    driverId: driver.driverId,
    store: STORES[i % STORES.length],
    applicationDate: isoDateOnly(i + 1),
    adjustmentType: ADJ_TYPES[i % ADJ_TYPES.length],
    amount,
    createdAt: isoDate(i + 1),
    notes: i % 3 === 0
      ? 'Error en sistema de asignación de pedido'
      : i % 3 === 1
      ? 'Ajuste por error operativo del operador'
      : 'Ajuste manual por petición del driver',
    createdBy: 'supervisor@spidi.mx',
  };
});

// ─── Daily Summaries ──────────────────────────────────────────────────────────

const MOCK_DAILY_SUMMARIES: IDailySummaryDetailDTO[] = Array.from({ length: 24 }, (_, i) => {
  const driver = MOCK_DRIVERS[i % MOCK_DRIVERS.length];
  const relatedOrders = MOCK_ORDERS.filter(o => o.driverId === driver.driverId).slice(0, 3);
  const ordersAmount = relatedOrders.reduce((sum, o) => sum + o.paymentAmount, 0);
  const bonusAmount = relatedOrders.reduce((sum, o) => sum + o.bonusAmount, 0);
  const adjForDriver = MOCK_ADJUSTMENTS.filter(a => a.driverId === driver.driverId).slice(0, 1);
  const adjustmentAmount = adjForDriver.reduce((sum, a) => sum + a.amount, 0);
  return {
    summaryId: `DS-${String(i + 1).padStart(4, '0')}`,
    driverId: driver.driverId,
    driverName: driver.driverName,
    rfc: driver.rfc,
    summaryDate: isoDateOnly(i),
    checkinCount: 1 + (i % 3),
    orderCount: relatedOrders.length,
    ordersAmount,
    bonusAmount,
    adjustmentAmount,
    totalAmount: ordersAmount + bonusAmount + adjustmentAmount,
    relatedOrders: relatedOrders.map(o => ({
      orderId: o.orderId,
      store: o.store,
      deliveryDateTime: o.deliveryDateTime,
      paymentAmount: o.paymentAmount,
    })),
    relatedBonuses: bonusAmount > 0
      ? [{ bonusId: `BON-${String((i % 10) + 1).padStart(3, '0')}`, bonusType: 'Punctuality', amount: bonusAmount }]
      : [],
    relatedAdjustments: adjForDriver.map(a => ({
      adjustmentId: a.adjustmentId,
      adjustmentType: a.adjustmentType,
      amount: a.amount,
    })),
  };
});

// ─── Weekly Summaries ─────────────────────────────────────────────────────────

const MOCK_WEEKLY_SUMMARIES: IWeeklySummaryDetailDTO[] = Array.from({ length: 12 }, (_, i) => {
  const driver = MOCK_DRIVERS[i % MOCK_DRIVERS.length];
  const dailies = MOCK_DAILY_SUMMARIES.filter(d => d.driverId === driver.driverId).slice(0, 5);
  const ordersAmount = dailies.reduce((sum, d) => sum + d.ordersAmount, 0);
  const bonusAmount = dailies.reduce((sum, d) => sum + d.bonusAmount, 0);
  const adjustmentAmount = dailies.reduce((sum, d) => sum + d.adjustmentAmount, 0);
  return {
    summaryId: `WS-${String(i + 1).padStart(3, '0')}`,
    driverId: driver.driverId,
    driverName: driver.driverName,
    rfc: driver.rfc,
    weekStartDate: mondayOf(i),
    ordersAmount,
    bonusAmount,
    adjustmentAmount,
    totalAmount: ordersAmount + bonusAmount + adjustmentAmount,
    totalCheckins: dailies.reduce((sum, d) => sum + d.checkinCount, 0),
    totalOrders: dailies.reduce((sum, d) => sum + d.orderCount, 0),
    totalWaitTime: 15 + i * 10,
    totalWorkTime: 240 + i * 30,
    executionDateTime: isoDate(-(i * 7)),
    dailySummaries: dailies,
  };
});

// ─── Helper: simulated delay ──────────────────────────────────────────────────

async function delay(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
}

// ─── Helper: paginate ─────────────────────────────────────────────────────────

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// ─── Helper: generate CSV ─────────────────────────────────────────────────────

function generateCsv<T extends Record<string, unknown>>(items: T[]): string {
  if (items.length === 0) return '';
  const headers = Object.keys(items[0]).join(',');
  const rows = items.map(item => Object.values(item).map(v => (typeof v === 'string' ? `"${v}"` : String(v))).join(','));
  return [headers, ...rows].join('\n');
}

// ─── Helper: generate XLSX ────────────────────────────────────────────────────

function generateXlsx<T extends Record<string, unknown>>(items: T[]): Blob {
  const ws = XLSX.utils.json_to_sheet(items);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ─── Repository implementation ────────────────────────────────────────────────

export class MockPaymentsRepository implements IPaymentRepository {

  async getStores(): Promise<IResultApi<IStoreDTO[]>> {
    await delay();
    return { success: true, data: [...MOCK_STORES] };
  }

  async getOrders(filters: IOrderFiltersDTO): Promise<IResultApi<{ items: IOrderListItemDTO[]; total: number }>> {
    await delay();
    let items: IOrderDetailDTO[] = [...MOCK_ORDERS];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(o => o.orderId.toLowerCase().includes(q) || o.driverName.toLowerCase().includes(q));
    }
    if (filters.driverName) {
      items = items.filter(o => o.driverName.toLowerCase().includes(filters.driverName!.toLowerCase()));
    }
    if (filters.dateFrom) {
      items = items.filter(o => o.deliveryDateTime >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      items = items.filter(o => o.deliveryDateTime <= filters.dateTo!);
    }
    if (filters.orderStatus?.length) {
      items = items.filter(o => filters.orderStatus!.includes(o.orderStatus));
    }
    if (filters.store?.length) {
      items = items.filter(o => filters.store!.includes(o.store));
    }

    // ── Sort ────────────────────────────────────────────────────────────────
    const dir = filters.sortDirection === 'asc' ? 1 : -1;
    const key = filters.sortBy as keyof IOrderDetailDTO;
    if (key) {
      items = [...items].sort((a, b) => {
        const av = a[key] ?? '';
        const bv = b[key] ?? '';
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }

    const total = items.length;
    const paged = paginate(items, filters.page, filters.pageSize);
    const listItems: IOrderListItemDTO[] = paged.map(({ routeId: _r, assignedAt: _a, startedAt: _s, closedAt: _c, customerSlot: _cs, appliedBonuses: _ab, ...rest }) => rest);
    return { success: true, data: { items: listItems, total } };
  }

  async getOrderById(id: string): Promise<IResultApi<IOrderDetailDTO>> {
    await delay();
    const order = MOCK_ORDERS.find(o => o.orderId === id);
    if (!order) return { success: false, error: { statusCode: 404, message: `Order with id ${id} not found` } };
    return { success: true, data: order };
  }

  async exportOrders(filters: IOrderFiltersDTO, format: string): Promise<IResultApi<Blob>> {
    await delay();
    const all = await this.getOrders({ ...filters, page: 1, pageSize: 10000 });
    const items = (all.data?.items ?? []) as unknown as Record<string, unknown>[];
    if (format === 'xlsx') {
      return { success: true, data: generateXlsx(items) };
    }
    const csv = generateCsv(items);
    return { success: true, data: new Blob([csv], { type: 'text/csv' }) };
  }

  // ── Bonuses ─────────────────────────────────────────────────────────────────

  async getBonuses(filters: IBonusFiltersDTO): Promise<IResultApi<{ items: IBonusListItemDTO[]; total: number }>> {
    await delay();
    let items: IBonusDetailDTO[] = [...MOCK_BONUSES];
    if (filters.store?.length) {
      items = items.filter(b => filters.store!.includes(b.store));
    }
    if (filters.bonusType?.length) {
      items = items.filter(b => filters.bonusType!.includes(b.bonusType));
    }
    if (filters.startDateFrom) {
      items = items.filter(b => b.startDate >= filters.startDateFrom!);
    }
    if (filters.startDateTo) {
      items = items.filter(b => b.startDate <= filters.startDateTo!);
    }
    if (filters.endDateFrom) {
      items = items.filter(b => b.endDate >= filters.endDateFrom!);
    }
    if (filters.endDateTo) {
      items = items.filter(b => b.endDate <= filters.endDateTo!);
    }

    // ── Sort ────────────────────────────────────────────────────────────────
    const dir = filters.sortDirection === 'asc' ? 1 : -1;
    const key = filters.sortBy as keyof IBonusDetailDTO;
    if (key) {
      items = [...items].sort((a, b) => {
        const av = a[key] ?? '';
        const bv = b[key] ?? '';
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }

    const total = items.length;
    const paged = paginate(items, filters.page, filters.pageSize);
    const listItems: IBonusListItemDTO[] = paged.map(({ threshold: _t, minimumOrders: _m, createdBy: _cb, lastModifiedBy: _lm, affectedOrders: _ao, ...rest }) => rest);
    return { success: true, data: { items: listItems, total } };
  }

  async getBonusById(id: string): Promise<IResultApi<IBonusDetailDTO>> {
    await delay();
    const bonus = MOCK_BONUSES.find(b => b.bonusId === id);
    if (!bonus) return { success: false, error: { statusCode: 404, message: `Bonus with id ${id} not found` } };
    return { success: true, data: bonus };
  }

  async createBonus(data: ICreateBonusDTO): Promise<IResultApi<IBonusDetailDTO>> {
    await delay();
    const newBonus: IBonusDetailDTO = {
      bonusId: `BON-${String(MOCK_BONUSES.length + 1).padStart(3, '0')}`,
      store: data.store[0] ?? STORES[0],
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date().toISOString(),
      bonusType: data.bonusType,
      bonusAmount: data.bonusAmount,
      threshold: data.threshold,
      minimumOrders: data.minimumOrders,
      createdBy: 'current-user@spidi.mx',
      lastModifiedBy: 'current-user@spidi.mx',
      affectedOrders: [],
    };
    MOCK_BONUSES.push(newBonus);
    return { success: true, data: newBonus };
  }

  async updateBonus(id: string, data: IUpdateBonusDTO): Promise<IResultApi<IBonusDetailDTO>> {
    await delay();
    const index = MOCK_BONUSES.findIndex(b => b.bonusId === id);
    if (index === -1) return { success: false, error: { statusCode: 404, message: `Bonus with id ${id} not found` } };
    const existing = MOCK_BONUSES[index];
    const updated: IBonusDetailDTO = {
      ...existing,
      ...(data.store !== undefined && { store: data.store[0] ?? existing.store }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      ...(data.bonusType !== undefined && { bonusType: data.bonusType }),
      ...(data.bonusAmount !== undefined && { bonusAmount: data.bonusAmount }),
      lastModifiedBy: 'current-user@spidi.mx',
    };
    MOCK_BONUSES[index] = updated;
    return { success: true, data: updated };
  }

  async exportBonuses(filters: IBonusFiltersDTO, format: string): Promise<IResultApi<Blob>> {
    await delay();
    const all = await this.getBonuses({ ...filters, page: 1, pageSize: 10000 });
    const items = (all.data?.items ?? []) as unknown as Record<string, unknown>[];
    if (format === 'xlsx') {
      return { success: true, data: generateXlsx(items) };
    }
    const csv = generateCsv(items);
    return { success: true, data: new Blob([csv], { type: 'text/csv' }) };
  }

  // ── Adjustments ─────────────────────────────────────────────────────────────

  async getAdjustments(filters: IAdjustmentFiltersDTO): Promise<IResultApi<{ items: IAdjustmentListItemDTO[]; total: number }>> {
    await delay();
    let items: IAdjustmentDetailDTO[] = [...MOCK_ADJUSTMENTS];
    if (filters.driverName) {
      items = items.filter(a => a.driverName.toLowerCase().includes(filters.driverName!.toLowerCase()));
    }
    if (filters.store?.length) {
      items = items.filter(a => filters.store!.includes(a.store));
    }
    if (filters.adjustmentType?.length) {
      items = items.filter(a => filters.adjustmentType!.includes(a.adjustmentType));
    }
    if (filters.applicationDateFrom) {
      items = items.filter(a => a.applicationDate >= filters.applicationDateFrom!);
    }
    if (filters.applicationDateTo) {
      items = items.filter(a => a.applicationDate <= filters.applicationDateTo!);
    }
    const total = items.length;
    if (filters.sortBy) {
      const dir = filters.sortDirection === 'asc' ? 1 : -1;
      items.sort((a, b) => {
        const key = filters.sortBy as keyof IAdjustmentDetailDTO;
        const av = a[key] ?? '';
        const bv = b[key] ?? '';
        return av < bv ? -dir : av > bv ? dir : 0;
      });
    }
    const paged = paginate(items, filters.page, filters.pageSize);
    const listItems: IAdjustmentListItemDTO[] = paged.map(({ notes: _n, createdBy: _cb, ...rest }) => rest);
    return { success: true, data: { items: listItems, total } };
  }

  async getAdjustmentById(id: string): Promise<IResultApi<IAdjustmentDetailDTO>> {
    await delay();
    const adjustment = MOCK_ADJUSTMENTS.find(a => a.adjustmentId === id);
    if (!adjustment) return { success: false, error: { statusCode: 404, message: `Adjustment with id ${id} not found` } };
    return { success: true, data: adjustment };
  }

  async createAdjustment(data: ICreateAdjustmentDTO): Promise<IResultApi<IAdjustmentDetailDTO>> {
    await delay();
    const driver = MOCK_DRIVERS.find(d => d.driverId === data.driverId) ?? MOCK_DRIVERS[0];
    const newAdj: IAdjustmentDetailDTO = {
      adjustmentId: `ADJ-${String(MOCK_ADJUSTMENTS.length + 1).padStart(3, '0')}`,
      driverName: driver.driverName,
      driverId: data.driverId,
      store: data.store,
      applicationDate: data.applicationDate,
      adjustmentType: data.adjustmentType,
      amount: data.amount,
      createdAt: new Date().toISOString(),
      notes: data.notes,
      createdBy: 'current-user@spidi.mx',
    };
    MOCK_ADJUSTMENTS.push(newAdj);
    return { success: true, data: newAdj };
  }

  async updateAdjustment(id: string, data: IUpdateAdjustmentDTO): Promise<IResultApi<IAdjustmentDetailDTO>> {
    await delay();
    const idx = MOCK_ADJUSTMENTS.findIndex(a => a.adjustmentId === id);
    if (idx === -1) return { success: false, error: { statusCode: 404, message: `Adjustment ${id} not found` } };
    MOCK_ADJUSTMENTS[idx] = { ...MOCK_ADJUSTMENTS[idx], ...data };
    return { success: true, data: MOCK_ADJUSTMENTS[idx] };
  }

  async exportAdjustments(filters: IAdjustmentFiltersDTO, format: string): Promise<IResultApi<Blob>> {
    await delay();
    const all = await this.getAdjustments({ ...filters, page: 1, pageSize: 10000 });
    const items = (all.data?.items ?? []) as unknown as Record<string, unknown>[];
    if (format === 'xlsx') {
      return { success: true, data: generateXlsx(items) };
    }
    const csv = generateCsv(items);
    return { success: true, data: new Blob([csv], { type: 'text/csv' }) };
  }

  // ── Daily Summaries ─────────────────────────────────────────────────────────

  async getDailySummaries(filters: IDailySummaryFiltersDTO): Promise<IResultApi<{ items: IDailySummaryListItemDTO[]; total: number }>> {
    await delay();
    let items: IDailySummaryDetailDTO[] = [...MOCK_DAILY_SUMMARIES];
    if (filters.driverSearch) {
      const q = filters.driverSearch.toLowerCase();
      items = items.filter(d => d.driverName.toLowerCase().includes(q) || d.driverId.toLowerCase().includes(q));
    }
    if (filters.dateFrom) {
      items = items.filter(d => d.summaryDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      items = items.filter(d => d.summaryDate <= filters.dateTo!);
    }
    const total = items.length;
    const paged = paginate(items, filters.page, filters.pageSize);
    const listItems: IDailySummaryListItemDTO[] = paged.map(({ relatedOrders: _ro, relatedBonuses: _rb, relatedAdjustments: _ra, ...rest }) => rest);
    return { success: true, data: { items: listItems, total } };
  }

  async getDailySummaryById(id: string): Promise<IResultApi<IDailySummaryDetailDTO>> {
    await delay();
    const summary = MOCK_DAILY_SUMMARIES.find(d => d.summaryId === id);
    if (!summary) return { success: false, error: { statusCode: 404, message: `Daily summary with id ${id} not found` } };
    return { success: true, data: summary };
  }

  async exportDailySummaries(filters: IDailySummaryFiltersDTO, format: string): Promise<IResultApi<Blob>> {
    await delay();
    const all = await this.getDailySummaries({ ...filters, page: 1, pageSize: 10000 });
    const items = (all.data?.items ?? []) as unknown as Record<string, unknown>[];
    if (format === 'xlsx') return { success: true, data: generateXlsx(items) };
    return { success: true, data: new Blob([generateCsv(items)], { type: 'text/csv' }) };
  }

  // ── Weekly Summaries ────────────────────────────────────────────────────────

  async getWeeklySummaries(filters: IWeeklySummaryFiltersDTO): Promise<IResultApi<{ items: IWeeklySummaryListItemDTO[]; total: number }>> {
    await delay();
    let items: IWeeklySummaryDetailDTO[] = [...MOCK_WEEKLY_SUMMARIES];
    if (filters.driverSearch) {
      const q = filters.driverSearch.toLowerCase();
      items = items.filter(w =>
        w.driverName.toLowerCase().includes(q) ||
        w.driverId.toLowerCase().includes(q) ||
        w.rfc.toLowerCase().includes(q),
      );
    }
    if (filters.dateFrom) items = items.filter(w => w.weekStartDate >= filters.dateFrom!);
    if (filters.dateTo)   items = items.filter(w => w.weekStartDate <= filters.dateTo!);

    // Sort
    const dir = filters.sortDirection === 'asc' ? 1 : -1;
    items.sort((a, b) => {
      const key = filters.sortBy as keyof IWeeklySummaryDetailDTO;
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      return av < bv ? -dir : av > bv ? dir : 0;
    });

    const total = items.length;
    const paged = paginate(items, filters.page, filters.pageSize);
    const listItems: IWeeklySummaryListItemDTO[] = paged.map(({ totalCheckins: _tc, totalOrders: _to, totalWaitTime: _tw, totalWorkTime: _twt, executionDateTime: _ed, dailySummaries: _ds, ...rest }) => rest);
    return { success: true, data: { items: listItems, total } };
  }

  async getWeeklySummaryById(id: string): Promise<IResultApi<IWeeklySummaryDetailDTO>> {
    await delay();
    const summary = MOCK_WEEKLY_SUMMARIES.find(w => w.summaryId === id);
    if (!summary) return { success: false, error: { statusCode: 404, message: `Weekly summary with id ${id} not found` } };
    return { success: true, data: summary };
  }

  async exportWeeklySummaries(filters: IWeeklySummaryFiltersDTO, format: string): Promise<IResultApi<Blob>> {
    await delay();
    const all = await this.getWeeklySummaries({ ...filters, page: 1, pageSize: 10000 });
    const items = (all.data?.items ?? []) as unknown as Record<string, unknown>[];
    if (format === 'xlsx') return { success: true, data: generateXlsx(items) };
    return { success: true, data: new Blob([generateCsv(items)], { type: 'text/csv' }) };
  }
}

