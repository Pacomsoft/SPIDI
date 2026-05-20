'use client';

import { Badge } from '../../ui/badge';

type OrderStatus = 'Delivered' | 'Cancelled' | 'Pending' | 'InRoute';

interface IOrderStatusBadgeProps {
  status: OrderStatus;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  Delivered: 'Entregado',
  Cancelled: 'Cancelado',
  Pending: 'Pendiente',
  InRoute: 'En ruta',
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  Delivered: 'badge-activo',                                    // green  — completado/positivo
  Cancelled: 'bg-red-100 text-red-800 border-red-300',          // red    — cancelado/negativo
  Pending:   'badge-pendiente',                                  // slate  — pendiente/neutral
  InRoute:   'badge-revision',                                   // amber  — en proceso/movimiento
};

export function OrderStatusBadge({ status }: IOrderStatusBadgeProps) {
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
