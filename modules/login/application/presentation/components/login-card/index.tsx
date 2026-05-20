import { Loader2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { type LoginErrorType } from '../../../hooks/use-login.hook';
import { SpidiLogo } from '@/components/ui/spidi-logo';
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
      <Card className="w-full max-w-sm border-border/60 shadow-lg">

        {/* ── Header ── */}
        <CardHeader className="pb-0 pt-8 px-8 text-center space-y-5">

          {/* Logo */}
          <div className="mx-auto">
            <SpidiLogo size={36} className="text-[#3E4C5E]" />
          </div>

          {/* Títulos */}
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
              Te damos la bienvenida
            </CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gestión centralizada de aspirantes, drivers, pagos, capacitaciones y documentación operativa.
            </p>
          </div>

          {/* Separador */}
          <div className="border-t border-border/50" />

        </CardHeader>

        {/* ── Content ── */}
        <CardContent className="px-8 pb-8 pt-5 space-y-4">

          {/* Error */}
          {error && (
            <div className={`flex items-start gap-2 rounded-md border p-3 text-xs ${
              errorType === 'too_many_attempts'
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}>
              {errorType === 'too_many_attempts' ? (
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <span>
                {error}
                {isLockedOut && lockoutSecondsLeft > 0 && (
                  <span className="ml-1 font-semibold">({formatSeconds(lockoutSecondsLeft)})</span>
                )}
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">
              Accede con tu cuenta corporativa para continuar
            </p>
            <Button
              onClick={onLogin}
              disabled={isLoading || isLockedOut}
              className="w-full h-10 text-sm font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando credenciales...
                </>
              ) : (
                'Iniciar sesión con Microsoft'
              )}
            </Button>
          </div>

          {/* Seguridad */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <ShieldCheck className="h-3 w-3 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground/60">
              Acceso protegido · Solo personal autorizado
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
