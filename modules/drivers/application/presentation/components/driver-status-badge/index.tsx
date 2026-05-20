'use client';

import type React from 'react';
import { Badge } from '../../ui/badge';

type DriverStatus = 'Enabled' | 'Disabled' | 'Suspended';

interface IDriverStatusBadgeProps {
  status: DriverStatus;
}

const STATUS_LABELS: Record<DriverStatus, string> = {
  Enabled:   'Habilitado',
  Disabled:  'Deshabilitado',
  Suspended: 'Suspendido',
};

// Paleta específica para estados de driver.
// Inline para no colisionar con badge-* globales y tener coherencia filtro ↔ tabla.
export const DRIVER_STATUS_STYLES: Record<DriverStatus, React.CSSProperties> = {
  Enabled: {
    // Verde — badge-activo / green
    borderColor:     'oklch(79.2% 0.209 151.711)',   // green-400 #05DF72
    backgroundColor: 'oklch(96.2% 0.044 156.743)',   // green-100 #DCFCE7
    color:           'oklch(0.2405 0.012 84.56)',     // #221f19
  },
  Disabled: {
    // Morado — purple
    borderColor:     'oklch(82.7% 0.119 306.383)',   // purple-300 #DAB2FF
    backgroundColor: 'oklch(94.6% 0.033 307.174)',   // purple-100 #F3E8FF
    color:           'oklch(0.2405 0.012 84.56)',
  },
  Suspended: {
    // Amarillo — amber
    borderColor:     'oklch(0.879 0.169 91.605)',    // amber-300 #FFD230
    backgroundColor: 'oklch(0.962 0.059 95.617)',    // amber-100 #FEF3C6
    color:           'oklch(0.2405 0.012 84.56)',
  },
};

export function DriverStatusBadge({ status }: IDriverStatusBadgeProps) {
  return (
    <Badge variant="outline" style={DRIVER_STATUS_STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
