'use client';

import { useState } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { useToast } from '@/modules/shared/application/hooks/use-toast.hook';
import {
  ArrowLeft, Loader2, MoreVertical, AlertTriangle,
  FileText, CheckCircle2, Clock, XCircle, Upload, Eye,
  ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { RoleGuard } from '@/modules/adm/application/presentation/components/role-guard';
import { AccessGuard } from '@/modules/adm/application/presentation/components/access-guard';
import { createCheckModuleAccessUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import { PermissionAction } from '@/modules/adm/domain/value-objects/module-access';
import { type IGetDriverByIdUseCase } from '../../../domain/contracts/get-driver-by-id-use-case.interface';
import { type IUpdateDriverUseCase } from '../../../domain/contracts/update-driver-use-case.interface';
import { type IDeleteDriverUseCase } from '../../../domain/contracts/delete-driver-use-case.interface';
import { type IGetDriverOrdersUseCase } from '../../../domain/contracts/get-driver-orders-use-case.interface';
import { type IGetDriverPaymentsUseCase } from '../../../domain/contracts/get-driver-payments-use-case.interface';
import { type IUploadDocumentUseCase } from '../../../domain/contracts/upload-document-use-case.interface';
import { type IChangeDriverStatusUseCase } from '../../../domain/contracts/change-driver-status-use-case.interface';
import { type ICheckModuleAccessUseCase } from '@/modules/adm/domain/contracts/check-module-access-use-case.interface';
import { type IGetSessionInfoUseCase } from '@/modules/adm/domain/contracts/get-session-info-use-case.interface';
import { type IDocumentDTO } from '../../../domain/contracts/driver-detail.dto';
import { useDriverDetail } from '../../hooks/use-driver-detail.hook';
import { DriverStatusBadge } from '../components/driver-status-badge';
import { UploadDocumentModal } from '../components/upload-document-modal';
import { ReceiptPreviewSheet } from '../components/receipt-preview-sheet';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const checkModuleAccessUseCase = createCheckModuleAccessUseCase();

// ── Document config ──────────────────────────────────────────────────────────
const DOCUMENT_TYPES: Array<{ type: string; label: string; hasExpiration: boolean }> = [
  { type: 'NSS',           label: 'NSS',                        hasExpiration: false },
  { type: 'LICENSE',       label: 'Licencia de Conducir',       hasExpiration: true  },
  { type: 'INSURANCE',     label: 'Seguro del Vehículo',        hasExpiration: true  },
  { type: 'INE',           label: 'INE',                        hasExpiration: true  },
  { type: 'CSF',           label: 'Constancia Fiscal (CSF)',    hasExpiration: false },
  { type: 'CLABE_COVER',   label: 'Carátula CLABE',             hasExpiration: false },
  { type: 'CONTRACT',      label: 'Contrato',                   hasExpiration: false },
];

const DOC_STATUS_CONFIG: Record<IDocumentDTO['status'], { label: string; color: string; icon: React.ReactNode }> = {
  Pending:      { label: 'Pendiente',     color: 'bg-gray-100 text-gray-700',   icon: <Clock className="h-3 w-3" /> },
  Unreadable:   { label: 'Ilegible',      color: 'bg-red-100 text-red-700',     icon: <XCircle className="h-3 w-3" /> },
  Prevalidated: { label: 'Prevalidado',   color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
  Validated:    { label: 'Validado',      color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
};

interface IDriverDetailViewProps {
  getDriverByIdUseCase: IGetDriverByIdUseCase;
  updateDriverUseCase: IUpdateDriverUseCase;
  deleteDriverUseCase: IDeleteDriverUseCase;
  getOrdersUseCase: IGetDriverOrdersUseCase;
  getPaymentsUseCase: IGetDriverPaymentsUseCase;
  uploadDocumentUseCase: IUploadDocumentUseCase;
  changeDriverStatusUseCase: IChangeDriverStatusUseCase;
  checkModuleAccessUseCase: ICheckModuleAccessUseCase;
  getSessionInfoUseCase: IGetSessionInfoUseCase;
}

export function DriverDetailView(props: IDriverDetailViewProps) {
  const { navigateTo, navigateBack } = useNavigationLoading();
  const { showToast } = useToast();
  const {
    driver, documents, orders, ordersTotal, payments, paymentsTotal,
    isLoading, isSaving, hasChanges,
    orderPage, paymentPage, isLoadingOrders, isLoadingPayments,
    orderSortBy, orderSortDirection, orderSearch,
    setOrderPage, setPaymentPage,
    setOrderSortBy, setOrderSortDirection, setOrderSearch,
    paymentSortBy, paymentSortDirection, paymentFilterYear, paymentFilterWeek,
    setPaymentSortBy, setPaymentSortDirection, setPaymentFilterYear, setPaymentFilterWeek,
    handleInputChange, handleBeneficiaryChange, addBeneficiary, removeBeneficiary,
    handleDocStatusChange, handleDocExpirationChange,
    handleSave, handleStatusChange, loadOrders, loadPayments,
  } = useDriverDetail(
    props.getDriverByIdUseCase,
    props.updateDriverUseCase,
    props.changeDriverStatusUseCase,
    props.getOrdersUseCase,
    props.getPaymentsUseCase,
  );

  const [showOrdersModal, setShowOrdersModal]   = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'Enabled' | 'Disabled' | 'Suspended' | null>(null);

  // Upload modal state
  const [uploadModal, setUploadModal] = useState<{ open: boolean; type: string; label: string }>({
    open: false, type: '', label: '',
  });

  // Receipt preview state
  const [receiptSheet, setReceiptSheet] = useState<{ open: boolean; url: string; weekLabel: string }>({
    open: false, url: '', weekLabel: '',
  });

  // Change log state
  const [changeLog, setChangeLog] = useState<Array<{ field: string; at: string }>>([]);

  if (isLoading || !driver) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isReadOnly = driver.driverStatus !== 'Enabled';
  const fullName = `${driver.firstName} ${driver.paternalLastName} ${driver.maternalLastName}`;

  const handleKebabAction = (status: 'Enabled' | 'Disabled' | 'Suspended') => {
    setPendingStatus(status);
    setShowConfirmDialog(true);
  };

  const STATUS_LABELS: Record<'Enabled' | 'Disabled' | 'Suspended', string> = {
    Enabled:   'reactivado',
    Disabled:  'deshabilitado',
    Suspended: 'suspendido',
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    const result = await handleStatusChange(pendingStatus);
    setShowConfirmDialog(false);
    if (result.success) {
      showToast({
        type: 'success',
        message: `Driver ${STATUS_LABELS[pendingStatus]} correctamente.`,
      });
    } else {
      showToast({
        type: 'danger',
        message: result.error?.message ?? 'No se pudo cambiar el estatus. Intenta de nuevo.',
      });
    }
    setPendingStatus(null);
  };

  const handleSaveWithLog = async () => {
    await handleSave();
    setChangeLog(prev => [...prev, { field: 'Datos actualizados', at: new Date().toLocaleString('es-MX') }]);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const days = (new Date(dateStr).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  };

  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <RoleGuard moduleKey="DRIVERS" checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6 pb-12">

        {/* ── Confirm status dialog ─────────────────────────────────── */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Confirmar cambio de estatus</CardTitle>
                <CardDescription>
                  {pendingStatus === 'Disabled' ? '¿Deshabilitar este driver?' :
                   pendingStatus === 'Suspended' ? '¿Suspender este driver?' : '¿Reactivar este driver?'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancelar</Button>
                <Button onClick={() => { void confirmStatusChange(); }}>Confirmar</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Upload document modal ─────────────────────────────────── */}
        <UploadDocumentModal
          open={uploadModal.open}
          onClose={() => setUploadModal({ open: false, type: '', label: '' })}
          driverId={driver.id}
          documentType={uploadModal.type}
          documentLabel={uploadModal.label}
          uploadUseCase={props.uploadDocumentUseCase}
          onSuccess={() => {
            // El doc recién cargado queda en escaneo asíncrono → Pending
            handleDocStatusChange(uploadModal.type, 'Pending');
            showToast({
              type: 'success',
              message: `Documento "${uploadModal.label}" cargado correctamente. Pendiente de escaneo.`,
            });
          }}
        />

        {/* ── Receipt preview sheet ─────────────────────────────────── */}
        <ReceiptPreviewSheet
          open={receiptSheet.open}
          onClose={() => setReceiptSheet({ open: false, url: '', weekLabel: '' })}
          receiptUrl={receiptSheet.url}
          weekLabel={receiptSheet.weekLabel}
          driverName={fullName}
        />

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigateBack('/adm/drivers')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={driver.photoUrl} />
                  <AvatarFallback className="text-lg sm:text-xl font-semibold">
                    {driver.firstName[0]}{driver.paternalLastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{fullName}</h1>
                  <p className="text-sm text-muted-foreground">
                    {driver.curp} • {driver.phone} • {driver.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DriverStatusBadge status={driver.driverStatus} />
                <Badge variant="outline">
                  {driver.incapacityStatus === 'With incapacity' ? 'Con incapacidad' : 'Sin incapacidad'}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {driver.driverStatus === 'Enabled' && (
                <DropdownMenuItem onClick={() => handleKebabAction('Disabled')}>Deshabilitar driver</DropdownMenuItem>
              )}
              {(driver.driverStatus === 'Enabled' || driver.driverStatus === 'Disabled') && (
                <DropdownMenuItem onClick={() => handleKebabAction('Suspended')}>Suspender</DropdownMenuItem>
              )}
              {(driver.driverStatus === 'Disabled' || driver.driverStatus === 'Suspended') && (
                <DropdownMenuItem onClick={() => handleKebabAction('Enabled')}>Volver a activar</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isReadOnly && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {driver.driverStatus === 'Suspended'
                ? 'Driver suspendido. La información es solo lectura.'
                : 'Driver deshabilitado. La información es solo lectura.'}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Datos Básicos ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Básicos</CardTitle>
            <CardDescription>Información personal y de contacto del driver</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* INFORMACIÓN PERSONAL */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">INFORMACIÓN PERSONAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'firstName',        label: 'Nombre(s)',          field: 'firstName'        as const },
                  { id: 'paternalLastName', label: 'Apellido Paterno',   field: 'paternalLastName' as const },
                  { id: 'maternalLastName', label: 'Apellido Materno',   field: 'maternalLastName' as const },
                  { id: 'phone',            label: 'Teléfono',           field: 'phone'            as const },
                  { id: 'email',            label: 'Email',              field: 'email'            as const },
                  { id: 'birthDate',        label: 'Fecha de Nacimiento',field: 'birthDate'        as const, type: 'date' },
                  { id: 'nationality',      label: 'Nacionalidad',       field: 'nationality'      as const },
                ].map(({ id, label, field, type }) => (
                  <div key={id} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">{label}</label>
                    <Input
                      id={id}
                      type={type ?? 'text'}
                      value={(driver[field] as string) ?? ''}
                      onChange={e => handleInputChange(field, e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* IDENTIFICACIÓN OFICIAL */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">IDENTIFICACIÓN OFICIAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'curp', label: 'CURP', field: 'curp' as const },
                  { id: 'rfc',  label: 'RFC',  field: 'rfc'  as const },
                  { id: 'nss',  label: 'NSS',  field: 'nss'  as const },
                ].map(({ id, label, field }) => (
                  <div key={id} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">{label}</label>
                    <Input id={id} value={(driver[field] as string) ?? ''} onChange={e => handleInputChange(field, e.target.value)} disabled={isReadOnly} />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* CAMPOS OPERACIONALES (read-only) */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">OPERACIÓN (SOLO LECTURA)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Incapacidad</label>
                  <Input
                    value={driver.incapacityStatus === 'With incapacity' ? 'Con incapacidad' : 'Sin incapacidad'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tienda último pedido</label>
                  <Input value={driver.lastOrderStore ?? '—'} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha último check-in</label>
                  <Input
                    value={driver.lastCheckInDate
                      ? new Date(driver.lastCheckInDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '—'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* DOMICILIO PERSONAL */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">DOMICILIO PERSONAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Calle</label>
                  <Input value={driver.street ?? ''} onChange={e => handleInputChange('street', e.target.value)} disabled={isReadOnly} />
                </div>
                {([
                  { label: 'Número Exterior', field: 'externalNumber' as const },
                  { label: 'Número Interior', field: 'internalNumber' as const },
                  { label: 'Colonia',         field: 'neighborhood'   as const },
                  { label: 'Ciudad',          field: 'city'           as const },
                  { label: 'Estado',          field: 'state'          as const },
                  { label: 'Código Postal',   field: 'postalCode'     as const },
                ] as const).map(({ label, field }) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <Input value={(driver[field] as string) ?? ''} onChange={e => handleInputChange(field, e.target.value)} disabled={isReadOnly} />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* DOMICILIO FISCAL */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">DOMICILIO FISCAL (SOLO LECTURA)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Calle</label>
                  <Input value={driver.fiscalStreet ?? ''} disabled className="bg-muted" />
                </div>
                {[
                  { label: 'Número Exterior', val: driver.fiscalExternalNumber },
                  { label: 'Número Interior', val: driver.fiscalInternalNumber },
                  { label: 'Colonia',         val: driver.fiscalNeighborhood },
                  { label: 'Ciudad',          val: driver.fiscalCity },
                  { label: 'Estado',          val: driver.fiscalState },
                  { label: 'Código Postal',   val: driver.fiscalPostalCode },
                ].map(({ label, val }) => (
                  <div key={label} className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <Input value={val ?? ''} disabled className="bg-muted" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* INFORMACIÓN BANCARIA Y FISCAL */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">INFORMACIÓN BANCARIA Y FISCAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {([
                  { label: 'Banco',           field: 'bank'         as const },
                  { label: 'CLABE',           field: 'clabe'        as const },
                  { label: 'Régimen Fiscal',  field: 'fiscalRegime' as const },
                ] as const).map(({ label, field }) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <Input value={(driver[field] as string) ?? ''} onChange={e => handleInputChange(field, e.target.value)} disabled={isReadOnly} />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* VEHÍCULO */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">VEHÍCULO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {([
                  { label: 'Marca',  field: 'vehicleMake'   as const },
                  { label: 'Modelo', field: 'vehicleModel'  as const },
                  { label: 'Año',    field: 'vehicleYear'   as const },
                  { label: 'Placas', field: 'vehiclePlates' as const },
                  { label: 'Color',  field: 'vehicleColor'  as const },
                ] as const).map(({ label, field }) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <Input value={driver[field]} onChange={e => handleInputChange(field, e.target.value)} disabled={isReadOnly} />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* BENEFICIARIOS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">BENEFICIARIOS</h3>
                  <p className="text-xs text-muted-foreground">El total de porcentajes no debe exceder 100%</p>
                </div>
                {!isReadOnly && (
                  <Button variant="outline" size="sm" onClick={addBeneficiary}>Agregar Beneficiario</Button>
                )}
              </div>
              {driver.beneficiaries && driver.beneficiaries.length > 0 ? (
                <div className="space-y-3">
                  {driver.beneficiaries.map((b, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-3 md:grid-cols-4 p-3 border rounded-lg">
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-xs font-medium">Nombre Completo</label>
                        <Input placeholder="Nombre completo" value={b.name} onChange={e => handleBeneficiaryChange(idx, 'name', e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Teléfono</label>
                        <Input placeholder="8112345678" value={b.phone} onChange={e => handleBeneficiaryChange(idx, 'phone', e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Porcentaje</label>
                        <div className="flex gap-2">
                          <Input type="number" min={0} max={100} value={b.percentage} onChange={e => handleBeneficiaryChange(idx, 'percentage', Number(e.target.value))} disabled={isReadOnly} />
                          {!isReadOnly && (
                            <Button variant="destructive" size="icon" onClick={() => removeBeneficiary(idx)}>×</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <p className="text-sm font-medium">Total: {driver.beneficiaries.reduce((s, b) => s + b.percentage, 0)}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay beneficiarios agregados</p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* ── Documentos ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>NSS, Licencia, Seguro, INE, CSF, Carátula CLABE y Contrato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOCUMENT_TYPES.map(({ type, label, hasExpiration }) => {
                const doc: IDocumentDTO = documents[type] ?? { type, label, status: 'Pending' };
                const statusCfg = DOC_STATUS_CONFIG[doc.status];
                const expired    = isExpired(doc.expirationDate);
                const expiringSoon = isExpiringSoon(doc.expirationDate);

                return (
                  <div
                    key={type}
                    className={`border rounded-lg p-4 space-y-3 ${expired ? 'border-red-300 bg-red-50' : expiringSoon ? 'border-yellow-300 bg-yellow-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>

                    {hasExpiration && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Fecha de vencimiento</label>
                        <Input
                          type="date"
                          value={doc.expirationDate ?? ''}
                          onChange={e => handleDocExpirationChange(type, e.target.value)}
                          disabled={isReadOnly}
                          className={`text-xs h-8 ${expired ? 'border-red-400 text-red-700' : expiringSoon ? 'border-yellow-400 text-yellow-700' : ''}`}
                        />
                        {expired && (
                          <p className="text-xs text-red-600 font-medium">⚠ Documento vencido</p>
                        )}
                        {!expired && expiringSoon && (
                          <p className="text-xs text-yellow-600 font-medium">⚠ Vence en menos de 30 días</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {doc.fileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      )}
                      {!isReadOnly && (() => {
                        // Bloqueado si está en escaneo asíncrono:
                        //   · Pending + fileUrl  → cargado pero security_scan = 0 (aún no procesado)
                        //   · Prevalidated       → escaneo en curso
                        const scanning = doc.status === 'Pending' && !!doc.fileUrl;
                        const canUpload = !scanning && doc.status !== 'Prevalidated';
                        const uploadBlockedMsg = scanning || doc.status === 'Prevalidated'
                          ? 'Escaneo de seguridad en progreso'
                          : '';
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 text-xs"
                                    disabled={!canUpload}
                                    onClick={() => canUpload && setUploadModal({ open: true, type, label })}
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    {doc.fileUrl ? 'Reemplazar' : 'Cargar'}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {!canUpload && (
                                <TooltipContent>{uploadBlockedMsg}</TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Pedidos Entregados ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Entregados</CardTitle>
            <CardDescription>Últimos 10 pedidos más recientes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay pedidos entregados</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID del Pedido</TableHead>
                      <TableHead>Tienda</TableHead>
                      <TableHead>Fecha de Entrega</TableHead>
                      <TableHead>Slot de Entrega</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 10).map(order => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                        <TableCell>{order.storeName}</TableCell>
                        <TableCell>{new Date(order.deliveryDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                        <TableCell className="text-sm">{order.deliverySlot}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowOrdersModal(true)}>Ver más</Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Pagos ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Pagos</CardTitle>
            <CardDescription>Últimos pagos semanales (lunes a domingo)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPayments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay pagos registrados</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Semana</TableHead>
                      <TableHead className="text-right">Pedidos</TableHead>
                      <TableHead className="text-right">Monto Pedidos</TableHead>
                      <TableHead className="text-right">Bonos</TableHead>
                      <TableHead className="text-right">Monto Bonos</TableHead>
                      <TableHead className="text-right">Ajuste</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Recibo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 6).map(p => (
                      <TableRow key={`${p.year}-${p.week}`}>
                        <TableCell>
                          <div className="font-medium">{p.year}-W{String(p.week).padStart(2, '0')}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(p.weekStart).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} –{' '}
                            {new Date(p.weekEnd).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{p.deliveredOrdersCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.ordersAmount)}</TableCell>
                        <TableCell className="text-right">{p.bonusesCount}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.bonusesAmount)}</TableCell>
                        <TableCell className={`text-right ${p.adjustmentAmount < 0 ? 'text-red-600' : p.adjustmentAmount > 0 ? 'text-green-600' : ''}`}>
                          {formatCurrency(p.adjustmentAmount)}
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(p.totalAmount)}</TableCell>
                        <TableCell className="text-center">
                          {p.hasReceipt
                            ? <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0"
                                onClick={() => p.receiptUrl && setReceiptSheet({
                                  open: true,
                                  url: p.receiptUrl,
                                  weekLabel: `${p.year}-W${String(p.week).padStart(2, '0')}`,
                                })}
                              >
                                Ver recibo
                              </Button>
                            : <span className="text-xs text-muted-foreground">No disponible</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowPaymentsModal(true)}>Ver más</Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Notas Internas ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Internas</CardTitle>
            <CardDescription>Visibles solo para el equipo operativo</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="Escribe notas internas sobre este driver..."
              value={driver.internalNotes ?? ''}
              onChange={e => handleInputChange('internalNotes', e.target.value)}
              disabled={isReadOnly}
              rows={5}
            />
          </CardContent>
        </Card>

        {/* ── Log de cambios ───────────────────────────────────────── */}
        {changeLog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Log de Cambios</CardTitle>
              <CardDescription>Historial de guardados en esta sesión</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {changeLog.map((entry, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-3">
                    <span className="font-mono text-xs">{entry.at}</span>
                    <span>{entry.field}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ── Guardar ──────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <TooltipProvider>
            <AccessGuard
              code="DRIVERS"
              action={PermissionAction.Edit}
              getSessionInfoUseCase={props.getSessionInfoUseCase}
              checkModuleAccessUseCase={props.checkModuleAccessUseCase}
              fallback={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled size="lg">⛔ Guardar cambios</Button>
                  </TooltipTrigger>
                  <TooltipContent>No tienes permisos para editar</TooltipContent>
                </Tooltip>
              }
            >
              <Button size="lg" onClick={() => { void handleSaveWithLog(); }} disabled={!hasChanges || isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
              </Button>
            </AccessGuard>
          </TooltipProvider>
        </div>

        {/* ── Modal Pedidos ─────────────────────────────────────────── */}
        {showOrdersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">
              <CardHeader className="relative flex-shrink-0">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setShowOrdersModal(false)}>✕</Button>
                <CardTitle>Pedidos entregados – {driver.firstName} {driver.paternalLastName}</CardTitle>
                <CardDescription>Listado completo de pedidos entregados ({ordersTotal} total)</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto space-y-4">
                {/* Búsqueda por ID */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar por ID de pedido..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    className="max-w-xs h-9"
                  />
                  {orderSearch && (
                    <Button variant="ghost" size="sm" onClick={() => setOrderSearch('')} className="h-9 px-2 text-muted-foreground">
                      Limpiar
                    </Button>
                  )}
                  {isLoadingOrders && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {isLoadingOrders && orders.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12"><p className="text-muted-foreground">No hay pedidos entregados</p></div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {/* Columna ordenable: ID */}
                            <TableHead
                              className="cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => {
                                if (orderSortBy === 'orderId') {
                                  setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setOrderSortBy('orderId');
                                  setOrderSortDirection('asc');
                                }
                              }}
                            >
                              <span className="inline-flex items-center gap-1">
                                ID del Pedido
                                {orderSortBy === 'orderId'
                                  ? orderSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            </TableHead>
                            {/* Columna ordenable: Tienda */}
                            <TableHead
                              className="cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => {
                                if (orderSortBy === 'storeName') {
                                  setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setOrderSortBy('storeName');
                                  setOrderSortDirection('asc');
                                }
                              }}
                            >
                              <span className="inline-flex items-center gap-1">
                                Tienda
                                {orderSortBy === 'storeName'
                                  ? orderSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            </TableHead>
                            {/* Columna ordenable: Fecha */}
                            <TableHead
                              className="cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => {
                                if (orderSortBy === 'deliveryDate') {
                                  setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setOrderSortBy('deliveryDate');
                                  setOrderSortDirection('asc');
                                }
                              }}
                            >
                              <span className="inline-flex items-center gap-1">
                                Fecha de Entrega
                                {orderSortBy === 'deliveryDate'
                                  ? orderSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            </TableHead>
                            {/* Columna ordenable: Slot */}
                            <TableHead
                              className="cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => {
                                if (orderSortBy === 'deliverySlot') {
                                  setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setOrderSortBy('deliverySlot');
                                  setOrderSortDirection('asc');
                                }
                              }}
                            >
                              <span className="inline-flex items-center gap-1">
                                Slot de Entrega
                                {orderSortBy === 'deliverySlot'
                                  ? orderSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map(order => (
                            <TableRow key={order.orderId}>
                              <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                              <TableCell>{order.storeName}</TableCell>
                              <TableCell>{new Date(order.deliveryDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                              <TableCell className="text-sm">{order.deliverySlot}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total: {ordersTotal}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setOrderPage(orderPage - 1)} disabled={orderPage <= 1 || isLoadingOrders}>Anterior</Button>
                        <span className="text-sm flex items-center px-2">Pág. {orderPage}</span>
                        <Button variant="outline" size="sm" onClick={() => setOrderPage(orderPage + 1)} disabled={orders.length < 10 || isLoadingOrders}>Siguiente</Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Modal Pagos ───────────────────────────────────────────── */}
        {showPaymentsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">
              <CardHeader className="relative flex-shrink-0">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setShowPaymentsModal(false)}>✕</Button>
                <CardTitle>Pagos – {driver.firstName} {driver.paternalLastName}</CardTitle>
                <CardDescription>Historial de pagos semanales ({paymentsTotal} total)</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto space-y-4">

                {/* Filtros: Año + Semana */}
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
                  const weeks = Array.from({ length: 53 }, (_, i) => i + 1);
                  return (
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">Año:</label>
                        <Select
                          value={paymentFilterYear !== undefined ? String(paymentFilterYear) : 'all'}
                          onValueChange={v => setPaymentFilterYear(v === 'all' ? undefined : Number(v))}
                        >
                          <SelectTrigger className="w-28 h-9">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {years.map(y => (
                              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">Semana:</label>
                        <Select
                          value={paymentFilterWeek !== undefined ? String(paymentFilterWeek) : 'all'}
                          onValueChange={v => setPaymentFilterWeek(v === 'all' ? undefined : Number(v))}
                          disabled={paymentFilterYear === undefined}
                        >
                          <SelectTrigger className="w-28 h-9">
                            <SelectValue placeholder="Todas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {weeks.map(w => (
                              <SelectItem key={w} value={String(w)}>Sem {String(w).padStart(2, '0')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(paymentFilterYear !== undefined || paymentFilterWeek !== undefined) && (
                        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={() => { setPaymentFilterYear(undefined); setPaymentFilterWeek(undefined); }}>
                          Limpiar filtros
                        </Button>
                      )}
                      {isLoadingPayments && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  );
                })()}

                {isLoadingPayments && payments.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12"><p className="text-muted-foreground">No hay pagos registrados</p></div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {/* Semana ordenable */}
                            <TableHead
                              className="cursor-pointer select-none hover:bg-muted/50"
                              onClick={() => {
                                if (paymentSortBy === 'weekStart') {
                                  setPaymentSortDirection(paymentSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaymentSortBy('weekStart');
                                  setPaymentSortDirection('asc');
                                }
                              }}
                            >
                              <span className="inline-flex items-center gap-1">
                                Semana
                                {paymentSortBy === 'weekStart'
                                  ? paymentSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            </TableHead>
                            {/* Pedidos ordenable */}
                            <TableHead
                              className="cursor-pointer select-none hover:bg-muted/50 text-right"
                              onClick={() => {
                                if (paymentSortBy === 'deliveredOrdersCount') {
                                  setPaymentSortDirection(paymentSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaymentSortBy('deliveredOrdersCount');
                                  setPaymentSortDirection('asc');
                                }
                              }}
                            >
                              <span className="inline-flex items-center justify-end gap-1 w-full">
                                Pedidos
                                {paymentSortBy === 'deliveredOrdersCount'
                                  ? paymentSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            </TableHead>
                            {/* Monto Pedidos ordenable */}
                            <TableHead
                              className="cursor-pointer select-none hover:bg-muted/50 text-right"
                              onClick={() => {
                                if (paymentSortBy === 'ordersAmount') {
                                  setPaymentSortDirection(paymentSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaymentSortBy('ordersAmount');
                                  setPaymentSortDirection('asc');
                                }
                              }}
                            >
                              <span className="inline-flex items-center justify-end gap-1 w-full">
                                Monto Pedidos
                                {paymentSortBy === 'ordersAmount'
                                  ? paymentSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            </TableHead>
                            <TableHead className="text-right">Bonos</TableHead>
                            <TableHead className="text-right">Monto Bonos</TableHead>
                            {/* Ajuste ordenable */}
                            <TableHead
                              className="cursor-pointer select-none hover:bg-muted/50 text-right"
                              onClick={() => {
                                if (paymentSortBy === 'adjustmentAmount') {
                                  setPaymentSortDirection(paymentSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaymentSortBy('adjustmentAmount');
                                  setPaymentSortDirection('asc');
                                }
                              }}
                            >
                              <span className="inline-flex items-center justify-end gap-1 w-full">
                                Ajuste
                                {paymentSortBy === 'adjustmentAmount'
                                  ? paymentSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            </TableHead>
                            {/* Total ordenable */}
                            <TableHead
                              className="cursor-pointer select-none hover:bg-muted/50 text-right"
                              onClick={() => {
                                if (paymentSortBy === 'totalAmount') {
                                  setPaymentSortDirection(paymentSortDirection === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setPaymentSortBy('totalAmount');
                                  setPaymentSortDirection('asc');
                                }
                              }}
                            >
                              <span className="inline-flex items-center justify-end gap-1 w-full">
                                Total
                                {paymentSortBy === 'totalAmount'
                                  ? paymentSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                              </span>
                            </TableHead>
                            <TableHead className="text-center">Recibo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map(p => (
                            <TableRow key={`${p.year}-${p.week}`}>
                              <TableCell>
                                <div className="font-medium">{p.year}-W{String(p.week).padStart(2, '0')}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(p.weekStart).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} –{' '}
                                  {new Date(p.weekEnd).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{p.deliveredOrdersCount}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(p.ordersAmount)}</TableCell>
                              <TableCell className="text-right">{p.bonusesCount}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(p.bonusesAmount)}</TableCell>
                              <TableCell className={`text-right ${p.adjustmentAmount < 0 ? 'text-red-600' : p.adjustmentAmount > 0 ? 'text-green-600' : ''}`}>
                                {formatCurrency(p.adjustmentAmount)}
                              </TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(p.totalAmount)}</TableCell>
                              <TableCell className="text-center">
                                {p.hasReceipt
                                  ? <Button
                                      variant="link"
                                      size="sm"
                                      className="h-auto p-0"
                                      onClick={() => p.receiptUrl && setReceiptSheet({
                                        open: true,
                                        url: p.receiptUrl,
                                        weekLabel: `${p.year}-W${String(p.week).padStart(2, '0')}`,
                                      })}
                                    >
                                      Ver recibo
                                    </Button>
                                  : <span className="text-xs text-muted-foreground">No disponible</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total: {paymentsTotal}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPaymentPage(paymentPage - 1)} disabled={paymentPage <= 1 || isLoadingPayments}>Anterior</Button>
                        <span className="text-sm flex items-center px-2">Pág. {paymentPage}</span>
                        <Button variant="outline" size="sm" onClick={() => setPaymentPage(paymentPage + 1)} disabled={payments.length < 10 || isLoadingPayments}>Siguiente</Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
