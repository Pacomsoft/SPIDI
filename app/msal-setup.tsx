'use client';

import { MsalProviderAdapter } from '@/modules/login/infrastructure/providers/msal-provider.adapter';

interface IMsalSetupProps {
  children: React.ReactNode;
}

export function MsalSetup({ children }: IMsalSetupProps) {
  return <MsalProviderAdapter>{children}</MsalProviderAdapter>;
}
