'use client';

import { Badge } from '../../ui/badge';
import type { IApplicantListItemDTO } from '../../../../domain/contracts/applicant-list.dto';

type ApplicationStatus = IApplicantListItemDTO['applicationStatus'];

const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  Approved: 'badge-aprobado',
  Rejected: 'badge-rechazado',
  'In Review': 'badge-revision',
  'Proposal Sent': 'badge-propuesta',
  Pending: 'badge-pendiente',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  Pending: 'Pendiente',
  'In Review': 'En Revisión',
  'Proposal Sent': 'Propuesta enviada',
  Approved: 'Aprobado',
  Rejected: 'Rechazado',
};

interface IApplicantStatusBadgeProps {
  status: ApplicationStatus;
}

export function ApplicantStatusBadge({ status }: IApplicantStatusBadgeProps) {
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${STATUS_CLASSES[status] ?? ''}`}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
