'use client';

import { useState } from 'react';
import { useNavigationLoading } from '@/modules/shared/application/hooks/use-navigation-loading.hook';
import { ArrowLeft, Loader2, Send, AlertTriangle } from 'lucide-react';
import { RoleGuard } from '@/modules/adm/application/presentation/components/role-guard';
import { createCheckModuleAccessUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import type { IGetTrainingByIdUseCase } from '../../../domain/contracts/get-training-by-id-use-case.interface';
import type { IUpdateTrainingUseCase } from '../../../domain/contracts/update-training-use-case.interface';
import type { ISendTrainingUseCase } from '../../../domain/contracts/send-training-use-case.interface';
import type { IGetTrainingProgressUseCase, IExportTrainingProgressUseCase } from '../../../domain/contracts/export-training-progress-use-case.interface';
import type { SendType } from '../../../domain/contracts/training.dto';
import { useTrainingDetail } from '../../hooks/use-training-detail.hook';
import { TrainingTypeBadge } from '../components/training-type-badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

const checkModuleAccessUseCase = createCheckModuleAccessUseCase();

interface ITrainingDetailViewProps {
  getTrainingByIdUseCase: IGetTrainingByIdUseCase;
  updateTrainingUseCase: IUpdateTrainingUseCase;
  sendTrainingUseCase: ISendTrainingUseCase;
  getTrainingProgressUseCase: IGetTrainingProgressUseCase;
  exportTrainingProgressUseCase: IExportTrainingProgressUseCase;
}

export function TrainingDetailView({
  getTrainingByIdUseCase,
  updateTrainingUseCase,
  sendTrainingUseCase,
  getTrainingProgressUseCase,
  exportTrainingProgressUseCase,
}: ITrainingDetailViewProps) {
  const { navigateTo, navigateBack } = useNavigationLoading();
  const {
    training, isLoading, error,
    progress, isLoadingProgress,
    formData, hasChanges, isSaving,
    handleFormChange, handleSave,
    sendData, isSending,
    handleSendDataChange, handleSend,
    handleExportProgress, isExportingProgress,
  } = useTrainingDetail(getTrainingByIdUseCase, getTrainingProgressUseCase);

  const [recipientEmailsInput, setRecipientEmailsInput] = useState('');

  const handleSendClick = async () => {
    const emails = sendData.sendType !== 'Mass'
      ? recipientEmailsInput.split(',').map(e => e.trim()).filter(Boolean)
      : [];
    handleSendDataChange({ recipientEmails: emails });
    await handleSend(sendTrainingUseCase);
  };

  const isSendEnabled = sendData.sendType === 'Mass'
    ? true
    : recipientEmailsInput.trim().length > 0;

  if (isLoading || !training) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <RoleGuard moduleKey="CAPACITACION" checkModuleAccessUseCase={checkModuleAccessUseCase}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard moduleKey="CAPACITACION" checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigateBack('/adm/capacitacion')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{training.title}</h1>
              <p className="text-sm text-muted-foreground">Detalle de la capacitación · {training.trainingId}</p>
            </div>
          </div>
          <TrainingTypeBadge type={training.trainingType} />
        </div>

        {/* Sección 1: Información del contenido */}
        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <Icon name="menu_book" size={20} className="text-muted-foreground" />
              <div>
                <CardTitle>Información del contenido</CardTitle>
                <CardDescription>Datos generales y material de formación</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* ID · Título · Tipo · Onboarding — una sola fila col-4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">ID</p>
                <p className="text-sm py-2 border-b border-border/50 font-mono">{training.trainingId}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Título</p>
                <Input
                  value={formData.title ?? ''}
                  onChange={e => handleFormChange({ title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tipo</p>
                <Select
                  value={formData.trainingType ?? training.trainingType}
                  onValueChange={v => handleFormChange({ trainingType: v as typeof training.trainingType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mandatory">Obligatorio</SelectItem>
                    <SelectItem value="Optional">Opcional</SelectItem>
                    <SelectItem value="CompanyPolicy">Política de empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Onboarding</p>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <Icon name="info" size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        Las capacitaciones de tipo onboarding son enviadas en automático a todos los drivers activos de manera masiva y se muestran de manera predeterminada a los drivers nuevos.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-background">
                  <input
                    id="is-onboarding"
                    type="checkbox"
                    checked={formData.isOnboarding ?? training.isOnboarding ?? false}
                    onChange={() => handleFormChange({ isOnboarding: !(formData.isOnboarding ?? training.isOnboarding ?? false) })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="is-onboarding" className="text-sm cursor-pointer select-none">
                    {(formData.isOnboarding ?? training.isOnboarding ?? false) ? 'Activada' : 'No activada'}
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contenido */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Contenido</p>
              <div
                className="prose prose-sm max-w-none p-4 border rounded-md bg-muted/20 min-h-[120px]"
                dangerouslySetInnerHTML={{ __html: formData.content ?? training.content ?? '' }}
              />
            </div>

            {training.documentUrl && (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Documento adjunto</p>
                <a
                  href={training.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline underline-offset-4"
                >
                  Ver documento
                </a>
              </div>
            )}

            {/* Cuestionario */}
            {training.hasQuiz && training.questions && training.questions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Cuestionario de evaluación</p>
                  {training.questions.map((q, qi) => (
                    <div key={qi} className="p-4 border rounded-lg space-y-2 bg-muted/10">
                      <p className="font-medium text-sm">Pregunta {qi + 1}: {q.questionText}</p>
                      <ul className="space-y-1">
                        {q.options.map((opt, oi) => (
                          <li
                            key={oi}
                            className={`text-sm flex items-center gap-2 ${oi === q.correctOption ? 'text-green-700 font-medium' : 'text-muted-foreground'}`}
                          >
                            <span className="w-5">{oi + 1}.</span>
                            <span>{opt.text}</span>
                            {oi === q.correctOption && <span className="text-xs">(correcta)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {training.minimumScore !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      Puntaje mínimo requerido: <span className="font-medium">{training.minimumScore}</span> de {training.questions.length}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => { void handleSave(updateTrainingUseCase); }} disabled={!hasChanges || isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Envío */}
        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <Icon name="send" size={20} className="text-muted-foreground" />
              <div>
                <CardTitle>Envío de capacitación</CardTitle>
                <CardDescription>Envía esta capacitación a los conductores</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">Tipo de envío</p>
                <Select
                  value={sendData.sendType}
                  onValueChange={v => {
                    handleSendDataChange({ sendType: v as SendType });
                    setRecipientEmailsInput('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Group">Grupal</SelectItem>
                    <SelectItem value="Mass">Masivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {sendData.sendType !== 'Mass' && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
                    Correos electrónicos
                    {sendData.sendType === 'Individual' && <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground">(1 correo)</span>}
                    {sendData.sendType === 'Group' && <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground">(separados por coma)</span>}
                  </p>
                  <Input
                    placeholder="email@ejemplo.com, otro@ejemplo.com"
                    value={recipientEmailsInput}
                    onChange={e => setRecipientEmailsInput(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => { void handleSendClick(); }} disabled={!isSendEnabled || isSending}>
                {isSending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                  : <><Send className="mr-2 h-4 w-4" />Enviar capacitación</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sección 3: Seguimiento de progreso */}
        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Icon name="monitoring" size={20} className="text-muted-foreground" />
                <div>
                  <CardTitle>Seguimiento de progreso</CardTitle>
                  <CardDescription>Conductores que completaron el cuestionario correctamente</CardDescription>
                </div>
              </div>
              {progress.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExportingProgress}>
                      {isExportingProgress
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exportando…</>
                        : 'Exportar'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { void handleExportProgress(exportTrainingProgressUseCase, 'csv'); }}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { void handleExportProgress(exportTrainingProgressUseCase, 'xlsx'); }}>Excel (.xlsx)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingProgress ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : progress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay registros de progreso para esta capacitación.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre del driver</TableHead>
                      <TableHead className="text-center">Respuestas</TableHead>
                      <TableHead>Fecha de respuesta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progress.map(p => (
                      <TableRow key={p.progressId}>
                        <TableCell className="font-medium">
                          <button
                            type="button"
                            onClick={() => navigateTo(`/adm/drivers/${p.driverId}`)}
                            className="text-left underline underline-offset-4 decoration-dotted hover:text-primary transition-colors"
                          >
                            {p.driverName}
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono text-sm">{p.correctAnswers} / {p.answersCount}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(p.responseDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
