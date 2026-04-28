'use client';

import { Badge } from '../../ui/badge';

type DriverStatus = 'Enabled' | 'Disabled' | 'Suspended';

interface IDriverStatusBadgeProps {
  status: DriverStatus;
}

const STATUS_LABELS: Record<DriverStatus, string> = {
  Enabled: 'Habilitado',
  Disabled: 'Deshabilitado',
  Suspended: 'Suspendido',
};

export function DriverStatusBadge({ status }: IDriverStatusBadgeProps) {
  if (status === 'Enabled') {
    return <Badge variant="outline" className="badge-activo">{STATUS_LABELS[status]}</Badge>;
  }
  if (status === 'Disabled') {
    return <Badge variant="outline" className="badge-inactivo">{STATUS_LABELS[status]}</Badge>;
  }
  return (
    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
