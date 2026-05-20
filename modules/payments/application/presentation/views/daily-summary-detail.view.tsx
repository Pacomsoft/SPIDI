'use client';

import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { ArrowLeft } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { type IGetDailySummaryByIdUseCase } from '../../../domain/contracts/get-daily-summary-by-id-use-case.interface';
import { useDailySummaryDetail } from '../../hooks/use-daily-summary-detail.hook';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface IDailySummaryDetailViewProps {
  getDailySummaryByIdUseCase: IGetDailySummaryByIdUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

export function DailySummaryDetailView({ getDailySummaryByIdUseCase }: IDailySummaryDetailViewProps) {
  const { navigateTo, navigateBack } = useNavigationLoading();
  const { summary, isLoading, error } = useDailySummaryDetail(getDailySummaryByIdUseCase);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground mb-4">{error ?? 'Resumen no encontrado'}</p>
        <Button variant="outline" onClick={() => navigateBack('/adm/pagos/resumenes-diarios')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver a Resúmenes Diarios
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigateBack('/adm/pagos/resumenes-diarios')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Resumen del {new Date(summary.summaryDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
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

      {/* Fila 1: Actividad */}
      <div className="grid grid-cols-2 gap-4">
        {([
          { label: 'Check-ins', value: summary.checkinCount.toString(), icon: 'login',         valueClass: 'text-foreground' },
          { label: 'Pedidos',   value: summary.orderCount.toString(),   icon: 'shopping_bag',  valueClass: 'text-foreground' },
        ] as { label: string; value: string; icon: string; valueClass: string }[]).map(({ label, value, icon, valueClass }) => (
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
        {([
          { label: 'M. Pedidos', value: fmt(summary.ordersAmount),      icon: 'account_balance_wallet', valueClass: 'text-green-600' },
          { label: 'M. Bonos',   value: fmt(summary.bonusAmount),       icon: 'card_giftcard',          valueClass: summary.bonusAmount > 0 ? 'text-green-600' : 'text-muted-foreground' },
          { label: 'M. Ajustes', value: fmt(summary.adjustmentAmount),  icon: 'tune',                   valueClass: summary.adjustmentAmount < 0 ? 'text-red-600' : summary.adjustmentAmount > 0 ? 'text-green-600' : 'text-muted-foreground' },
          { label: 'Total',      value: fmt(summary.totalAmount),       icon: 'payments',               valueClass: summary.totalAmount < 0 ? 'text-red-600' : 'text-green-600' },
        ] as { label: string; value: string; icon: string; valueClass: string }[]).map(({ label, value, icon, valueClass }) => (
          <Card key={label} className="relative overflow-hidden">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold mt-1 relative z-10 ${valueClass}`}>{value}</p>
            </CardContent>
            <Icon name={icon} className="absolute right-2 bottom-1 pointer-events-none opacity-[0.15] text-foreground" size={52} />
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos relacionados</CardTitle>
          <CardDescription>{summary.relatedOrders.length} pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pedido</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.relatedOrders.map(o => (
                  <TableRow
                    key={o.orderId}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => navigateTo(`/adm/pagos/pedidos/${o.orderId}`)}
                  >
                    <TableCell className="font-mono text-sm">{o.orderId}</TableCell>
                    <TableCell>{o.store}</TableCell>
                    <TableCell className="text-sm">{new Date(o.deliveryDateTime).toLocaleString('es-MX')}</TableCell>
                    <TableCell className="text-right">{fmt(o.paymentAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bonos relacionados</CardTitle>
          <CardDescription>{summary.relatedBonuses.length} bonos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Bono</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.relatedBonuses.map(b => (
                  <TableRow
                    key={b.bonusId}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => navigateTo(`/adm/pagos/bonos/${b.bonusId}`)}
                  >
                    <TableCell className="font-mono text-sm">{b.bonusId}</TableCell>
                    <TableCell>{b.bonusType}</TableCell>
                    <TableCell className="text-right text-green-600">{fmt(b.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajustes relacionados</CardTitle>
          <CardDescription>{summary.relatedAdjustments.length} ajustes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Ajuste</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.relatedAdjustments.map(a => (
                  <TableRow
                    key={a.adjustmentId}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => navigateTo(`/adm/pagos/ajustes/${a.adjustmentId}`)}
                  >
                    <TableCell className="font-mono text-sm">{a.adjustmentId}</TableCell>
                    <TableCell>{a.adjustmentType}</TableCell>
                    <TableCell className={`text-right ${a.amount < 0 ? 'text-red-600' : a.amount > 0 ? 'text-green-600' : ''}`}>
                      {fmt(a.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
