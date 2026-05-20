'use client';

import { useRef } from 'react';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { createCapacitacionModule } from '@/modules/capacitacion/infrastructure/dependency-injection';
import { TrainingDetailView } from '@/modules/capacitacion/application/presentation/views/training-detail.view';

export function CapacitacionDetailClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createCapacitacionModule(toastContext).useCases);

  return (
    <TrainingDetailView
      getTrainingByIdUseCase={useCasesRef.current.getTrainingById}
      updateTrainingUseCase={useCasesRef.current.updateTraining}
      sendTrainingUseCase={useCasesRef.current.sendTraining}
      getTrainingProgressUseCase={useCasesRef.current.getTrainingProgress}
      exportTrainingProgressUseCase={useCasesRef.current.exportTrainingProgress}
    />
  );
}
