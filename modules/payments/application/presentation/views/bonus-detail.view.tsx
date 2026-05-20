'use client';

import { useState, useEffect } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { type IGetBonusByIdUseCase } from '../../../domain/contracts/get-bonus-by-id-use-case.interface';
import { type IUpdateBonusUseCase } from '../../../domain/contracts/update-bonus-use-case.interface';
import { type IGetStoresUseCase } from '../../../domain/contracts/get-stores-use-case.interface';
import { type BonusType, type IUpdateBonusDTO } from '../../../domain/contracts/bonus.dto';
import { type IStoreDTO } from '../../../domain/contracts/order.dto';
import { useBonusDetail } from '../../hooks/use-bonus-detail.hook';
import { BonusTypeBadge } from '../components/bonus-type-badge';
import { SearchableSelect } from '../ui/searchable-select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface IBonusDetailViewProps {
  getBonusByIdUseCase: IGetBonusByIdUseCase;
  updateBonusUseCase: IUpdateBonusUseCase;
  getStoresUseCase: IGetStoresUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const BONUS_TYPE_OPTIONS: { value: BonusType; label: string }[] = [
  { value: 'Punctuality',     label: 'Puntualidad'      },
  { value: 'Productivity',    label: 'Productividad'    },
  { value: 'SpecialSchedule', label: 'Horario especial' },
  { value: 'Zone',            label: 'Zona'             },
  { value: 'Weather',         label: 'Clima'            },
];

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium bg-muted">
      {label}
      <button onClick={onRemove} className="hover:text-destructive transition-colors ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ─── Campo solo lectura — patrón ejecutivo ────────────────────────────────────
function DataField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">{label}</p>
      <p className={`text-sm font-medium text-foreground leading-snug ${mono ? 'font-mono' : ''}`}>{value || '–'}</p>
    </div>
  );
}

export function BonusDetailView({ getBonusByIdUseCase, updateBonusUseCase, getStoresUseCase }: IBonusDetailViewProps) {
  const { navigateTo, navigateBack } = useNavigationLoading();
  const { showToast } = useToast();
  const { bonus, isLoading, isSaving, error, isEditable, formData, hasChanges, handleFormChange, handleSave } =
    useBonusDetail(getBonusByIdUseCase);

  const [storeOptions, setStoreOptions] = useState<IStoreDTO[]>([]);

  // Catálogo de tiendas — API real
  useEffect(() => {
    getStoresUseCase.execute().then(r => {
      if (r.success && r.data) setStoreOptions(r.data);
    });
  }, [getStoresUseCase]);

  // Tienda seleccionada actualmente (array de labels)
  const selectedStores: string[] = formData.store ?? (bonus?.store ? [bonus.store] : []);

  const addStore = (label: string) => {
    if (!selectedStores.includes(label))
      handleFormChange('store', [...selectedStores, label] as IUpdateBonusDTO['store']);
  };

  const removeStore = (label: string) => {
    handleFormChange('store', selectedStores.filter(s => s !== label) as IUpdateBonusDTO['store']);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !bonus) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground mb-4">{error ?? 'Bono no encontrado'}</p>
        <Button variant="outline" onClick={() => navigateBack('/adm/pagos/bonos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver a Bonos
        </Button>
      </div>
    );
  }

  const currentBonusType = formData.bonusType ?? bonus.bonusType;

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigateBack('/adm/pagos/bonos')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono">{bonus.bonusId}</h1>
              <BonusTypeBadge type={bonus.bonusType} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Detalle del bono</p>
          </div>
        </div>

        {/* Botón Guardar — en el header para que siempre sea visible */}
        {isEditable && (
          <Button
            onClick={() => {
                void handleSave(updateBonusUseCase).then(ok => {
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
        )}
      </div>

      {/* Aviso solo lectura */}
      {!isEditable && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Este bono venció el {new Date(bonus.endDate).toLocaleDateString('es-MX')} y no puede modificarse.
        </div>
      )}

      {/* Card principal */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Bono</CardTitle>
          <CardDescription>
            {isEditable ? 'Edita los campos y guarda los cambios' : 'Solo lectura — bono fuera de vigencia'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Grid único de 4 columnas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-start">

            {/* ID — siempre solo lectura */}
            <DataField label="ID Bono" value={bonus.bonusId} mono />

            {/* Tienda */}
            {isEditable ? (
              <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tienda</p>
                <div className="space-y-1.5 mt-0.5">
                  <SearchableSelect
                    placeholder="Agregar tienda…"
                    searchPlaceholder="Buscar tienda…"
                    emptyMessage="Sin tiendas disponibles"
                    options={storeOptions.map(s => ({ value: s.label, label: s.label }))}
                    selectedValues={selectedStores}
                    onSelect={addStore}
                  />
                  {selectedStores.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStores.map(s => (
                        <Chip key={s} label={s} onRemove={() => removeStore(s)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <DataField label="Tienda" value={bonus.store || '–'} />
            )}

            {/* Tipo de bono */}
            {isEditable ? (
              <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tipo de bono</p>
                <div className="mt-0.5">
                  <Select
                    value={currentBonusType}
                    onValueChange={v => handleFormChange('bonusType', v as BonusType)}
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BONUS_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <DataField label="Tipo de bono" value={BONUS_TYPE_OPTIONS.find(o => o.value === bonus.bonusType)?.label ?? bonus.bonusType} />
            )}

            {/* Fecha creación — solo lectura */}
            <DataField label="Fecha creación" value={new Date(bonus.createdAt).toLocaleDateString('es-MX')} />

            {/* Inicio vigencia */}
            {isEditable ? (
              <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Inicio vigencia</p>
                <Input
                  type="date"
                  value={formData.startDate ?? bonus.startDate}
                  onChange={e => handleFormChange('startDate', e.target.value)}
                  className="h-9 mt-0.5"
                />
              </div>
            ) : (
              <DataField label="Inicio vigencia" value={new Date(bonus.startDate).toLocaleDateString('es-MX')} />
            )}

            {/* Fin vigencia */}
            {isEditable ? (
              <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Fin vigencia</p>
                <Input
                  type="date"
                  value={formData.endDate ?? bonus.endDate}
                  onChange={e => handleFormChange('endDate', e.target.value)}
                  className="h-9 mt-0.5"
                />
              </div>
            ) : (
              <DataField label="Fin vigencia" value={new Date(bonus.endDate).toLocaleDateString('es-MX')} />
            )}

            {/* Monto */}
            {isEditable ? (
              <div className="flex flex-col gap-0.5 pt-1 pb-2 border-b border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Monto</p>
                <Input
                  type="number"
                  min={0}
                  value={formData.bonusAmount ?? bonus.bonusAmount}
                  onChange={e => handleFormChange('bonusAmount', Number(e.target.value))}
                  className="h-9 mt-0.5"
                />
              </div>
            ) : (
              <DataField label="Monto" value={fmt(bonus.bonusAmount)} />
            )}

            {/* Mínimo de pedidos — solo lectura */}
            <DataField label="Mínimo de pedidos" value={String(bonus.minimumOrders)} />

            {/* Umbral — solo lectura, condicional */}
            {bonus.threshold !== undefined && (
              <DataField label="Umbral" value={String(bonus.threshold)} />
            )}

            {/* Creado por — solo lectura */}
            <DataField label="Creado por" value={bonus.createdBy} />

            {/* Última modificación — solo lectura */}
            <DataField label="Última modificación" value={bonus.lastModifiedBy} />

          </div>

        </CardContent>
      </Card>

      {/* Pedidos afectados */}
      {bonus.affectedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pedidos afectados</CardTitle>
            <CardDescription>{bonus.affectedOrders.length} pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Pedido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonus.affectedOrders.map(orderId => (
                    <TableRow
                      key={orderId}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => navigateTo(`/adm/pagos/pedidos/${orderId}`)}
                    >
                      <TableCell className="font-mono text-sm">{orderId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
