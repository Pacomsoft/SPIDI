'use client';

import { useRef } from 'react';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { createCapacitacionModule } from '@/modules/capacitacion/infrastructure/dependency-injection';
import { TrainingFormView } from '@/modules/capacitacion/application/presentation/views/training-form.view';

export function CreateCapacitacionClient() {
  const toastContext = useToast();
  const useCasesRef = useRef(createCapacitacionModule(toastContext).useCases);

  return <TrainingFormView createTrainingUseCase={useCasesRef.current.createTraining} />;
}
