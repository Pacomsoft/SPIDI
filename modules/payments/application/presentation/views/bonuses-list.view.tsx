'use client';

import { useState, useEffect } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import { Download, FilterX, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Plus, X } from 'lucide-react';
import { type IGetBonusesUseCase } from '../../../domain/contracts/get-bonuses-use-case.interface';
import { type IExportBonusesUseCase } from '../../../domain/contracts/export-bonuses-use-case.interface';
import { type ICreateBonusUseCase } from '../../../domain/contracts/create-bonus-use-case.interface';
import { type IGetStoresUseCase } from '../../../domain/contracts/get-stores-use-case.interface';
import { type BonusType, type ICreateBonusDTO, type IBonusFiltersDTO } from '../../../domain/contracts/bonus.dto';
import { type IStoreDTO } from '../../../domain/contracts/order.dto';
import { useBonusesList } from '../../hooks/use-bonuses-list.hook';
import { BonusTypeBadge } from '../components/bonus-type-badge';
import { SearchableSelect } from '../ui/searchable-select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface IBonusesListViewProps {
  getBonusesUseCase: IGetBonusesUseCase;
  exportBonusesUseCase: IExportBonusesUseCase;
  createBonusUseCase: ICreateBonusUseCase;
  getStoresUseCase: IGetStoresUseCase;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

type SortKey = 'bonusId' | 'store' | 'createdAt' | 'startDate' | 'endDate' | 'bonusType' | 'bonusAmount';

const BONUS_TYPE_OPTIONS: { value: BonusType; label: string }[] = [
  { value: 'Punctuality',     label: 'Puntualidad'      },
  { value: 'Productivity',    label: 'Productividad'    },
  { value: 'SpecialSchedule', label: 'Horario especial' },
  { value: 'Zone',            label: 'Zona'             },
  { value: 'Weather',         label: 'Clima'            },
];

// ─── Chip removible reutilizable ──────────────────────────────────────────────

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

// ─── Filtro de fecha + hora ───────────────────────────────────────────────────

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return { value: `${h}:00`, label: `${h}:00` };
});

const NO_HOUR = '__none__';

function DateTimeFilter({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  label: string;
  date: string;
  time: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          type="date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
          className="flex-1 min-w-0"
        />
        <Select
          value={time || NO_HOUR}
          onValueChange={v => onTimeChange(v === NO_HOUR ? '' : v)}
        >
          <SelectTrigger className="w-24 shrink-0">
            <SelectValue placeholder="Hora" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            <SelectItem value={NO_HOUR}>–</SelectItem>
            {HOUR_OPTIONS.map(h => (
              <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Modal crear bono ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  store: [] as string[],
  startDate: '', startTime: '',
  endDate: '',   endTime: '',
  bonusType: 'Punctuality' as BonusType,
  threshold: undefined as number | undefined,
  minimumOrders: 1,
  bonusAmount: 0,
};

type FormState = typeof EMPTY_FORM;

// Combina date + time en ISO sin zona — el backend espera string libre
const toISO = (date: string, time: string) =>
  date ? (time ? `${date}T${time}` : `${date}T00:00`) : '';

// ─── Validaciones por campo ───────────────────────────────────────────────────
function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState | 'dateRange', string>> = {};
  if (form.store.length === 0)       errors.store = 'Selecciona al menos una tienda';
  if (!form.startDate)               errors.startDate = 'Requerido';
  if (!form.endDate)                 errors.endDate = 'Requerido';
  if (form.startDate && form.endDate) {
    const start = new Date(toISO(form.startDate, form.startTime));
    const end   = new Date(toISO(form.endDate, form.endTime));
    if (end <= start) errors.dateRange = 'La fecha fin debe ser posterior al inicio';
  }
  if (form.minimumOrders < 1)        errors.minimumOrders = 'Debe ser al menos 1';
  if (form.bonusAmount <= 0)         errors.bonusAmount = 'Debe ser mayor a 0';
  return errors;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

function BonusFormModal({
  storeOptions,
  onClose,
  onCreate,
}: {
  storeOptions: IStoreDTO[];
  onClose: () => void;
  onCreate: (data: ICreateBonusDTO) => Promise<boolean>;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState | 'dateRange', boolean>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  const touch = (...fields: (keyof FormState | 'dateRange')[]) =>
    setTouched(prev => Object.fromEntries([...Object.entries(prev), ...fields.map(f => [f, true])]));

  const showThreshold = form.bonusType === 'Punctuality' || form.bonusType === 'Productivity';

  const toggleStore = (s: string) => {
    setForm(prev => ({
      ...prev,
      store: prev.store.includes(s) ? prev.store.filter(x => x !== s) : [...prev.store, s],
    }));
    touch('store');
  };

  const handleSubmit = async () => {
    // Marcar todo como tocado para mostrar todos los errores
    setTouched({ store: true, startDate: true, endDate: true, dateRange: true, minimumOrders: true, bonusAmount: true });
    if (!isValid) return;

    setIsSaving(true);
    const payload: ICreateBonusDTO = {
      store: form.store,
      startDate: toISO(form.startDate, form.startTime),
      endDate:   toISO(form.endDate,   form.endTime),
      bonusType: form.bonusType,
      threshold: showThreshold ? form.threshold : undefined,
      minimumOrders: form.minimumOrders,
      bonusAmount: form.bonusAmount,
    };
    const ok = await onCreate(payload);
    setIsSaving(false);
    if (ok) {
      showToast({ message: 'Bono creado correctamente', type: 'success' });
      onClose();
    } else {
      showToast({ message: 'Error al crear el bono', type: 'danger' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <CardTitle>Crear bono</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Tienda */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tiendas</label>
            <SearchableSelect
              placeholder="Agregar tienda…"
              searchPlaceholder="Buscar tienda…"
              options={storeOptions.map(s => ({ value: s.label, label: s.label }))}
              selectedValues={form.store}
              onSelect={toggleStore}
            />
            {form.store.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.store.map(s => (
                  <Chip key={s} label={s} onRemove={() => toggleStore(s)} />
                ))}
              </div>
            )}
            {touched.store && <FieldError msg={errors.store} />}
          </div>

          {/* Fecha inicio */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Fecha inicio</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={form.startDate}
                onChange={e => { setForm(p => ({ ...p, startDate: e.target.value })); touch('startDate', 'dateRange'); }}
                onBlur={() => touch('startDate', 'dateRange')}
              />
              <Input
                type="time"
                value={form.startTime}
                onChange={e => { setForm(p => ({ ...p, startTime: e.target.value })); touch('dateRange'); }}
              />
            </div>
            {touched.startDate && <FieldError msg={errors.startDate} />}
          </div>

          {/* Fecha fin */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Fecha fin</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={form.endDate}
                onChange={e => { setForm(p => ({ ...p, endDate: e.target.value })); touch('endDate', 'dateRange'); }}
                onBlur={() => touch('endDate', 'dateRange')}
              />
              <Input
                type="time"
                value={form.endTime}
                onChange={e => { setForm(p => ({ ...p, endTime: e.target.value })); touch('dateRange'); }}
              />
            </div>
            {touched.endDate && <FieldError msg={errors.endDate} />}
            {touched.dateRange && <FieldError msg={errors.dateRange} />}
          </div>

          {/* Tipo de bono */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tipo de bono</label>
            <Select value={form.bonusType} onValueChange={v => setForm(p => ({ ...p, bonusType: v as BonusType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BONUS_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Umbral — condicional */}
          {showThreshold && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Umbral (threshold)</label>
              <Input
                type="number"
                value={form.threshold ?? ''}
                onChange={e => setForm(p => ({ ...p, threshold: Number(e.target.value) }))}
              />
            </div>
          )}

          {/* Mínimo de pedidos + Monto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Mínimo de pedidos</label>
              <Input
                type="number" min={1}
                value={form.minimumOrders}
                onChange={e => { setForm(p => ({ ...p, minimumOrders: Number(e.target.value) })); touch('minimumOrders'); }}
                onBlur={() => touch('minimumOrders')}
              />
              {touched.minimumOrders && <FieldError msg={errors.minimumOrders} />}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Monto del bono</label>
              <Input
                type="number" min={0}
                value={form.bonusAmount}
                onChange={e => { setForm(p => ({ ...p, bonusAmount: Number(e.target.value) })); touch('bonusAmount'); }}
                onBlur={() => touch('bonusAmount')}
              />
              {touched.bonusAmount && <FieldError msg={errors.bonusAmount} />}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { void handleSubmit(); }} disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export function BonusesListView({
  getBonusesUseCase,
  exportBonusesUseCase,
  createBonusUseCase,
  getStoresUseCase,
}: IBonusesListViewProps) {
  const { navigateTo } = useNavigationLoading();
  const [showModal, setShowModal] = useState(false);
  const [storeOptions, setStoreOptions] = useState<IStoreDTO[]>([]);

  // Filtros de fecha desglosados: date string + time string (se combinan al enviar al hook)
  const [startFromDate, setStartFromDate] = useState('');
  const [startFromTime, setStartFromTime] = useState('');
  const [startToDate, setStartToDate]     = useState('');
  const [startToTime, setStartToTime]     = useState('');
  const [endFromDate, setEndFromDate]     = useState('');
  const [endFromTime, setEndFromTime]     = useState('');
  const [endToDate, setEndToDate]         = useState('');
  const [endToTime, setEndToTime]         = useState('');

  // Combina date + time en ISO-like string para el hook
  const combine = (date: string, time: string) =>
    date ? (time ? `${date}T${time}` : date) : undefined;

  const {
    bonuses, total, isLoading, page, pageSize, sortBy, sortDirection,
    store, bonusType, isExporting,
    setPage, setPageSize, setSortBy, setSortDirection,
    setStartDateFrom, setStartDateTo, setEndDateFrom, setEndDateTo,
    setStore, setBonusType,
    handleExport, clearFilters,
  } = useBonusesList(getBonusesUseCase, exportBonusesUseCase);

  // Carga catálogo de tiendas (API real)
  useEffect(() => {
    getStoresUseCase.execute().then(r => {
      if (r.success && r.data) setStoreOptions(r.data);
    });
  }, [getStoresUseCase]);

  // Propaga cambios date+time al hook
  useEffect(() => { setStartDateFrom(combine(startFromDate, startFromTime) ?? ''); }, [startFromDate, startFromTime]);
  useEffect(() => { setStartDateTo(combine(startToDate, startToTime) ?? '');       }, [startToDate, startToTime]);
  useEffect(() => { setEndDateFrom(combine(endFromDate, endFromTime) ?? '');       }, [endFromDate, endFromTime]);
  useEffect(() => { setEndDateTo(combine(endToDate, endToTime) ?? '');             }, [endToDate, endToTime]);

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

  const addStore = (s: string) => { if (!store.includes(s)) setStore([...store, s]); };
  const removeStore = (s: string) => setStore(store.filter(x => x !== s));

  const addBonusType = (bt: BonusType) => { if (!bonusType.includes(bt)) setBonusType([...bonusType, bt]); };
  const removeBonusType = (bt: BonusType) => setBonusType(bonusType.filter(x => x !== bt));

  const handleClearAll = () => {
    setStartFromDate(''); setStartFromTime('');
    setStartToDate('');   setStartToTime('');
    setEndFromDate('');   setEndFromTime('');
    setEndToDate('');     setEndToTime('');
    clearFilters();
  };

  const handleCreate = async (data: ICreateBonusDTO): Promise<boolean> => {
    const result = await createBonusUseCase.execute(data);
    if (result.success) handleClearAll();
    return result.success ?? false;
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <BonusFormModal
          storeOptions={storeOptions}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col gap-4">

            {/* Título + acciones */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bonos</h1>
                <p className="text-sm text-muted-foreground mt-1">{total} bonos en total</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearAll}>
                  <FilterX className="sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Limpiar filtros</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExporting}>
                      <Download className="sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{isExporting ? 'Exportando…' : 'Exportar'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { void handleExport('csv'); }}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { void handleExport('xlsx'); }}>Excel (.xlsx)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Crear bono</span>
                </Button>
              </div>
            </div>

            {/* Filtros de fecha (4 columnas: inicio desde/hasta, fin desde/hasta) */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DateTimeFilter
                label="Inicio vigencia desde"
                date={startFromDate} time={startFromTime}
                onDateChange={setStartFromDate} onTimeChange={setStartFromTime}
              />
              <DateTimeFilter
                label="Inicio vigencia hasta"
                date={startToDate} time={startToTime}
                onDateChange={setStartToDate} onTimeChange={setStartToTime}
              />
              <DateTimeFilter
                label="Fin vigencia desde"
                date={endFromDate} time={endFromTime}
                onDateChange={setEndFromDate} onTimeChange={setEndFromTime}
              />
              <DateTimeFilter
                label="Fin vigencia hasta"
                date={endToDate} time={endToTime}
                onDateChange={setEndToDate} onTimeChange={setEndToTime}
              />
            </div>

            {/* Filtros de Tienda, Tipo y botón limpiar */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
              {/* Tienda */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tienda</label>
                <SearchableSelect
                  placeholder="Agregar tienda…"
                  searchPlaceholder="Buscar tienda…"
                  emptyMessage="Sin tiendas disponibles"
                  options={storeOptions.map(s => ({ value: s.label, label: s.label }))}
                  selectedValues={store}
                  onSelect={addStore}
                />
                {store.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {store.map(s => <Chip key={s} label={s} onRemove={() => removeStore(s)} />)}
                  </div>
                )}
              </div>

              {/* Tipo de bono */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de bono</label>
                <SearchableSelect
                  placeholder="Agregar tipo…"
                  searchPlaceholder="Buscar tipo…"
                  emptyMessage="Sin tipos disponibles"
                  options={BONUS_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                  selectedValues={bonusType}
                  onSelect={v => addBonusType(v as BonusType)}
                />
                {bonusType.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {bonusType.map(bt => {
                      const label = BONUS_TYPE_OPTIONS.find(o => o.value === bt)?.label ?? bt;
                      return <Chip key={bt} label={label} onRemove={() => removeBonusType(bt)} />;
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : bonuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No se encontraron bonos con los filtros seleccionados</p>
              <Button variant="outline" onClick={handleClearAll}><FilterX className="mr-2 h-4 w-4" />Limpiar filtros</Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('bonusId')}>
                        <div className="flex items-center">ID Bono{getSortIcon('bonusId')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('store')}>
                        <div className="flex items-center">Tienda{getSortIcon('store')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('startDate')}>
                        <div className="flex items-center">Inicio vigencia{getSortIcon('startDate')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('endDate')}>
                        <div className="flex items-center">Fin vigencia{getSortIcon('endDate')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center">Fecha creación{getSortIcon('createdAt')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('bonusType')}>
                        <div className="flex items-center">Tipo{getSortIcon('bonusType')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort('bonusAmount')}>
                        <div className="flex items-center justify-end">Monto{getSortIcon('bonusAmount')}</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonuses.map(bonus => (
                      <TableRow
                        key={bonus.bonusId}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => navigateTo(`/adm/pagos/bonos/${bonus.bonusId}`)}
                      >
                        <TableCell className="font-mono text-sm">{bonus.bonusId}</TableCell>
                        <TableCell>{bonus.store}</TableCell>
                        <TableCell className="text-sm">{new Date(bonus.startDate).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell className="text-sm">{new Date(bonus.endDate).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(bonus.createdAt).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell><BonusTypeBadge type={bonus.bonusType} /></TableCell>
                        <TableCell className="text-right font-medium">{fmt(bonus.bonusAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
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
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} · Total: {total} bonos
                  </div>
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
