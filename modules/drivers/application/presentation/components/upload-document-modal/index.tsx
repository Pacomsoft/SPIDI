'use client';
import { useRef, useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import type { IUploadDocumentUseCase } from '../../../../domain/contracts/upload-document-use-case.interface';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png', 'application/pdf'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.webp,.png,.pdf';

interface IUploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
  driverId: string;
  documentType: string;
  documentLabel: string;
  uploadUseCase: IUploadDocumentUseCase;
  onSuccess: () => void;
}

export function UploadDocumentModal({
  open,
  onClose,
  driverId,
  documentType,
  documentLabel,
  uploadUseCase,
  onSuccess,
}: IUploadDocumentModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [typeError, setTypeError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const validateAndSetFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setTypeError('Tipo de archivo no permitido. Use JPG, WEBP, PNG o PDF.');
      setSelectedFile(null);
    } else {
      setTypeError('');
      setSelectedFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    await uploadUseCase.execute({ driverId, documentType, documentLabel, file: selectedFile });
    setIsUploading(false);
    setSelectedFile(null);
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTypeError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{documentLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Arrastra un archivo aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground">JPG, WEBP, PNG o PDF</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {typeError && (
            <p className="text-sm text-destructive">{typeError}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancelar
            </Button>
            <Button onClick={() => { void handleConfirm(); }} disabled={!selectedFile || isUploading}>
              {isUploading ? 'Cargando...' : 'Cargar documento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
