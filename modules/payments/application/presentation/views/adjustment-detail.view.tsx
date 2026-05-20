'use client';

import { useState, useEffect } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { type IGetAdjustmentByIdUseCase } from '../../../domain/contracts/get-adjustment-by-id-use-case.interface';
import { type IUpdateAdjustmentUseCase } from '../../../domain/contracts/update-adjustment-use-case.interface';
import { type IGetStoresUseCase } from '../../../domain/contracts/get-stores-use-case.interface';
import { type AdjustmentType } from '../../../domain/contracts/adjustment.dto';
import { type IStoreDTO } from '../../../domain/contracts/order.dto';
import { useAdjustmentDetail } from '../../hooks/use-adjustment-detail.hook';
import { AdjustmentTypeBadge } from '../components/adjustment-type-badge';
import { SearchableSelect } from '../ui/searchable-select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';

interface IAdjustmentDetailViewProps {
  getAdjustmentByIdUseCase: IGetAdjustmentByIdUseCase;
  updateAdjustmentUseCase: IUpdateAdjustmentUseCase;
  getStoresUseCase: IGetStoresUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const ADJUSTMENT_TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: 'OperationalError',      label: 'Error operativo'  },
  { value: 'SystemError',           label: 'Error sistema'    },
  { value: 'OperationalAdjustment', label: 'Ajuste operativo' },
];

// ─── Campo solo lectura — patrón ejecutivo (igual que bonus-detail) ────────────
function DataField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">{label}</p>
      <p className={`text-sm font-medium text-foreground leading-snug ${mono ? 'font-mono' : ''}`}>{value || '–'}</p>
    </div>
  );
}

export function AdjustmentDetailView({ getAdjustmentByIdUseCase, updateAdjustmentUseCase, getStoresUseCase }: IAdjustmentDetailViewProps) {
  const { navigateTo, navigateBack } = useNavigationLoading();
  const { showToast } = useToast();
  const { adjustment, isLoading, isSaving, error, formData, hasChanges, handleFormChange, handleSave } =
    useAdjustmentDetail(getAdjustmentByIdUseCase);

  const [storeOptions, setStoreOptions] = useState<IStoreDTO[]>([]);

  useEffect(() => {
    getStoresUseCase.execute().then(r => {
      if (r.success && r.data) setStoreOptions(r.data);
    });
  }, [getStoresUseCase]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !adjustment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground mb-4">{error ?? 'Ajuste no encontrado'}</p>
        <Button variant="outline" onClick={() => navigateBack('/adm/pagos/ajustes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver a Ajustes
        </Button>
      </div>
    );
  }

  const currentType = formData.adjustmentType ?? adjustment.adjustmentType;

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigateBack('/adm/pagos/ajustes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono">{adjustment.adjustmentId}</h1>
              <AdjustmentTypeBadge type={adjustment.adjustmentType} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Detalle del ajuste</p>
          </div>
        </div>

        {/* Botón Guardar */}
        <Button
          onClick={() => {
            void handleSave(updateAdjustmentUseCase).then(ok => {
              if (ok) showToast({ message: 'Cambios guardados correctamente', type: 'success' });
              else showToast({ message: 'Error al guardar los cambios', type: 'danger' });
            });
          }}
          disabled={!hasChanges || isSaving}
          className="self-start sm:self-auto"
        >
          {isSaving
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando…</>
            : 'Guardar cambios'}
        </Button>
      </div>

      {/* Card principal */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Ajuste</CardTitle>
          <CardDescription>Edita los campos y guarda los cambios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Grid 4 columnas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-start">

            {/* ID — solo lectura */}
            <DataField label="ID Ajuste" value={adjustment.adjustmentId} mono />

            {/* Driver — solo lectura + botón ojo como input group */}
            <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Driver</p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-sm font-medium text-foreground leading-snug flex-1">{adjustment.driverName}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => navigateTo(`/adm/drivers/${adjustment.driverId}`)}
                  title="Ver detalle del driver"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Tienda — editable, single select via SearchableSelect */}
            <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tienda</p>
              <div className="mt-0.5">
                <SearchableSelect
                  placeholder="Seleccionar tienda…"
                  searchPlaceholder="Buscar tienda…"
                  emptyMessage="Sin tiendas disponibles"
                  options={storeOptions.map(s => ({ value: s.label, label: s.label }))}
                  selectedValues={formData.store ? [formData.store] : adjustment.store ? [adjustment.store] : []}
                  onSelect={v => handleFormChange('store', v)}
                />
              </div>
            </div>

            {/* Fecha creación — solo lectura */}
            <DataField label="Fecha creación" value={new Date(adjustment.createdAt).toLocaleDateString('es-MX')} />

            {/* Fecha aplicación — editable */}
            <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Fecha de aplicación</p>
              <Input
                type="date"
                value={formData.applicationDate ?? adjustment.applicationDate}
                onChange={e => handleFormChange('applicationDate', e.target.value)}
                className="h-9 mt-0.5"
              />
            </div>

            {/* Tipo — editable */}
            <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tipo de ajuste</p>
              <Select
                value={currentType}
                onValueChange={v => handleFormChange('adjustmentType', v as AdjustmentType)}
              >
                <SelectTrigger className="h-9 mt-0.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monto — editable */}
            <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Monto</p>
              <Input
                type="number"
                value={formData.amount ?? adjustment.amount}
                onChange={e => handleFormChange('amount', Number(e.target.value))}
                className={`h-9 mt-0.5 font-medium ${
                  (formData.amount ?? adjustment.amount) < 0
                    ? 'text-red-600'
                    : (formData.amount ?? adjustment.amount) > 0
                    ? 'text-green-600'
                    : ''
                }`}
              />
            </div>

            {/* Creado por — solo lectura */}
            <DataField label="Creado por" value={adjustment.createdBy} />

          </div>

          {/* Notas — editable, ancho completo */}
          <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
              Notas ({(formData.notes ?? adjustment.notes).length}/1500)
            </p>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-0.5 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              maxLength={1500}
              value={formData.notes ?? adjustment.notes}
              onChange={e => handleFormChange('notes', e.target.value)}
            />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
