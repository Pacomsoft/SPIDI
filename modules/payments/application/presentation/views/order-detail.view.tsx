'use client';

import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { ArrowLeft, UserCheck, Truck, PackageCheck, CalendarClock, type LucideIcon } from 'lucide-react';
import { type IGetOrderByIdUseCase } from '../../../domain/contracts/get-order-by-id-use-case.interface';
import { useOrderDetail } from '../../hooks/use-order-detail.hook';
import { OrderStatusBadge } from '../components/order-status-badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface IOrderDetailViewProps {
  getOrderByIdUseCase: IGetOrderByIdUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

interface ITimelinePoint {
  label: string;
  date: string | undefined;
  Icon: LucideIcon;
}

function OrderTimeline({ points }: { points: ITimelinePoint[] }) {
  return (
    <>
      {/* ── Mobile: lista vertical ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-0 sm:hidden">
        {points.map((point, idx) => {
          const active = !!point.date;
          return (
            <div key={idx} className="flex items-start gap-3">
              {/* Icono + connector */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors
                  ${active ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'}`}>
                  <point.Icon className="w-4 h-4" />
                </div>
                {idx < points.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border my-1 min-h-[1.5rem]" />
                )}
              </div>
              {/* Label + date */}
              <div className="pb-4 pt-1">
                <p className={`text-xs font-semibold leading-none ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {point.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {point.date
                    ? new Date(point.date).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Pendiente'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop: línea horizontal ──────────────────────────────────────── */}
      <div className="hidden sm:flex items-start w-full py-2">
        {points.map((point, idx) => {
          const active = !!point.date;
          return (
            <div key={idx} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                  ${active ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'}`}>
                  <point.Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-semibold text-center leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {point.label}
                </span>
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  {point.date
                    ? new Date(point.date).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Pendiente'}
                </span>
              </div>
              {idx < points.length - 1 && (
                <div className="w-8 shrink-0 h-0.5 bg-border mt-5" />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function OrderDetailView({ getOrderByIdUseCase }: IOrderDetailViewProps) {
  const { navigateTo, navigateBack } = useNavigationLoading();
  const { order, isLoading, error } = useOrderDetail(getOrderByIdUseCase);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground mb-4">{error ?? 'Pedido no encontrado'}</p>
        <Button variant="outline" onClick={() => navigateBack('/adm/pagos/pedidos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver a Pedidos
        </Button>
      </div>
    );
  }

  const timelinePoints: ITimelinePoint[] = [
    { label: 'Asignado',     date: order.assignedAt,   Icon: UserCheck     },
    { label: 'En ruta',      date: order.startedAt,    Icon: Truck         },
    { label: 'Cerrado',      date: order.closedAt,     Icon: PackageCheck  },
    { label: 'Slot cliente', date: order.customerSlot, Icon: CalendarClock },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigateBack('/adm/pagos/pedidos')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono">{order.orderId}</h1>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Detalle del pedido</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Pedido</CardTitle>
          <CardDescription>Datos generales y tiempos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Driver</p>
              <p className="font-medium">
                <a
                  href={`/adm/drivers/${order.driverId}`}
                  className="text-primary hover:underline"
                  onClick={e => { e.preventDefault(); navigateTo(`/adm/drivers/${order.driverId}`); }}
                >
                  {order.driverName}
                </a>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tienda</p>
              <p>{order.store}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Fecha/Hora Entrega</p>
              <p>{new Date(order.deliveryDateTime).toLocaleString('es-MX')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Ruta ID</p>
              <p className="font-mono text-sm">{order.routeId ?? '–'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">TIMELINE</p>
            <OrderTimeline points={timelinePoints} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Montos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pago base</p>
                <p className="text-lg font-semibold">{fmt(order.paymentAmount)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Bonus</p>
                <p className={`text-lg font-semibold ${order.bonusAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {fmt(order.bonusAmount)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Ajuste</p>
                <p className={`text-lg font-semibold ${order.adjustmentAmount < 0 ? 'text-red-600' : order.adjustmentAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {fmt(order.adjustmentAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.appliedBonuses.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Bonos aplicados</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {order.appliedBonuses.map(b => (
                  <li key={b.bonusId} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <span className="font-mono text-sm text-muted-foreground">{b.bonusId}</span>
                      <span className="ml-2 text-sm">{b.bonusType}</span>
                    </div>
                    <span className="font-medium text-green-600">{fmt(b.amount)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <div className="hidden lg:block" />
        )}
      </div>
    </div>
  );
}
