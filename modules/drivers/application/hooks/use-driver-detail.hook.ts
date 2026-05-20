'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { type IGetDriverByIdUseCase } from '../../domain/contracts/get-driver-by-id-use-case.interface';
import { type IUpdateDriverUseCase } from '../../domain/contracts/update-driver-use-case.interface';
import { type IChangeDriverStatusUseCase } from '../../domain/contracts/change-driver-status-use-case.interface';
import { type IGetDriverOrdersUseCase } from '../../domain/contracts/get-driver-orders-use-case.interface';
import { type IGetDriverPaymentsUseCase, type IGetDriverPaymentsInput } from '../../domain/contracts/get-driver-payments-use-case.interface';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import type { IChangeDriverStatusOutputDTO } from '../../domain/contracts/change-driver-status.dto';
import { type IDriverDetailDTO, type IDocumentDTO, type IOrderDTO, type IPaymentWeekDTO } from '../../domain/contracts/driver-detail.dto';
import { type IUpdateDriverDTO } from '../../domain/contracts/update-driver.dto';

export interface IUseDriverDetailResult {
  driver: IDriverDetailDTO | null;
  documents: Record<string, IDocumentDTO>;
  orders: IOrderDTO[];
  ordersTotal: number;
  payments: IPaymentWeekDTO[];
  paymentsTotal: number;
  isLoading: boolean;
  isSaving: boolean;
  isLoadingOrders: boolean;
  isLoadingPayments: boolean;
  hasChanges: boolean;
  // orders pagination / sort / search
  orderPage: number;
  orderPageSize: number;
  orderSortBy: string;
  orderSortDirection: 'asc' | 'desc';
  orderSearch: string;
  setOrderPage: (p: number) => void;
  setOrderSortBy: (col: string) => void;
  setOrderSortDirection: (dir: 'asc' | 'desc') => void;
  setOrderSearch: (q: string) => void;
  // payments pagination + sort + filter
  paymentPage: number;
  paymentPageSize: number;
  paymentSortBy: string;
  paymentSortDirection: 'asc' | 'desc';
  paymentFilterYear: number | undefined;
  paymentFilterWeek: number | undefined;
  setPaymentPage: (p: number) => void;
  setPaymentSortBy: (col: string) => void;
  setPaymentSortDirection: (dir: 'asc' | 'desc') => void;
  setPaymentFilterYear: (year: number | undefined) => void;
  setPaymentFilterWeek: (week: number | undefined) => void;
  // handlers
  handleInputChange: (field: keyof IDriverDetailDTO, value: string) => void;
  handleBeneficiaryChange: (index: number, field: string, value: string | number) => void;
  addBeneficiary: () => void;
  removeBeneficiary: (index: number) => void;
  handleDocStatusChange: (type: string, status: IDocumentDTO['status']) => void;
  handleDocExpirationChange: (type: string, date: string) => void;
  handleSave: () => Promise<void>;
  handleStatusChange: (newStatus: 'Enabled' | 'Disabled' | 'Suspended') => Promise<IResultApi<IChangeDriverStatusOutputDTO>>;
  loadOrders: () => Promise<void>;
  loadPayments: () => Promise<void>;
}

export function useDriverDetail(
  getDriverByIdUseCase: IGetDriverByIdUseCase,
  updateDriverUseCase: IUpdateDriverUseCase,
  changeDriverStatusUseCase: IChangeDriverStatusUseCase,
  getOrdersUseCase: IGetDriverOrdersUseCase,
  getPaymentsUseCase: IGetDriverPaymentsUseCase,
): IUseDriverDetailResult {
  const params = useParams();
  const id = params?.id as string;

  const [driver, setDriver] = useState<IDriverDetailDTO | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<IDriverDetailDTO | null>(null);
  const [documents, setDocuments] = useState<Record<string, IDocumentDTO>>({});
  const [orders, setOrders] = useState<IOrderDTO[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [payments, setPayments] = useState<IPaymentWeekDTO[]>([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Orders pagination + sort + search
  // Default: fecha ASC + slot ASC (criteria: "ordenado por fecha y slot, ambos ascendente")
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize] = useState(10);
  const [orderSortBy, setOrderSortByState] = useState('deliveryDate');
  const [orderSortDirection, setOrderSortDirectionState] = useState<'asc' | 'desc'>('asc');
  const [orderSearch, setOrderSearchState] = useState('');

  // Payments pagination + sort + filter
  // Default: semana ASC (criterio: "ordenado por fecha, ascendente")
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize] = useState(10);
  const [paymentSortBy, setPaymentSortByState] = useState('weekStart');
  const [paymentSortDirection, setPaymentSortDirectionState] = useState<'asc' | 'desc'>('asc');
  const [paymentFilterYear, setPaymentFilterYearState] = useState<number | undefined>(undefined);
  const [paymentFilterWeek, setPaymentFilterWeekState] = useState<number | undefined>(undefined);

  // ── Load driver ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      const result = await getDriverByIdUseCase.execute(id);
      if (result.success && result.data) {
        setDriver(result.data);
        setInitialSnapshot(JSON.parse(JSON.stringify(result.data)) as IDriverDetailDTO);
      }
      setIsLoading(false);
    };
    void load();
  }, [id, getDriverByIdUseCase]);

  // ── Load orders (reactive to page / sort / search) ─────────────────────────
  const loadOrders = useCallback(async () => {
    if (!id) return;
    setIsLoadingOrders(true);
    const result = await getOrdersUseCase.execute({
      driverId: id,
      pagination: {
        page: orderPage,
        pageSize: orderPageSize,
        sortBy: orderSortBy,
        sortDirection: orderSortDirection,
        search: orderSearch || undefined,
      },
    });
    if (result.success && result.data) {
      setOrders(result.data.items);
      setOrdersTotal(result.data.total);
    }
    setIsLoadingOrders(false);
  }, [id, orderPage, orderPageSize, orderSortBy, orderSortDirection, orderSearch, getOrdersUseCase]);

  useEffect(() => {
    if (!id) return;
    void loadOrders();
  }, [id, orderPage, orderSortBy, orderSortDirection, orderSearch, loadOrders]);

  // ── Load payments (reactive to page / sort / filter) ──────────────────────
  const loadPayments = useCallback(async () => {
    if (!id) return;
    setIsLoadingPayments(true);
    const input: IGetDriverPaymentsInput = {
      driverId: id,
      pagination: {
        page: paymentPage,
        pageSize: paymentPageSize,
        sortBy: paymentSortBy,
        sortDirection: paymentSortDirection,
      },
      filterYear: paymentFilterYear,
      filterWeek: paymentFilterWeek,
    };
    const result = await getPaymentsUseCase.execute(input);
    if (result.success && result.data) {
      setPayments(result.data.items);
      setPaymentsTotal(result.data.total);
    }
    setIsLoadingPayments(false);
  }, [id, paymentPage, paymentPageSize, paymentSortBy, paymentSortDirection, paymentFilterYear, paymentFilterWeek, getPaymentsUseCase]);

  useEffect(() => {
    if (!id) return;
    void loadPayments();
  }, [id, paymentPage, paymentSortBy, paymentSortDirection, paymentFilterYear, paymentFilterWeek, loadPayments]);

  // ── Setters that reset page to 1 ──────────────────────────────────────────
  const setOrderSortBy = useCallback((col: string) => {
    setOrderPage(1);
    setOrderSortByState(col);
  }, []);

  const setOrderSortDirection = useCallback((dir: 'asc' | 'desc') => {
    setOrderPage(1);
    setOrderSortDirectionState(dir);
  }, []);

  const setOrderSearch = useCallback((q: string) => {
    setOrderPage(1);
    setOrderSearchState(q);
  }, []);

  const setPaymentSortBy = useCallback((col: string) => {
    setPaymentPage(1);
    setPaymentSortByState(col);
  }, []);

  const setPaymentSortDirection = useCallback((dir: 'asc' | 'desc') => {
    setPaymentPage(1);
    setPaymentSortDirectionState(dir);
  }, []);

  const setPaymentFilterYear = useCallback((year: number | undefined) => {
    setPaymentPage(1);
    setPaymentFilterYearState(year);
    setPaymentFilterWeekState(undefined); // reset week when year changes
  }, []);

  const setPaymentFilterWeek = useCallback((week: number | undefined) => {
    setPaymentPage(1);
    setPaymentFilterWeekState(week);
  }, []);

  // ── hasChanges ─────────────────────────────────────────────────────────────
  const hasChanges = useMemo(() => {
    if (!driver || !initialSnapshot) return false;
    return JSON.stringify(driver) !== JSON.stringify(initialSnapshot);
  }, [driver, initialSnapshot]);

  // ── Field handlers ────────────────────────────────────────────────────────
  const handleInputChange = useCallback((field: keyof IDriverDetailDTO, value: string) => {
    setDriver(prev => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const handleBeneficiaryChange = useCallback((index: number, field: string, value: string | number) => {
    setDriver(prev => {
      if (!prev) return prev;
      const beneficiaries = [...(prev.beneficiaries ?? [])];
      beneficiaries[index] = { ...beneficiaries[index], [field]: value };
      return { ...prev, beneficiaries };
    });
  }, []);

  const addBeneficiary = useCallback(() => {
    setDriver(prev => {
      if (!prev) return prev;
      const beneficiaries = [...(prev.beneficiaries ?? [])];
      beneficiaries.push({ name: '', phone: '', percentage: 0 });
      return { ...prev, beneficiaries };
    });
  }, []);

  const removeBeneficiary = useCallback((index: number) => {
    setDriver(prev => {
      if (!prev) return prev;
      const beneficiaries = (prev.beneficiaries ?? []).filter((_, i) => i !== index);
      return { ...prev, beneficiaries };
    });
  }, []);

  const handleDocStatusChange = useCallback((type: string, status: IDocumentDTO['status']) => {
    setDocuments(prev => ({ ...prev, [type]: { ...prev[type], status } }));
  }, []);

  const handleDocExpirationChange = useCallback((type: string, date: string) => {
    const expired = new Date(date) < new Date();
    setDocuments(prev => ({ ...prev, [type]: { ...prev[type], expirationDate: date, isExpired: expired } }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!driver || !id) return;
    setIsSaving(true);
    const updateData: IUpdateDriverDTO = { ...driver };
    const result = await updateDriverUseCase.execute({ id, data: updateData });
    if (result.success && result.data) {
      setDriver(result.data);
      setInitialSnapshot(JSON.parse(JSON.stringify(result.data)) as IDriverDetailDTO);
    }
    setIsSaving(false);
  }, [driver, id, updateDriverUseCase]);

  const handleStatusChange = useCallback(async (newStatus: 'Enabled' | 'Disabled' | 'Suspended'): Promise<IResultApi<IChangeDriverStatusOutputDTO>> => {
    if (!driver || !id) return { success: false, error: { message: 'Driver no disponible' } };
    setIsSaving(true);
    const result = await changeDriverStatusUseCase.execute({
      driverId: id,
      status: newStatus,
      changedBy: 'admin', // plug & play: reemplazar con usuario de sesión real
    });
    if (result.success) {
      setDriver(prev => prev ? { ...prev, driverStatus: newStatus } : prev);
      setInitialSnapshot(prev => prev ? { ...prev, driverStatus: newStatus } : prev);
    }
    setIsSaving(false);
    return result;
  }, [driver, id, changeDriverStatusUseCase]);

  return {
    driver, documents, orders, ordersTotal, payments, paymentsTotal,
    isLoading, isSaving, isLoadingOrders, isLoadingPayments, hasChanges,
    orderPage, orderPageSize, orderSortBy, orderSortDirection, orderSearch,
    setOrderPage, setOrderSortBy, setOrderSortDirection, setOrderSearch,
    paymentPage, paymentPageSize, paymentSortBy, paymentSortDirection, paymentFilterYear, paymentFilterWeek,
    setPaymentPage, setPaymentSortBy, setPaymentSortDirection, setPaymentFilterYear, setPaymentFilterWeek,
    handleInputChange, handleBeneficiaryChange, addBeneficiary, removeBeneficiary,
    handleDocStatusChange, handleDocExpirationChange,
    handleSave, handleStatusChange, loadOrders, loadPayments,
  };
}
