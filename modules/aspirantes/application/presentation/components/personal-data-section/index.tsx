'use client';

import type { IApplicantDetailDTO } from '../../../../domain/contracts/applicant-detail.dto';
import type { ICatalogItemDTO } from '../../../../domain/contracts/applicant-list.dto';
import { Input } from '../../ui/input';
import { Separator } from '../../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { AlertCircle } from 'lucide-react';

const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium leading-none ${className}`}>{children}</label>
);

const Textarea = ({ placeholder, value, onChange, rows = 3, className = '' }: {
  placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number; className?: string;
}) => (
  <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows}
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
);

interface IPersonalDataSectionProps {
  applicant: IApplicantDetailDTO;
  isEditable: boolean;
  catalogs: { genders: ICatalogItemDTO[]; states: ICatalogItemDTO[]; banks: ICatalogItemDTO[]; fiscalRegimes: ICatalogItemDTO[] };
  validationErrors: Record<string, string>;
  onFieldChange: (field: keyof IApplicantDetailDTO, value: unknown) => void;
  internalNotes: string;
  onNotesChange: (v: string) => void;
}

const req = (field: string, applicant: IApplicantDetailDTO, errs: Record<string, string>) => {
  const requiredFields = [
    'firstName', 'paternalLastName', 'maternalLastName', 'birthDate', 'gender',
    'nationality', 'cityOfInterest', 'street', 'externalNumber', 'neighborhood',
    'city', 'state', 'postalCode', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'vehiclePlates', 'bank', 'clabe',
  ];
  if (!requiredFields.includes(field)) return { cls: '', lCls: '' };
  const val = applicant[field as keyof IApplicantDetailDTO];
  const empty = !val || (typeof val === 'string' && val.trim() === '');
  const hasErr = !!errs[field];
  const border = empty || hasErr ? 'border-destructive' : '';
  const label = empty ? 'text-destructive font-semibold' : '';
  return { cls: border, lCls: label };
};

export function PersonalDataSection({ applicant, isEditable, catalogs, validationErrors, onFieldChange, internalNotes, onNotesChange }: IPersonalDataSectionProps) {
  return (
    <div className="space-y-8">
      {/* Datos Personales */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(['firstName', 'paternalLastName', 'maternalLastName'] as const).map((field) => {
          const labels: Record<string, string> = { firstName: 'Nombre(s) *', paternalLastName: 'Apellido Paterno *', maternalLastName: 'Apellido Materno *' };
          const placeholders: Record<string, string> = { firstName: 'Ej. Juan Carlos', paternalLastName: 'Ej. Pérez', maternalLastName: 'Ej. García' };
          const { cls, lCls } = req(field, applicant, validationErrors);
          return (
            <div key={field} className="flex flex-col gap-2">
              <Label className={lCls}>{labels[field]}</Label>
              <Input placeholder={placeholders[field]} value={(applicant[field] as string) ?? ''} onChange={(e) => onFieldChange(field, e.target.value)} disabled={!isEditable} className={cls} />
            </div>
          );
        })}
        <div className="flex flex-col gap-2">
          <Label className={req('birthDate', applicant, validationErrors).lCls}>Fecha de Nacimiento *</Label>
          <Input type="date" value={applicant.birthDate ?? ''} onChange={(e) => onFieldChange('birthDate', e.target.value)} disabled={!isEditable} className={req('birthDate', applicant, validationErrors).cls} />
        </div>
        <div className="flex flex-col gap-2">
          <Label className={req('gender', applicant, validationErrors).lCls}>Género *</Label>
          <Select value={applicant.gender ?? ''} onValueChange={(v) => onFieldChange('gender', v)} disabled={!isEditable}>
            <SelectTrigger className={req('gender', applicant, validationErrors).cls}><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>
              {catalogs.genders.length > 0 ? catalogs.genders.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>) : (
                <>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Nacionalidad *</Label>
          <Input placeholder="Ej. Mexicana" value={applicant.nationality ?? ''} onChange={(e) => onFieldChange('nationality', e.target.value)} disabled={!isEditable} className={req('nationality', applicant, validationErrors).cls} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>RFC</Label>
          <Input placeholder="PEGJ900515XXX" value={applicant.rfc ?? ''} onChange={(e) => onFieldChange('rfc', e.target.value)} disabled={!isEditable} />
        </div>
        <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
          <Label>CURP</Label>
          <Input placeholder="PEGJ900515HNLRXN01" value={applicant.curp ?? ''} onChange={(e) => onFieldChange('curp', e.target.value)} disabled={!isEditable} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Correo Electrónico</Label>
          <Input type="email" value={applicant.email} disabled className="bg-muted" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Teléfono</Label>
          <Input value={applicant.phone} disabled className="bg-muted" />
        </div>
        <div className="flex flex-col gap-2">
          <Label className={req('cityOfInterest', applicant, validationErrors).lCls}>Ciudad de interés *</Label>
          <Select value={applicant.cityOfInterest ?? ''} onValueChange={(v) => onFieldChange('cityOfInterest', v)} disabled={!isEditable}>
            <SelectTrigger className={req('cityOfInterest', applicant, validationErrors).cls}><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>
              {catalogs.states.length > 0 ? catalogs.states.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>) : (
                ['Monterrey', 'Guadalupe', 'San Pedro', 'Apodaca', 'Escobedo', 'Santa Catarina'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Domicilio Personal */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Domicilio Personal</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { field: 'street', label: 'Calle *', placeholder: 'Ej. Avenida Revolución', span: 2 },
            { field: 'externalNumber', label: 'Número Exterior *', placeholder: '123', span: 1 },
            { field: 'internalNumber', label: 'Número Interior', placeholder: '4B', span: 1 },
            { field: 'postalCode', label: 'Código Postal *', placeholder: '64000', span: 1 },
            { field: 'neighborhood', label: 'Colonia *', placeholder: 'Centro', span: 1 },
            { field: 'city', label: 'Ciudad/Municipio *', placeholder: 'Monterrey', span: 1 },
            { field: 'state', label: 'Estado *', placeholder: 'Nuevo León', span: 1 },
          ].map(({ field, label, placeholder, span }) => {
            const { cls, lCls } = req(field, applicant, validationErrors);
            return (
              <div key={field} className={`${span > 1 ? `md:col-span-${span} lg:col-span-${span}` : ''} flex flex-col gap-2`}>
                <Label className={lCls}>{label}</Label>
                <Input placeholder={placeholder} value={(applicant[field as keyof IApplicantDetailDTO] as string) ?? ''} onChange={(e) => onFieldChange(field as keyof IApplicantDetailDTO, e.target.value)} disabled={!isEditable} className={cls} />
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Domicilio Fiscal */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Domicilio Fiscal</h3>
        <p className="text-sm text-muted-foreground">Datos obtenidos de la Constancia de Situación Fiscal (solo lectura)</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { field: 'fiscalStreet', label: 'Calle', span: 2 }, { field: 'fiscalExternalNumber', label: 'Núm. Exterior', span: 1 },
            { field: 'fiscalInternalNumber', label: 'Núm. Interior', span: 1 }, { field: 'fiscalPostalCode', label: 'C.P.', span: 1 },
            { field: 'fiscalNeighborhood', label: 'Colonia', span: 1 }, { field: 'fiscalCity', label: 'Ciudad', span: 1 },
            { field: 'fiscalState', label: 'Estado', span: 1 },
          ].map(({ field, label, span }) => (
            <div key={field} className={`${span > 1 ? `md:col-span-${span} lg:col-span-${span}` : ''} flex flex-col gap-2`}>
              <Label>{label}</Label>
              <Input value={(applicant[field as keyof IApplicantDetailDTO] as string) ?? ''} disabled className="bg-muted" placeholder="Datos del CSF" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 mt-4 max-w-sm">
          <Label>Régimen Fiscal</Label>
          <Select value={applicant.fiscalRegime ?? ''} disabled>
            <SelectTrigger className="bg-muted"><SelectValue placeholder="Datos del CSF" /></SelectTrigger>
            <SelectContent>
              {catalogs.fiscalRegimes.length > 0 ? catalogs.fiscalRegimes.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>) : (
                <SelectItem value="l">Régimen Simplificado de Confianza (RESICO)</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Datos Bancarios */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Datos Bancarios</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className={req('bank', applicant, validationErrors).lCls}>Banco *</Label>
            <Input placeholder="BBVA" value={applicant.bank ?? ''} onChange={(e) => onFieldChange('bank', e.target.value)} disabled={!isEditable} className={req('bank', applicant, validationErrors).cls} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className={req('clabe', applicant, validationErrors).lCls}>CLABE *</Label>
            <Input placeholder="012180001234567890" value={applicant.clabe ?? ''} onChange={(e) => onFieldChange('clabe', e.target.value)} disabled={!isEditable} maxLength={18} className={validationErrors.clabe ? 'border-destructive' : req('clabe', applicant, validationErrors).cls} />
            {validationErrors.clabe && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{validationErrors.clabe}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Vehículo */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Datos del Vehículo</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { field: 'vehicleMake', label: 'Marca *', placeholder: 'Toyota', span: 2 },
            { field: 'vehicleModel', label: 'Modelo *', placeholder: 'Corolla', span: 2 },
            { field: 'vehicleYear', label: 'Año *', placeholder: '2020', span: 1 },
            { field: 'vehiclePlates', label: 'Placas *', placeholder: 'ABC1234', span: 1 },
            { field: 'vehicleColor', label: 'Color', placeholder: 'Blanco', span: 2 },
          ].map(({ field, label, placeholder, span }) => {
            const { cls, lCls } = req(field, applicant, validationErrors);
            return (
              <div key={field} className={`${span > 1 ? `md:col-span-${span} lg:col-span-${span}` : ''} flex flex-col gap-2`}>
                <Label className={lCls}>{label}</Label>
                <Input placeholder={placeholder} value={(applicant[field as keyof IApplicantDetailDTO] as string) ?? ''} onChange={(e) => onFieldChange(field as keyof IApplicantDetailDTO, e.target.value)} disabled={!isEditable} className={cls} />
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Beneficiarios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Beneficiarios</h3>
            <p className="text-sm text-muted-foreground">El total de porcentajes no debe exceder 100%</p>
          </div>
          {isEditable && (
            <button type="button" className="text-sm border rounded px-3 py-1 hover:bg-muted" onClick={() => {
              const existing = applicant.beneficiaries ?? [];
              const total = existing.reduce((s, b) => s + b.percentage, 0);
              if (total >= 100) { alert('El total ya es 100%'); return; }
              onFieldChange('beneficiaries', [...existing, { name: '', phone: '', percentage: 0 }]);
            }}>
              Agregar Beneficiario
            </button>
          )}
        </div>
        {applicant.beneficiaries && applicant.beneficiaries.length > 0 ? (
          <div className="space-y-4">
            {applicant.beneficiaries.map((b, i) => (
              <div key={i} className="grid grid-cols-1 gap-4 md:grid-cols-4 p-4 border rounded-lg">
                <div className="md:col-span-2 flex flex-col gap-2">
                  <Label>Nombre Completo *</Label>
                  <Input placeholder="Ej. María García López" value={b.name} disabled={!isEditable} onChange={(e) => {
                    const updated = [...(applicant.beneficiaries ?? [])];
                    updated[i] = { ...updated[i], name: e.target.value };
                    onFieldChange('beneficiaries', updated);
                  }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Teléfono *</Label>
                  <Input placeholder="8112345678" value={b.phone} disabled={!isEditable} onChange={(e) => {
                    const updated = [...(applicant.beneficiaries ?? [])];
                    updated[i] = { ...updated[i], phone: e.target.value };
                    onFieldChange('beneficiaries', updated);
                  }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Porcentaje *</Label>
                  <div className="flex gap-2">
                    <Input type="number" min="0" max="100" placeholder="50" value={b.percentage} disabled={!isEditable} onChange={(e) => {
                      const newPct = Number(e.target.value);
                      const others = (applicant.beneficiaries ?? []).filter((_, j) => j !== i).reduce((s, x) => s + x.percentage, 0);
                      if (others + newPct > 100) { alert('El total no puede exceder 100%'); return; }
                      const updated = [...(applicant.beneficiaries ?? [])];
                      updated[i] = { ...updated[i], percentage: newPct };
                      onFieldChange('beneficiaries', updated);
                    }} />
                    {isEditable && (
                      <button type="button" className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm" onClick={() => {
                        onFieldChange('beneficiaries', (applicant.beneficiaries ?? []).filter((_, j) => j !== i));
                      }}>×</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <p className="text-sm font-medium text-right">Total: {applicant.beneficiaries.reduce((s, b) => s + b.percentage, 0)}%</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay beneficiarios agregados</p>
        )}
      </div>

      <Separator />

      {/* Notas Internas */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Notas Internas</h3>
        <Textarea placeholder="Escribe notas internas sobre este aspirante..." value={internalNotes} onChange={(e) => onNotesChange(e.target.value)} rows={6} />
      </div>
    </div>
  );
}
