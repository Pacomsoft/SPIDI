'use client';

import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { ArrowLeft } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { type IGetWeeklySummaryByIdUseCase } from '../../../domain/contracts/get-weekly-summary-by-id-use-case.interface';
import { useWeeklySummaryDetail } from '../../hooks/use-weekly-summary-detail.hook';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface IWeeklySummaryDetailViewProps {
  getWeeklySummaryByIdUseCase: IGetWeeklySummaryByIdUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function WeeklySummaryDetailView({ getWeeklySummaryByIdUseCase }: IWeeklySummaryDetailViewProps) {
  const { navigateTo, navigateBack } = useNavigationLoading();
  const { summary, isLoading, error } = useWeeklySummaryDetail(getWeeklySummaryByIdUseCase);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground mb-4">{error ?? 'Resumen no encontrado'}</p>
        <Button variant="outline" onClick={() => navigateBack('/adm/pagos/resumenes-semanales')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver a Resúmenes Semanales
        </Button>
      </div>
    );
  }

  const weekLabel = new Date(summary.weekStartDate).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Cards de métricas — íconos Material Symbols para consistencia con el menú
  const statCards: { label: string; value: string; icon: string; valueClass: string }[] = [
    {
      label: 'Check-ins',
      value: summary.totalCheckins.toString(),
      icon: 'login',
      valueClass: 'text-foreground',
    },
    {
      label: 'Pedidos',
      value: summary.totalOrders.toString(),
      icon: 'shopping_bag',
      valueClass: 'text-foreground',
    },
    {
      label: 'M. Pedidos',
      value: fmt(summary.ordersAmount),
      icon: 'account_balance_wallet',
      valueClass: 'text-green-600',
    },
    {
      label: 'M. Bonos',
      value: fmt(summary.bonusAmount),
      icon: 'card_giftcard',
      valueClass: summary.bonusAmount > 0 ? 'text-green-600' : 'text-muted-foreground',
    },
    {
      label: 'M. Ajustes',
      value: fmt(summary.adjustmentAmount),
      icon: 'tune',
      valueClass: summary.adjustmentAmount < 0
        ? 'text-red-600'
        : summary.adjustmentAmount > 0
          ? 'text-green-600'
          : 'text-muted-foreground',
    },
    {
      label: 'Total',
      value: fmt(summary.totalAmount),
      icon: 'payments',
      valueClass: summary.totalAmount < 0 ? 'text-red-600' : 'text-green-600',
    },
    {
      label: 'T. Espera',
      value: formatMinutes(summary.totalWaitTime),
      icon: 'hourglass_empty',
      valueClass: 'text-foreground',
    },
    {
      label: 'T. Trabajo',
      value: formatMinutes(summary.totalWorkTime),
      icon: 'timer',
      valueClass: 'text-foreground',
    },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigateBack('/adm/pagos/resumenes-semanales')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize">
            Semana del {weekLabel}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <a
              href={`/adm/drivers/${summary.driverId}`}
              className="font-medium underline decoration-dotted underline-offset-2 hover:text-muted-foreground transition-colors"
              onClick={e => { e.preventDefault(); navigateTo(`/adm/drivers/${summary.driverId}`); }}
            >
              {summary.driverName}
            </a>
            {' · '}{summary.rfc}
          </p>
        </div>
      </div>

      {/* Fila 1: Conteos — valores cortos, 2 cols en mobile, 4 en sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.filter((_, i) => [0, 1, 6, 7].includes(i)).map(({ label, value, icon, valueClass }) => (
          <Card key={label} className="relative overflow-hidden">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold mt-1 relative z-10 ${valueClass}`}>{value}</p>
            </CardContent>
            <Icon name={icon} className="absolute right-2 bottom-1 pointer-events-none opacity-[0.15] text-foreground" size={52} />
          </Card>
        ))}
      </div>

      {/* Fila 2: Montos — 1 col en mobile, 2 en sm, 4 en lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.slice(2, 6).map(({ label, value, icon, valueClass }) => (
          <Card key={label} className="relative overflow-hidden">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold mt-1 relative z-10 ${valueClass}`}>{value}</p>
            </CardContent>
            <Icon name={icon} className="absolute right-2 bottom-1 pointer-events-none opacity-[0.15] text-foreground" size={52} />
          </Card>
        ))}
      </div>

      {/* Tabla de resúmenes diarios */}
      <Card>
        <CardHeader>
          <CardTitle>Resúmenes diarios</CardTitle>
          <CardDescription>{summary.dailySummaries.length} día{summary.dailySummaries.length !== 1 ? 's' : ''} registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Check-ins</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">M. Pedidos</TableHead>
                  <TableHead className="text-right">M. Bonos</TableHead>
                  <TableHead className="text-right">M. Ajustes</TableHead>
                  <TableHead className="text-right">Total día</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.dailySummaries.map(d => (
                  <TableRow
                    key={d.summaryId}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => navigateTo(`/adm/pagos/resumenes-diarios/${d.summaryId}`)}
                  >
                    <TableCell className="text-sm">
                      {new Date(d.summaryDate).toLocaleDateString('es-MX', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </TableCell>
                    <TableCell className="text-right">{d.checkinCount}</TableCell>
                    <TableCell className="text-right">{d.orderCount}</TableCell>
                    {/* M. Pedidos — siempre positivo */}
                    <TableCell className="text-right text-green-600">{fmt(d.ordersAmount)}</TableCell>
                    {/* M. Bonos — verde/neutro */}
                    <TableCell className={`text-right ${d.bonusAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {fmt(d.bonusAmount)}
                    </TableCell>
                    {/* M. Ajustes — rojo/verde/neutro */}
                    <TableCell className={`text-right ${d.adjustmentAmount < 0 ? 'text-red-600' : d.adjustmentAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {fmt(d.adjustmentAmount)}
                    </TableCell>
                    {/* Total día */}
                    <TableCell className={`text-right font-semibold ${d.totalAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {fmt(d.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Fecha y hora de ejecución */}
      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <Icon name="schedule" size={14} className="opacity-60" />
        <span>
          Procesado el {new Date(summary.executionDateTime).toLocaleString('es-MX', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </div>

    </div>
  );
}
