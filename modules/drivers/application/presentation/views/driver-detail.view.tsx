'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MoreVertical, AlertTriangle } from 'lucide-react';
import { RoleGuard } from '@/modules/adm/application/presentation/components/role-guard';
import { AccessGuard } from '@/modules/adm/application/presentation/components/access-guard';
import { createCheckModuleAccessUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import { PermissionAction } from '@/modules/adm/domain/value-objects/module-access';
import { type IGetDriverByIdUseCase } from '../../../domain/contracts/get-driver-by-id-use-case.interface';
import { type IUpdateDriverUseCase } from '../../../domain/contracts/update-driver-use-case.interface';
import { type IDeleteDriverUseCase } from '../../../domain/contracts/delete-driver-use-case.interface';
import { type IGetDriverOrdersUseCase } from '../../../domain/contracts/get-driver-orders-use-case.interface';
import { type IGetDriverPaymentsUseCase } from '../../../domain/contracts/get-driver-payments-use-case.interface';
import { type ICheckModuleAccessUseCase } from '@/modules/adm/domain/contracts/check-module-access-use-case.interface';
import { type IGetSessionInfoUseCase } from '@/modules/adm/domain/contracts/get-session-info-use-case.interface';
import { useDriverDetail } from '../../hooks/use-driver-detail.hook';
import { DriverStatusBadge } from '../components/driver-status-badge';
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

const checkModuleAccessUseCase = createCheckModuleAccessUseCase();

interface IDriverDetailViewProps {
  getDriverByIdUseCase: IGetDriverByIdUseCase;
  updateDriverUseCase: IUpdateDriverUseCase;
  deleteDriverUseCase: IDeleteDriverUseCase;
  getOrdersUseCase: IGetDriverOrdersUseCase;
  getPaymentsUseCase: IGetDriverPaymentsUseCase;
  checkModuleAccessUseCase: ICheckModuleAccessUseCase;
  getSessionInfoUseCase: IGetSessionInfoUseCase;
}

export function DriverDetailView(props: IDriverDetailViewProps) {
  const router = useRouter();
  const {
    driver, orders, ordersTotal, payments, paymentsTotal,
    isLoading, isSaving, hasChanges,
    orderPage, paymentPage, isLoadingOrders, isLoadingPayments,
    setOrderPage, setPaymentPage,
    handleInputChange, handleBeneficiaryChange, addBeneficiary, removeBeneficiary,
    handleSave, handleStatusChange, loadOrders, loadPayments,
  } = useDriverDetail(
    props.getDriverByIdUseCase,
    props.updateDriverUseCase,
    props.getOrdersUseCase,
    props.getPaymentsUseCase,
  );

  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'Enabled' | 'Disabled' | 'Suspended' | null>(null);

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

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    await handleStatusChange(pendingStatus);
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  return (
    <RoleGuard moduleKey="DRIVERS" checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6 pb-12">
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/adm/drivers')}>
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
                <Badge variant="outline">{driver.incapacityStatus === 'With incapacity' ? 'Con incapacidad' : 'Sin incapacidad'}</Badge>
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
              {driver.driverStatus === 'Suspended' ? 'Driver suspendido. La información es solo lectura.' : 'Driver deshabilitado. La información es solo lectura.'}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Datos Básicos</CardTitle>
            <CardDescription>Información personal y de contacto del driver</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">INFORMACIÓN PERSONAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'firstName', label: 'Nombre(s)', field: 'firstName' as const },
                  { id: 'paternalLastName', label: 'Apellido Paterno', field: 'paternalLastName' as const },
                  { id: 'maternalLastName', label: 'Apellido Materno', field: 'maternalLastName' as const },
                  { id: 'phone', label: 'Teléfono', field: 'phone' as const },
                  { id: 'email', label: 'Email', field: 'email' as const },
                  { id: 'birthDate', label: 'Fecha de Nacimiento', field: 'birthDate' as const, type: 'date' },
                  { id: 'nationality', label: 'Nacionalidad', field: 'nationality' as const },
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
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">IDENTIFICACIÓN OFICIAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'curp', label: 'CURP', field: 'curp' as const },
                  { id: 'rfc', label: 'RFC', field: 'rfc' as const },
                  { id: 'nss', label: 'NSS', field: 'nss' as const },
                ].map(({ id, label, field }) => (
                  <div key={id} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">{label}</label>
                    <Input id={id} value={(driver[field] as string) ?? ''} onChange={e => handleInputChange(field, e.target.value)} disabled={isReadOnly} />
                  </div>
                ))}
              </div>
            </div>
            <Separator />
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
                  { label: 'Colonia', field: 'neighborhood' as const },
                  { label: 'Ciudad', field: 'city' as const },
                  { label: 'Estado', field: 'state' as const },
                  { label: 'Código Postal', field: 'postalCode' as const },
                ] as const).map(({ label, field }) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <Input value={(driver[field] as string) ?? ''} onChange={e => handleInputChange(field, e.target.value)} disabled={isReadOnly} />
                  </div>
                ))}
              </div>
            </div>
            <Separator />
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
                  { label: 'Colonia', val: driver.fiscalNeighborhood },
                  { label: 'Ciudad', val: driver.fiscalCity },
                  { label: 'Estado', val: driver.fiscalState },
                  { label: 'Código Postal', val: driver.fiscalPostalCode },
                ].map(({ label, val }) => (
                  <div key={label} className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <Input value={val ?? ''} disabled className="bg-muted" />
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">INFORMACIÓN BANCARIA Y FISCAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {([
                  { label: 'Banco', field: 'bank' as const },
                  { label: 'CLABE', field: 'clabe' as const },
                  { label: 'Régimen Fiscal', field: 'fiscalRegime' as const },
                ] as const).map(({ label, field }) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <Input value={(driver[field] as string) ?? ''} onChange={e => handleInputChange(field, e.target.value)} disabled={isReadOnly} />
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">VEHÍCULO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {([
                  { label: 'Marca', field: 'vehicleMake' as const },
                  { label: 'Modelo', field: 'vehicleModel' as const },
                  { label: 'Año', field: 'vehicleYear' as const },
                  { label: 'Placas', field: 'vehiclePlates' as const },
                  { label: 'Color', field: 'vehicleColor' as const },
                ] as const).map(({ label, field }) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <Input value={driver[field]} onChange={e => handleInputChange(field, e.target.value)} disabled={isReadOnly} />
                  </div>
                ))}
              </div>
            </div>
            <Separator />
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

        <Card>
          <CardHeader>
            <CardTitle>Pedidos Entregados</CardTitle>
            <CardDescription>Últimos pedidos entregados</CardDescription>
          </CardHeader>
          <CardContent>
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
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => { void loadOrders(); setShowOrdersModal(true); }}>Ver más</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagos</CardTitle>
            <CardDescription>Últimos pagos semanales</CardDescription>
          </CardHeader>
          <CardContent>
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
                        <div className="text-xs text-muted-foreground">{new Date(p.weekStart).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – {new Date(p.weekEnd).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</div>
                      </TableCell>
                      <TableCell className="text-right">{p.deliveredOrdersCount}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.ordersAmount)}</TableCell>
                      <TableCell className="text-right">{p.bonusesCount}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.bonusesAmount)}</TableCell>
                      <TableCell className={`text-right ${p.adjustmentAmount < 0 ? 'text-red-600' : p.adjustmentAmount > 0 ? 'text-green-600' : ''}`}>{formatCurrency(p.adjustmentAmount)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(p.totalAmount)}</TableCell>
                      <TableCell className="text-center">{p.hasReceipt ? <Button variant="link" size="sm" className="h-auto p-0">Recibo</Button> : <span className="text-xs text-muted-foreground">No disponible</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => { void loadPayments(); setShowPaymentsModal(true); }}>Ver más</Button>
            </div>
          </CardContent>
        </Card>

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
              <Button size="lg" onClick={() => { void handleSave(); }} disabled={!hasChanges || isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
              </Button>
            </AccessGuard>
          </TooltipProvider>
        </div>

        {showOrdersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">
              <CardHeader className="relative flex-shrink-0">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setShowOrdersModal(false)}>✕</Button>
                <CardTitle>Pedidos entregados – {driver.firstName} {driver.paternalLastName}</CardTitle>
                <CardDescription>Listado completo de pedidos entregados ({ordersTotal} total)</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {isLoadingOrders ? (
                  <p className="text-sm text-muted-foreground">Cargando pedidos...</p>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12"><p className="text-muted-foreground">No hay pedidos entregados</p></div>
                ) : (
                  <>
                    <div className="rounded-md border mb-4">
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
                        <Button variant="outline" size="sm" onClick={() => { setOrderPage(orderPage - 1); void loadOrders(); }} disabled={orderPage <= 1}>Anterior</Button>
                        <span className="text-sm flex items-center px-2">Pág. {orderPage}</span>
                        <Button variant="outline" size="sm" onClick={() => { setOrderPage(orderPage + 1); void loadOrders(); }} disabled={orders.length < 10}>Siguiente</Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {showPaymentsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">
              <CardHeader className="relative flex-shrink-0">
                <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setShowPaymentsModal(false)}>✕</Button>
                <CardTitle>Pagos – {driver.firstName} {driver.paternalLastName}</CardTitle>
                <CardDescription>Historial de pagos semanales ({paymentsTotal} total)</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {isLoadingPayments ? (
                  <p className="text-sm text-muted-foreground">Cargando pagos...</p>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12"><p className="text-muted-foreground">No hay pagos registrados</p></div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-x-auto mb-4">
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
                          {payments.map(p => (
                            <TableRow key={`${p.year}-${p.week}`}>
                              <TableCell>
                                <div className="font-medium">{p.year}-W{String(p.week).padStart(2, '0')}</div>
                                <div className="text-xs text-muted-foreground">{new Date(p.weekStart).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – {new Date(p.weekEnd).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</div>
                              </TableCell>
                              <TableCell className="text-right">{p.deliveredOrdersCount}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(p.ordersAmount)}</TableCell>
                              <TableCell className="text-right">{p.bonusesCount}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(p.bonusesAmount)}</TableCell>
                              <TableCell className={`text-right ${p.adjustmentAmount < 0 ? 'text-red-600' : p.adjustmentAmount > 0 ? 'text-green-600' : ''}`}>{formatCurrency(p.adjustmentAmount)}</TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(p.totalAmount)}</TableCell>
                              <TableCell className="text-center">{p.hasReceipt ? <Button variant="link" size="sm" className="h-auto p-0">Recibo</Button> : <span className="text-xs text-muted-foreground">No disponible</span>}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total: {paymentsTotal}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setPaymentPage(paymentPage - 1); void loadPayments(); }} disabled={paymentPage <= 1}>Anterior</Button>
                        <span className="text-sm flex items-center px-2">Pág. {paymentPage}</span>
                        <Button variant="outline" size="sm" onClick={() => { setPaymentPage(paymentPage + 1); void loadPayments(); }} disabled={payments.length < 10}>Siguiente</Button>
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
