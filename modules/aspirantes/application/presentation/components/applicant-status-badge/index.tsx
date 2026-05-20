'use client';

import type React from 'react';
import { Badge } from '../../ui/badge';
import type { IApplicantListItemDTO } from '../../../../domain/contracts/applicant-list.dto';

type ApplicationStatus = IApplicantListItemDTO['applicationStatus'];

// Paleta específica para estados de aspirante.
// Inline para no colisionar con badge-* globales y tener coherencia filtro ↔ tabla.
export const APPLICANT_STATUS_STYLES: Record<ApplicationStatus, React.CSSProperties> = {
  Pending: {
    // Slate — neutro/en espera
    borderColor:     'oklch(0.869 0.022 252.894)',   // slate-300 #CAD5E2
    backgroundColor: 'oklch(0.968 0.007 247.896)',   // slate-100 #F1F5F9
    color:           'oklch(0.2405 0.012 84.56)',     // #221f19
  },
  'In Review': {
    // Amber — en proceso / requiere atención
    borderColor:     'oklch(0.879 0.169 91.605)',    // amber-300 #FFD230
    backgroundColor: 'oklch(0.962 0.059 95.617)',    // amber-100 #FEF3C6
    color:           'oklch(0.2405 0.012 84.56)',
  },
  'Proposal Sent': {
    // Purple — especial / propuesta
    borderColor:     'oklch(82.7% 0.119 306.383)',   // purple-300 #DAB2FF
    backgroundColor: 'oklch(94.6% 0.033 307.174)',   // purple-100 #F3E8FF
    color:           'oklch(0.2405 0.012 84.56)',
  },
  Approved: {
    // Verde — completado / aprobado
    borderColor:     'oklch(79.2% 0.209 151.711)',   // green-400 #05DF72
    backgroundColor: 'oklch(96.2% 0.044 156.743)',   // green-100 #DCFCE7
    color:           'oklch(0.2405 0.012 84.56)',
  },
  Rejected: {
    // Rosa suave — rechazado (no el rojo de botones)
    borderColor:     'oklch(0.6813 0.1223 13.71)',   // #D97782
    backgroundColor: 'oklch(0.9358 0.0222 7.19)',    // #F8E4E7
    color:           'oklch(0.2405 0.012 84.56)',
  },
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  Pending:        'Pendiente',
  'In Review':    'En Revisión',
  'Proposal Sent':'Propuesta enviada',
  Approved:       'Aprobado',
  Rejected:       'Rechazado',
};

interface IApplicantStatusBadgeProps {
  status: ApplicationStatus;
}

export function ApplicantStatusBadge({ status }: IApplicantStatusBadgeProps) {
  return (
    <Badge variant="outline" className="whitespace-nowrap" style={APPLICANT_STATUS_STYLES[status]}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
