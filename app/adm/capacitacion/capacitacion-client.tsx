'use client';

import { createCapacitacionModule } from '@/modules/capacitacion/infrastructure/dependency-injection';
import { TrainingsListView } from '@/modules/capacitacion/application/presentation/views/trainings-list.view';

const capacitacionModule = createCapacitacionModule();

export function CapacitacionClient() {
  return (
    <TrainingsListView
      getTrainingsUseCase={capacitacionModule.useCases.getTrainings}
      exportTrainingsUseCase={capacitacionModule.useCases.exportTrainings}
      createTrainingUseCase={capacitacionModule.useCases.createTraining}
    />
  );
}
