'use client';

import { useState, useCallback } from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { v7 as uuidv7 } from 'uuid';
import { ToastContext } from '../../../hooks/use-toast.hook';
import { ToastItem } from '../toast';
import type { IToastOptions, ToastType } from '../../../../domain/contracts/toast.interface';

const DEFAULT_DURATION = 5000;

interface ToastEntry {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback((options: IToastOptions) => {
    const entry: ToastEntry = {
      id: uuidv7(),
      message: options.message,
      type: options.type,
      duration: options.duration ?? DEFAULT_DURATION,
    };
    setToasts((prev) => [...prev, entry]);
  }, []);

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    if (!open) setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onOpenChange={handleOpenChange}
          />
        ))}
        <RadixToast.Viewport
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 9999,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
