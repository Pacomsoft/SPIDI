'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface INextAuthProviderAdapterProps {
  children: React.ReactNode;
  session: Session | null;
}

export function NextAuthProviderAdapter({ children, session }: INextAuthProviderAdapterProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
