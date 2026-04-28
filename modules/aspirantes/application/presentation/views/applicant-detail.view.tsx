'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Camera, AlertCircle } from 'lucide-react';
import { RoleGuard } from '@/modules/adm/application/presentation/components/role-guard';
import { AccessGuard } from '@/modules/adm/application/presentation/components/access-guard';
import { createCheckModuleAccessUseCase } from '@/modules/adm/infrastructure/dependency-injection';
import { PermissionAction } from '@/modules/adm/domain/value-objects/module-access';
import type { IGetApplicantByIdUseCase } from '../../../domain/contracts/get-applicant-by-id-use-case.interface';
import type { IUpdateApplicantUseCase } from '../../../domain/contracts/update-applicant-use-case.interface';
import type { IDeleteApplicantUseCase } from '../../../domain/contracts/delete-applicant-use-case.interface';
import type { ICreateProposalUseCase } from '../../../domain/contracts/create-proposal-use-case.interface';
import type { IGetApplicantCatalogsUseCase } from '../../../domain/contracts/get-applicant-catalogs-use-case.interface';
import type { IGetSessionInfoUseCase } from '@/modules/adm/domain/contracts/get-session-info-use-case.interface';
import type { ICheckModuleAccessUseCase } from '@/modules/adm/domain/contracts/check-module-access-use-case.interface';
import { useApplicantDetail } from '../../../application/hooks/use-applicant-detail.hook';
import { PersonalDataSection } from '../components/personal-data-section';
import { DocumentsSection } from '../components/documents-section';
import { ProposalsSection } from '../components/proposals-section';
import { ApplicantStatusBadge } from '../components/applicant-status-badge';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const MODULE_KEY = 'ASPIRANTES';
const checkModuleAccessUseCase = createCheckModuleAccessUseCase();

const REQUIRED_DOC_TYPES = ['nss', 'licencia', 'seguroAuto', 'ine', 'csf', 'cuentaBancaria'];

interface IApplicantDetailViewProps {
  getApplicantByIdUseCase: IGetApplicantByIdUseCase;
  updateApplicantUseCase: IUpdateApplicantUseCase;
  deleteApplicantUseCase: IDeleteApplicantUseCase;
  createProposalUseCase: ICreateProposalUseCase;
  getCatalogsUseCase: IGetApplicantCatalogsUseCase;
  checkModuleAccessUseCase: ICheckModuleAccessUseCase;
  getSessionInfoUseCase: IGetSessionInfoUseCase;
}

export function ApplicantDetailView({
  getApplicantByIdUseCase,
  updateApplicantUseCase,
  deleteApplicantUseCase,
  createProposalUseCase,
  getCatalogsUseCase,
  getSessionInfoUseCase,
}: IApplicantDetailViewProps) {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [internalNotes, setInternalNotes] = useState('');

  const {
    applicant, documents, proposals, catalogs, isLoading, isSaving, hasChanges,
    validationErrors, handleFieldChange, handleSave, handleCreateProposal, handleDocumentChange,
  } = useApplicantDetail(
    id, getApplicantByIdUseCase, updateApplicantUseCase,
    deleteApplicantUseCase, createProposalUseCase, getCatalogsUseCase,
  );

  const isRequiredComplete = useMemo(() => {
    if (!applicant) return false;
    const requiredFields: Array<keyof typeof applicant> = [
      'firstName', 'paternalLastName', 'maternalLastName', 'birthDate', 'gender',
      'nationality', 'cityOfInterest', 'street', 'externalNumber', 'neighborhood',
      'city', 'state', 'postalCode', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'vehiclePlates', 'bank', 'clabe',
    ];
    return requiredFields.every((f) => {
      const v = applicant[f];
      return v !== undefined && v !== null && String(v).trim() !== '';
    });
  }, [applicant]);

  const canSendProposal = useMemo(() => {
    if (proposals.some((p) => p.status === 'Active')) return false;
    if (!isRequiredComplete) return false;
    return REQUIRED_DOC_TYPES.every((type) => {
      const doc = documents[type];
      return doc && (doc.status === 'Validated' || doc.status === 'Prevalidated');
    });
  }, [proposals, isRequiredComplete, documents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!applicant) return null;

  const isEditable = !applicant.isDriver;

  return (
    <RoleGuard moduleKey={MODULE_KEY} checkModuleAccessUseCase={checkModuleAccessUseCase}>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/adm/aspirantes')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={applicant.photoUrl ?? ''} alt={`${applicant.firstName} ${applicant.paternalLastName}`} />
                <AvatarFallback className="text-lg sm:text-xl font-semibold">
                  {applicant.firstName.charAt(0)}{applicant.paternalLastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isEditable && (
                <label htmlFor="foto-upload" className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90" title="Cambiar fotografía">
                  <Camera className="h-4 w-4" />
                  <input id="foto-upload" type="file" accept="image/*" className="hidden" aria-label="Cambiar fotografía de perfil"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size <= 2.5 * 1024 * 1024) {
                        handleFieldChange('photoUrl', URL.createObjectURL(file));
                      } else if (file) {
                        alert('La imagen no debe superar 2.5MB');
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                {applicant.firstName} {applicant.paternalLastName} {applicant.maternalLastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">ID: {applicant.id}</p>
                <ApplicantStatusBadge status={applicant.applicationStatus} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {applicant.isDriver && <Badge variant="outline">Driver Activo</Badge>}
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Fecha Firma de Contrato</p>
              <p className="text-sm font-medium">
                {applicant.applicationStatus === 'Approved' && applicant.contractSignatureDate
                  ? new Date(applicant.contractSignatureDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Datos Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Datos del Aspirante</CardTitle>
            <CardDescription className="text-xs">
              Información personal, domicilio, fiscal/bancario y vehículo
              {applicant.isDriver && !isEditable && ' (Solo lectura - Ya es driver)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <PersonalDataSection
              applicant={applicant}
              isEditable={isEditable}
              catalogs={catalogs}
              validationErrors={validationErrors}
              onFieldChange={handleFieldChange}
              internalNotes={internalNotes}
              onNotesChange={setInternalNotes}
            />
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Documentos</CardTitle>
            <CardDescription className="text-xs">Gestión de documentación requerida</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <DocumentsSection documents={documents} />
          </CardContent>
        </Card>

        {/* Propuestas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Propuestas de Trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <ProposalsSection
              applicantId={id}
              applicantCity={applicant.city}
              proposals={proposals}
              canSendProposal={canSendProposal}
              stores={catalogs.stores}
              onCreateProposal={handleCreateProposal}
            />
          </CardContent>
        </Card>

        {/* Sticky footer */}
        <div className="flex justify-end gap-4 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-t">
          <Button variant="outline" onClick={() => router.push('/adm/aspirantes')}>Cancelar</Button>
          <AccessGuard
            code={MODULE_KEY}
            action={PermissionAction.Edit}
            getSessionInfoUseCase={getSessionInfoUseCase}
            checkModuleAccessUseCase={checkModuleAccessUseCase}
            fallback={
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled>⛔</Button>
                  </TooltipTrigger>
                  <TooltipContent>No tienes permisos para editar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }
          >
            <Button onClick={handleSave} disabled={!hasChanges || isSaving || !isEditable || Object.keys(validationErrors).length > 0}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Cambios'}
            </Button>
          </AccessGuard>
        </div>
      </div>
    </RoleGuard>
  );
}
