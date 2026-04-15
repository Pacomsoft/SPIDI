import { Loader2 } from 'lucide-react';
import styles from './style.module.scss';

interface IGlobalLoadingProps {
  isLoading: boolean;
}

export function GlobalLoading({ isLoading }: IGlobalLoadingProps) {
  if (!isLoading) return null;
  return (
    <div className={styles.overlay}>
      <Loader2 className={`h-12 w-12 animate-spin text-primary ${styles.spinner}`} />
      <p className={styles.text}>Cargando...</p>
    </div>
  );
}
