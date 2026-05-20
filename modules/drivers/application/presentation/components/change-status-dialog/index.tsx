'use client';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import type { DriverStatusValue } from '../../../../domain/contracts/change-driver-status.dto';

interface IChangeStatusDialogProps {
  open: boolean;
  onClose: () => void;
  targetStatus: DriverStatusValue;
  onConfirm: () => void;
  isLoading?: boolean;
}

const STATUS_LABELS: Record<DriverStatusValue, { message: string; actionLabel: string }> = {
  Disabled: {
    message: "Se cambiará el estatus del driver a 'Deshabilitado'. ¿Confirmar el cambio de estatus?",
    actionLabel: 'Deshabilitar',
  },
  Enabled: {
    message: "Se cambiará el estatus del driver a 'Habilitado'. ¿Confirmar el cambio de estatus?",
    actionLabel: 'Habilitar',
  },
  Suspended: {
    message: "Se cambiará el estatus del driver a 'Suspendido'. ¿Confirmar el cambio de estatus?",
    actionLabel: 'Suspender',
  },
};

export function ChangeStatusDialog({
  open,
  onClose,
  targetStatus,
  onConfirm,
  isLoading,
}: IChangeStatusDialogProps) {
  const { message, actionLabel } = STATUS_LABELS[targetStatus];

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar cambio de estatus</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Procesando...' : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
