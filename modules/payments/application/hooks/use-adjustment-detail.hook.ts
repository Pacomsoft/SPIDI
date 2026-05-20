'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { type IGetAdjustmentByIdUseCase } from '../../domain/contracts/get-adjustment-by-id-use-case.interface';
import { type IUpdateAdjustmentUseCase } from '../../domain/contracts/update-adjustment-use-case.interface';
import { type IAdjustmentDetailDTO, type IUpdateAdjustmentDTO } from '../../domain/contracts/adjustment.dto';

export interface IUseAdjustmentDetailResult {
  adjustment: IAdjustmentDetailDTO | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  formData: IUpdateAdjustmentDTO;
  hasChanges: boolean;
  handleFormChange: (field: keyof IUpdateAdjustmentDTO, value: IUpdateAdjustmentDTO[keyof IUpdateAdjustmentDTO]) => void;
  handleSave: (updateAdjustmentUseCase: IUpdateAdjustmentUseCase) => Promise<boolean>;
}

export function useAdjustmentDetail(
  getAdjustmentByIdUseCase: IGetAdjustmentByIdUseCase,
): IUseAdjustmentDetailResult {
  const params = useParams();
  const id = params?.id as string;

  const [adjustment, setAdjustment] = useState<IAdjustmentDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<IUpdateAdjustmentDTO>({});
  const [initialFormData, setInitialFormData] = useState<IUpdateAdjustmentDTO>({});

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getAdjustmentByIdUseCase.execute(id);
      if (result.success && result.data) {
        setAdjustment(result.data);
        const initial: IUpdateAdjustmentDTO = {
          store:           result.data.store,
          applicationDate: result.data.applicationDate,
          adjustmentType:  result.data.adjustmentType,
          amount:          result.data.amount,
          notes:           result.data.notes,
        };
        setFormData(initial);
        setInitialFormData(JSON.parse(JSON.stringify(initial)) as IUpdateAdjustmentDTO);
      } else {
        setError(result.error?.message ?? 'Error al cargar el ajuste');
      }
      setIsLoading(false);
    };
    void load();
  }, [id, getAdjustmentByIdUseCase]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData],
  );

  const handleFormChange = useCallback((
    field: keyof IUpdateAdjustmentDTO,
    value: IUpdateAdjustmentDTO[keyof IUpdateAdjustmentDTO],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async (updateAdjustmentUseCase: IUpdateAdjustmentUseCase): Promise<boolean> => {
    if (!id) return false;
    setIsSaving(true);
    const result = await updateAdjustmentUseCase.execute({ id, data: formData });
    if (result.success && result.data) {
      setAdjustment(result.data);
      const updated: IUpdateAdjustmentDTO = {
        store:           result.data.store,
        applicationDate: result.data.applicationDate,
        adjustmentType:  result.data.adjustmentType,
        amount:          result.data.amount,
        notes:           result.data.notes,
      };
      setFormData(updated);
      setInitialFormData(JSON.parse(JSON.stringify(updated)) as IUpdateAdjustmentDTO);
    }
    setIsSaving(false);
    return result.success ?? false;
  }, [id, formData]);

  return { adjustment, isLoading, isSaving, error, formData, hasChanges, handleFormChange, handleSave };
}
