import { signIn, getSession } from 'next-auth/react';
import { type IAuthService, type ITokenResultDTO } from '../../domain/contracts/auth-service.interface';
import { type ISessionWithToken } from '@/auth';

export class NextAuthAuthService implements IAuthService {
  async initiateRedirect(): Promise<void> {
    await signIn('microsoft-entra-id', { callbackUrl: '/validate-token' });
  }

  async handleRedirectResult(): Promise<ITokenResultDTO | null> {
    const session = await getSession();
    if (!session?.user) return null;

    const user = session.user as typeof session.user & { id?: string };
    const sessionWithToken = session as typeof session & ISessionWithToken;

    return {
      accessToken: sessionWithToken.accessToken ?? '',
      userId: user.id ?? user.email ?? '',
      userName: user.name ?? '',
      userEmail: user.email ?? '',
    };
  }
}
