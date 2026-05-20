'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { type IGetBonusByIdUseCase } from '../../domain/contracts/get-bonus-by-id-use-case.interface';
import { type IUpdateBonusUseCase } from '../../domain/contracts/update-bonus-use-case.interface';
import { type IBonusDetailDTO, type IUpdateBonusDTO } from '../../domain/contracts/bonus.dto';

export interface IUseBonusDetailResult {
  bonus: IBonusDetailDTO | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isEditable: boolean;
  formData: IUpdateBonusDTO;
  hasChanges: boolean;
  handleFormChange: (field: keyof IUpdateBonusDTO, value: IUpdateBonusDTO[keyof IUpdateBonusDTO]) => void;
  handleSave: (updateBonusUseCase: IUpdateBonusUseCase) => Promise<boolean>;
}

export function useBonusDetail(
  getBonusByIdUseCase: IGetBonusByIdUseCase,
): IUseBonusDetailResult {
  const params = useParams();
  const id = params?.id as string;

  const [bonus, setBonus] = useState<IBonusDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<IUpdateBonusDTO>({});
  const [initialFormData, setInitialFormData] = useState<IUpdateBonusDTO>({});

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getBonusByIdUseCase.execute(id);
      if (result.success && result.data) {
        setBonus(result.data);
        const initial: IUpdateBonusDTO = {
          store: result.data.store ? [result.data.store] : undefined,
          startDate: result.data.startDate,
          endDate: result.data.endDate,
          bonusType: result.data.bonusType,
          bonusAmount: result.data.bonusAmount,
        };
        setFormData(initial);
        setInitialFormData(JSON.parse(JSON.stringify(initial)) as IUpdateBonusDTO);
      } else {
        setError(result.error?.message ?? 'Error al cargar el bono');
      }
      setIsLoading(false);
    };
    void load();
  }, [id, getBonusByIdUseCase]);

  const isEditable = useMemo(() => {
    if (!bonus?.endDate) return false;
    return new Date() < new Date(bonus.endDate);
  }, [bonus?.endDate]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  const handleFormChange = useCallback((
    field: keyof IUpdateBonusDTO,
    value: IUpdateBonusDTO[keyof IUpdateBonusDTO],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async (updateBonusUseCase: IUpdateBonusUseCase): Promise<boolean> => {
    if (!id) return false;
    setIsSaving(true);
    const result = await updateBonusUseCase.execute({ id, data: formData });
    if (result.success && result.data) {
      setBonus(result.data);
      const updated: IUpdateBonusDTO = {
        store: result.data.store ? [result.data.store] : undefined,
        startDate: result.data.startDate,
        endDate: result.data.endDate,
        bonusType: result.data.bonusType,
        bonusAmount: result.data.bonusAmount,
      };
      setFormData(updated);
      setInitialFormData(JSON.parse(JSON.stringify(updated)) as IUpdateBonusDTO);
    }
    setIsSaving(false);
    return result.success ?? false;
  }, [id, formData]);

  return { bonus, isLoading, isSaving, error, isEditable, formData, hasChanges, handleFormChange, handleSave };
}
