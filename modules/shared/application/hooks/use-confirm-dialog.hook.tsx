'use client';

import { useCallback, useRef, useState } from 'react';
import { ConfirmDialog } from '../presentation/components/confirm-dialog';
import { type IDialogOptions } from '@/modules/shared/domain/contracts/dialog-options.interface';

interface IConfirmDialogState {
  open: boolean;
  options: IDialogOptions;
  resolve: ((result: boolean) => void) | null;
}

const INITIAL_STATE: IConfirmDialogState = {
  open: false,
  options: {},
  resolve: null,
};

export function useConfirmDialog() {
  const [state, setState] = useState<IConfirmDialogState>(INITIAL_STATE);
  const resolveRef = useRef<((result: boolean) => void) | null>(null);

  const confirm = useCallback((options: IDialogOptions = {}): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleResult = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const ConfirmDialogComponent = (
    <ConfirmDialog
      open={state.open}
      options={state.options}
      onResult={handleResult}
    />
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
