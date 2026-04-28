'use client';

import { useState } from 'react';
import { FileText, Eye, Download, CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../ui/sheet';
import type { IApplicantDocumentDTO } from '../../../../domain/contracts/applicant-detail.dto';

const REQUIRED_DOCS: Array<{ type: string; label: string }> = [
  { type: 'nss', label: 'NSS' },
  { type: 'licencia', label: 'Licencia' },
  { type: 'seguroAuto', label: 'Seguro de Auto' },
  { type: 'ine', label: 'INE' },
  { type: 'csf', label: 'CSF (Constancia de Situación Fiscal)' },
  { type: 'cuentaBancaria', label: 'Carátula cuenta bancaria con CLABE' },
];

const StatusIcon = ({ status }: { status: IApplicantDocumentDTO['status'] }) => {
  switch (status) {
    case 'Validated': return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
    case 'Prevalidated': return <Clock className="h-3.5 w-3.5 text-blue-600" />;
    case 'Unreadable': return <XCircle className="h-3.5 w-3.5 text-red-600" />;
    default: return <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />;
  }
};

const statusLabel: Record<IApplicantDocumentDTO['status'], string> = {
  Validated: 'Validado', Prevalidated: 'Prevalidado', Unreadable: 'No legible', Pending: 'Pendiente',
};

interface IDocumentsSectionProps {
  documents: Record<string, IApplicantDocumentDTO>;
}

export function DocumentsSection({ documents }: IDocumentsSectionProps) {
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocType, setViewerDocType] = useState('');

  const simulateLoad = async (type: string) => {
    setLoadingDoc(type);
    await new Promise((r) => setTimeout(r, 600));
    setLoadingDoc(null);
  };

  const handleView = async (type: string) => {
    await simulateLoad(type);
    setViewerDocType(type);
    setViewerOpen(true);
  };

  const handleDownload = async (type: string) => {
    await simulateLoad(type);
    const doc = documents[type];
    if (!doc?.fileUrl) return;
    const a = document.createElement('a');
    a.href = doc.fileUrl;
    a.download = `${doc.label.replace(/ /g, '_')}.pdf`;
    a.click();
  };

  return (
    <div>
      <div className="grid gap-2 md:grid-cols-2">
        {REQUIRED_DOCS.map((req) => {
          const doc: IApplicantDocumentDTO = documents[req.type] ?? { type: req.type, label: req.label, status: 'Pending' };
          const isWarning = doc.status === 'Pending' || doc.status === 'Unreadable';
          const isLoading = loadingDoc === req.type;
          const canView = doc.status === 'Validated' || doc.status === 'Prevalidated';

          return (
            <div key={req.type} className={`p-2.5 border rounded-md space-y-2 overflow-hidden ${isWarning ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20' : ''}`}>
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{doc.label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusIcon status={doc.status} />
                    <span className="text-[10px] font-medium">{statusLabel[doc.status]}</span>
                  </div>
                </div>
              </div>
              {req.type !== 'nss' && req.type !== 'cuentaBancaria' && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground">Vigencia</span>
                  <p className="text-xs text-foreground font-medium">
                    {doc.expirationDate ? new Date(doc.expirationDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </p>
                </div>
              )}
              {canView && (
                <div className="flex gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleView(req.type)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDownload(req.type)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={viewerOpen} onOpenChange={setViewerOpen}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Visualizar Documento</SheetTitle>
            <SheetDescription>{viewerDocType && documents[viewerDocType]?.label}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex items-center justify-center bg-muted rounded-lg p-8 min-h-[400px]">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Vista previa del documento</p>
              <Button variant="outline" onClick={() => handleDownload(viewerDocType)}>
                <Download className="h-4 w-4 mr-2" />Descargar documento
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
