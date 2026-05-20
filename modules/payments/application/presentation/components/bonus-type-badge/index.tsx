'use client';

import { Badge } from '../../ui/badge';

type BonusType = 'Punctuality' | 'Productivity' | 'SpecialSchedule' | 'Zone' | 'Weather';

interface IBonusTypeBadgeProps {
  type: BonusType;
}

const TYPE_LABELS: Record<BonusType, string> = {
  Punctuality: 'Puntualidad',
  Productivity: 'Productividad',
  SpecialSchedule: 'Horario especial',
  Zone: 'Zona',
  Weather: 'Clima',
};

const TYPE_CLASSES: Record<BonusType, string> = {
  Punctuality:     'badge-pendiente',                                  // slate  — informativo neutral
  Productivity:    'badge-activo',                                     // green  — positivo/productivo
  SpecialSchedule: 'badge-propuesta',                                  // purple — especial/distinto
  Zone:            'badge-revision',                                   // amber  — geográfico/territorial
  Weather:         'bg-blue-100 text-blue-800 border-blue-300',        // blue   — climático/externo
};

export function BonusTypeBadge({ type }: IBonusTypeBadgeProps) {
  return (
    <Badge variant="outline" className={TYPE_CLASSES[type]}>
      {TYPE_LABELS[type]}
    </Badge>
  );
}
