import * as RadixToast from '@radix-ui/react-toast';
import { CircleX, TriangleAlert, MessageCircleWarning, Check } from 'lucide-react';
import type { ToastType } from '../../../../domain/contracts/toast.interface';
import styles from './style.module.scss';

interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  onOpenChange: (id: string, open: boolean) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  danger: <CircleX size={18} />,
  warning: <TriangleAlert size={18} />,
  info: <MessageCircleWarning size={18} />,
  success: <Check size={18} />,
};

export function ToastItem({ id, message, type, duration, onOpenChange }: ToastItemProps) {
  return (
    <RadixToast.Root
      className={`${styles.root} ${styles[type]}`}
      duration={duration}
      onOpenChange={(open) => onOpenChange(id, open)}
    >
      <RadixToast.Title className={styles.title}>
        <span className={styles.icon}>{ICONS[type]}</span>
        {message}
      </RadixToast.Title>
    </RadixToast.Root>
  );
}
