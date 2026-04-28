'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { type IDialogOptions } from '@/modules/shared/domain/contracts/dialog-options.interface';

const DEFAULTS = {
  title: 'Advertencia',
  text: '¿Deseas continuar?',
  okText: 'Sí',
  cancelText: 'No',
  showCancel: true,
} satisfies Required<IDialogOptions>;

interface IConfirmDialogProps {
  open: boolean;
  options: IDialogOptions;
  onResult: (result: boolean) => void;
}

export function ConfirmDialog({ open, options, onResult }: IConfirmDialogProps) {
  const title = options.title ?? DEFAULTS.title;
  const text = options.text ?? DEFAULTS.text;
  const okText = options.okText ?? DEFAULTS.okText;
  const cancelText = options.cancelText ?? DEFAULTS.cancelText;
  const showCancel = options.showCancel ?? DEFAULTS.showCancel;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onResult(false);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{text}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          {showCancel && (
            <Button variant="outline" onClick={() => onResult(false)}>
              {cancelText}
            </Button>
          )}
          <Button onClick={() => onResult(true)}>{okText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
