import { Loader2 } from 'lucide-react';
import styles from './style.module.scss';

interface IValidateTokenLoaderProps {
  isProcessing: boolean;
}

export function ValidateTokenLoader({ isProcessing }: IValidateTokenLoaderProps) {
  if (!isProcessing) return null;
  return (
    <div className={styles.container}>
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">Verificando sesión...</p>
    </div>
  );
}
