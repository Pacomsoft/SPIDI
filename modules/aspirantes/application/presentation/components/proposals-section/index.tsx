'use client';

import { useState, useMemo } from 'react';
import { Send, AlertCircle, CheckCircle2, Clock, Info } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import type { IProposalDTO, ICreateProposalDTO } from '../../../../domain/contracts/applicant-detail.dto';
import type { ICatalogItemDTO } from '../../../../domain/contracts/applicant-list.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';

const HORARIOS = [
  { value: '06:00', label: '06:00 AM', hora: 6 }, { value: '07:00', label: '07:00 AM', hora: 7 },
  { value: '08:00', label: '08:00 AM', hora: 8 }, { value: '09:00', label: '09:00 AM', hora: 9 },
  { value: '10:00', label: '10:00 AM', hora: 10 }, { value: '11:00', label: '11:00 AM', hora: 11 },
  { value: '12:00', label: '12:00 PM', hora: 12 }, { value: '13:00', label: '01:00 PM', hora: 13 },
  { value: '14:00', label: '02:00 PM', hora: 14 }, { value: '15:00', label: '03:00 PM', hora: 15 },
  { value: '16:00', label: '04:00 PM', hora: 16 }, { value: '17:00', label: '05:00 PM', hora: 17 },
  { value: '18:00', label: '06:00 PM', hora: 18 }, { value: '19:00', label: '07:00 PM', hora: 19 },
  { value: '20:00', label: '08:00 PM', hora: 20 }, { value: '21:00', label: '09:00 PM', hora: 21 },
  { value: '22:00', label: '10:00 PM', hora: 22 },
];

const formatTimeRemaining = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

interface IProposalsSectionProps {
  applicantId: string;
  applicantCity?: string;
  proposals: IProposalDTO[];
  canSendProposal: boolean;
  stores: ICatalogItemDTO[];
  onCreateProposal: (data: ICreateProposalDTO) => Promise<IResultApi<IProposalDTO>>;
}

export function ProposalsSection({
  applicantId, applicantCity, proposals, canSendProposal, stores, onCreateProposal,
}: IProposalsSectionProps) {
  const [open, setOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const filteredStores = useMemo(
    () => stores.filter((s) => !applicantCity || s.label.toLowerCase().includes(applicantCity.toLowerCase())),
    [stores, applicantCity],
  );

  const availableEndTimes = useMemo(() => {
    if (!startTime) return HORARIOS;
    const startHora = HORARIOS.find((h) => h.value === startTime)?.hora ?? 0;
    return HORARIOS.filter((h) => h.hora > startHora);
  }, [startTime]);

  const isScheduleValid = useMemo(() => {
    if (!startTime || !endTime) return false;
    const s = HORARIOS.find((h) => h.value === startTime)?.hora ?? 0;
    const e = HORARIOS.find((h) => h.value === endTime)?.hora ?? 0;
    return e > s;
  }, [startTime, endTime]);

  const handleSend = async () => {
    if (!selectedStore || !startTime || !endTime || !isScheduleValid) return;
    await onCreateProposal({ applicantId, store: selectedStore, startTime, endTime });
    setOpen(false);
    setSelectedStore(''); setStartTime(''); setEndTime('');
  };

  const statusVariant = (s: IProposalDTO['status']): 'default' | 'destructive' | 'secondary' | 'outline' =>
    s === 'Rejected' || s === 'Expired' ? (s === 'Rejected' ? 'destructive' : 'secondary') : 'default';

  const statusLabel: Record<IProposalDTO['status'], string> = {
    Active: 'Activa', Accepted: 'Aceptada', Rejected: 'Rechazada', Expired: 'Expirada',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold">Propuestas de Trabajo</h3>
          <p className="text-xs text-muted-foreground">Gestión de propuestas laborales</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button disabled={!canSendProposal} size="sm">
              <Send className="h-4 w-4 mr-2" />Enviar propuesta...
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Enviar propuesta</SheetTitle>
              <SheetDescription>Selecciona la tienda y horario</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              {filteredStores.length === 0 ? (
                <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>No hay tiendas disponibles en esta ciudad.</AlertDescription></Alert>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  <Info className="h-4 w-4 inline mr-2" />{filteredStores.length} tienda(s) disponibles en <strong>{applicantCity}</strong>
                </div>
              )}
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger><SelectValue placeholder="Selecciona tienda" /></SelectTrigger>
                <SelectContent>
                  {filteredStores.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/30">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Hora de Entrada</p>
                  <Select value={startTime} onValueChange={(v) => { setStartTime(v); setEndTime(''); }}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {HORARIOS.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Hora de Salida</p>
                  <Select value={endTime} onValueChange={setEndTime} disabled={!startTime}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {availableEndTimes.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedStore && startTime && endTime && isScheduleValid && (
                <div className="p-4 border-2 border-primary/20 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Vista previa</span>
                  </div>
                  <p className="text-sm pl-6">📍 <strong>{filteredStores.find((s) => s.value === selectedStore)?.label}</strong></p>
                  <p className="text-sm pl-6">🕐 <strong>{HORARIOS.find((h) => h.value === startTime)?.label} - {HORARIOS.find((h) => h.value === endTime)?.label}</strong></p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSend} disabled={!selectedStore || !isScheduleValid} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />Enviar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {proposals.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tienda</TableHead><TableHead>Horario</TableHead>
              <TableHead>Fecha envío</TableHead><TableHead>Estado</TableHead>
              <TableHead>Tiempo restante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...proposals].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()).slice(0, 5).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.store}</TableCell>
                <TableCell>{p.schedule}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.sentAt}</TableCell>
                <TableCell><Badge variant={statusVariant(p.status)}>{statusLabel[p.status]}</Badge></TableCell>
                <TableCell className="text-sm font-mono">
                  {p.status === 'Active' && p.expiresIn ? formatTimeRemaining(p.expiresIn) : <span className="text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : !canSendProposal ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-base font-bold mb-2">Propuesta no disponible</h3>
          <p className="text-sm text-muted-foreground">Completa los datos requeridos y valida los documentos para habilitar el envío.</p>
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No hay propuestas enviadas aún.</p>
        </div>
      )}
    </div>
  );
}
