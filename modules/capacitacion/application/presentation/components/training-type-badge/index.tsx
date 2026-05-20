'use client';

import type { TrainingType } from '@/modules/capacitacion/domain/contracts/training.dto';

interface ITrainingTypeBadgeProps {
  type: TrainingType;
}

const LABELS: Record<TrainingType, string> = {
  Mandatory:     'Obligatorio',
  Optional:      'Opcional',
  CompanyPolicy: 'Política de empresa',
};

const CLASSES: Record<TrainingType, string> = {
  Mandatory:     'badge-revision',    // amber  — requiere acción, es obligatorio
  Optional:      'badge-inactivo',    // gray   — neutro, sin urgencia
  CompanyPolicy: 'badge-propuesta',   // purple — institucional / especial
};

export function TrainingTypeBadge({ type }: ITrainingTypeBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${CLASSES[type]}`}>
      {LABELS[type]}
    </span>
  );
}
