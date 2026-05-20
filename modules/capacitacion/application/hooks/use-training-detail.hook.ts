'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { IGetTrainingByIdUseCase } from '../../domain/contracts/get-training-by-id-use-case.interface';
import type { IUpdateTrainingUseCase } from '../../domain/contracts/update-training-use-case.interface';
import type { ISendTrainingUseCase } from '../../domain/contracts/send-training-use-case.interface';
import type { IGetTrainingProgressUseCase } from '../../domain/contracts/export-training-progress-use-case.interface';
import type {
  ITrainingDetailDTO,
  IUpdateTrainingDTO,
  ISendTrainingDTO,
  ITrainingProgressDTO,
} from '../../domain/contracts/training.dto';

export interface IUseTrainingDetailResult {
  training: ITrainingDetailDTO | null;
  isLoading: boolean;
  error: string | null;
  progress: ITrainingProgressDTO[];
  isLoadingProgress: boolean;
  formData: IUpdateTrainingDTO;
  hasChanges: boolean;
  isSaving: boolean;
  handleFormChange: (patch: Partial<IUpdateTrainingDTO>) => void;
  handleSave: (updateUseCase: IUpdateTrainingUseCase) => Promise<void>;
  sendData: ISendTrainingDTO;
  isSending: boolean;
  handleSendDataChange: (patch: Partial<ISendTrainingDTO>) => void;
  handleSend: (sendUseCase: ISendTrainingUseCase) => Promise<void>;
  handleExportProgress: (exportUseCase: { execute: (input: { trainingId: string; format: string }) => Promise<{ success: boolean; data?: Blob }> }, format: string) => Promise<void>;
  isExportingProgress: boolean;
}

export function useTrainingDetail(
  getTrainingByIdUseCase: IGetTrainingByIdUseCase,
  getTrainingProgressUseCase: IGetTrainingProgressUseCase,
): IUseTrainingDetailResult {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  const [training, setTraining] = useState<ITrainingDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ITrainingProgressDTO[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isExportingProgress, setIsExportingProgress] = useState(false);
  const [formData, setFormData] = useState<IUpdateTrainingDTO>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sendData, setSendData] = useState<ISendTrainingDTO>({
    trainingId: id,
    sendType: 'Individual',
    recipientEmails: [],
  });
  const [isSending, setIsSending] = useState(false);

  const getByIdRef = useRef(getTrainingByIdUseCase);
  const getProgressRef = useRef(getTrainingProgressUseCase);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      setIsLoadingProgress(true);
      setError(null);

      const [trainingResult, progressResult] = await Promise.all([
        getByIdRef.current.execute(id),
        getProgressRef.current.execute(id),
      ]);

      if (trainingResult.success && trainingResult.data) {
        setTraining(trainingResult.data);
        setFormData({
          title: trainingResult.data.title,
          trainingType: trainingResult.data.trainingType,
          content: trainingResult.data.content,
          documentUrl: trainingResult.data.documentUrl,
          hasQuiz: trainingResult.data.hasQuiz,
          questions: trainingResult.data.questions,
          minimumScore: trainingResult.data.minimumScore,
          isOnboarding: trainingResult.data.isOnboarding ?? false,
        });
        setSendData((prev) => ({ ...prev, trainingId: trainingResult.data!.trainingId }));
      } else {
        setError(trainingResult.error?.message ?? 'Error al cargar la capacitación');
      }

      if (progressResult.success && progressResult.data) {
        setProgress(progressResult.data);
      }

      setIsLoading(false);
      setIsLoadingProgress(false);
    };
    void load();
  }, [id]);

  const handleFormChange = useCallback((patch: Partial<IUpdateTrainingDTO>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async (updateUseCase: IUpdateTrainingUseCase) => {
    if (!training) return;
    setIsSaving(true);
    const result = await updateUseCase.execute({ id: training.trainingId, data: formData });
    if (result.success && result.data) {
      setTraining(result.data);
      setHasChanges(false);
    }
    setIsSaving(false);
  }, [training, formData]);

  const handleSendDataChange = useCallback((patch: Partial<ISendTrainingDTO>) => {
    setSendData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSend = useCallback(async (sendUseCase: ISendTrainingUseCase) => {
    setIsSending(true);
    const result = await sendUseCase.execute(sendData);
    if (!result.success) {
      // error toast handled by repository
    }
    setIsSending(false);
  }, [sendData]);

  const handleExportProgress = useCallback(async (
    exportUseCase: { execute: (input: { trainingId: string; format: string }) => Promise<{ success: boolean; data?: Blob }> },
    format: string,
  ) => {
    if (!training) return;
    setIsExportingProgress(true);
    const result = await exportUseCase.execute({ trainingId: training.trainingId, format });
    if (result.success && result.data) {
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `progreso_${training.trainingId}_${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setIsExportingProgress(false);
  }, [training]);

  return {
    training, isLoading, error,
    progress, isLoadingProgress,
    formData, hasChanges, isSaving,
    handleFormChange, handleSave,
    sendData, isSending,
    handleSendDataChange, handleSend,
    handleExportProgress, isExportingProgress,
  };
}
