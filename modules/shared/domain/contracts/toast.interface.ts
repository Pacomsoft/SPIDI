export type ToastType = 'danger' | 'warning' | 'info' | 'success';

export interface IToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

export interface IToastContext {
  showToast: (options: IToastOptions) => void;
}
