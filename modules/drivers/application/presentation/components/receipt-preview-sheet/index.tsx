'use client';

import { useState } from 'react';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Button } from '../../ui/button';

interface IReceiptPreviewSheetProps {
  open: boolean;
  onClose: () => void;
  receiptUrl: string;
  weekLabel: string;
  driverName: string;
}

function getFileType(url: string): 'pdf' | 'image' | 'unknown' {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.pdf')) return 'pdf';
  if (clean.match(/\.(jpg|jpeg|png|webp|gif)$/)) return 'image';
  return 'unknown';
}

export function ReceiptPreviewSheet({
  open,
  onClose,
  receiptUrl,
  weekLabel,
  driverName,
}: IReceiptPreviewSheetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const fileType = getFileType(receiptUrl);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = receiptUrl;
    a.download = `recibo-${driverName.replace(/\s+/g, '-').toLowerCase()}-${weekLabel}.${fileType === 'pdf' ? 'pdf' : 'jpg'}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setIsLoading(true);
      setLoadError(false);
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[560px] md:w-[680px] lg:w-[760px] sm:max-w-none flex flex-col p-0 gap-0"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-base">Recibo de pago</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {driverName} · Semana {weekLabel}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => window.open(receiptUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* ── Preview area ── */}
        <div className="flex-1 overflow-hidden relative bg-muted/30">

          {/* Spinner mientras carga */}
          {isLoading && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-muted/30">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error de carga */}
          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="h-12 w-12 opacity-30" />
              <p className="text-sm">No se pudo previsualizar el archivo.</p>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                <Download className="h-4 w-4" />
                Descargar recibo
              </Button>
            </div>
          )}

          {/* PDF */}
          {fileType === 'pdf' && !loadError && (
            <iframe
              src={`${receiptUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0"
              title={`Recibo ${weekLabel}`}
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setLoadError(true); }}
            />
          )}

          {/* Imagen */}
          {fileType === 'image' && !loadError && (
            <div className="w-full h-full overflow-auto flex items-start justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptUrl}
                alt={`Recibo ${weekLabel}`}
                className="max-w-full rounded-md shadow-sm object-contain"
                onLoad={() => setIsLoading(false)}
                onError={() => { setIsLoading(false); setLoadError(true); }}
              />
            </div>
          )}

          {/* Tipo desconocido → fallback directo */}
          {fileType === 'unknown' && !loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="h-12 w-12 opacity-30" />
              <p className="text-sm">Vista previa no disponible para este tipo de archivo.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.open(receiptUrl, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en nueva pestaña
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
