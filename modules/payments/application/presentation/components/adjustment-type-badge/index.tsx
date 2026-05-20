'use client';

import { Badge } from '../../ui/badge';

type AdjustmentType = 'OperationalError' | 'SystemError' | 'OperationalAdjustment';

interface IAdjustmentTypeBadgeProps {
  type: AdjustmentType;
}

const TYPE_LABELS: Record<AdjustmentType, string> = {
  OperationalError: 'Error operativo',
  SystemError: 'Error sistema',
  OperationalAdjustment: 'Ajuste operativo',
};

const TYPE_CLASSES: Record<AdjustmentType, string> = {
  OperationalError:      'bg-red-100 text-red-800 border-red-300',    // red    — error/problema
  SystemError:           'badge-revision',                             // amber  — alerta/atención
  OperationalAdjustment: 'badge-pendiente',                           // slate  — neutro/administrativo
};

export function AdjustmentTypeBadge({ type }: IAdjustmentTypeBadgeProps) {
  return (
    <Badge variant="outline" className={TYPE_CLASSES[type]}>
      {TYPE_LABELS[type]}
    </Badge>
  );
}
