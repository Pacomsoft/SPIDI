'use client';

import { useState, useEffect, useRef } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Plus, X, Loader2 } from 'lucide-react';
import { type IGetAdjustmentsUseCase } from '../../../domain/contracts/get-adjustments-use-case.interface';
import { type IExportAdjustmentsUseCase } from '../../../domain/contracts/export-adjustments-use-case.interface';
import { type ICreateAdjustmentUseCase } from '../../../domain/contracts/create-adjustment-use-case.interface';
import { type IGetStoresUseCase } from '../../../domain/contracts/get-stores-use-case.interface';
import { type AdjustmentType, type ICreateAdjustmentDTO } from '../../../domain/contracts/adjustment.dto';
import { type IStoreDTO } from '../../../domain/contracts/order.dto';
import { type IGetDriversUseCase } from '@/modules/drivers/domain/contracts/get-drivers-use-case.interface';
import { type IDriverListItemDTO } from '@/modules/drivers/domain/contracts/driver-list.dto';
import { useAdjustmentsList } from '../../hooks/use-adjustments-list.hook';
import { AdjustmentTypeBadge } from '../components/adjustment-type-badge';
import { SearchableSelect } from '../ui/searchable-select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface IAdjustmentsListViewProps {
  getAdjustmentsUseCase: IGetAdjustmentsUseCase;
  exportAdjustmentsUseCase: IExportAdjustmentsUseCase;
  createAdjustmentUseCase: ICreateAdjustmentUseCase;
  getStoresUseCase: IGetStoresUseCase;
  getDriversUseCase: IGetDriversUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

type SortKey = 'createdAt' | 'applicationDate' | 'adjustmentType' | 'amount' | 'driverName' | 'adjustmentId';

const ADJUSTMENT_TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: 'OperationalError',      label: 'Error operativo'  },
  { value: 'SystemError',           label: 'Error sistema'    },
  { value: 'OperationalAdjustment', label: 'Ajuste operativo' },
];

// ─── Chip ─────────────────────────────────────────────────────────────────────
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

// ─── Validación modal ─────────────────────────────────────────────────────────
type FormState = ICreateAdjustmentDTO;

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const EMPTY_FORM: FormState = {
  driverId: '',
  store: '',
  applicationDate: getYesterday(),
  adjustmentType: 'OperationalError',
  amount: 0,
  notes: '',
};

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.driverId)        errors.driverId = 'Selecciona un driver';
  if (!form.store)           errors.store = 'Selecciona una tienda';
  if (!form.applicationDate) errors.applicationDate = 'Requerido';
  if (form.amount === 0)     errors.amount = 'Debe ser distinto de 0';
  if (!form.notes.trim())    errors.notes = 'Requerido';
  return errors;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

// ─── Modal crear ajuste ───────────────────────────────────────────────────────
function CreateAdjustmentModal({
  storeOptions,
  getDriversUseCase,
  onClose,
  onCreate,
}: {
  storeOptions: IStoreDTO[];
  getDriversUseCase: IGetDriversUseCase;
  onClose: () => void;
  onCreate: (data: ICreateAdjustmentDTO) => Promise<boolean>;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [drivers, setDrivers] = useState<IDriverListItemDTO[]>([]);
  const [driverSearch, setDriverSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showToast } = useToast();

  // Carga drivers con debounce en la búsqueda
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void getDriversUseCase.execute({ page: 1, pageSize: 50, sortBy: 'firstName', sortDirection: 'asc', search: driverSearch || undefined })
        .then(r => { if (r.success && r.data) setDrivers(r.data.items); });
    }, 300);
  }, [driverSearch, getDriversUseCase]);

  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  const touch = (...fields: (keyof FormState)[]) =>
    setTouched(prev => Object.fromEntries([...Object.entries(prev), ...fields.map(f => [f, true])]));

  const fmtAmount = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  const handleAmountChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.\-]/g, '');
    const num = parseFloat(cleaned);
    setForm(p => ({ ...p, amount: isNaN(num) ? 0 : num }));
    touch('amount');
  };

  const selectedDriver = drivers.find(d => d.id === form.driverId);

  const handleSubmit = async () => {
    setTouched({ driverId: true, store: true, applicationDate: true, amount: true, notes: true });
    if (!isValid) return;
    setIsSaving(true);
    const ok = await onCreate(form);
    setIsSaving(false);
    if (ok) {
      showToast({ message: 'Ajuste creado correctamente', type: 'success' });
      onClose();
    } else {
      showToast({ message: 'Error al crear el ajuste', type: 'danger' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="relative px-6 pt-6 pb-2">
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">Crear ajuste</h2>
        </div>
        <div className="px-6 pb-6 space-y-4">

          {/* Driver — SearchableSelect con nombre + CURP, búsqueda en tiempo real */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Driver</label>
            <SearchableSelect
              placeholder="Buscar driver…"
              searchPlaceholder="Nombre o CURP…"
              emptyMessage="Sin drivers disponibles"
              externalSearch={driverSearch}
              onExternalSearchChange={setDriverSearch}
              options={drivers.map(d => ({
                value: d.id,
                label: `${d.firstName} ${d.paternalLastName} ${d.maternalLastName}`,
                description: d.curp,
              }))}
              selectedValues={form.driverId ? [form.driverId] : []}
              onSelect={v => { setForm(p => ({ ...p, driverId: v })); touch('driverId'); }}
              displayValue={selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.paternalLastName} ${selectedDriver.maternalLastName}` : undefined}
            />
            {selectedDriver && (
              <p className="text-xs text-muted-foreground">CURP: {selectedDriver.curp}</p>
            )}
            {touched.driverId && <FieldError msg={errors.driverId} />}
          </div>

          {/* Tienda */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tienda</label>
            <SearchableSelect
              placeholder="Seleccionar tienda…"
              searchPlaceholder="Buscar tienda…"
              emptyMessage="Sin tiendas disponibles"
              options={storeOptions.map(s => ({ value: s.label, label: s.label }))}
              selectedValues={form.store ? [form.store] : []}
              onSelect={v => { setForm(p => ({ ...p, store: v })); touch('store'); }}
            />
            {touched.store && <FieldError msg={errors.store} />}
          </div>

          {/* Fecha de aplicación — default: ayer */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Fecha de aplicación</label>
            <Input
              type="date"
              value={form.applicationDate}
              onChange={e => { setForm(p => ({ ...p, applicationDate: e.target.value })); touch('applicationDate'); }}
              onBlur={() => touch('applicationDate')}
            />
            {touched.applicationDate && <FieldError msg={errors.applicationDate} />}
          </div>

          {/* Tipo de ajuste */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tipo de ajuste</label>
            <Select value={form.adjustmentType} onValueChange={v => setForm(p => ({ ...p, adjustmentType: v as AdjustmentType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monto — formateado como divisa con preview */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Monto de ajuste</label>
            <Input
              placeholder="Ej. -150.00 o 200.00"
              value={form.amount === 0 ? '' : String(form.amount)}
              onChange={e => handleAmountChange(e.target.value)}
              onBlur={() => touch('amount')}
            />
            {form.amount !== 0 && (
              <p className={`text-xs font-medium ${form.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {fmtAmount(form.amount)}
              </p>
            )}
            {touched.amount && <FieldError msg={errors.amount} />}
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
              Notas ({form.notes.length}/1500)
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              maxLength={1500}
              value={form.notes}
              onChange={e => { setForm(p => ({ ...p, notes: e.target.value })); touch('notes'); }}
              onBlur={() => touch('notes')}
              placeholder="Describe el motivo del ajuste…"
            />
            {touched.notes && <FieldError msg={errors.notes} />}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { void handleSubmit(); }} disabled={!isValid || isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando…</> : 'Guardar'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function AdjustmentsListView({
  getAdjustmentsUseCase,
  exportAdjustmentsUseCase,
  createAdjustmentUseCase,
  getStoresUseCase,
  getDriversUseCase,
}: IAdjustmentsListViewProps) {
  const { navigateTo } = useNavigationLoading();
  const [showModal, setShowModal] = useState(false);
  const [storeOptions, setStoreOptions] = useState<IStoreDTO[]>([]);

  const {
    adjustments, total, isLoading, page, pageSize, sortBy, sortDirection,
    driverName, applicationDateFrom, applicationDateTo, store, adjustmentType,
    isExporting,
    setPage, setPageSize, setSortBy, setSortDirection,
    setDriverName, setApplicationDateFrom, setApplicationDateTo, setStore, setAdjustmentType,
    handleExport, clearFilters,
  } = useAdjustmentsList(getAdjustmentsUseCase, exportAdjustmentsUseCase);

  // Catálogo de tiendas — API real
  useEffect(() => {
    getStoresUseCase.execute().then(r => {
      if (r.success && r.data) setStoreOptions(r.data);
    });
  }, [getStoresUseCase]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortBy('createdAt'); setSortDirection('desc'); }
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortBy !== key) return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4 ml-1" />;
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const toggleType = (t: AdjustmentType) =>
    setAdjustmentType(adjustmentType.includes(t) ? adjustmentType.filter(x => x !== t) : [...adjustmentType, t]);

  const toggleStoreFilter = (s: string) =>
    setStore(store.includes(s) ? store.filter(x => x !== s) : [...store, s]);

  const handleCreate = async (data: ICreateAdjustmentDTO): Promise<boolean> => {
    const result = await createAdjustmentUseCase.execute(data);
    if (result.success) clearFilters();
    return result.success ?? false;
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <CreateAdjustmentModal
          storeOptions={storeOptions}
          getDriversUseCase={getDriversUseCase}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col gap-4">

            {/* Título + acciones */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ajustes</h1>
                <p className="text-sm text-muted-foreground mt-1">{total} ajustes en total</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Export — DropdownMenu para evitar bug de re-disparo */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExporting}>
                      {isExporting
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exportando…</>
                        : 'Exportar'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { void handleExport('csv'); }}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { void handleExport('xlsx'); }}>Excel (.xlsx)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />Crear ajuste
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="space-y-4">
              {/* Búsqueda + limpiar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Buscar por driver…"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
              </div>

              {/* Filtros secundarios */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {/* Fecha aplicación desde */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Aplicación desde</label>
                  <Input type="date" value={applicationDateFrom} onChange={e => setApplicationDateFrom(e.target.value)} />
                </div>

                {/* Fecha aplicación hasta */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Aplicación hasta</label>
                  <Input type="date" value={applicationDateTo} onChange={e => setApplicationDateTo(e.target.value)} />
                </div>

                {/* Tienda — SearchableSelect + chips */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tienda</label>
                  <SearchableSelect
                    placeholder="Filtrar tienda…"
                    searchPlaceholder="Buscar tienda…"
                    emptyMessage="Sin tiendas disponibles"
                    options={storeOptions.map(s => ({ value: s.label, label: s.label }))}
                    selectedValues={store}
                    onSelect={toggleStoreFilter}
                  />
                  {store.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {store.map(s => (
                        <Chip key={s} label={s} onRemove={() => toggleStoreFilter(s)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tipo</label>
                  <SearchableSelect
                    placeholder="Filtrar tipo…"
                    searchPlaceholder="Buscar tipo…"
                    emptyMessage="Sin opciones"
                    options={ADJUSTMENT_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                    selectedValues={adjustmentType}
                    onSelect={v => toggleType(v as AdjustmentType)}
                  />
                  {adjustmentType.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {adjustmentType.map(t => (
                        <Chip
                          key={t}
                          label={ADJUSTMENT_TYPE_OPTIONS.find(o => o.value === t)?.label ?? t}
                          onRemove={() => toggleType(t)}
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : adjustments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No se encontraron ajustes con los filtros seleccionados</p>
              <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('adjustmentId')}>
                        <div className="flex items-center">ID Ajuste{getSortIcon('adjustmentId')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('driverName')}>
                        <div className="flex items-center">Driver{getSortIcon('driverName')}</div>
                      </TableHead>
                      <TableHead>Tienda</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('applicationDate')}>
                        <div className="flex items-center">Fecha aplicación{getSortIcon('applicationDate')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('adjustmentType')}>
                        <div className="flex items-center">Tipo{getSortIcon('adjustmentType')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort('amount')}>
                        <div className="flex items-center justify-end">Monto{getSortIcon('amount')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center">Fecha creación{getSortIcon('createdAt')}</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map(adj => (
                      <TableRow
                        key={adj.adjustmentId}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => navigateTo(`/adm/pagos/ajustes/${adj.adjustmentId}`)}
                      >
                        <TableCell className="font-mono text-sm">{adj.adjustmentId}</TableCell>
                        <TableCell className="font-medium">{adj.driverName}</TableCell>
                        <TableCell>{adj.store}</TableCell>
                        <TableCell className="text-sm">{new Date(adj.applicationDate).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell><AdjustmentTypeBadge type={adj.adjustmentType} /></TableCell>
                        <TableCell className={`text-right font-medium ${adj.amount < 0 ? 'text-red-600' : adj.amount > 0 ? 'text-green-600' : ''}`}>
                          {fmt(adj.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(adj.createdAt).toLocaleDateString('es-MX')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Mostrar:</span>
                    <Select value={pageSize.toString()} onValueChange={v => setPageSize(Number(v))}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} · Total: {total} ajustes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                    Siguiente<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
