'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useConfirmDialog } from '@/modules/shared/application/hooks/use-confirm-dialog.hook';
import { LogOut, User, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type IGetSessionInfoUseCase } from '@/modules/adm/domain/contracts/get-session-info-use-case.interface';
import { type IAdmSessionPort } from '@/modules/adm/domain/contracts/adm-session-port.interface';
import { type ISessionInfoDTO } from '@/modules/adm/domain/contracts/adm.dto';

interface IHomeViewProps {
  getSessionInfoUseCase: IGetSessionInfoUseCase;
  sessionPort: IAdmSessionPort;
}

export function HomeView({ getSessionInfoUseCase, sessionPort }: IHomeViewProps) {
  const router = useRouter();
  const [session, setSession] = useState<ISessionInfoDTO | null>(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    const loadSession = async () => {
      const info = await getSessionInfoUseCase.execute();
      setSession(info);
    };
    loadSession();
  }, [getSessionInfoUseCase]);

  const handleLogout = async () => {
    const confirmed = await confirm({ text: '¿Estás seguro que deseas cerrar sesión?' });
    if (!confirmed) return;
    await sessionPort.clearSession();
    router.push('/login');
  };

  const formatExpiration = (timestamp: number) => {
    const remaining = timestamp - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">Panel de administración</p>
        </div>
        <Button onClick={handleLogout} variant="destructive" size="lg">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Sesión Iniciada
          </CardTitle>
          <CardDescription>Información de la sesión activa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <User className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                <p className="text-base font-semibold">{session?.userName ?? '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Rol</p>
                <p className="text-base font-semibold">{session?.userRole ?? '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <Clock className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Expira en</p>
                <p className="text-base font-semibold">
                  {session ? formatExpiration(session.expiresAt) : '-'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {ConfirmDialog}
    </div>
  );
}
