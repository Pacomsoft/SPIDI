import { ShieldAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Button } from '../../ui/button';
import styles from './style.module.scss';

interface IAccessDeniedCardProps {
  onGoHome: () => void;
}

export function AccessDeniedCard({ onGoHome }: IAccessDeniedCardProps) {
  return (
    <div className={styles.container}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className={styles.iconWrapper}>
            <ShieldAlert className={styles.icon} />
          </div>
          <CardTitle className="text-2xl font-bold">Acceso Denegado</CardTitle>
          <CardDescription className="text-base">
            No tienes permisos para acceder a este módulo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Tu rol actual no incluye acceso a esta sección del sistema. Si crees que esto es un
            error, contacta al administrador.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onGoHome} className="w-full" size="lg">
            Volver al Inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
