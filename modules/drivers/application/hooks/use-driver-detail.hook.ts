'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { type IGetDriverByIdUseCase } from '../../domain/contracts/get-driver-by-id-use-case.interface';
import { type IUpdateDriverUseCase } from '../../domain/contracts/update-driver-use-case.interface';
import { type IGetDriverOrdersUseCase } from '../../domain/contracts/get-driver-orders-use-case.interface';
import { type IGetDriverPaymentsUseCase } from '../../domain/contracts/get-driver-payments-use-case.interface';
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
  orderPage: number;
  orderPageSize: number;
  paymentPage: number;
  paymentPageSize: number;
  setOrderPage: (p: number) => void;
  setPaymentPage: (p: number) => void;
  handleInputChange: (field: keyof IDriverDetailDTO, value: string) => void;
  handleBeneficiaryChange: (index: number, field: string, value: string | number) => void;
  addBeneficiary: () => void;
  removeBeneficiary: (index: number) => void;
  handleDocStatusChange: (type: string, status: IDocumentDTO['status']) => void;
  handleDocExpirationChange: (type: string, date: string) => void;
  handleSave: () => Promise<void>;
  handleStatusChange: (newStatus: 'Enabled' | 'Disabled' | 'Suspended') => Promise<void>;
  loadOrders: () => Promise<void>;
  loadPayments: () => Promise<void>;
}

export function useDriverDetail(
  getDriverByIdUseCase: IGetDriverByIdUseCase,
  updateDriverUseCase: IUpdateDriverUseCase,
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
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize] = useState(10);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize] = useState(10);

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

  const loadOrders = useCallback(async () => {
    if (!id) return;
    setIsLoadingOrders(true);
    const result = await getOrdersUseCase.execute({
      driverId: id,
      pagination: { page: orderPage, pageSize: orderPageSize, sortBy: 'deliveryDate', sortDirection: 'desc' },
    });
    if (result.success && result.data) {
      setOrders(result.data.items);
      setOrdersTotal(result.data.total);
    }
    setIsLoadingOrders(false);
  }, [id, orderPage, orderPageSize, getOrdersUseCase]);

  const loadPayments = useCallback(async () => {
    if (!id) return;
    setIsLoadingPayments(true);
    const result = await getPaymentsUseCase.execute({
      driverId: id,
      pagination: { page: paymentPage, pageSize: paymentPageSize, sortBy: 'week', sortDirection: 'desc' },
    });
    if (result.success && result.data) {
      setPayments(result.data.items);
      setPaymentsTotal(result.data.total);
    }
    setIsLoadingPayments(false);
  }, [id, paymentPage, paymentPageSize, getPaymentsUseCase]);

  const hasChanges = useMemo(() => {
    if (!driver || !initialSnapshot) return false;
    return JSON.stringify(driver) !== JSON.stringify(initialSnapshot);
  }, [driver, initialSnapshot]);

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
    const isExpired = new Date(date) < new Date();
    setDocuments(prev => ({ ...prev, [type]: { ...prev[type], expirationDate: date, isExpired } }));
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

  const handleStatusChange = useCallback(async (newStatus: 'Enabled' | 'Disabled' | 'Suspended') => {
    if (!driver || !id) return;
    setIsSaving(true);
    const result = await updateDriverUseCase.execute({ id, data: { driverStatus: newStatus } });
    if (result.success && result.data) {
      setDriver(result.data);
      setInitialSnapshot(JSON.parse(JSON.stringify(result.data)) as IDriverDetailDTO);
    }
    setIsSaving(false);
  }, [driver, id, updateDriverUseCase]);

  return {
    driver, documents, orders, ordersTotal, payments, paymentsTotal,
    isLoading, isSaving, isLoadingOrders, isLoadingPayments, hasChanges,
    orderPage, orderPageSize, paymentPage, paymentPageSize,
    setOrderPage, setPaymentPage,
    handleInputChange, handleBeneficiaryChange, addBeneficiary, removeBeneficiary,
    handleDocStatusChange, handleDocExpirationChange,
    handleSave, handleStatusChange, loadOrders, loadPayments,
  };
}
