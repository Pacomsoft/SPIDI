'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { type IGetOrderByIdUseCase } from '../../domain/contracts/get-order-by-id-use-case.interface';
import { type IOrderDetailDTO } from '../../domain/contracts/order.dto';

export interface IUseOrderDetailResult {
  order: IOrderDetailDTO | null;
  isLoading: boolean;
  error: string | null;
}

export function useOrderDetail(
  getOrderByIdUseCase: IGetOrderByIdUseCase,
): IUseOrderDetailResult {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<IOrderDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getOrderByIdUseCase.execute(id);
      if (result.success && result.data) {
        setOrder(result.data);
      } else {
        setError(result.error?.message ?? 'Error al cargar el pedido');
      }
      setIsLoading(false);
    };
    void load();
  }, [id, getOrderByIdUseCase]);

  return { order, isLoading, error };
}
