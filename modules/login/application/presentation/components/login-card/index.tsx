import { Loader2, Phone, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { type LoginErrorType } from '../../../hooks/use-login.hook';
import styles from './style.module.scss';

interface ILoginCardProps {
  isLoading: boolean;
  error: string | null;
  errorType: LoginErrorType | null;
  isLockedOut: boolean;
  lockoutSecondsLeft: number;
  onLogin: () => void;
}

export function LoginCard({
  isLoading,
  error,
  errorType,
  isLockedOut,
  lockoutSecondsLeft,
  onLogin,
}: ILoginCardProps) {
  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <span className="text-3xl font-bold text-primary-foreground">S</span>
          </div>
          <CardTitle className="text-2xl font-bold">Te damos la bienvenida</CardTitle>
          <CardDescription className="text-base">
            Inicia sesión con tu cuenta corporativa para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
              errorType === 'too_many_attempts'
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}>
              {errorType === 'too_many_attempts' ? (
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>
                {error}
                {isLockedOut && lockoutSecondsLeft > 0 && (
                  <span className="ml-1 font-semibold">({formatSeconds(lockoutSecondsLeft)})</span>
                )}
              </span>
            </div>
          )}

          <Button
            onClick={onLogin}
            disabled={isLoading || isLockedOut}
            className="w-full h-11 text-base font-medium"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirigiendo...
              </>
            ) : (
              'Iniciar sesión con Microsoft'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Serás redirigido a App Directory para autenticarte de forma segura.
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">¿Necesitas ayuda?</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
              <Phone className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Comunícate con nosotros</p>
              <p className="text-sm text-muted-foreground">(81) 1234-5678 ext. 1234</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
