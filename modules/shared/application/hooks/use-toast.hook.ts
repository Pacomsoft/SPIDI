'use client';

import { createContext, useContext } from 'react';
import type { IToastContext } from '../../domain/contracts/toast.interface';

export const ToastContext = createContext<IToastContext | null>(null);

export function useToast(): IToastContext {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
