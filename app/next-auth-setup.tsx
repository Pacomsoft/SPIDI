'use client';

import { NextAuthProviderAdapter } from '@/modules/login/infrastructure/providers/next-auth-provider.adapter';
import type { Session } from 'next-auth';

interface INextAuthSetupProps {
  children: React.ReactNode;
  session: Session | null;
}

export function NextAuthSetup({ children, session }: INextAuthSetupProps) {
  return <NextAuthProviderAdapter session={session}>{children}</NextAuthProviderAdapter>;
}
